import { describe, expect, test } from "bun:test";
import { LOCATION_GROUPS, LOCATIONS } from "@/config/locations";
import { aggregateNightForDate } from "@/features/stargazing/server/aggregate";
import { scoreNight } from "@/features/stargazing/server/scoring";
import type { OpenMeteoHourlyResponse } from "@/features/stargazing/server/open-meteo";
import type { MoonInfo, NightlyAggregation } from "@/features/stargazing/types";

// 构造连续 48 小时的 hourly 数据（覆盖业务日 + 次日），timezone Asia/Shanghai
function buildHourly(date: string, nextDate: string, opts: {
  cloud: number;
  cloudLow?: number;
  cloudHigh?: number;
  temp: number;
  dew: number;
}): OpenMeteoHourlyResponse {
  const time: string[] = [];
  for (const d of [date, nextDate]) {
    for (let h = 0; h < 24; h++) {
      time.push(`${d}T${String(h).padStart(2, "0")}:00`);
    }
  }
  const n = time.length;
  return {
    time,
    temperature_2m: Array(n).fill(opts.temp),
    dew_point_2m: Array(n).fill(opts.dew),
    cloud_cover: Array(n).fill(opts.cloud),
    cloud_cover_low: Array(n).fill(opts.cloudLow ?? 0),
    cloud_cover_high: Array(n).fill(opts.cloudHigh ?? 0)
  };
}

describe("aggregateNightForDate", () => {
  test("跨天切片覆盖 8 小时", () => {
    const h = buildHourly("2026-04-25", "2026-04-26", { cloud: 10, temp: 5, dew: 1 });
    const agg = aggregateNightForDate(h, "2026-04-25", "Asia/Shanghai");
    expect(agg.hoursCovered).toBe(8); // 20-23 + 0-3
    expect(agg.complete).toBe(true);
    expect(agg.cloudCoverAvg).toBe(10);
    expect(agg.minDewPointSpread).toBeCloseTo(4);
  });

  test("不同小时云量与温露差能正确取最值", () => {
    const h = buildHourly("2026-04-25", "2026-04-26", { cloud: 10, temp: 5, dew: 1 });
    // 把次日 02:00 的云量设为 90
    const idx = 24 + 2;
    h.cloud_cover[idx] = 90;
    h.temperature_2m[idx] = 0;
    h.dew_point_2m[idx] = -0.5;
    const agg = aggregateNightForDate(h, "2026-04-25", "Asia/Shanghai");
    expect(agg.cloudCoverMax).toBe(90);
    expect(agg.minTemperature).toBe(0);
    expect(agg.minDewPointSpread).toBeCloseTo(0.5);
  });
});

function moon(illum: number): MoonInfo {
  return { businessDate: "2026-04-25", illumination: illum, phase: 0.5, phaseLabel: "x", phaseIcon: "🌑" };
}

function agg(o: Partial<NightlyAggregation>): NightlyAggregation {
  return {
    businessDate: "2026-04-25",
    windowStartUtcMs: 0,
    windowEndUtcMs: 0,
    complete: true,
    hoursCovered: 8,
    cloudCoverAvg: 10,
    cloudCoverMax: 20,
    cloudCoverLowAvg: 5,
    cloudCoverHighAvg: 5,
    minTemperature: 5,
    minDewPointSpread: 5,
    ...o
  };
}

describe("scoreNight 评分顺序", () => {
  test("月亮过亮直接 POOR", () => {
    const r = scoreNight(agg({}), moon(0.8), 3);
    expect(r.level).toBe("POOR");
  });
  test("月暗云高 POOR", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 65, cloudCoverMax: 80 }), moon(0.1), 3);
    expect(r.level).toBe("POOR");
  });
  test("云薄月暗 EXCELLENT", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 5, cloudCoverMax: 10 }), moon(0.1), 3);
    expect(r.level).toBe("EXCELLENT");
  });
  test("温露差小 FAIR + 风险", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 30, cloudCoverMax: 40, minDewPointSpread: 1 }), moon(0.4), 3);
    expect(r.level).toBe("FAIR");
    expect(r.risks.some((x) => x.includes("结露"))).toBe(true);
  });
  test("普通条件 FAIR", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 30 }), moon(0.4), 3);
    expect(r.level).toBe("FAIR");
  });
  test("中度光污染会把 EXCELLENT 压到 FAIR，并保留原始值说明", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 5, cloudCoverMax: 10 }), moon(0.1), 5);
    expect(r.level).toBe("FAIR");
    expect(r.reason).toContain("光污染");
    expect(r.risks.some((x) => x.includes("B5"))).toBe(true);
  });
  test("重度光污染会把 FAIR 进一步压到 POOR", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 30 }), moon(0.4), 6);
    expect(r.level).toBe("POOR");
    expect(r.reason).toContain("光污染");
  });
});

describe("locations 分组与静态光污染基线", () => {
  test("地点分组固定为江浙、广东沿海、云南", () => {
    expect(LOCATION_GROUPS.map((group) => group.label)).toEqual(["江浙", "广东沿海", "云南"]);
  });

  test("每个分组地点数量符合预期，且都带有静态光污染原始值", () => {
    const counts = LOCATIONS.reduce<Record<string, number>>((acc, location) => {
      acc[location.groupId] = (acc[location.groupId] ?? 0) + 1;
      expect(location.lightPollutionBortle).toBeGreaterThanOrEqual(1);
      expect(location.lightPollutionBortle).toBeLessThanOrEqual(9);
      return acc;
    }, {});

    expect(counts.jiangzhe).toBe(10);
    expect(counts.guangdongCoast).toBe(5);
    expect(counts.yunnan).toBe(5);
  });
});
