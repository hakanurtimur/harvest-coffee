"use client";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  description?: string;
  eyebrow?: string;
  minHeight?: string;
  title?: string;
};

export default function LoadingState({
  className,
  description = "Fetching the latest Harvest Coffee data.",
  eyebrow = "Harvest Coffee",
  minHeight = "min-h-[360px]",
  title = "Loading workspace",
}: LoadingStateProps) {
  return (
    <div className={cn("harvest-theme relative grid place-items-center overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm shadow-primary/5", minHeight, className)}>
      <CoffeeBranchMask className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 bg-primary/[0.055]" />
      <CoffeeBranchMask className="pointer-events-none absolute -right-16 top-0 h-56 w-56 -scale-x-100 bg-primary/[0.045]" />
      <div className="relative px-6 text-center">
        <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-foreground">{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CoffeeBranchMask({ className }: { className?: string }) {
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
