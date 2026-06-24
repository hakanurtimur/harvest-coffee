"use client";

import { isHarvestMockAuthEnabled, setHarvestAccessToken } from "@/lib/harvest-api";
import { useSearchParams } from "next/navigation";
import LoginModernWorkspace from "./LoginModernWorkspace";

export default function LoginWorkspace() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const adminNext = "/admin";
  const dealerLoginTarget = `${next}${next.includes("?") ? "&" : "?"}mockAuth=1&mockRole=dealer`;
  const adminLoginTarget = `${adminNext}?mockAuth=1&mockRole=admin`;
  const liveLoginEnabled = process.env.NEXT_PUBLIC_DISABLE_LIVE_LOGIN !== "true";
  const mockLoginEnabled = isHarvestMockAuthEnabled();

  const login = (role: "dealer" | "admin") => {
    if (!mockLoginEnabled) return;
    setHarvestAccessToken(null);
    window.localStorage.setItem("harvest_mock_auth", "logged-in");
    window.localStorage.setItem("harvest_mock_role", role);
    window.dispatchEvent(new Event("harvest_mock_auth_changed"));
    window.location.assign(role === "admin" ? adminNext : next);
  };

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
      adminLoginTarget={adminLoginTarget}
      dealerLoginTarget={dealerLoginTarget}
      liveLoginEnabled={liveLoginEnabled}
      mockLoginEnabled={mockLoginEnabled}
      onGoogleLogin={googleLogin}
      onLogin={login}
    />
  );
}
