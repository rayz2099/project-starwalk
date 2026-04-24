import { LIGHT_POLLUTION_THRESHOLDS, RATING_THRESHOLDS } from "../constants";
import { getLightPollutionSummary } from "../light-pollution";
import type { MoonInfo, NightlyAggregation, RatingLevel, RatingResult } from "../types";

// 评分纯函数。规则顺序与 AGENTS.md 严格一致：
// 1) 月相亮度 > 70%      => POOR
// 2) 总云量平均/最大 > 60% => POOR
// 3) 总云量 < 15% 且 月相 < 30% => EXCELLENT
// 4) 最小温露点差 < 2°C   => FAIR（带结露/起雾风险）
// 5) 其余 => FAIR
// 最后叠加静态光污染修正，why：天气是当晚条件，光污染是地点长期上限，不能混成同一优先级
export function scoreNight(
  agg: NightlyAggregation,
  moon: MoonInfo,
  lightPollutionBortle: number
): RatingResult {
  const risks: string[] = [];

  // 露点风险无论评分如何都标注
  if (Number.isFinite(agg.minDewPointSpread) && agg.minDewPointSpread < RATING_THRESHOLDS.dewPointSpreadFair) {
    risks.push(`温露点差仅 ${agg.minDewPointSpread.toFixed(1)}°C，结露/起雾风险高`);
  }
  if (Number.isFinite(agg.cloudCoverHighAvg) && agg.cloudCoverHighAvg >= 50) {
    risks.push(`高云平均 ${Math.round(agg.cloudCoverHighAvg)}%，可能影响透明度`);
  }
  if (moon.illumination > RATING_THRESHOLDS.moonBrightPoor) {
    risks.push(`月相亮度 ${(moon.illumination * 100).toFixed(0)}% 偏高`);
  }
  if (lightPollutionBortle > LIGHT_POLLUTION_THRESHOLDS.darkSkyMax) {
    risks.push(`光污染基线 ${getLightPollutionSummary(lightPollutionBortle)}`);
  }

  const base = scoreBaseNight(agg, moon, risks);
  return applyLightPollutionPenalty(base, lightPollutionBortle);
}

// 基础评分只看会随夜晚变化的因子，why：保证天气/月相逻辑和地点基线逻辑能独立演进
function scoreBaseNight(agg: NightlyAggregation, moon: MoonInfo, risks: string[]): RatingResult {
  if (moon.illumination > RATING_THRESHOLDS.moonBrightPoor) {
    return { level: "POOR", reason: `月相过亮 (${(moon.illumination * 100).toFixed(0)}%)`, risks };
  }
  if (
    agg.cloudCoverAvg > RATING_THRESHOLDS.cloudPoor ||
    agg.cloudCoverMax > RATING_THRESHOLDS.cloudPoor
  ) {
    return {
      level: "POOR",
      reason: `云量过高 (均 ${Math.round(agg.cloudCoverAvg)}% / 峰 ${Math.round(agg.cloudCoverMax)}%)`,
      risks
    };
  }
  if (
    agg.cloudCoverAvg < RATING_THRESHOLDS.cloudExcellent &&
    moon.illumination < RATING_THRESHOLDS.moonExcellent
  ) {
    return {
      level: "EXCELLENT",
      reason: `晴朗 (云均 ${Math.round(agg.cloudCoverAvg)}%) 且月暗`,
      risks
    };
  }
  if (Number.isFinite(agg.minDewPointSpread) && agg.minDewPointSpread < RATING_THRESHOLDS.dewPointSpreadFair) {
    return { level: "FAIR", reason: "存在结露/起雾风险", risks };
  }
  return { level: "FAIR", reason: "条件一般", risks };
}

// 光污染修正只做有限降级，why：地点长期属性应该约束上限，但不应掩盖实时天气的价值
function applyLightPollutionPenalty(base: RatingResult, lightPollutionBortle: number): RatingResult {
  const summary = getLightPollutionSummary(lightPollutionBortle);

  if (lightPollutionBortle >= LIGHT_POLLUTION_THRESHOLDS.forcePoorMin && base.level !== "POOR") {
    return {
      ...base,
      level: "POOR",
      reason: `光污染过强 (${summary})`
    };
  }

  if (lightPollutionBortle === LIGHT_POLLUTION_THRESHOLDS.downgradeMax && base.level !== "POOR") {
    return {
      ...base,
      level: downgradeOneLevel(base.level),
      reason: `受光污染影响 (${summary})`
    };
  }

  if (
    lightPollutionBortle <= LIGHT_POLLUTION_THRESHOLDS.excellentCapMax &&
    lightPollutionBortle > LIGHT_POLLUTION_THRESHOLDS.darkSkyMax &&
    base.level === "EXCELLENT"
  ) {
    return {
      ...base,
      level: "FAIR",
      reason: `天气虽优，但光污染限制上限 (${summary})`
    };
  }

  return base;
}

// 只允许降一级，why：保留天气/月相作为主要排序依据，避免静态属性完全吞掉动态差异
function downgradeOneLevel(level: RatingLevel): RatingLevel {
  if (level === "EXCELLENT") return "FAIR";
  if (level === "FAIR") return "POOR";
  return "POOR";
}
