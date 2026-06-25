const allowedMobileProtocols = new Set(["exp:", "exps:", "harvestcoffee:"]);

export function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = getMobileRedirectUrl(url.searchParams.get("return_to"));

  if (!redirectUrl) {
    const fallback = new URL("/login", url.origin);
    fallback.searchParams.set("error", "Invalid mobile redirect.");
    return Response.redirect(fallback.toString(), 302);
  }

  const accessToken = url.searchParams.get("access_token");
  const isNewUser = url.searchParams.get("is_new_user");
  const error = url.searchParams.get("error");

  if (accessToken) redirectUrl.searchParams.set("access_token", accessToken);
  if (isNewUser) redirectUrl.searchParams.set("is_new_user", isNewUser);
  if (error) redirectUrl.searchParams.set("error", error);
  if (!accessToken && !error) redirectUrl.searchParams.set("error", "Google sign in did not return an access token.");

  return Response.redirect(redirectUrl.toString(), 302);
}

function getMobileRedirectUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (allowedMobileProtocols.has(url.protocol)) return url;
    return null;
  } catch {
    return null;
  }
}
