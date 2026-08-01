"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";
import { Label } from "./label";

export { Input } from "./input";
export { Label } from "./label";
export { Textarea } from "./textarea";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const child = Children.only(children);
  const existingId =
    isValidElement<{ id?: string }>(child) && typeof child.props.id === "string"
      ? child.props.id
      : undefined;
  const controlId = existingId ?? generatedId;
  const describedBy = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  const control = isValidElement(child)
    ? cloneElement(
        child as ReactElement<{
          id?: string;
          "aria-invalid"?: boolean;
          "aria-describedby"?: string;
        }>,
        {
          id: controlId,
          "aria-invalid": Boolean(error) || undefined,
          "aria-describedby": describedBy,
        },
      )
    : children;

  return (
    <div className="block space-y-1.5">
      <Label htmlFor={controlId}>{label}</Label>
      {control}
      {error ? (
        <span id={`${controlId}-error`} className="block text-sm text-destructive">
          {error}
        </span>
      ) : hint ? (
        <span id={`${controlId}-hint`} className="block text-sm text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
