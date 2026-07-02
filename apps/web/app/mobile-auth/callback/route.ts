import { buildMobileAuthRedirect } from "@/lib/mobile-auth-bridge";
import { getMobileAuthCodeSecret } from "@/lib/mobile-auth-code";

export const runtime = "nodejs";

export function GET(request: Request) {
  try {
    return Response.redirect(buildMobileAuthRedirect(request.url, {
      allowExpoRedirects: shouldAllowExpoMobileRedirects(),
      secret: getMobileAuthCodeSecret(),
    }), 302);
  } catch {
    const url = new URL(request.url);
    const fallback = new URL("/login", url.origin);
    fallback.searchParams.set("error", "Mobile auth bridge is not configured.");
    return Response.redirect(fallback.toString(), 302);
  }
}

function shouldAllowExpoMobileRedirects() {
  const value = process.env.HARVEST_ALLOW_EXPO_MOBILE_REDIRECTS;
  if (value === "true") return true;
  if (value === "false") return false;
  return process.env.NODE_ENV !== "production";
}
