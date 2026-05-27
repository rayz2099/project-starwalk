"use client";

import { Fragment } from "react";
import { format } from "date-fns";
import { LOCATION_GROUPS } from "@/config/locations";
import { getLightPollutionSummary, getLightPollutionTier } from "@/features/stargazing/light-pollution";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LocationConfig, MatrixCell, PlannerMatrix } from "@/features/stargazing/types";
import { cn } from "@/lib/utils";
import { PlannerCellCard } from "./planner-cell-card";

interface Props {
  matrix: PlannerMatrix;
}

function formatDateHeader(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return format(new Date(y, m - 1, day), "M/d EEE");
}

function formatShortDate(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return format(new Date(y, m - 1, day), "M/d");
}

// 行头光污染文字颜色：why：地点基线要长期可见，但不能和 nightly rating 争抢视觉主导权
function lightPollutionTextClass(bortle: number | undefined): string {
  const tier = getLightPollutionTier(bortle);
  if (tier === "unknown") return "text-muted-foreground";
  if (tier === "dark") return "text-emerald-500 dark:text-emerald-300";
  if (tier === "moderate") return "text-amber-600 dark:text-amber-300";
  return "text-rose-600 dark:text-rose-300";
}

function levelTextClass(level: string | undefined): string {
  if (level === "EXCELLENT") return "text-rating-excellent";
  if (level === "FAIR") return "text-rating-fair";
  if (level === "POOR") return "text-rating-poor";
  return "text-muted-foreground";
}

// 每行摘要服务移动端标题, why: 手机屏幕先给结论, 细节再往下看
function summarizeCells(cells: MatrixCell[]): string {
  const excellent = cells.filter((cell) => cell.rating?.level === "EXCELLENT").length;
  const poor = cells.filter((cell) => cell.rating?.level === "POOR").length;
  if (excellent > 0) return `${excellent} 个极佳夜晚`;
  if (poor === cells.length) return "近期均不理想";
  return `${cells.length - poor} 个可观察夜晚`;
}

function LocationMeta({ location, fetchError }: { location: LocationConfig; fetchError?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium leading-tight">{location.name}</span>
      <span className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
        {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)} · {location.elevation}m
      </span>
      <span
        className={cn(
          "mt-1 text-[11px] font-medium tabular-nums",
          lightPollutionTextClass(location.lightPollutionBortle)
        )}
      >
        光污染 {getLightPollutionSummary(location.lightPollutionBortle)}
      </span>
      {fetchError ? (
        <span className="mt-1 text-[11px] text-rating-poor" title={fetchError}>
          数据拉取失败
        </span>
      ) : null}
    </div>
  );
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
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[980px] border-separate border-spacing-y-1">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 w-[230px] rounded-l-xl bg-card/90 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
                地点 / 日期
              </TableHead>
              {matrix.dates.map((date) => {
                const moon = moonByDate.get(date);
                const illumination = moon ? Math.round(moon.illumination * 100) : null;
                return (
                  <TableHead
                    key={date}
                    className="min-w-[210px] bg-card/70 text-left backdrop-blur first:rounded-l-xl last:rounded-r-xl"
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
                    className="border-y border-border/60 bg-background/25 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{group.label}</span>
                      <span className="text-xs text-muted-foreground">{group.description}</span>
                    </div>
                  </TableCell>
                </TableRow>

                {rows.map((row) => (
                  <TableRow key={row.location.id} className="hover:bg-transparent">
                    <TableCell className="sticky left-0 z-10 rounded-l-xl bg-card/90 align-top backdrop-blur">
                      <LocationMeta location={row.location} fetchError={row.fetchError} />
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
      </div>

      <div className="space-y-4 md:hidden">
        {rowsByGroup.map(({ group, rows }) => (
          <section key={group.id} className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{group.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
            </div>

            {rows.map((row) => (
              <article
                key={row.location.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-background/35 p-4">
                  <LocationMeta location={row.location} fetchError={row.fetchError} />
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      levelTextClass(row.cells.find((cell) => cell.rating?.level)?.rating?.level)
                    )}
                  >
                    {summarizeCells(row.cells)}
                  </span>
                </div>

                <div className="grid gap-2 p-3">
                  {row.cells.map((cell) => {
                    const moon = moonByDate.get(cell.businessDate);
                    return (
                      <div key={cell.businessDate} className="grid gap-2">
                        <div className="flex items-center justify-between px-1 text-xs">
                          <span className="font-semibold tabular-nums text-foreground">
                            {formatShortDate(cell.businessDate)}
                          </span>
                          {moon ? (
                            <span className="tabular-nums text-muted-foreground">
                              {moon.icon} {Math.round(moon.illumination * 100)}%
                            </span>
                          ) : null}
                        </div>
                        <PlannerCellCard cell={cell} location={row.location} />
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
