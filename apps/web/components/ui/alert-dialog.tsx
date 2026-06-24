"use client";

import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlertDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel?: string;
  description: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  tone?: "default" | "destructive";
};

export function AlertDialog({
  cancelLabel = "Cancel",
  children,
  confirmLabel = "Confirm",
  description,
  loading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = "default",
}: AlertDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-foreground/45 px-4 py-8 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl shadow-primary/15">
        <header className="flex items-start gap-4 border-b border-border p-5">
          <span
            className={cn(
              "grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl",
              tone === "destructive"
                ? "bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))]"
                : "bg-primary/10 text-primary",
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black tracking-normal text-foreground">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{description}</p>
          </div>
          <button
            aria-label="Close dialog"
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {children ? <div className="border-b border-border px-5 py-4">{children}</div> : null}

        <footer className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
          <Button disabled={loading} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {cancelLabel}
          </Button>
          <Button
            className={tone === "destructive" ? "bg-[hsl(var(--status-danger))] text-white hover:bg-[hsl(var(--status-danger)/0.9)]" : undefined}
            disabled={loading}
            onClick={() => void onConfirm()}
            type="button"
            variant={tone === "destructive" ? "default" : "dark"}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </footer>
      </div>
    </div>
  );
}
