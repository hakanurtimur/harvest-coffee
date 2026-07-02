import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const MOBILE_AUTH_CODE_VERSION = "v1";
const MOBILE_AUTH_CODE_AAD = "harvest-mobile-auth-code-v1";
const MOBILE_AUTH_CODE_TTL_MS = 2 * 60 * 1000;

interface MobileAuthCodeInput {
  accessToken: string;
  isNewUser?: string;
  now?: number;
  secret: string;
  ttlMs?: number;
}

interface MobileAuthCodeConsumeOptions {
  now?: number;
  secret: string;
}

interface MobileAuthCodePayload {
  accessToken: string;
  expiresAt: number;
  isNewUser?: string;
}

export interface MobileAuthCodeResult {
  accessToken: string;
  isNewUser?: string;
}

export function createMobileAuthCode(input: MobileAuthCodeInput) {
  const accessToken = input.accessToken.trim();
  if (!accessToken) throw new Error("Mobile auth code requires an access token.");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getMobileAuthCodeKey(input.secret), iv);
  cipher.setAAD(Buffer.from(MOBILE_AUTH_CODE_AAD));

  const payload: MobileAuthCodePayload = {
    accessToken,
    expiresAt: (input.now ?? Date.now()) + (input.ttlMs ?? MOBILE_AUTH_CODE_TTL_MS),
    isNewUser: input.isNewUser,
  };
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    MOBILE_AUTH_CODE_VERSION,
    base64UrlEncode(iv),
    base64UrlEncode(encrypted),
    base64UrlEncode(tag),
  ].join(".");
}

export function consumeMobileAuthCode(code: string, options: MobileAuthCodeConsumeOptions): MobileAuthCodeResult {
  const [version, ivValue, encryptedValue, tagValue] = code.split(".");
  if (version !== MOBILE_AUTH_CODE_VERSION || !ivValue || !encryptedValue || !tagValue) {
    throw new Error("Invalid mobile auth code.");
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", getMobileAuthCodeKey(options.secret), base64UrlDecode(ivValue));
    decipher.setAAD(Buffer.from(MOBILE_AUTH_CODE_AAD));
    decipher.setAuthTag(base64UrlDecode(tagValue));
    const decrypted = Buffer.concat([
      decipher.update(base64UrlDecode(encryptedValue)),
      decipher.final(),
    ]);
    const payload = JSON.parse(decrypted.toString("utf8")) as Partial<MobileAuthCodePayload>;
    if (!payload.accessToken || typeof payload.expiresAt !== "number") {
      throw new Error("Invalid mobile auth code payload.");
    }
    if ((options.now ?? Date.now()) > payload.expiresAt) {
      throw new Error("Mobile auth code expired.");
    }
    return {
      accessToken: payload.accessToken,
      isNewUser: payload.isNewUser,
    };
  } catch (error) {
    if (error instanceof Error && /expired/i.test(error.message)) throw error;
    throw new Error("Invalid mobile auth code.");
  }
}

export function getMobileAuthCodeSecret() {
  const secret = process.env.HARVEST_MOBILE_AUTH_SECRET || process.env.BASE44_API_KEY;
  if (!secret) {
    throw new Error("HARVEST_MOBILE_AUTH_SECRET or BASE44_API_KEY is required for mobile auth code exchange.");
  }
  return secret;
}

function getMobileAuthCodeKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function base64UrlEncode(value: Buffer) {
  return value.toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url");
}
