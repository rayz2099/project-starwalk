import { OPEN_METEO_BASE_URL, OPEN_METEO_REQUEST_TIMEOUT_MS } from "../constants";
import type { LocationConfig } from "../types";

// Open-Meteo Forecast API hourly 字段（务必使用新字段名）
// precipitation 进评分；precipitation_probability 仅展示
const HOURLY_FIELDS = [
  "temperature_2m",
  "dew_point_2m",
  "cloud_cover",
  "cloud_cover_low",
  "cloud_cover_high",
  "precipitation",
  "precipitation_probability"
] as const;

export interface OpenMeteoHourlyResponse {
  // 与请求 timezone 一致的本地时间字符串数组，无时区后缀
  time: string[];
  temperature_2m: number[];
  dew_point_2m: number[];
  cloud_cover: number[];
  cloud_cover_low: number[];
  cloud_cover_high: number[];
  precipitation: number[];
  precipitation_probability: number[];
}

export interface OpenMeteoFetchOk {
  ok: true;
  hourly: OpenMeteoHourlyResponse;
  // 请求实际使用的 timezone，便于上层切片
  timezone: string;
  utcOffsetSeconds: number;
}

export interface OpenMeteoFetchErr {
  ok: false;
  error: string;
}

export type OpenMeteoFetchResult = OpenMeteoFetchOk | OpenMeteoFetchErr;

export interface FetchHourlyArgs {
  location: LocationConfig;
  // 业务起止日期（含）按 location 本地日历理解
  startDate: string;
  endDate: string;
}

// 单地点 hourly 拉取：按地点 timezone 让 Open-Meteo 直接返回本地时间序列，
// 同时把 endDate 自动 +1 天，确保覆盖最后一夜跨天到次日 04:00 的小时
export async function fetchHourlyForLocation({
  location,
  startDate,
  endDate
}: FetchHourlyArgs): Promise<OpenMeteoFetchResult> {
  const expandedEnd = addOneDay(endDate);
  const url = new URL(OPEN_METEO_BASE_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("elevation", String(location.elevation));
  url.searchParams.set("timezone", location.timezone);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", expandedEnd);
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPEN_METEO_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      // 服务端缓存 5 分钟，避免短时间内重复触发上游
      next: { revalidate: 300 }
    });
    if (!res.ok) {
      return { ok: false, error: `open-meteo http ${res.status}` };
    }
    const data = (await res.json()) as {
      hourly?: OpenMeteoHourlyResponse;
      timezone?: string;
      utc_offset_seconds?: number;
    };
    if (!data.hourly || !Array.isArray(data.hourly.time)) {
      return { ok: false, error: "open-meteo missing hourly" };
    }
    // 校验数组对齐，避免后续聚合错位
    const len = data.hourly.time.length;
    for (const f of HOURLY_FIELDS) {
      const arr = (data.hourly as unknown as Record<string, unknown>)[f];
      if (!Array.isArray(arr) || arr.length !== len) {
        return { ok: false, error: `open-meteo field length mismatch: ${f}` };
      }
    }
    return {
      ok: true,
      hourly: data.hourly,
      timezone: data.timezone ?? location.timezone,
      utcOffsetSeconds: data.utc_offset_seconds ?? 0
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return { ok: false, error: `open-meteo fetch failed: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}

// yyyy-MM-dd + 1 天，纯字符串运算避免时区漂移
function addOneDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  // 用 UTC 构造避免本地时区影响
  const ts = Date.UTC(y, m - 1, d) + 24 * 3600 * 1000;
  const dt = new Date(ts);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// 并发拉取多地点。Open-Meteo 单坐标限制相对宽松，这里限制并发避免触发限流
export async function fetchHourlyBatch(
  locations: LocationConfig[],
  startDate: string,
  endDate: string,
  concurrency = 4
): Promise<Map<string, OpenMeteoFetchResult>> {
  const out = new Map<string, OpenMeteoFetchResult>();
  let cursor = 0;
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, locations.length); i++) {
    workers.push(
      (async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= locations.length) return;
          const loc = locations[idx];
          const r = await fetchHourlyForLocation({ location: loc, startDate, endDate });
          out.set(loc.id, r);
        }
      })()
    );
  }
  await Promise.all(workers);
  return out;
}
