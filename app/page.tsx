import { format, addDays } from "date-fns";
import { DEFAULT_LOCATION_IDS } from "@/config/locations";
import { DEFAULT_DATE_RANGE_DAYS } from "@/features/stargazing/constants";
import { PlannerPage } from "@/features/stargazing/components/planner-page";
import { buildPlannerMatrix } from "@/features/stargazing/server/planner";

// 数据按日变化，禁用静态化让每次请求都拿到当天的预热结果
export const dynamic = "force-dynamic";

// 服务端预热首屏：默认从今天起 N 天，默认地点
export default async function Page() {
  const today = new Date();
  const startDate = format(today, "yyyy-MM-dd");
  const endDate = format(addDays(today, DEFAULT_DATE_RANGE_DAYS - 1), "yyyy-MM-dd");
  const initialValue = {
    startDate,
    endDate,
    locationIds: DEFAULT_LOCATION_IDS
  };

  let initialMatrix = null;
  let initialError: string | undefined;
  try {
    initialMatrix = await buildPlannerMatrix(initialValue);
  } catch (err) {
    initialError = err instanceof Error ? err.message : "首屏生成失败";
  }

  return (
    <main className="container mx-auto py-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Stargazing Planner</h1>
        <p className="text-sm text-muted-foreground">
          多地点 × 多日期 观星条件对比矩阵 · 服务端聚合 · 月相离线计算
        </p>
      </header>
      <PlannerPage
        initialValue={initialValue}
        initialMatrix={initialMatrix}
        initialError={initialError}
      />
    </main>
  );
}
