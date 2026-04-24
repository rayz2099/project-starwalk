"use client";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * 日历组件 why：react-day-picker v9 默认样式偏中性，需要把强调色 / hover / range 颜色显式
 * 绑到 shadcn 主题变量上，否则在亮色主题下 range 块几乎不可见。
 */
export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn(
        "p-3 text-sm",
        // 通过 CSS 变量驱动 rdp 内置颜色
        "[--rdp-accent-color:hsl(var(--primary))]",
        "[--rdp-accent-background-color:hsl(var(--accent))]",
        "[--rdp-background-color:transparent]",
        "[--rdp-day_button-border-radius:9999px]",
        "[--rdp-day-height:2.25rem]",
        "[--rdp-day-width:2.25rem]",
        "[&_.rdp-day_button:hover]:bg-accent [&_.rdp-day_button:hover]:text-accent-foreground",
        "[&_.rdp-selected_.rdp-day_button]:!bg-primary [&_.rdp-selected_.rdp-day_button]:!text-primary-foreground",
        "[&_.rdp-range_middle_.rdp-day_button]:!bg-accent [&_.rdp-range_middle_.rdp-day_button]:!text-accent-foreground [&_.rdp-range_middle_.rdp-day_button]:!rounded-none",
        "[&_.rdp-outside]:opacity-40",
        "[&_.rdp-caption_label]:font-medium",
        "[&_.rdp-nav_button]:rounded-md [&_.rdp-nav_button]:hover:bg-accent",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        ...(classNames ?? {})
      }}
      {...props}
    />
  );
}
