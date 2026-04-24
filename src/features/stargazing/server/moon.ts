import SunCalc from "suncalc";
import type { LocationConfig, MoonInfo } from "../types";

// 使用 suncalc 在服务端计算月相，避免 UI 层重复推导
// 月相位 0~1 区段对应：
// [0, 0.0625) 新月 ; [0.0625, 0.1875) 娥眉 ; [0.1875, 0.3125) 上弦 ;
// [0.3125, 0.4375) 盈凸 ; [0.4375, 0.5625) 满月 ; [0.5625, 0.6875) 亏凸 ;
// [0.6875, 0.8125) 下弦 ; [0.8125, 0.9375) 残月 ; [0.9375, 1] 新月

interface PhaseDef {
  label: string;
  icon: string;
}

const PHASE_BUCKETS: Array<{ max: number; def: PhaseDef }> = [
  { max: 0.0625, def: { label: "新月", icon: "🌑" } },
  { max: 0.1875, def: { label: "娥眉月", icon: "🌒" } },
  { max: 0.3125, def: { label: "上弦月", icon: "🌓" } },
  { max: 0.4375, def: { label: "盈凸月", icon: "🌔" } },
  { max: 0.5625, def: { label: "满月", icon: "🌕" } },
  { max: 0.6875, def: { label: "亏凸月", icon: "🌖" } },
  { max: 0.8125, def: { label: "下弦月", icon: "🌗" } },
  { max: 0.9375, def: { label: "残月", icon: "🌘" } },
  { max: 1.0001, def: { label: "新月", icon: "🌑" } }
];

function pickPhaseDef(phase: number): PhaseDef {
  for (const b of PHASE_BUCKETS) {
    if (phase < b.max) return b.def;
  }
  return PHASE_BUCKETS[PHASE_BUCKETS.length - 1].def;
}

// 给定业务日（本地 yyyy-MM-dd）+ 地点，按当夜中点（次日 00:00 本地）计算月相
// 这样能更稳定地代表“该夜晚”的月相，而不是日落时刻
export function computeMoonForBusinessDate(
  location: LocationConfig,
  businessDate: string
): MoonInfo {
  // 该夜晚的代表时刻：业务日 +1 天 的本地 00:00
  const midnightUtcMs = localMidnightUtcMs(addDays(businessDate, 1), location.timezone);
  const dateAtMidnight = new Date(midnightUtcMs);
  const moon = SunCalc.getMoonIllumination(dateAtMidnight);
  const def = pickPhaseDef(moon.phase);
  return {
    businessDate,
    illumination: clamp01(moon.fraction),
    phase: clamp01(moon.phase),
    phaseLabel: def.label,
    phaseIcon: def.icon
  };
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
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

// 把 yyyy-MM-dd 在指定 IANA 时区的 00:00 转为 UTC ms
// 思路：先按 UTC 假设构造，再用 Intl 拿到该 UTC 时刻在目标时区的偏移并修正
export function localMidnightUtcMs(date: string, timezone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  // 假设这是 UTC 时间
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const offsetMs = timezoneOffsetMs(guess, timezone);
  // 真实 UTC ms = 我们想要的本地 0 点 - 时区偏移
  return guess - offsetMs;
}

// 返回指定 UTC 时刻在 timezone 中相对 UTC 的偏移（毫秒，东正西负）
export function timezoneOffsetMs(utcMs: number, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return asUtc - utcMs;
}
