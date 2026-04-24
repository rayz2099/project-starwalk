"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, MapPin } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCATIONS } from "@/config/locations";
import { MAX_DATE_RANGE_DAYS } from "@/features/stargazing/constants";

export interface ControlPanelValue {
  startDate: string;
  endDate: string;
  locationIds: string[];
}

interface ControlPanelProps {
  value: ControlPanelValue;
  loading: boolean;
  onSubmit: (value: ControlPanelValue) => void;
}

function toYmd(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function fromYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function ControlPanel({ value, loading, onSubmit }: ControlPanelProps) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: fromYmd(value.startDate),
    to: fromYmd(value.endDate)
  });
  const [locationIds, setLocationIds] = useState<string[]>(value.locationIds);

  const days =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
      : 0;
  const overflow = days > MAX_DATE_RANGE_DAYS;
  const noLocation = locationIds.length === 0;
  const noRange = !range?.from || !range?.to;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between rounded-lg border bg-card/50 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">观测日期范围</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[280px] justify-start font-normal">
              <CalendarIcon className="h-4 w-4 opacity-70" />
              {range?.from && range?.to
                ? `${toYmd(range.from)} → ${toYmd(range.to)} (${days}天)`
                : "选择日期范围"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
        {overflow ? (
          <span className="text-xs text-rating-poor">范围超过 {MAX_DATE_RANGE_DAYS} 天上限</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> 观测地点（多选）
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {LOCATIONS.map((loc) => {
            const checked = locationIds.includes(loc.id);
            return (
              <label
                key={loc.id}
                className="flex items-center gap-2 rounded-md border bg-background/40 px-3 py-2 text-sm hover:bg-accent/50 cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    setLocationIds((prev) =>
                      c ? Array.from(new Set([...prev, loc.id])) : prev.filter((id) => id !== loc.id)
                    );
                  }}
                />
                <span className="truncate">{loc.name}</span>
              </label>
            );
          })}
        </div>
        {noLocation ? <span className="text-xs text-rating-poor">至少选择一个地点</span> : null}
      </div>

      <div className="flex gap-2">
        <Button
          disabled={loading || overflow || noLocation || noRange}
          onClick={() => {
            if (!range?.from || !range?.to) return;
            onSubmit({
              startDate: toYmd(range.from),
              endDate: toYmd(range.to),
              locationIds
            });
          }}
        >
          {loading ? "计算中…" : "刷新矩阵"}
        </Button>
      </div>
    </div>
  );
}
