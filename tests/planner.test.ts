import { describe, expect, test } from "bun:test";
import { LOCATION_GROUPS, LOCATIONS, DEFAULT_LOCATION_IDS } from "@/config/locations";
import { PRECIP_THRESHOLDS, MAX_SELECTED_LOCATIONS } from "@/features/stargazing/constants";
import { aggregateNightForDate } from "@/features/stargazing/server/aggregate";
import { scoreNight } from "@/features/stargazing/server/scoring";
import type { OpenMeteoHourlyResponse } from "@/features/stargazing/server/open-meteo";
import type {
  BestObservationWindow,
  MoonInfo,
  NightlyAggregation,
  NightlyWindowAnalysis
} from "@/features/stargazing/types";

// 构造连续 48 小时的 hourly 数据（覆盖业务日 + 次日），timezone Asia/Shanghai
function buildHourly(
  date: string,
  nextDate: string,
  opts: {
    cloud: number;
    cloudLow?: number;
    cloudHigh?: number;
    temp: number;
    dew: number;
    precip?: number;
    precipProb?: number;
  }
): OpenMeteoHourlyResponse {
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
    cloud_cover_high: Array(n).fill(opts.cloudHigh ?? 0),
    precipitation: Array(n).fill(opts.precip ?? 0),
    precipitation_probability: Array(n).fill(opts.precipProb ?? 0)
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
    expect(agg.precipitationSumMm).toBe(0);
  });

  test("不同小时云量与温露差能正确取最值", () => {
    const h = buildHourly("2026-04-25", "2026-04-26", { cloud: 10, temp: 5, dew: 1 });
    // 改写夜间关键小时
    const idx20 = h.time.indexOf("2026-04-25T20:00");
    h.cloud_cover[idx20] = 90;
    h.temperature_2m[idx20] = 0;
    h.dew_point_2m[idx20] = -0.5;
    const agg = aggregateNightForDate(h, "2026-04-25", "Asia/Shanghai");
    expect(agg.cloudCoverMax).toBe(90);
    expect(agg.minTemperature).toBe(0);
    expect(agg.minDewPointSpread).toBeCloseTo(0.5);
  });

  test("夜间降水合计与雨概率 max 正确", () => {
    const h = buildHourly("2026-04-25", "2026-04-26", {
      cloud: 20,
      temp: 8,
      dew: 3,
      precip: 0.2,
      precipProb: 30
    });
    const idx22 = h.time.indexOf("2026-04-25T22:00");
    h.precipitation[idx22] = 1.5;
    h.precipitation_probability[idx22] = 80;
    const agg = aggregateNightForDate(h, "2026-04-25", "Asia/Shanghai");
    // 7 * 0.2 + 1.5 = 2.9
    expect(agg.precipitationSumMm).toBeCloseTo(2.9);
    expect(agg.precipitationProbabilityMax).toBe(80);
    expect(agg.wetHourCount).toBe(8);
  });
});

function moon(illum: number): MoonInfo {
  return {
    businessDate: "2026-04-25",
    illumination: illum,
    phase: 0.5,
    phaseLabel: "满月",
    phaseIcon: "full"
  };
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
    precipitationSumMm: 0,
    precipitationMaxMm: 0,
    precipitationProbabilityMax: 10,
    wetHourCount: 0,
    ...o
  };
}

function analysis(o: Partial<BestObservationWindow>): NightlyWindowAnalysis {
  return {
    slots: [],
    bestWindow: {
      startLocalTime: "2026-04-25T23:00",
      endLocalTime: "2026-04-26T02:00",
      hours: 3,
      avgScore: 80,
      avgCloudCover: 10,
      maxCloudCover: 20,
      moonlightImpact: "LOW",
      targetSuitability: ["BRIGHT_STARS", "PLANETS", "MILKY_WAY"],
      ...o
    }
  };
}

describe("scoreNight 评分顺序", () => {
  test("满月但存在低月光窗口时不直接 POOR", () => {
    const r = scoreNight(agg({}), moon(0.8), 3, analysis({ moonlightImpact: "LOW" }));
    expect(r.level).toBe("EXCELLENT");
  });
  test("没有连续可观测窗口时 POOR", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 65, cloudCoverMax: 80 }), moon(0.1), 3, {
      slots: [],
      bestWindow: null
    });
    expect(r.level).toBe("POOR");
  });
  test("长时间低云低月光窗口 EXCELLENT", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 5, cloudCoverMax: 10 }), moon(0.1), 3, analysis({}));
    expect(r.level).toBe("EXCELLENT");
  });
  test("温露差小 FAIR + 风险", () => {
    const r = scoreNight(
      agg({ cloudCoverAvg: 30, cloudCoverMax: 40, minDewPointSpread: 1 }),
      moon(0.4),
      3,
      analysis({ avgScore: 60, avgCloudCover: 30, moonlightImpact: "MEDIUM" })
    );
    expect(r.level).toBe("FAIR");
    expect(r.risks.some((x) => x.includes("结露"))).toBe(true);
  });
  test("普通条件 FAIR", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 30 }), moon(0.4), 3, analysis({ avgScore: 60 }));
    expect(r.level).toBe("FAIR");
  });
  test("中度光污染会把 EXCELLENT 压到 FAIR，并保留原始值说明", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 5, cloudCoverMax: 10 }), moon(0.1), 5, analysis({}));
    expect(r.level).toBe("FAIR");
    expect(r.reason).toContain("光污染");
    expect(r.risks.some((x) => x.includes("B5"))).toBe(true);
  });
  test("重度光污染不会吞掉可观测窗口，但会限制优秀评级", () => {
    const r = scoreNight(agg({ cloudCoverAvg: 30 }), moon(0.4), 6, analysis({}));
    expect(r.level).toBe("FAIR");
    expect(r.reason).toContain("光污染");
  });
  test("夜间合计降水超过 hard gate 直接 POOR", () => {
    const r = scoreNight(
      agg({ precipitationSumMm: PRECIP_THRESHOLDS.hardGateSumMm + 0.1 }),
      moon(0.1),
      2,
      analysis({})
    );
    expect(r.level).toBe("POOR");
    expect(r.reason).toContain("实质降雨");
  });
  test("零星降水只进 soft risk 不改 level", () => {
    const r = scoreNight(
      agg({ precipitationSumMm: 1.2, precipitationMaxMm: 0.4, wetHourCount: 2 }),
      moon(0.1),
      2,
      analysis({})
    );
    expect(r.level).toBe("EXCELLENT");
    expect(r.risks.some((x) => x.includes("零星降水"))).toBe(true);
  });
});

describe("locations 分组与静态光污染基线", () => {
  test("地点分组包含江浙、沿海、云南、神农架、川西、搜索", () => {
    expect(LOCATION_GROUPS.map((group) => group.id)).toEqual([
      "jiangzhe",
      "guangdongCoast",
      "yunnan",
      "shennongjia",
      "chuanxi",
      "search"
    ]);
  });

  test("每个分组地点数量符合预期，且都带有静态光污染原始值", () => {
    const counts = LOCATIONS.reduce<Record<string, number>>((acc, location) => {
      acc[location.groupId] = (acc[location.groupId] ?? 0) + 1;
      expect(location.lightPollutionBortle).toBeGreaterThanOrEqual(1);
      expect(location.lightPollutionBortle).toBeLessThanOrEqual(9);
      return acc;
    }, {});

    expect(counts.jiangzhe).toBe(13);
    expect(counts.guangdongCoast).toBe(5);
    expect(counts.yunnan).toBe(5);
    expect(counts.shennongjia).toBe(2);
    expect(counts.chuanxi).toBe(9);
  });

  test("默认地点只含江浙且不超过硬顶", () => {
    expect(DEFAULT_LOCATION_IDS.length).toBeLessThanOrEqual(MAX_SELECTED_LOCATIONS);
    expect(
      DEFAULT_LOCATION_IDS.every((id) => {
        const loc = LOCATIONS.find((item) => item.id === id);
        return loc?.groupId === "jiangzhe";
      })
    ).toBe(true);
  });
});
