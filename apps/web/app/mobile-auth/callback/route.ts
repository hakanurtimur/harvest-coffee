import { getSafeMobileRedirectUrl } from "@/lib/security-helpers";

export function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUrl = getSafeMobileRedirectUrl(url.searchParams.get("return_to"), {
    allowExpoRedirects: shouldAllowExpoMobileRedirects(),
  });

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

function shouldAllowExpoMobileRedirects() {
  const value = process.env.HARVEST_ALLOW_EXPO_MOBILE_REDIRECTS;
  if (value === "true") return true;
  if (value === "false") return false;
  return process.env.NODE_ENV !== "production";
}
