const HARVEST_LOGIN_CALLBACK_PATHS = new Set(["/auth/callback", "/mobile-auth/callback"]);
const MOBILE_APP_PROTOCOLS = new Set(["harvestcoffee:"]);
const EXPO_PROTOCOLS = new Set(["exp:", "exps:"]);

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type MemoryRateLimitOptions = {
  limit: number;
  windowMs: number;
};

export function getSafeHarvestLoginRedirectUrl(value: string, currentOrigin: string) {
  const current = normalizeUrlOrigin(currentOrigin);
  if (!current) return null;

  try {
    const redirectUrl = new URL(value, current.toString());
    normalizeLocalDevHost(redirectUrl);

    if (redirectUrl.origin !== current.origin) return null;
    if (!HARVEST_LOGIN_CALLBACK_PATHS.has(redirectUrl.pathname)) return null;
    if (!["http:", "https:"].includes(redirectUrl.protocol)) return null;

    return redirectUrl.toString();
  } catch {
    return null;
  }
}

export function getSafeMobileRedirectUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (MOBILE_APP_PROTOCOLS.has(url.protocol)) return url;
    if (EXPO_PROTOCOLS.has(url.protocol) && isAllowedExpoHost(url.hostname)) return url;
    return null;
  } catch {
    return null;
  }
}

export function createMemoryRateLimiter(options: MemoryRateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    check(key: string, now = Date.now()) {
      const normalizedKey = key.trim() || "anonymous";
      const bucket = buckets.get(normalizedKey);

      if (!bucket || bucket.resetAt <= now) {
        buckets.set(normalizedKey, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true, remaining: Math.max(options.limit - 1, 0), resetAt: now + options.windowMs };
      }

      if (bucket.count >= options.limit) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
      }

      bucket.count += 1;
      return { allowed: true, remaining: Math.max(options.limit - bucket.count, 0), resetAt: bucket.resetAt };
    },
    clear() {
      buckets.clear();
    },
    reset(key: string) {
      buckets.delete(key.trim() || "anonymous");
    },
  };
}

function normalizeUrlOrigin(value: string) {
  try {
    const url = new URL(value);
    normalizeLocalDevHost(url);
    return url;
  } catch {
    return null;
  }
}

function normalizeLocalDevHost(url: URL) {
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
}

function isAllowedExpoHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".exp.direct")) return true;
  if (isPrivateIpv4(host)) return true;
  return false;
}

function isPrivateIpv4(value: string) {
  const parts = value.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}
