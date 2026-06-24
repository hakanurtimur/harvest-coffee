"use client";

import type { ReactNode } from "react";

export default function AdminPageHeader({
  actions,
  description,
  eyebrow = "Admin",
  title,
}: {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-foreground md:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
