"use client";

import { getHarvestApi, HARVEST_AUTH_EVENT, setHarvestAccessToken } from "@/lib/harvest-api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthLoading message="Completing sign in..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const api = useMemo(() => getHarvestApi(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const next = searchParams.get("next") || "/home";

    if (!accessToken) {
      setError("Google sign in did not return an access token.");
      return;
    }

    setHarvestAccessToken(accessToken);
    void api.getCurrentUser()
      .then((user) => {
        window.localStorage.setItem("harvest_user_label", user?.fullName || user?.email || "Harvest User");
        window.dispatchEvent(new Event(HARVEST_AUTH_EVENT));
        router.replace(user?.role === "admin" ? "/admin" : next);
      })
      .catch((callbackError) => {
        setHarvestAccessToken(null);
        setError(callbackError instanceof Error ? callbackError.message : "Could not complete Google sign in.");
      });
  }, [api, router, searchParams]);

  if (error) {
    return (
      <AuthLoading
        message="Sign in could not be completed."
        detail={error}
      />
    );
  }

  return <AuthLoading message="Completing sign in..." detail="Reading your Base44 account and preparing your workspace." />;
}

function AuthLoading({ detail, message }: { detail?: string; message: string }) {
  return (
    <main className="harvest-theme grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-2xl shadow-primary/10">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <h1 className="font-display text-2xl font-black">{message}</h1>
        {detail ? <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">{detail}</p> : null}
      </section>
    </main>
  );
}
