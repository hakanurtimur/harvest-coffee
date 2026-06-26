"use client";

import AppShell from "@/components/AppShell";
import PublicShell from "@/components/PublicShell";
import { HARVEST_AUTH_EVENT, hasHarvestSession, syncHarvestSessionFromUrl } from "@/lib/harvest-api";
import { ReactNode, useEffect, useState } from "react";

type ShellState = "checking" | "authenticated" | "public";
type ProductsRouteShellProps = {
  children: ReactNode | ((context: { authenticated: boolean }) => ReactNode);
};

export default function ProductsRouteShell({ children }: ProductsRouteShellProps) {
  const [shellState, setShellState] = useState<ShellState>("checking");

  useEffect(() => {
    const syncSession = () => {
      syncHarvestSessionFromUrl();
      setShellState(hasHarvestSession() ? "authenticated" : "public");
    };

    syncSession();
    window.addEventListener(HARVEST_AUTH_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(HARVEST_AUTH_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  if (shellState === "checking") {
    return (
      <div className="harvest-theme grid min-h-screen place-items-center bg-background text-foreground">
        <div
          aria-label="Loading"
          className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
          role="status"
        />
      </div>
    );
  }

  if (shellState === "authenticated") {
    const content = typeof children === "function" ? children({ authenticated: true }) : children;
    return <AppShell>{content}</AppShell>;
  }

  const content = typeof children === "function" ? children({ authenticated: false }) : children;
  return <PublicShell>{content}</PublicShell>;
}
