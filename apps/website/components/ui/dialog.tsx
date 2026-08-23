"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onOpenChange(false);
          }
        }}
      >
        <div
          className="fixed inset-0 -z-10"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-md animate-scaleIn">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
  showCloseButton = true,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  const context = React.useContext(DialogContext);
  const handleClose = onClose ?? (() => context?.onOpenChange(false));

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 text-card-foreground shadow-2xl relative select-none",
        className
      )}
    >
      {showCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn(
        "text-xl font-black leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-sm font-bold text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col gap-2 pt-4 border-t border-border mt-4",
        className
      )}
      {...props}
    />
  );
}

export function DialogClose({
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={(e) => {
        context?.onOpenChange(false);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
