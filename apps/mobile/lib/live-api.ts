const HARVEST_PROXY_PATH = "/api/harvest";

export function getHarvestProxyEndpoint() {
  return normalizeHarvestProxyEndpoint(process.env.EXPO_PUBLIC_HARVEST_API_URL);
}

export function isLiveProxyMode() {
  return Boolean(getHarvestProxyEndpoint());
}

export function getHarvestWebOrigin(proxyEndpoint = getHarvestProxyEndpoint()) {
  if (!proxyEndpoint) return null;

  try {
    return new URL(proxyEndpoint).origin;
  } catch {
    return proxyEndpoint
      .replace(/\/api\/harvest\/?$/, "")
      .replace(/\/$/, "");
  }
}

export function normalizeHarvestProxyEndpoint(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const pathname = url.pathname.replace(/\/$/, "");
    if (!pathname || pathname === "/") {
      url.pathname = HARVEST_PROXY_PATH;
    } else {
      url.pathname = pathname;
    }
    return url.toString();
  } catch {
    return trimmed;
  }
}
