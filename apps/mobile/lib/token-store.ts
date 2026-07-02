export const MOBILE_ACCESS_TOKEN_KEY = "harvest_mobile_access_token";
export const MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY = "harvest_mobile_access_token_expires_at";
export const MOBILE_LOGIN_NONCE_KEY = "harvest_mobile_login_nonce";

const DEFAULT_TOKEN_EXPIRY_SKEW_MS = 30_000;
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export type SecureTokenStorage = {
  deleteItemAsync(key: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
};

export type MobileTokenStoreOptions = {
  expirySkewMs?: number;
  now?: () => number;
};

export function createMobileTokenStore(storage: SecureTokenStorage, options: MobileTokenStoreOptions = {}) {
  let accessToken: string | null = null;
  const getNow = options.now ?? (() => Date.now());
  const expirySkewMs = options.expirySkewMs ?? DEFAULT_TOKEN_EXPIRY_SKEW_MS;

  async function clearStoredAccessToken() {
    accessToken = null;
    await storage.deleteItemAsync(MOBILE_ACCESS_TOKEN_KEY);
    await storage.deleteItemAsync(MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY);
  }

  return {
    async clearAccessToken() {
      await clearStoredAccessToken();
    },
    async clearLoginNonce() {
      await storage.deleteItemAsync(MOBILE_LOGIN_NONCE_KEY);
    },
    async consumeLoginNonce(nonce: string | null | undefined) {
      const expectedNonce = await storage.getItemAsync(MOBILE_LOGIN_NONCE_KEY);
      await storage.deleteItemAsync(MOBILE_LOGIN_NONCE_KEY);
      return Boolean(nonce && expectedNonce && nonce === expectedNonce);
    },
    async createLoginNonce() {
      const nonce = createMobileLoginNonce();
      await storage.setItemAsync(MOBILE_LOGIN_NONCE_KEY, nonce);
      return nonce;
    },
    getAccessToken() {
      return accessToken;
    },
    async loadAccessToken() {
      const storedToken = await storage.getItemAsync(MOBILE_ACCESS_TOKEN_KEY);
      if (!storedToken) {
        await clearStoredAccessToken();
        return null;
      }

      const storedExpiresAt = await storage.getItemAsync(MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY);
      const expiresAt = parseStoredExpiry(storedExpiresAt) ?? readJwtExpirationMs(storedToken);

      if (isExpired(expiresAt, getNow(), expirySkewMs)) {
        await clearStoredAccessToken();
        return null;
      }

      accessToken = storedToken;
      if (expiresAt !== null && storedExpiresAt !== String(expiresAt)) {
        await storage.setItemAsync(MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
      }
      return accessToken;
    },
    async setAccessToken(token: string) {
      const expiresAt = readJwtExpirationMs(token);
      if (isExpired(expiresAt, getNow(), expirySkewMs)) {
        await clearStoredAccessToken();
        throw new Error("Base44 access token is expired.");
      }

      accessToken = token;
      await storage.setItemAsync(MOBILE_ACCESS_TOKEN_KEY, token);
      if (expiresAt === null) {
        await storage.deleteItemAsync(MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY);
      } else {
        await storage.setItemAsync(MOBILE_ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
      }
    },
  };
}

export function readJwtExpirationMs(token: string) {
  const [, payloadSegment] = token.split(".");
  if (!payloadSegment) {
    return null;
  }

  const payload = decodeBase64UrlJson(payloadSegment);
  const exp = payload?.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    return null;
  }

  return Math.floor(exp * 1000);
}

export function createMobileLoginNonce(byteLength = 18) {
  const bytes = new Uint8Array(byteLength);
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseStoredExpiry(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isExpired(expiresAt: number | null, now: number, skewMs: number) {
  return expiresAt !== null && expiresAt <= now + skewMs;
}

function decodeBase64UrlJson(segment: string): Record<string, unknown> | null {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const binary = decodeBase64ToBinary(base64);
    if (binary === null) {
      return null;
    }
    const json = decodeURIComponent(
      Array.from(binary, (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
    );
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function decodeBase64ToBinary(value: string) {
  const normalized = value.replace(/=+$/g, "");
  let buffer = 0;
  let bits = 0;
  let output = "";

  for (const character of normalized) {
    const index = BASE64_ALPHABET.indexOf(character);
    if (index === -1) {
      return null;
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}
