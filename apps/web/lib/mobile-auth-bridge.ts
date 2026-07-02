import { createMobileAuthCode } from "./mobile-auth-code";
import { getSafeMobileRedirectUrl } from "./security-helpers";

export interface MobileAuthRedirectOptions {
  allowExpoRedirects?: boolean;
  now?: number;
  secret: string;
}

export function buildMobileAuthRedirect(requestUrl: string, options: MobileAuthRedirectOptions) {
  const url = new URL(requestUrl);
  const redirectUrl = getSafeMobileRedirectUrl(url.searchParams.get("return_to"), {
    allowExpoRedirects: options.allowExpoRedirects,
  });

  if (!redirectUrl) {
    const fallback = new URL("/login", url.origin);
    fallback.searchParams.set("error", "Invalid mobile redirect.");
    return fallback.toString();
  }

  redirectUrl.searchParams.delete("access_token");
  redirectUrl.searchParams.delete("auth_code");
  redirectUrl.searchParams.delete("error");
  redirectUrl.searchParams.delete("is_new_user");

  const accessToken = url.searchParams.get("access_token");
  const isNewUser = url.searchParams.get("is_new_user") ?? undefined;
  const error = url.searchParams.get("error");

  if (accessToken) {
    redirectUrl.searchParams.set("auth_code", createMobileAuthCode({
      accessToken,
      isNewUser,
      now: options.now,
      secret: options.secret,
    }));
    if (isNewUser) redirectUrl.searchParams.set("is_new_user", isNewUser);
  } else if (error) {
    redirectUrl.searchParams.set("error", error);
  } else {
    redirectUrl.searchParams.set("error", "Google sign in did not return an access token.");
  }

  return redirectUrl.toString();
}
