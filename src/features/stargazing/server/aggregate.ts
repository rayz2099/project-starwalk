import {
  NIGHT_WINDOW_END_HOUR,
  NIGHT_WINDOW_HOURS,
  NIGHT_WINDOW_START_HOUR,
  PRECIP_THRESHOLDS
} from "../constants";
import type { NightlyAggregation } from "../types";
import type { OpenMeteoHourlyResponse } from "./open-meteo";
import { localMidnightUtcMs } from "./moon";

// 将 hourly 数据切到指定业务日的夜间窗口（本地 20:00 → 次日 04:00 exclusive）
// hourly.time 是请求时区下的本地字符串，例如 "2026-04-25T20:00"
// 我们只需做字符串前缀匹配 + 小时范围判断，不必再走时区解析
export function aggregateNightForDate(
  hourly: OpenMeteoHourlyResponse,
  businessDate: string,
  timezone: string
): NightlyAggregation {
  const nextDay = addDays(businessDate, 1);

  const windowStartUtcMs = localMidnightUtcMs(businessDate, timezone) + NIGHT_WINDOW_START_HOUR * 3600_000;
  const windowEndUtcMs = localMidnightUtcMs(nextDay, timezone) + NIGHT_WINDOW_END_HOUR * 3600_000;

  const idxs = collectNightHourIndexes(hourly, businessDate);

  const hoursCovered = idxs.length;
  if (hoursCovered === 0) {
    return {
      businessDate,
      windowStartUtcMs,
      windowEndUtcMs,
      complete: false,
      hoursCovered: 0,
      cloudCoverAvg: NaN,
      cloudCoverMax: NaN,
      cloudCoverLowAvg: NaN,
      cloudCoverHighAvg: NaN,
      minTemperature: NaN,
      minDewPointSpread: NaN,
      precipitationSumMm: NaN,
      precipitationMaxMm: NaN,
      precipitationProbabilityMax: NaN,
      wetHourCount: 0
    };
  }

  let cloudSum = 0;
  let cloudMax = -Infinity;
  let cloudLowSum = 0;
  let cloudHighSum = 0;
  let tempMin = Infinity;
  let spreadMin = Infinity;
  let precipSum = 0;
  let precipMax = -Infinity;
  let precipProbMax = -Infinity;
  let wetHourCount = 0;

  for (const i of idxs) {
    const c = hourly.cloud_cover[i];
    const cl = hourly.cloud_cover_low[i];
    const ch = hourly.cloud_cover_high[i];
    const t = hourly.temperature_2m[i];
    const td = hourly.dew_point_2m[i];
    const precip = hourly.precipitation[i] ?? 0;
    const precipProb = hourly.precipitation_probability[i] ?? 0;

    cloudSum += c;
    if (c > cloudMax) cloudMax = c;
    cloudLowSum += cl;
    cloudHighSum += ch;
    if (t < tempMin) tempMin = t;
    const spread = t - td;
    if (spread < spreadMin) spreadMin = spread;

    precipSum += precip;
    if (precip > precipMax) precipMax = precip;
    if (precipProb > precipProbMax) precipProbMax = precipProb;
    if (precip > PRECIP_THRESHOLDS.wetHourSoftMinMm) wetHourCount += 1;
  }

  return {
    businessDate,
    windowStartUtcMs,
    windowEndUtcMs,
    complete: hoursCovered === NIGHT_WINDOW_HOURS,
    hoursCovered,
    cloudCoverAvg: cloudSum / hoursCovered,
    cloudCoverMax: cloudMax,
    cloudCoverLowAvg: cloudLowSum / hoursCovered,
    cloudCoverHighAvg: cloudHighSum / hoursCovered,
    minTemperature: tempMin,
    minDewPointSpread: spreadMin,
    precipitationSumMm: precipSum,
    precipitationMaxMm: precipMax,
    precipitationProbabilityMax: precipProbMax,
    wetHourCount
  };
}

// 统一夜间小时索引，why：聚合与最佳窗口分析必须使用完全相同的业务夜晚切片
export function collectNightHourIndexes(
  hourly: OpenMeteoHourlyResponse,
  businessDate: string
): number[] {
  const nextDay = addDays(businessDate, 1);
  const idxs: number[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i]; // "yyyy-MM-ddTHH:mm"
    const datePart = t.slice(0, 10);
    const hour = Number(t.slice(11, 13));
    if (datePart === businessDate && hour >= NIGHT_WINDOW_START_HOUR) {
      idxs.push(i);
    } else if (datePart === nextDay && hour < NIGHT_WINDOW_END_HOUR) {
      idxs.push(i);
    }
  }
  return idxs;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const ts = Date.UTC(y, m - 1, d) + days * 24 * 3600 * 1000;
  const dt = new Date(ts);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
