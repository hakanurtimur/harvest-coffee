"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  id?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function DatePicker({
  className,
  disabled = false,
  fromDate,
  id,
  onChange,
  placeholder = "Select date",
  value,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={selectedDate ? `Selected date ${format(selectedDate, "dd MMM yyyy")}` : placeholder}
          className={cn(
            "h-11 w-full justify-start rounded-xl border border-border bg-background px-3 text-left text-sm font-bold text-foreground shadow-none hover:bg-secondary",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
          id={id}
          type="button"
          variant="outline"
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="min-w-0 flex-1 truncate">{selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          fromDate={fromDate}
          mode="single"
          onSelect={(date) => {
            if (!date) return;
            onChange(toDateValue(date));
            setOpen(false);
          }}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseDateValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}
