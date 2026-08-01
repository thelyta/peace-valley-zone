"use client";

import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Icon } from "./icon";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const DATE_VALUE_FORMAT = "yyyy-MM-dd";

function parseDateValue(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

function formatDateValue(date: Date): string {
  return format(date, DATE_VALUE_FORMAT);
}

export type DatePickerProps = {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /** Allow clearing optional dates. */
  clearable?: boolean;
};

export function DatePicker({
  id,
  value = "",
  onChange,
  onBlur,
  name,
  disabled,
  placeholder = "Pick a date",
  className,
  clearable = false,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          name={name}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          data-empty={!selected}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <Icon icon={CalendarIcon} size={20} />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          className="w-full"
          onSelect={(date) => {
            onChange?.(date ? formatDateValue(date) : "");
            setOpen(false);
          }}
          defaultMonth={selected}
          autoFocus
        />
        {clearable && value ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
