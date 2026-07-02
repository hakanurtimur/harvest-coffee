export const MOBILE_AUTH_CODE_PARAM = "auth_code";
export const MOBILE_LOGIN_NONCE_PARAM = "login_nonce";

export function appendMobileLoginNonce(returnTo: string, nonce: string) {
  const url = new URL(returnTo);
  url.searchParams.set(MOBILE_LOGIN_NONCE_PARAM, nonce);
  return url.toString();
}

export function getMobileLoginCallbackParams(url: string) {
  try {
    return new URL(url).searchParams;
  } catch {
    const [, query = ""] = url.split("?");
    return new URLSearchParams(query);
  }
}
