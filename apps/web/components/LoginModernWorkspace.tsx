"use client";

import MotionReveal from "@/components/MotionReveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Store } from "lucide-react";

type LoginModernWorkspaceProps = {
  liveLoginEnabled?: boolean;
  onGoogleLogin?: () => void;
};

export default function LoginModernWorkspace({ liveLoginEnabled, onGoogleLogin }: LoginModernWorkspaceProps) {
  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pb-24">
        <CoffeeBranchAsset className="absolute -left-20 top-10 h-80 w-80 bg-primary/[0.085]" />
        <CoffeeBranchAsset className="absolute -right-20 bottom-2 h-72 w-72 -scale-x-100 bg-primary/[0.07]" />

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <MotionReveal>
            <p className="mb-5 text-xs font-black uppercase tracking-[0.34em] text-primary">
              {liveLoginEnabled ? "Base44 Authentication" : "Authentication Required"}
            </p>
            <h1 className="font-display max-w-xl text-5xl font-black leading-tight text-foreground sm:text-6xl">Login</h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              {liveLoginEnabled
                ? "Sign in with Google through Base44 first, then dealer and admin data can be read through the secure proxy."
                : "Google sign-in is required before dealer and admin data can be read through the secure proxy."}
            </p>

            <Card className="mt-8 rounded-lg border-primary/15 bg-card/70 p-5 shadow-none">
              <div className="flex gap-4">
                <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black text-foreground">
                    {liveLoginEnabled ? "Secure live reads" : "Live session required"}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                    {liveLoginEnabled
                      ? "The Base44 API key stays on the server. The browser only stores the user session token returned by login."
                      : "Live Google sign-in is disabled for this environment, so authenticated data cannot be opened."}
                  </p>
                </div>
              </div>
            </Card>
          </MotionReveal>

          <MotionReveal delay={120} variant="right">
            <Card className="rounded-lg border-border bg-card/85 p-6 shadow-2xl shadow-primary/10 backdrop-blur-sm sm:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <Store className="h-8 w-8" />
                </div>
                <h2 className="font-display text-3xl font-black text-foreground">{liveLoginEnabled ? "Sign in" : "Login unavailable"}</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
                  {liveLoginEnabled
                    ? "Use the same Google account enabled in the live Base44 app."
                    : "Enable Google login for this environment before opening dealer or admin data."}
                </p>
              </div>

              {liveLoginEnabled ? (
                <div className="mb-5 grid gap-3">
                  <Button className="h-12 rounded-md text-base font-black" onClick={onGoogleLogin} type="button" variant="default">
                    <Store className="h-5 w-5" />
                    Continue with Google
                  </Button>
                </div>
              ) : null}
            </Card>
          </MotionReveal>
        </div>
      </section>
    </div>
  );
}

function CoffeeBranchAsset({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        maskImage: "url('/assets/coffee-branch-clean.svg')",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: "url('/assets/coffee-branch-clean.svg')",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
