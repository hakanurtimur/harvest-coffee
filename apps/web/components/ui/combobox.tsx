"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type ComboboxProps = {
  className?: string;
  disabled?: boolean;
  id?: string;
  loading?: boolean;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
};

export function Combobox({
  className,
  disabled = false,
  id,
  loading = false,
  onChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  value,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const isDisabled = disabled || loading;

  return (
    <Popover open={open && !isDisabled} onOpenChange={(nextOpen) => !isDisabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label={selectedOption ? `Selected ${selectedOption.label}` : placeholder}
          className={cn(
            "h-11 w-full justify-between rounded-xl border border-border bg-background px-3 text-left text-sm font-bold text-foreground shadow-none hover:bg-secondary disabled:opacity-60",
            !selectedOption && "text-muted-foreground",
            className,
          )}
          disabled={isDisabled}
          id={id}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="min-w-0 flex-1 truncate text-left">{selectedOption?.label ?? placeholder}</span>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <input
          className="mb-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          value={query}
        />
        <div className="max-h-72 overflow-y-auto pr-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm font-semibold text-muted-foreground">No results found.</div>
          ) : (
            <div className="grid gap-1">
              {filteredOptions.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-45",
                      selected && "bg-secondary text-primary",
                    )}
                    disabled={option.disabled}
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    type="button"
                  >
                    <Check className={cn("h-4 w-4 flex-shrink-0", selected ? "opacity-100" : "opacity-0")} />
                    <span className="min-w-0 flex-1">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
