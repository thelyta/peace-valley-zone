"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { type ComponentProps, useContext } from "react";
import { cn } from "@/lib/utils";

export function InputOTP({
  className,
  containerClassName,
  ...props
}: ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

export function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

export function InputOTPSlot({
  index,
  className,
  ...props
}: ComponentProps<"div"> & { index: number }) {
  const inputOTPContext = useContext(OTPInputContext);
  const slot = inputOTPContext?.slots[index];
  const char = slot?.char;
  const hasFakeCaret = slot?.hasFakeCaret;
  const isActive = slot?.isActive;

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-12 items-center justify-center rounded-md border border-input bg-card font-mono text-xl font-semibold shadow-sm transition-colors sm:size-14 sm:text-2xl",
        "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-ring/35",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-px animate-pulse bg-foreground" />
        </div>
      ) : null}
    </div>
  );
}

export function InputOTPSeparator({ ...props }: ComponentProps<"div">) {
  return (
    <div aria-hidden="true" className="text-muted-foreground" {...props}>
      ·
    </div>
  );
}
