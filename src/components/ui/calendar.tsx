"use client";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// 简化版日历，复用 react-day-picker 内置样式 + 主题覆盖
export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("p-2 [--rdp-accent-color:hsl(var(--primary))] [--rdp-background-color:hsl(var(--accent))]", className)}
      {...props}
    />
  );
}
