"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        caption: "relative flex items-center justify-center px-8 pt-1",
        caption_label: "text-sm font-black text-foreground",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        nav_button: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 rounded-xl border border-border bg-background/70 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground",
        ),
        nav_button_previous: "left-0",
        nav_button_next: "right-0",
        table: "w-full border-collapse space-y-1",
        head_row: "grid grid-cols-7",
        head_cell: "grid h-9 place-items-center text-[11px] font-black uppercase tracking-[0.08em] text-muted-foreground",
        row: "grid grid-cols-7",
        cell: "relative grid h-9 place-items-center p-0 text-center text-sm",
        day: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 rounded-xl p-0 text-sm font-bold text-foreground hover:bg-secondary aria-selected:opacity-100",
        ),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-secondary text-foreground",
        day_outside: "text-muted-foreground/40 opacity-60",
        day_disabled: "text-muted-foreground/30 opacity-40",
        day_range_middle: "aria-selected:bg-secondary aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className }: { className?: string }) => <ChevronLeft className={cn("h-4 w-4", className)} />,
        IconRight: ({ className }: { className?: string }) => <ChevronRight className={cn("h-4 w-4", className)} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
