"use client";

import { CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type ToastKind = "loading" | "success" | "error" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastInput = Omit<ToastItem, "id" | "kind"> & {
  id?: string;
  duration?: number;
};

type ToastPromiseMessages<T> = {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
};

const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener(items));
}

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function upsertToast(toast: ToastItem) {
  items = [toast, ...items.filter((item) => item.id !== toast.id)].slice(0, 5);
  emit();
}

function dismissToast(id: string) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function scheduleDismiss(id: string, duration = 2800) {
  window.setTimeout(() => dismissToast(id), duration);
}

function show(kind: ToastKind, input: ToastInput) {
  const id = input.id || createId();
  upsertToast({ id, kind, title: input.title, description: input.description });
  if (kind !== "loading") scheduleDismiss(id, input.duration);
  return id;
}

export const requestToast = {
  loading(input: ToastInput) {
    return show("loading", input);
  },
  success(input: ToastInput) {
    return show("success", input);
  },
  error(input: ToastInput) {
    return show("error", input);
  },
  info(input: ToastInput) {
    return show("info", input);
  },
  dismiss: dismissToast,
  async promise<T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) {
    const id = show("loading", { title: messages.loading });
    try {
      const value = await promise;
      show("success", {
        id,
        title: typeof messages.success === "function" ? messages.success(value) : messages.success,
      });
      return value;
    } catch (error) {
      show("error", {
        id,
        title: typeof messages.error === "function" ? messages.error(error) : messages.error,
      });
      throw error;
    }
  },
};

export function Sonner() {
  const [toasts, setToasts] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col-reverse gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => {
        const Icon = getToastIcon(toast.kind);
        return (
          <div
            className="pointer-events-auto flex min-h-16 items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-950 shadow-2xl shadow-neutral-950/10 animate-in slide-in-from-bottom-2 fade-in-0"
            key={toast.id}
          >
            <span className={getIconClassName(toast.kind)}>
              <Icon className={toast.kind === "loading" ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-5 text-neutral-950">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{toast.description}</p> : null}
            </div>
            <button
              aria-label="Dismiss notification"
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function getToastIcon(kind: ToastKind) {
  if (kind === "success") return CheckCircle2;
  if (kind === "error") return XCircle;
  if (kind === "loading") return Loader2;
  return Info;
}

function getIconClassName(kind: ToastKind) {
  const base = "grid h-9 w-9 flex-shrink-0 place-items-center rounded-full";
  if (kind === "success") return `${base} bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]`;
  if (kind === "error") return `${base} bg-[hsl(var(--status-danger)/0.1)] text-[hsl(var(--status-danger))]`;
  if (kind === "loading") return `${base} bg-primary/10 text-primary`;
  return `${base} bg-[hsl(var(--status-info)/0.1)] text-[hsl(var(--status-info))]`;
}
