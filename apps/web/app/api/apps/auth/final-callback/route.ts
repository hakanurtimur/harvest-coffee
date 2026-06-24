export function GET(request: Request) {
  const url = new URL(request.url);
  const accessToken = url.searchParams.get("access_token");
  const isNewUser = url.searchParams.get("is_new_user");
  const state = parseState(url.searchParams.get("state"));
  const fromUrl = getSafeRedirectUrl(state.from_url, url.origin);
  const redirectUrl = new URL("/auth/callback", url.origin);
  redirectUrl.searchParams.set("next", fromUrl?.searchParams.get("next") || fromUrl?.pathname || "/home");

  if (accessToken) redirectUrl.searchParams.set("access_token", accessToken);
  if (isNewUser) redirectUrl.searchParams.set("is_new_user", isNewUser);

  return Response.redirect(redirectUrl.toString(), 302);
}

function parseState(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function getSafeRedirectUrl(value: unknown, origin: string) {
  if (typeof value !== "string") return null;
  try {
    const redirectUrl = new URL(value, origin);
    if (redirectUrl.origin !== origin) return null;
    return redirectUrl;
  } catch {
    return null;
  }
}
