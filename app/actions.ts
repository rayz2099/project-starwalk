"use server";

import { buildPlannerMatrix } from "@/features/stargazing/server/planner";
import type { PlannerInput, PlannerMatrix } from "@/features/stargazing/types";

// 单一 server action 入口；前端只感知 PlannerInput / PlannerMatrix
export async function fetchPlannerMatrixAction(input: PlannerInput): Promise<
  | { ok: true; data: PlannerMatrix }
  | { ok: false; error: string }
> {
  try {
    const data = await buildPlannerMatrix(input);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return { ok: false, error: message };
  }
}
