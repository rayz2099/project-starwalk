import { format, addDays } from "date-fns";
import { CalendarDays, CloudRain, MapPinned } from "lucide-react";
import { DEFAULT_LOCATION_IDS } from "@/config/locations";
import {
  DEFAULT_DATE_RANGE_DAYS,
  MAX_SELECTED_LOCATIONS,
  NIGHT_WINDOW_END_HOUR,
  NIGHT_WINDOW_START_HOUR
} from "@/features/stargazing/constants";
import { PlannerPage } from "@/features/stargazing/components/planner-page";
import { buildPlannerMatrix } from "@/features/stargazing/server/planner";

// 数据按日变化，禁用静态化让每次请求都拿到当天的预热结果
export const dynamic = "force-dynamic";

// 服务端预热首屏：默认从今天起 N 天，默认江浙近场
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
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1500px] flex-col gap-6 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <header className="grid gap-6 border-b border-border/60 pb-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-end">
        <div className="space-y-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Stargazing Planner
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-foreground sm:text-5xl lg:text-6xl">
            多地点
            <span className="text-muted-foreground"> x </span>
            多日期观星矩阵
          </h1>
          <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            对比云量、降水、月相、温露点差与光污染基线。默认近场江浙；神农架与川西作长线候选，手动勾选。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border/70 bg-card p-3">
            <MapPinned className="mb-2 h-4 w-4 text-primary" strokeWidth={1.75} />
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {DEFAULT_LOCATION_IDS.length}
            </p>
            <p className="text-[11px] text-muted-foreground">江浙默认点</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-3">
            <CalendarDays className="mb-2 h-4 w-4 text-primary" strokeWidth={1.75} />
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {NIGHT_WINDOW_START_HOUR}-{String(NIGHT_WINDOW_END_HOUR).padStart(2, "0")}
            </p>
            <p className="text-[11px] text-muted-foreground">夜间窗口</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-3">
            <CloudRain className="mb-2 h-4 w-4 text-primary" strokeWidth={1.75} />
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {MAX_SELECTED_LOCATIONS}
            </p>
            <p className="text-[11px] text-muted-foreground">地点硬顶</p>
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
