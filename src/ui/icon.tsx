import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

/** App-wide Lucide defaults — stroke 1.75 only. */
export function Icon({
  icon: Lucide,
  size = 20,
  className,
  ...props
}: LucideProps & {
  icon: LucideIcon;
  size?: number;
}) {
  return (
    <Lucide
      size={size}
      strokeWidth={1.75}
      absoluteStrokeWidth={false}
      aria-hidden={props["aria-label"] || props["aria-labelledby"] ? undefined : true}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
