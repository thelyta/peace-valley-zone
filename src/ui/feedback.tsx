"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, Inbox, X } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button, buttonVariants } from "./button";
import { Icon } from "./icon";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-secondary text-secondary-foreground",
    good: "bg-success-soft text-success-soft-foreground",
    warning: "bg-warning-soft text-warning-soft-foreground",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  detail,
  icon,
  action,
}: {
  title: string;
  detail?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="px-2 py-8 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex size-16 items-center justify-center text-muted-foreground">
          {icon}
        </div>
      ) : (
        <div className="mx-auto mb-4 flex size-16 items-center justify-center text-muted-foreground">
          <Icon icon={Inbox} size={48} />
        </div>
      )}
      <p className="text-lg font-medium text-foreground">{title}</p>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <Icon icon={AlertTriangle} size={24} className="mt-0.5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
      {retry ? (
        <Button type="button" variant="outline" className="sm:ml-auto" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const restore = () => setOnline(true);
    const lose = () => setOnline(false);
    window.addEventListener("online", restore);
    window.addEventListener("offline", lose);
    return () => {
      window.removeEventListener("online", restore);
      window.removeEventListener("offline", lose);
    };
  }, []);
  return online ? null : (
    <div
      role="status"
      className="bg-warning-soft px-4 py-2 text-center text-sm font-medium text-warning-soft-foreground"
    >
      You are offline. Gate admission cannot be confirmed until you reconnect.
    </div>
  );
}

type Toast = { id: number; message: string };
type ToastFn = (message: string) => void;

const ToastContext = createContext<ToastFn>(() => undefined);

/** Imperative toast for mutation `onError` handlers (Nexus/Lekker-style). */
let toastImpl: ToastFn = () => undefined;

export function toast(message: string) {
  toastImpl(message);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string) => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000);
  }, []);

  useEffect(() => {
    toastImpl = add;
    return () => {
      toastImpl = () => undefined;
    };
  }, [add]);

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div aria-live="polite" className="fixed bottom-20 right-4 z-50 space-y-2 md:bottom-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-xl border border-border bg-card p-6 shadow-xl outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog" className="shrink-0">
                <Icon icon={X} size={20} />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ConfirmDialog({
  open,
  title,
  detail,
  confirmLabel,
  pending,
  tone = "danger",
  children,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  detail: string;
  confirmLabel: string;
  pending?: boolean;
  tone?: "danger" | "primary";
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{detail}</AlertDialogDescription>
        </AlertDialogHeader>
        {children ? <div className="mt-2">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              buttonVariants({ variant: tone === "danger" ? "destructive" : "default" }),
            )}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
