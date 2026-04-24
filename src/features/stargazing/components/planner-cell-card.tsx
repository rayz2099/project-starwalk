"use client";

import { Cloud, Droplets, Thermometer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLightPollutionSummary, getLightPollutionTier } from "@/features/stargazing/light-pollution";
import { cn } from "@/lib/utils";
import type { LocationConfig, MatrixCell } from "@/features/stargazing/types";

interface Props {
  cell: MatrixCell;
  location: LocationConfig;
}

function ratingVariant(level: string | undefined) {
  if (level === "EXCELLENT") return "excellent" as const;
  if (level === "FAIR") return "fair" as const;
  if (level === "POOR") return "poor" as const;
  return "outline" as const;
}

function ratingLabel(level: string | undefined) {
  if (level === "EXCELLENT") return "极佳";
  if (level === "FAIR") return "一般";
  if (level === "POOR") return "不宜";
  return "无数据";
}

// 评级 → 卡片左侧色条颜色，避免大块染色干扰主体阅读
function ratingBarClass(level: string | undefined) {
  if (level === "EXCELLENT") return "bg-rating-excellent";
  if (level === "FAIR") return "bg-rating-fair";
  if (level === "POOR") return "bg-rating-poor";
  return "bg-border";
}

// 光污染文字颜色：why：给长期背景值稳定着色，不污染 nightly 评分主色
function lightPollutionTextClass(bortle: number): string {
  const tier = getLightPollutionTier(bortle);
  if (tier === "dark") return "text-emerald-300";
  if (tier === "moderate") return "text-amber-300";
  return "text-rose-300";
}

export function PlannerCellCard({ cell, location }: Props) {
  const { aggregation, rating, moon, error } = cell;
  const tooltip = [rating?.reason, ...(rating?.risks ?? [])].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-card/60 p-3",
        "shadow-[0_1px_0_hsl(var(--border)/0.5)] transition-colors hover:bg-card/90"
      )}
      title={tooltip || undefined}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-[3px]", ratingBarClass(rating?.level))}
      />

      <div className="flex items-center justify-between gap-2 pl-1">
        <Badge variant={ratingVariant(rating?.level)}>{ratingLabel(rating?.level)}</Badge>
        <span
          className="whitespace-nowrap text-xs tabular-nums text-muted-foreground"
          title={moon.phaseLabel}
        >
          {moon.phaseIcon} {(moon.illumination * 100).toFixed(0)}%
        </span>
      </div>

      <div className="pl-1">
        <span
          className={cn(
            "text-[11px] font-medium tabular-nums",
            lightPollutionTextClass(location.lightPollutionBortle)
          )}
          title="静态光污染基线（Bortle）"
        >
          光污染 {getLightPollutionSummary(location.lightPollutionBortle)}
        </span>
      </div>

      {aggregation ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 text-xs tabular-nums">
          <span className="inline-flex items-center gap-1" title="云量均值 / 峰值 / 高云均值">
            <Cloud className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="font-medium">{Math.round(aggregation.cloudCoverAvg)}%</span>
            <span className="text-muted-foreground">↑{Math.round(aggregation.cloudCoverMax)}</span>
          </span>
          <span className="inline-flex items-center gap-1" title="夜间最低气温">
            <Thermometer className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="font-medium">{aggregation.minTemperature.toFixed(0)}°</span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              aggregation.minDewPointSpread < 2 && "text-rating-poor"
            )}
            title="最小温露点差，<2°C 易起雾结露"
          >
            <Droplets className="h-3 w-3 shrink-0" />
            <span className="font-medium">Δ{aggregation.minDewPointSpread.toFixed(1)}°</span>
          </span>
        </div>
      ) : (
        <p className="pl-1 text-xs text-rating-poor">{error ?? "无数据"}</p>
      )}

      {!aggregation?.complete && aggregation ? (
        <p className="pl-1 text-[10px] text-muted-foreground">
          数据不完整 {aggregation.hoursCovered}/8h
        </p>
      ) : null}
    </div>
  );
}
