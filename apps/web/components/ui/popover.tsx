"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type PopoverContextValue = {
  contentRef: React.RefObject<HTMLDivElement | null>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function Popover({ children, onOpenChange, open }: { children: ReactNode; onOpenChange: (open: boolean) => void; open: boolean }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <PopoverContext.Provider value={{ contentRef, onOpenChange, open, triggerRef }}>
      <div className="relative" ref={ref}>{children}</div>
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({ asChild = false, children }: { asChild?: boolean; children: ReactNode }) {
  const context = usePopoverContext();

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (event: MouseEvent) => void }>;
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ref: (node: HTMLElement | null) => {
        context.triggerRef.current = node;
        const childRef = (child as ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
        if (typeof childRef === "function") childRef(node);
        else if (childRef && "current" in childRef) {
          (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      onClick: (event: MouseEvent) => {
        child.props.onClick?.(event);
        context.onOpenChange(!context.open);
      },
    } as Record<string, unknown>);
  }

  return (
    <button ref={context.triggerRef as React.RefObject<HTMLButtonElement>} onClick={() => context.onOpenChange(!context.open)} type="button">
      {children}
    </button>
  );
}

function PopoverContent({
  align = "center",
  children,
  className,
}: {
  align?: "start" | "center" | "end";
  children: ReactNode;
  className?: string;
}) {
  const context = usePopoverContext();
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!context.open) return;

    const updatePosition = () => {
      const rect = context.triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = 320;
      const gutter = 16;
      const top = Math.min(rect.bottom + 8, window.innerHeight - gutter);
      const preferredLeft = align === "end" ? rect.right - width : align === "center" ? rect.left + rect.width / 2 - width / 2 : rect.left;
      const left = Math.min(Math.max(preferredLeft, gutter), window.innerWidth - width - gutter);
      setStyle({ left, top, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, context.open, context.triggerRef]);

  if (!context.open) return null;

  return createPortal(
    <div
      ref={(node) => {
        context.contentRef.current = node;
        if (node) {
          const rect = node.getBoundingClientRect();
          if (rect.bottom > window.innerHeight - 16) {
            setStyle((current) => ({ ...current, top: Math.max(16, (context.triggerRef.current?.getBoundingClientRect().top ?? 16) - rect.height - 8) }));
          }
        }
      }}
      className={cn(
        "fixed z-[10000] rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-2xl shadow-primary/10 outline-none animate-in fade-in-0 zoom-in-95",
        className,
      )}
      style={style}
    >
      {children}
    </div>,
    document.body,
  );
}

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) throw new Error("Popover components must be used inside Popover.");
  return context;
}

export { Popover, PopoverContent, PopoverTrigger };
