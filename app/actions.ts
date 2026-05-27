"use server";

import { buildPlannerMatrix } from "@/features/stargazing/server/planner";
import { searchChinaLocations } from "@/features/stargazing/server/geocoding";
import type { LocationConfig, PlannerInput, PlannerMatrix } from "@/features/stargazing/types";

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

// 地址搜索走服务端，why：统一管理第三方 API、超时和结果映射，避免客户端泄露外部调用细节
export async function searchLocationsAction(query: string): Promise<
  | { ok: true; data: LocationConfig[] }
  | { ok: false; error: string }
> {
  try {
    const data = await searchChinaLocations(query);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return { ok: false, error: message };
  }
}
