import { format, addDays } from "date-fns";
import { CalendarDays, MapPinned, MoonStar } from "lucide-react";
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
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <header className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/75 px-5 py-6 shadow-[0_20px_80px_hsl(var(--foreground)/0.08)] backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <MoonStar className="h-3.5 w-3.5" />
              Stargazing Planner · Matrix
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                多地点观星条件工作台
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                横向比较候选观测点和未来日期, 把云量, 月相, 温露点差和光污染基线压进同一个决策矩阵。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
            <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
              <MapPinned className="mb-2 h-4 w-4 text-primary" />
              <p className="text-xl font-semibold tabular-nums">{DEFAULT_LOCATION_IDS.length}</p>
              <p className="text-[11px] text-muted-foreground">默认地点</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
              <CalendarDays className="mb-2 h-4 w-4 text-primary" />
              <p className="text-xl font-semibold tabular-nums">{DEFAULT_DATE_RANGE_DAYS}</p>
              <p className="text-[11px] text-muted-foreground">预热天数</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
              <MoonStar className="mb-2 h-4 w-4 text-primary" />
              <p className="text-xl font-semibold">20-04</p>
              <p className="text-[11px] text-muted-foreground">夜间窗口</p>
            </div>
          </div>
        </div>
      </header>
      <PlannerPage
        initialValue={initialValue}
        initialMatrix={initialMatrix}
        initialError={initialError}
      />
    </main>
  );
}
