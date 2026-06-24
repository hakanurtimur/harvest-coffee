"use client";

import { isHarvestMockAuthEnabled, setHarvestAccessToken } from "@/lib/harvest-api";
import { useV2Enabled } from "@/lib/v2-pages";
import { LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import LoginV2Workspace from "./LoginV2Workspace";

export default function LoginWorkspace() {
  const v2Enabled = useV2Enabled("/login");
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
    const from = new URL(window.location.href);
    if (from.hostname === "0.0.0.0") {
      from.hostname = "localhost";
    }
    from.searchParams.set("next", next);
    window.location.assign(`/api/harvest?mode=google-login&from=${encodeURIComponent(from.toString())}`);
  };

  if (v2Enabled) {
    return (
      <LoginV2Workspace
        adminLoginTarget={adminLoginTarget}
        dealerLoginTarget={dealerLoginTarget}
        liveLoginEnabled={liveLoginEnabled}
        mockLoginEnabled={mockLoginEnabled}
        onGoogleLogin={googleLogin}
        onLogin={login}
      />
    );
  }

  return (
    <section className="py-24 px-4">
      <div className="max-w-md mx-auto rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mb-3">
          {liveLoginEnabled ? "Base44 authentication" : mockLoginEnabled ? "Mock authentication" : "Authentication required"}
        </p>
        <h1 className="text-4xl font-bold text-amber-900 mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Login
        </h1>
        <p className="text-gray-600 mb-8">
          {liveLoginEnabled
            ? "Use Google through Base44 to read live dealer/admin data through the secure proxy."
            : mockLoginEnabled
              ? "This is a temporary mock login for parity testing. Real Base44 auth will be wired later."
              : "Mock web sessions are disabled. Enable Google login or explicit mock auth for local testing."}
        </p>
        {liveLoginEnabled ? (
          <button
            className="mb-6 inline-flex w-full items-center justify-center rounded-md bg-amber-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-800"
            onClick={googleLogin}
            type="button"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Continue with Google
          </button>
        ) : null}
        {mockLoginEnabled ? (
          <div className="grid gap-3">
            <a
              href={dealerLoginTarget}
              onClick={(event) => {
                event.preventDefault();
                login("dealer");
              }}
              onPointerUp={() => login("dealer")}
              className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-6 py-3 font-semibold transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login as dealer
            </a>
            <a
              href={adminLoginTarget}
              onClick={(event) => {
                event.preventDefault();
                login("admin");
              }}
              onPointerUp={() => login("admin")}
              className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 font-semibold transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login as admin
            </a>
          </div>
        ) : null}
        {mockLoginEnabled ? (
          <noscript>
            <a
              href={dealerLoginTarget}
              className="inline-flex items-center justify-center rounded-md bg-amber-900 hover:bg-amber-800 text-white px-6 py-3 font-semibold transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login as dealer
            </a>
            <a
              href={adminLoginTarget}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 font-semibold transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login as admin
            </a>
          </noscript>
        ) : null}
      </div>
    </section>
  );
}
