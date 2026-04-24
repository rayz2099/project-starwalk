"use client";

import { Fragment } from "react";
import { format } from "date-fns";
import { LOCATION_GROUPS } from "@/config/locations";
import { getLightPollutionSummary, getLightPollutionTier } from "@/features/stargazing/light-pollution";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlannerMatrix } from "@/features/stargazing/types";
import { cn } from "@/lib/utils";
import { PlannerCellCard } from "./planner-cell-card";

interface Props {
  matrix: PlannerMatrix;
}

function formatDateHeader(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return format(new Date(y, m - 1, day), "M/d EEE");
}

// 行头光污染文字颜色：why：地点基线要长期可见，但不能和 nightly rating 争抢视觉主导权
function lightPollutionTextClass(bortle: number): string {
  const tier = getLightPollutionTier(bortle);
  if (tier === "dark") return "text-emerald-300";
  if (tier === "moderate") return "text-amber-300";
  return "text-rose-300";
}

export function PlannerMatrixView({ matrix }: Props) {
  // 表头月相：取第一个非空地点该日的 moon 信息（同日不同地点差异极小）
  const moonByDate = new Map<string, { icon: string; illumination: number }>();
  for (const row of matrix.rows) {
    for (const cell of row.cells) {
      if (!moonByDate.has(cell.businessDate)) {
        moonByDate.set(cell.businessDate, { icon: cell.moon.phaseIcon, illumination: cell.moon.illumination });
      }
    }
  }

  const rowsByGroup = LOCATION_GROUPS.map((group) => ({
    group,
    rows: matrix.rows.filter((row) => row.location.groupId === group.id)
  })).filter((entry) => entry.rows.length > 0);

  return (
    <Table className="min-w-[980px] border-separate border-spacing-y-1">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="sticky left-0 z-10 w-[220px] rounded-l-lg bg-card/80 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
            地点 / 日期
          </TableHead>
          {matrix.dates.map((date) => {
            const moon = moonByDate.get(date);
            const illumination = moon ? Math.round(moon.illumination * 100) : null;
            return (
              <TableHead
                key={date}
                className="min-w-[210px] bg-card/60 text-left backdrop-blur"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatDateHeader(date)}
                  </span>
                  {moon ? (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {moon.icon} {illumination}%
                    </span>
                  ) : null}
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowsByGroup.map(({ group, rows }) => (
          <Fragment key={group.id}>
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={matrix.dates.length + 1}
                className="border-y border-border/60 bg-background/20 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{group.label}</span>
                  <span className="text-xs text-muted-foreground">{group.description}</span>
                </div>
              </TableCell>
            </TableRow>

            {rows.map((row) => (
              <TableRow key={row.location.id} className="hover:bg-transparent">
                <TableCell className="sticky left-0 z-10 rounded-l-lg bg-card/80 align-top backdrop-blur">
                  <div className="flex flex-col">
                    <span className="font-medium leading-tight">{row.location.name}</span>
                    <span className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                      {row.location.latitude.toFixed(2)}, {row.location.longitude.toFixed(2)} ·{" "}
                      {row.location.elevation}m
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[11px] font-medium tabular-nums",
                        lightPollutionTextClass(row.location.lightPollutionBortle)
                      )}
                    >
                      光污染 {getLightPollutionSummary(row.location.lightPollutionBortle)}
                    </span>
                    {row.fetchError ? (
                      <span className="mt-1 text-[11px] text-rating-poor" title={row.fetchError}>
                        数据拉取失败
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                {row.cells.map((cell) => (
                  <TableCell key={cell.businessDate} className="p-1.5 align-top">
                    <PlannerCellCard cell={cell} location={row.location} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
