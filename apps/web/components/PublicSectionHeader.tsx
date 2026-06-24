"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PublicSectionHeaderProps = {
  align?: "left" | "center";
  className?: string;
  description?: ReactNode;
  divider?: boolean;
  eyebrow?: ReactNode;
  size?: "page" | "section" | "compact";
  title: ReactNode;
};

export default function PublicSectionHeader({
  align = "left",
  className,
  description,
  divider = true,
  eyebrow,
  size = "section",
  title,
}: PublicSectionHeaderProps) {
  const centered = align === "center";
  const Heading = size === "page" ? "h1" : "h2";
  const titleSize = {
    page: "text-5xl leading-tight sm:text-6xl lg:text-7xl",
    section: "text-4xl leading-tight sm:text-5xl",
    compact: "text-3xl leading-tight sm:text-4xl",
  }[size];

  return (
    <div className={cn(centered ? "mx-auto text-center" : "", className)}>
      {eyebrow && (
        <p className="text-xs font-black uppercase tracking-[0.34em] text-primary">
          {eyebrow}
        </p>
      )}
      {divider && (
        <div className={cn("mt-4 flex w-36 items-center gap-3 text-primary/70", centered && "mx-auto justify-center")}>
          <span className="h-px flex-1 bg-primary/35" />
          <span className="grid h-5 w-5 place-items-center rounded-full border border-primary/40 text-[10px] font-black">H</span>
          <span className="h-px flex-1 bg-primary/35" />
        </div>
      )}
      <Heading className={cn("font-display font-black tracking-normal text-foreground", eyebrow || divider ? "mt-6" : "", titleSize)}>
        {title}
      </Heading>
      {description && (
        <p className={cn("mt-5 text-base font-medium leading-8 text-muted-foreground", size === "page" && "text-lg", centered && "mx-auto")}>
          {description}
        </p>
      )}
    </div>
  );
}
