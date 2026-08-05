"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchPlannerMatrixAction } from "@app/actions";
import { ControlPanel, type ControlPanelValue } from "./control-panel";
import { PlannerMatrixView } from "./planner-matrix";
import type { PlannerMatrix } from "@/features/stargazing/types";

interface Props {
  initialValue: ControlPanelValue;
  initialMatrix: PlannerMatrix | null;
  initialError?: string;
}

// 使用固定格式避免服务端 / 客户端 locale 不一致引发的 hydration mismatch
function formatTs(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export function PlannerPage({ initialValue, initialMatrix, initialError }: Props) {
  const [value, setValue] = useState<ControlPanelValue>(initialValue);
  const [matrix, setMatrix] = useState<PlannerMatrix | null>(initialMatrix);
  const [error, setError] = useState<string | undefined>(initialError);
  const [pending, startTransition] = useTransition();

  // 初次进入若无数据自动触发一次
  useEffect(() => {
    if (!initialMatrix && !initialError) {
      submit(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(next: ControlPanelValue) {
    setValue(next);
    startTransition(async () => {
      const res = await fetchPlannerMatrixAction(next);
      if (res.ok) {
        setMatrix(res.data);
        setError(undefined);
      } else {
        setMatrix(null);
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ControlPanel value={value} loading={pending} onSubmit={submit} />

      {error ? (
        <div className="rounded-2xl border border-rating-poor/35 bg-rating-poor/10 px-4 py-3 text-sm text-rating-poor">
          矩阵生成失败：{error}
        </div>
      ) : null}

      {pending && !matrix ? (
        <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
          <div className="mx-auto mb-3 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
          </div>
          正在拉取天气并计算评分…
        </div>
      ) : null}

      {matrix ? (
        <section className="glass-panel p-2 sm:p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Observation Matrix
            </p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {matrix.rows.length} 地点 · {matrix.dates.length} 日
            </p>
          </div>
          <PlannerMatrixView matrix={matrix} />
          <p className="p-2 text-[11px] tabular-nums text-muted-foreground">
            生成时间 {formatTs(matrix.generatedAtUtcMs)} · Open-Meteo · suncalc · 降水 hard gate 5mm
          </p>
        </section>
      ) : !pending && !error ? (
        <div className="glass-panel border-dashed p-10 text-center text-sm text-muted-foreground">
          请选择日期范围与地点后查看矩阵
        </div>
      ) : null}
    </div>
  );
}
