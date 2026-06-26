"use client";

import { useSearchParams } from "next/navigation";
import LoginModernWorkspace from "./LoginModernWorkspace";

export default function LoginWorkspace() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const liveLoginEnabled = process.env.NEXT_PUBLIC_DISABLE_LIVE_LOGIN !== "true";

  const googleLogin = () => {
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (callbackUrl.hostname === "0.0.0.0") {
      callbackUrl.hostname = "localhost";
    }
    callbackUrl.searchParams.set("next", next);
    window.location.assign(`/api/harvest?mode=google-login&from=${encodeURIComponent(callbackUrl.toString())}`);
  };

  return (
    <LoginModernWorkspace
      liveLoginEnabled={liveLoginEnabled}
      onGoogleLogin={googleLogin}
    />
  );
}
