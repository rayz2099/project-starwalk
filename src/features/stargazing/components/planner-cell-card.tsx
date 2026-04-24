"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { MatrixCell } from "@/features/stargazing/types";

interface Props {
  cell: MatrixCell;
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

export function PlannerCellCard({ cell }: Props) {
  const { aggregation, rating, moon, error } = cell;

  return (
    <Card className="bg-background/40 border-border/60">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={ratingVariant(rating?.level)}>{ratingLabel(rating?.level)}</Badge>
          <span className="text-xs text-muted-foreground" title={moon.phaseLabel}>
            {moon.phaseIcon} {(moon.illumination * 100).toFixed(0)}%
          </span>
        </div>

        {aggregation ? (
          <dl className="text-xs grid grid-cols-2 gap-x-2 gap-y-1">
            <dt className="text-muted-foreground">云均</dt>
            <dd className="text-right">{Math.round(aggregation.cloudCoverAvg)}%</dd>
            <dt className="text-muted-foreground">云峰</dt>
            <dd className="text-right">{Math.round(aggregation.cloudCoverMax)}%</dd>
            <dt className="text-muted-foreground">高云</dt>
            <dd className="text-right">{Math.round(aggregation.cloudCoverHighAvg)}%</dd>
            <dt className="text-muted-foreground">最低温</dt>
            <dd className="text-right">{aggregation.minTemperature.toFixed(1)}°C</dd>
            <dt className="text-muted-foreground">温露差</dt>
            <dd
              className={
                aggregation.minDewPointSpread < 2 ? "text-right text-rating-poor" : "text-right"
              }
            >
              {aggregation.minDewPointSpread.toFixed(1)}°C
            </dd>
          </dl>
        ) : (
          <p className="text-xs text-rating-poor">{error ?? "无数据"}</p>
        )}

        {rating?.reason ? (
          <p className="text-[11px] text-muted-foreground leading-snug">{rating.reason}</p>
        ) : null}

        {rating?.risks?.length ? (
          <ul className="text-[11px] text-rating-fair space-y-0.5">
            {rating.risks.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        ) : null}

        {!aggregation?.complete && aggregation ? (
          <p className="text-[10px] text-muted-foreground">
            数据不完整 ({aggregation.hoursCovered}/8h)
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
