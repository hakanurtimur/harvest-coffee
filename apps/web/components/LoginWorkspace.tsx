"use client";

import { useV2Enabled } from "@/lib/v2-pages";
import { LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import LoginV2Workspace from "./LoginV2Workspace";

export default function LoginWorkspace() {
  const v2Enabled = useV2Enabled("/login");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const adminNext = "/admin";
  const dealerLoginTarget = `${next}${next.includes("?") ? "&" : "?"}mockAuth=1&mockRole=dealer`;
  const adminLoginTarget = `${adminNext}?mockAuth=1&mockRole=admin`;

  const login = (role: "dealer" | "admin") => {
    window.localStorage.setItem("harvest_mock_auth", "logged-in");
    window.localStorage.setItem("harvest_mock_role", role);
    window.dispatchEvent(new Event("harvest_mock_auth_changed"));
    window.location.assign(role === "admin" ? adminNext : next);
  };

  if (v2Enabled) {
    return <LoginV2Workspace adminLoginTarget={adminLoginTarget} dealerLoginTarget={dealerLoginTarget} onLogin={login} />;
  }

  return (
    <section className="py-24 px-4">
      <div className="max-w-md mx-auto rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase mb-3">Mock authentication</p>
        <h1 className="text-4xl font-bold text-amber-900 mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Login
        </h1>
        <p className="text-gray-600 mb-8">
          This is a temporary mock login for parity testing. Real Base44 auth will be wired later.
        </p>
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
      </div>
    </section>
  );
}
