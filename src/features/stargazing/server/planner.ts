import { LOCATIONS } from "@/config/locations";
import { MAX_DATE_RANGE_DAYS } from "../constants";
import type {
  MatrixCell,
  MatrixRow,
  PlannerInput,
  PlannerMatrix
} from "../types";
import { fetchHourlyBatch } from "./open-meteo";
import { computeMoonForBusinessDate } from "./moon";
import { aggregateNightForDate } from "./aggregate";
import { scoreNight } from "./scoring";

// 应用服务层：唯一暴露给页面层的入口
// 接收输入，吐出可直接渲染的矩阵 DTO
export async function buildPlannerMatrix(input: PlannerInput): Promise<PlannerMatrix> {
  const dates = enumerateDates(input.startDate, input.endDate);
  if (dates.length === 0) {
    throw new Error("日期范围非法：startDate 必须 <= endDate");
  }
  if (dates.length > MAX_DATE_RANGE_DAYS) {
    throw new Error(`日期范围过大：最多支持 ${MAX_DATE_RANGE_DAYS} 天`);
  }
  const locations = LOCATIONS.filter((l) => input.locationIds.includes(l.id));
  if (locations.length === 0) {
    throw new Error("未选择任何地点");
  }

  const fetched = await fetchHourlyBatch(locations, input.startDate, input.endDate);

  const rows: MatrixRow[] = locations.map((location) => {
    const result = fetched.get(location.id);
    if (!result || !result.ok) {
      // 整地点失败：每格都给 null，并保留错误说明
      return {
        location,
        fetchError: result && !result.ok ? result.error : "未知错误",
        cells: dates.map<MatrixCell>((d) => ({
          locationId: location.id,
          businessDate: d,
          aggregation: null,
          moon: computeMoonForBusinessDate(location, d),
          rating: null,
          error: result && !result.ok ? result.error : "未知错误"
        }))
      };
    }
    const cells = dates.map<MatrixCell>((d) => {
      const moon = computeMoonForBusinessDate(location, d);
      const agg = aggregateNightForDate(result.hourly, d, location.timezone);
      if (agg.hoursCovered === 0) {
        return {
          locationId: location.id,
          businessDate: d,
          aggregation: null,
          moon,
          rating: null,
          error: "夜间窗口数据为空"
        };
      }
      const rating = scoreNight(agg, moon, location.lightPollutionBortle);
      return {
        locationId: location.id,
        businessDate: d,
        aggregation: agg,
        moon,
        rating,
        error: agg.complete ? undefined : `夜间小时不完整 (${agg.hoursCovered}/8)`
      };
    });
    return { location, cells };
  });

  return {
    dates,
    rows,
    generatedAtUtcMs: Date.now()
  };
}

// 枚举 yyyy-MM-dd 闭区间
function enumerateDates(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const sTs = Date.UTC(sy, sm - 1, sd);
  const eTs = Date.UTC(ey, em - 1, ed);
  if (eTs < sTs) return [];
  const out: string[] = [];
  for (let t = sTs; t <= eTs; t += 24 * 3600 * 1000) {
    const dt = new Date(t);
    out.push(
      `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
        dt.getUTCDate()
      ).padStart(2, "0")}`
    );
  }
  return out;
}
