"use client";

import { useMemo, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon, Loader2, MapPin, Pin, Search, X } from "lucide-react";
import { searchLocationsAction } from "@app/actions";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LOCATION_GROUPS, LOCATIONS } from "@/config/locations";
import { MAX_DATE_RANGE_DAYS, MAX_SELECTED_LOCATIONS } from "@/features/stargazing/constants";
import { getLightPollutionSummary, getLightPollutionTier } from "@/features/stargazing/light-pollution";
import { cn } from "@/lib/utils";
import type { LocationConfig } from "../types";

export interface ControlPanelValue {
  startDate: string;
  endDate: string;
  locationIds: string[];
  customLocations?: LocationConfig[];
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

// 常用范围预设: 避免用户必须戳两次日历
const PRESETS: Array<{ label: string; days: number }> = [
  { label: "今夜", days: 1 },
  { label: "3 天", days: 3 },
  { label: "1 周", days: 7 },
  { label: "2 周", days: 14 }
];

// 提前按组编排地点, why: 控制区和矩阵都要复用同一套区域顺序
const LOCATIONS_BY_GROUP = LOCATION_GROUPS.map((group) => ({
  ...group,
  locations: LOCATIONS.filter((location) => location.groupId === group.id)
}));

const JIANGZHE_LOCATION_IDS = LOCATIONS.filter((location) => location.groupId === "jiangzhe").map(
  (location) => location.id
);

// 统一合并 id，why：禁止静默截断，超限由提交校验/UI 硬顶拦截
function addLocationIds(current: string[], nextIds: string[]): string[] {
  return Array.from(new Set([...current, ...nextIds]));
}

// 统一处理本组清空, why: 让整组取消和单项取消都遵循相同语义
function removeLocationIds(current: string[], removeIds: string[]): string[] {
  return current.filter((id) => !removeIds.includes(id));
}

// 搜索结果也按 id 去重，why：同一地址重复固定时不能产生多个等价对象
function addLocationObjects(current: LocationConfig[], next: LocationConfig[]): LocationConfig[] {
  return Array.from(new Map([...current, ...next].map((location) => [location.id, location])).values());
}

// 搜索归一化集中在这里, why: 地点名, 区域名, id 共用同一个匹配口径
function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

// 光污染小标签颜色, why: 这里强调地点长期背景质量, 不抢评级 Badge 的主视觉
function lightPollutionTextClass(bortle: number | undefined): string {
  const tier = getLightPollutionTier(bortle);
  if (tier === "unknown") return "text-muted-foreground";
  if (tier === "dark") return "text-emerald-500 dark:text-emerald-300";
  if (tier === "moderate") return "text-amber-600 dark:text-amber-300";
  return "text-rose-600 dark:text-rose-300";
}

// 固定地点列表按数量展开，why：默认全选地点较多时，内部短滚动会削弱横向对比前的确认效率
function pinnedLocationMaxHeight(locationCount: number): number {
  if (locationCount <= 0) return 0;
  return Math.max(180, locationCount * 34);
}

export function ControlPanel({ value, loading, onSubmit }: ControlPanelProps) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: fromYmd(value.startDate),
    to: fromYmd(value.endDate)
  });
  const [locationIds, setLocationIds] = useState<string[]>(value.locationIds);
  const [customLocations, setCustomLocations] = useState<LocationConfig[]>(value.customLocations ?? []);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationConfig[]>([]);
  const [searchError, setSearchError] = useState<string | undefined>();
  const [searchPending, startSearchTransition] = useTransition();

  const days =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1
      : 0;
  const overflow = days > MAX_DATE_RANGE_DAYS;
  const noLocation = locationIds.length === 0;
  const noRange = !range?.from || !range?.to;
  const locationOverflow = locationIds.length > MAX_SELECTED_LOCATIONS;
  const atLocationCap = locationIds.length >= MAX_SELECTED_LOCATIONS;
  const allJiangzheSelected = JIANGZHE_LOCATION_IDS.every((id) => locationIds.includes(id));
  const searchKey = normalizeSearch(query);
  const selectedIdSet = useMemo(() => new Set(locationIds), [locationIds]);

  const selectedLocations = useMemo(() => {
    const all = [...LOCATIONS, ...customLocations];
    return all.filter((location) => selectedIdSet.has(location.id));
  }, [customLocations, selectedIdSet]);
  const pinnedListStyle = selectedLocations.length
    ? { maxHeight: pinnedLocationMaxHeight(selectedLocations.length) }
    : undefined;

  const filteredGroups = LOCATIONS_BY_GROUP.filter((group) => group.locations.length > 0);

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
    if (locationIds.length === 0) return;
    if (locationIds.length > MAX_SELECTED_LOCATIONS) return;
    onSubmit({
      startDate: toYmd(range.from),
      endDate: toYmd(range.to),
      locationIds,
      customLocations: customLocations.filter((location) => locationIds.includes(location.id))
    });
  }

  function searchLocations() {
    if (searchKey.length < 2) {
      setSearchResults([]);
      setSearchError(undefined);
      return;
    }
    startSearchTransition(async () => {
      const res = await searchLocationsAction(query);
      if (res.ok) {
        setSearchResults(res.data);
        setSearchError(undefined);
      } else {
        setSearchResults([]);
        setSearchError(res.error);
      }
    });
  }

  function pinLocation(location: LocationConfig) {
    if (locationIds.includes(location.id)) return;
    if (locationIds.length >= MAX_SELECTED_LOCATIONS) return;
    setCustomLocations((customs) => addLocationObjects(customs, [location]));
    setLocationIds((current) => addLocationIds(current, [location.id]));
  }

  function toggleLocation(id: string, checked: boolean) {
    setLocationIds((current) => {
      if (checked) {
        if (current.includes(id) || current.length >= MAX_SELECTED_LOCATIONS) return current;
        return addLocationIds(current, [id]);
      }
      return removeLocationIds(current, [id]);
    });
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="glass-panel overflow-hidden">
        <div className="border-b border-border/70 bg-background/45 p-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            观测日期范围
          </span>
          <div className="mt-3 space-y-3">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start rounded-xl bg-card/80 font-medium tabular-nums"
                >
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="truncate">{rangeLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(r) => {
                    setRange(r);
                    if (r?.from && r?.to) setCalendarOpen(false);
                  }}
                  numberOfMonths={1}
                  defaultMonth={range?.from ?? new Date()}
                />
              </PopoverContent>
            </Popover>

            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.days)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-xs transition-colors",
                    "hover:border-primary hover:text-primary",
                    days === preset.days
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 bg-background/45 text-muted-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {overflow ? (
              <span className="block text-xs text-rating-poor">
                范围超过 {MAX_DATE_RANGE_DAYS} 天上限
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Pin className="h-3 w-3" /> 固定地点
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {selectedLocations.length}/{MAX_SELECTED_LOCATIONS}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 overflow-y-auto pr-1" style={pinnedListStyle}>
            {selectedLocations.length > 0 ? (
              selectedLocations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setLocationIds((current) => removeLocationIds(current, [location.id]))}
                  className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-xs text-primary"
                  title="从固定地点中移除"
                >
                  <span className="truncate">{location.name}</span>
                  <X className="h-3 w-3 opacity-65 transition-opacity group-hover:opacity-100" />
                </button>
              ))
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                先搜索或勾选地点, 固定后会出现在这里。
              </p>
            )}
          </div>

          {noLocation ? (
            <span className="mt-3 block text-xs text-rating-poor">至少选择一个地点</span>
          ) : null}
          {locationOverflow || atLocationCap ? (
            <span className="mt-2 block text-xs text-rating-fair">
              单次最多 {MAX_SELECTED_LOCATIONS} 个地点，超限将拒绝提交
            </span>
          ) : null}
        </div>
      </aside>

      <div className="glass-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/70 bg-background/45 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" /> 观测地点
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              默认近场江浙；川西/神农架手动勾选。单次地点有硬顶，超限拒绝提交。
            </p>
          </div>
          <button
            type="button"
            className="self-start rounded-full border border-border/80 px-3 py-1.5 text-xs text-primary transition-colors hover:border-primary/60 hover:bg-primary/10 sm:self-auto"
            onClick={() =>
              setLocationIds((current) =>
                allJiangzheSelected
                  ? removeLocationIds(current, JIANGZHE_LOCATION_IDS)
                  : addLocationIds(current, JIANGZHE_LOCATION_IDS)
              )
            }
          >
            {allJiangzheSelected ? "取消江浙默认" : "勾选江浙默认"}
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") searchLocations();
              }}
              placeholder="搜索全国地址, 例如: 阿里, 赛里木湖, 冷湖"
              className="h-11 w-full rounded-2xl border border-input bg-background/70 pl-9 pr-24 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={searchLocations}
              disabled={searchPending}
              className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-xl bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
              {searchPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              搜索
            </button>
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-[70px] top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="清空搜索"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {(searchResults.length > 0 || searchError) ? (
            <div className="mt-4 rounded-2xl border border-border/70 bg-card/45 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">全国搜索结果</p>
                <span className="text-[11px] text-muted-foreground">OpenStreetMap</span>
              </div>
              {searchError ? (
                <p className="text-xs text-rating-poor">{searchError}</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {searchResults.map((location) => {
                    const pinned = selectedIdSet.has(location.id);
                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => pinLocation(location)}
                        className={cn(
                          "min-h-[76px] rounded-xl border px-3 py-2 text-left transition-colors",
                          pinned
                            ? "border-primary/60 bg-primary/10"
                            : "border-border bg-background/45 hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <span className="block truncate text-sm font-medium">{location.name}</span>
                        <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">
                          {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)} · {location.elevation}m
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {pinned ? "已固定" : "点击固定到矩阵"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {filteredGroups.map((group) => {
              const groupLocationIds = group.locations.map((location) => location.id);
              const selectedCount = groupLocationIds.filter((id) => locationIds.includes(id)).length;
              const allGroupSelected = selectedCount === groupLocationIds.length;

              return (
                <div
                  key={group.id}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-background/35"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{group.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{group.description}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-primary hover:bg-primary/10"
                      onClick={() =>
                        setLocationIds((current) => {
                          if (allGroupSelected) {
                            return removeLocationIds(current, groupLocationIds);
                          }
                          const merged = addLocationIds(current, groupLocationIds);
                          // 整组加会超顶则拒绝，why：禁止静默截半组
                          if (merged.length > MAX_SELECTED_LOCATIONS) return current;
                          return merged;
                        })
                      }
                    >
                      {allGroupSelected ? "清空本组" : "固定本组"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.locations.map((location) => {
                      const checked = locationIds.includes(location.id);
                      return (
                        <label
                          key={location.id}
                          className={cn(
                            "flex min-h-[74px] cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                            checked
                              ? "border-primary/60 bg-primary/10 text-foreground shadow-[inset_0_1px_0_hsl(var(--primary)/0.18)]"
                              : "border-border bg-card/45 hover:bg-accent/45"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={!checked && atLocationCap}
                            onCheckedChange={(checkedValue) => {
                              toggleLocation(location.id, Boolean(checkedValue));
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium" title={location.name}>
                              {location.name}
                            </span>
                            <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">
                              {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                            </span>
                            <span
                              className={cn(
                                "mt-1 block text-[11px] font-medium tabular-nums",
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

          <div className="mt-4 flex items-center justify-end border-t border-border/60 pt-4">
            <Button
              size="lg"
              disabled={loading || overflow || noLocation || noRange || locationOverflow}
              onClick={submit}
              className="min-h-11 w-full rounded-xl sm:w-auto sm:min-w-[150px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {loading ? "计算中..." : "刷新矩阵"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
