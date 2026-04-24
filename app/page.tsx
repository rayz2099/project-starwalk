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
    <main className="container mx-auto py-8 space-y-6">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Stargazing · Beta
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          多地点 × 多日期 观星条件矩阵
        </h1>
        <p className="text-sm text-muted-foreground">
          服务端聚合 Open-Meteo 逐小时云量与温露点 · 月相由 suncalc 离线计算 · 光污染采用静态地点基线
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
