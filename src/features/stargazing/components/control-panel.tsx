"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon, MapPin, Sparkles } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCATION_GROUPS, LOCATIONS } from "@/config/locations";
import { MAX_DATE_RANGE_DAYS } from "@/features/stargazing/constants";
import { getLightPollutionSummary, getLightPollutionTier } from "@/features/stargazing/light-pollution";
import { cn } from "@/lib/utils";

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

// 常用范围预设：避免用户必须戳两次日历
const PRESETS: Array<{ label: string; days: number }> = [
  { label: "今夜", days: 1 },
  { label: "3 天", days: 3 },
  { label: "1 周", days: 7 },
  { label: "2 周", days: 14 }
];

// 提前按组编排地点，why：控制区和矩阵都要复用同一套区域顺序
const LOCATIONS_BY_GROUP = LOCATION_GROUPS.map((group) => ({
  ...group,
  locations: LOCATIONS.filter((location) => location.groupId === group.id)
}));

// 统一处理本组全选，why：避免多处分散写 Set 合并逻辑
function addLocationIds(current: string[], nextIds: string[]): string[] {
  return Array.from(new Set([...current, ...nextIds]));
}

// 统一处理本组清空，why：让“整组取消”和“单项取消”都遵循相同语义
function removeLocationIds(current: string[], removeIds: string[]): string[] {
  return current.filter((id) => !removeIds.includes(id));
}

// 光污染小标签颜色：why：这里强调地点长期背景质量，不抢评级 Badge 的主视觉
function lightPollutionTextClass(bortle: number): string {
  const tier = getLightPollutionTier(bortle);
  if (tier === "dark") return "text-emerald-300";
  if (tier === "moderate") return "text-amber-300";
  return "text-rose-300";
}

export function ControlPanel({ value, loading, onSubmit }: ControlPanelProps) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: fromYmd(value.startDate),
    to: fromYmd(value.endDate)
  });
  const [locationIds, setLocationIds] = useState<string[]>(value.locationIds);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const days =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
      : 0;
  const overflow = days > MAX_DATE_RANGE_DAYS;
  const noLocation = locationIds.length === 0;
  const noRange = !range?.from || !range?.to;
  const allSelected = locationIds.length === LOCATIONS.length;

  function applyPreset(d: number) {
    const today = new Date();
    setRange({ from: today, to: addDays(today, d - 1) });
    setCalendarOpen(false);
  }

  function rangeLabel(): string {
    if (!range?.from || !range?.to) return "选择日期范围";
    const sameDay =
      range.from.getFullYear() === range.to.getFullYear() &&
      range.from.getMonth() === range.to.getMonth() &&
      range.from.getDate() === range.to.getDate();
    if (sameDay) return `${format(range.from, "M/d EEE")} · 单日`;
    return `${format(range.from, "M/d")} → ${format(range.to, "M/d")} · ${days} 天`;
  }

  function submit() {
    if (!range?.from || !range?.to) return;
    onSubmit({
      startDate: toYmd(range.from),
      endDate: toYmd(range.to),
      locationIds
    });
  }

  return (
    <section className="glass-panel p-5 space-y-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-2 lg:w-[360px] shrink-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            观测日期范围
          </span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 w-full justify-start font-medium tabular-nums"
              >
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="truncate">{rangeLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="start">
              <Calendar
                mode="range"
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  if (r?.from && r?.to) setCalendarOpen(false);
                }}
                numberOfMonths={2}
                defaultMonth={range?.from ?? new Date()}
              />
            </PopoverContent>
          </Popover>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  "hover:border-primary hover:text-primary",
                  days === preset.days
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {overflow ? (
            <span className="text-xs text-rating-poor">
              范围超过 {MAX_DATE_RANGE_DAYS} 天上限
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 观测地点 · 已选 {locationIds.length}/{LOCATIONS.length}
            </span>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() =>
                setLocationIds(allSelected ? [] : LOCATIONS.map((location) => location.id))
              }
            >
              {allSelected ? "全部取消" : "全选"}
            </button>
          </div>

          <div className="space-y-3">
            {LOCATIONS_BY_GROUP.map((group) => {
              const groupLocationIds = group.locations.map((location) => location.id);
              const selectedCount = groupLocationIds.filter((id) => locationIds.includes(id)).length;
              const allGroupSelected = selectedCount === groupLocationIds.length;

              return (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-xl border border-border/70 bg-background/30"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{group.label}</p>
                      <p className="text-[11px] text-muted-foreground">{group.description}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-primary hover:underline"
                      onClick={() =>
                        setLocationIds((current) =>
                          allGroupSelected
                            ? removeLocationIds(current, groupLocationIds)
                            : addLocationIds(current, groupLocationIds)
                        )
                      }
                    >
                      {allGroupSelected ? "清空本组" : "全选本组"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 p-3">
                    {group.locations.map((location) => {
                      const checked = locationIds.includes(location.id);
                      return (
                        <label
                          key={location.id}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors",
                            checked
                              ? "border-primary/60 bg-primary/5 text-foreground"
                              : "border-border bg-background/40 hover:bg-accent/50"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(checkedValue) => {
                              setLocationIds((current) =>
                                checkedValue
                                  ? addLocationIds(current, [location.id])
                                  : removeLocationIds(current, [location.id])
                              );
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate" title={location.name}>
                              {location.name}
                            </span>
                            <span
                              className={cn(
                                "mt-1 block text-[11px] tabular-nums",
                                lightPollutionTextClass(location.lightPollutionBortle)
                              )}
                            >
                              {getLightPollutionSummary(location.lightPollutionBortle)} · {location.elevation}m
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {noLocation ? (
            <span className="text-xs text-rating-poor">至少选择一个地点</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
        <Button
          size="lg"
          disabled={loading || overflow || noLocation || noRange}
          onClick={submit}
          className="min-w-[140px]"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "计算中…" : "刷新矩阵"}
        </Button>
      </div>
    </section>
  );
}
