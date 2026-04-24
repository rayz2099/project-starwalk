"use client";

import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlannerMatrix } from "@/features/stargazing/types";
import { PlannerCellCard } from "./planner-cell-card";

interface Props {
  matrix: PlannerMatrix;
}

function formatDateHeader(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  return format(new Date(y, m - 1, day), "M/d EEE");
}

export function PlannerMatrixView({ matrix }: Props) {
  // 表头月相：取第一个非空地点该日的 moon 信息（同一日不同地点差异极小）
  const moonByDate = new Map<string, { icon: string; illumination: number }>();
  for (const row of matrix.rows) {
    for (const c of row.cells) {
      if (!moonByDate.has(c.businessDate)) {
        moonByDate.set(c.businessDate, { icon: c.moon.phaseIcon, illumination: c.moon.illumination });
      }
    }
  }

  return (
    <Table className="min-w-[960px]">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[180px] bg-background/80">地点 \ 日期</TableHead>
          {matrix.dates.map((d) => {
            const m = moonByDate.get(d);
            return (
              <TableHead key={d} className="min-w-[200px] bg-background/80">
                <div className="flex flex-col">
                  <span className="text-foreground font-semibold">{formatDateHeader(d)}</span>
                  {m ? (
                    <span className="text-xs text-muted-foreground">
                      {m.icon} {(m.illumination * 100).toFixed(0)}%
                    </span>
                  ) : null}
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {matrix.rows.map((row) => (
          <TableRow key={row.location.id}>
            <TableCell className="align-top">
              <div className="flex flex-col">
                <span className="font-medium">{row.location.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {row.location.latitude.toFixed(2)}, {row.location.longitude.toFixed(2)} ·{" "}
                  {row.location.elevation}m
                </span>
                {row.fetchError ? (
                  <span className="text-[11px] text-rating-poor mt-1">{row.fetchError}</span>
                ) : null}
              </div>
            </TableCell>
            {row.cells.map((cell) => (
              <TableCell key={cell.businessDate}>
                <PlannerCellCard cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
