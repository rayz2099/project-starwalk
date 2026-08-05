"use client";

import { Cloud, CloudRain, Droplets, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PRECIP_THRESHOLDS } from "@/features/stargazing/constants";
import { cn } from "@/lib/utils";
import type { LocationConfig, MatrixCell, RatingLevel } from "../types";

interface Props {
  cell: MatrixCell;
  location: LocationConfig;
}

// 评级语义色：稳定映射，禁止组件内临时取色
function levelBadgeClass(level: RatingLevel | undefined): string {
  if (level === "EXCELLENT") {
    return "border-rating-excellent/30 bg-rating-excellent/15 text-rating-excellent";
  }
  if (level === "FAIR") {
    return "border-rating-fair/30 bg-rating-fair/15 text-rating-fair";
  }
  if (level === "POOR") {
    return "border-rating-poor/30 bg-rating-poor/15 text-rating-poor";
  }
  return "border-border bg-muted text-muted-foreground";
}

function levelAccent(level: RatingLevel | undefined): string {
  if (level === "EXCELLENT") return "border-l-rating-excellent";
  if (level === "FAIR") return "border-l-rating-fair";
  if (level === "POOR") return "border-l-rating-poor";
  return "border-l-border";
}

function levelLabel(level: RatingLevel | undefined): string {
  if (level === "EXCELLENT") return "优秀";
  if (level === "FAIR") return "一般";
  if (level === "POOR") return "较差";
  return "不可算";
}

// 单元格：评级 + 云量 + 月相 + 雨概率 max + 可选 mm + 风险
// why：矩阵可比性优先，字段只放决策必需量
export function PlannerCellCard({ cell }: Props) {
  const rating = cell.rating;
  const agg = cell.aggregation;
  const bestWindow = cell.windowAnalysis?.bestWindow;
  const moonPct = Math.round(cell.moon.illumination * 100);
  const rainProb =
    agg && Number.isFinite(agg.precipitationProbabilityMax)
      ? Math.round(agg.precipitationProbabilityMax)
      : null;
  const rainSum =
    agg && Number.isFinite(agg.precipitationSumMm) ? agg.precipitationSumMm : null;
  const showRainMm =
    rainSum !== null && rainSum > PRECIP_THRESHOLDS.softRiskMinMm;

  if (cell.error && !agg) {
    return (
      <Card
        className={cn(
          "min-h-[148px] border-dashed border-border/70 bg-muted/30 shadow-none",
          "border-l-2",
          levelAccent(undefined)
        )}
      >
        <CardContent className="space-y-2 p-3">
          <Badge variant="outline" className={levelBadgeClass(undefined)}>
            不可算
          </Badge>
          <p className="text-xs leading-5 text-muted-foreground">{cell.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "min-h-[148px] border-border/60 bg-card/90 shadow-none transition-colors",
        "border-l-2 hover:bg-card",
        levelAccent(rating?.level)
      )}
    >
      <CardContent className="flex h-full flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={cn("font-medium", levelBadgeClass(rating?.level))}>
            {levelLabel(rating?.level)}
          </Badge>
          {bestWindow ? (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {bestWindow.startLocalTime.slice(11, 16)}-{bestWindow.endLocalTime.slice(11, 16)}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-2 text-xs leading-5 text-foreground/90">
          {rating?.reason ?? "无评分结果"}
        </p>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] tabular-nums text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Cloud className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            云量 {agg ? `${Math.round(agg.cloudCoverAvg)}%` : "--"}
            {agg ? ` / max ${Math.round(agg.cloudCoverMax)}%` : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Moon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            {cell.moon.phaseLabel} {moonPct}%
          </span>
          <span className="inline-flex items-center gap-1">
            <CloudRain className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            雨概率 {rainProb !== null ? `${rainProb}%` : "--"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Droplets className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            {showRainMm && rainSum !== null
              ? `夜间 ${rainSum.toFixed(1)} mm`
              : `露点差 ${
                  agg && Number.isFinite(agg.minDewPointSpread)
                    ? `${agg.minDewPointSpread.toFixed(1)}°C`
                    : "--"
                }`}
          </span>
        </div>

        {rating?.risks && rating.risks.length > 0 ? (
          <ul className="mt-auto space-y-0.5 border-t border-border/50 pt-2">
            {rating.risks.slice(0, 2).map((risk) => (
              <li key={risk} className="line-clamp-1 text-[10px] leading-4 text-muted-foreground">
                {risk}
              </li>
            ))}
          </ul>
        ) : cell.error ? (
          <p className="mt-auto text-[10px] text-rating-fair">{cell.error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
