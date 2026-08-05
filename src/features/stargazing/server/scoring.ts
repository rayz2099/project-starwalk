import {
  LIGHT_POLLUTION_THRESHOLDS,
  PRECIP_THRESHOLDS,
  RATING_THRESHOLDS,
  WINDOW_SCORING_THRESHOLDS
} from "../constants";
import { getLightPollutionSummary } from "../light-pollution";
import type {
  BestObservationWindow,
  MoonInfo,
  NightlyAggregation,
  NightlyWindowAnalysis,
  RatingLevel,
  RatingResult
} from "../types";

// 评分流水线：hard gate → bestWindow → 光污染；降水概率只展示不进 level
// why：满月不代表整夜不可观测，但实质整夜降水应直接熔断
export function scoreNight(
  agg: NightlyAggregation,
  moon: MoonInfo,
  lightPollutionBortle: number | undefined,
  analysis: NightlyWindowAnalysis
): RatingResult {
  const risks = collectRisks(agg, moon, lightPollutionBortle, analysis.bestWindow);

  // 1) hard gate：整夜合计实质降水
  if (
    Number.isFinite(agg.precipitationSumMm) &&
    agg.precipitationSumMm > PRECIP_THRESHOLDS.hardGateSumMm
  ) {
    return {
      level: "POOR",
      reason: `夜间合计降水 ${agg.precipitationSumMm.toFixed(1)} mm，实质降雨`,
      risks
    };
  }

  // 2-3) 湿小时已在 window-analysis 剔除，这里只评 bestWindow
  const base = scoreBestWindow(analysis.bestWindow, risks);
  // 4) 光污染有限降级；不可救回 hard gate POOR（hard gate 已提前返回）
  return applyLightPollutionPenalty(base, lightPollutionBortle);
}

function collectRisks(
  agg: NightlyAggregation,
  moon: MoonInfo,
  lightPollutionBortle: number | undefined,
  bestWindow: BestObservationWindow | null
): string[] {
  const risks: string[] = [];

  if (Number.isFinite(agg.minDewPointSpread) && agg.minDewPointSpread < RATING_THRESHOLDS.dewPointSpreadFair) {
    risks.push(`温露点差最低 ${agg.minDewPointSpread.toFixed(1)}°C，结露/起雾风险高`);
  }
  if (Number.isFinite(agg.cloudCoverHighAvg) && agg.cloudCoverHighAvg >= 50) {
    risks.push(`高云平均 ${Math.round(agg.cloudCoverHighAvg)}%，可能影响透明度`);
  }
  if (moon.illumination >= 0.7) {
    risks.push(`月相亮度 ${(moon.illumination * 100).toFixed(0)}%，需优先看月落后窗口`);
  }
  if (bestWindow?.moonlightImpact === "HIGH") {
    risks.push("最佳窗口仍有强月光，更适合亮星、星座和行星");
  }
  if (lightPollutionBortle !== undefined && lightPollutionBortle > LIGHT_POLLUTION_THRESHOLDS.darkSkyMax) {
    risks.push(`光污染基线 ${getLightPollutionSummary(lightPollutionBortle)}`);
  }

  // 5) soft risk：零星降水/湿气，不改 level
  if (
    Number.isFinite(agg.precipitationSumMm) &&
    agg.precipitationSumMm > PRECIP_THRESHOLDS.softRiskMinMm &&
    agg.precipitationSumMm <= PRECIP_THRESHOLDS.hardGateSumMm
  ) {
    risks.push(`夜间零星降水合计 ${agg.precipitationSumMm.toFixed(1)} mm，设备注意防潮`);
  } else if (agg.wetHourCount > 0 && Number.isFinite(agg.precipitationMaxMm)) {
    if (
      agg.precipitationMaxMm > PRECIP_THRESHOLDS.wetHourSoftMinMm &&
      agg.precipitationMaxMm <= PRECIP_THRESHOLDS.windowKillMm
    ) {
      risks.push(`存在毛毛雨湿小时 (峰值 ${agg.precipitationMaxMm.toFixed(1)} mm/h)`);
    }
  }

  return risks;
}

// 基础评分只看当晚能找到的最佳连续窗口，why：用户最终需要知道有没有可用时段
function scoreBestWindow(bestWindow: BestObservationWindow | null, risks: string[]): RatingResult {
  if (!bestWindow) {
    return {
      level: "POOR",
      reason: `无连续 ${WINDOW_SCORING_THRESHOLDS.minCandidateHours}h 可观测干窗`,
      risks
    };
  }

  if (
    bestWindow.hours >= WINDOW_SCORING_THRESHOLDS.excellentHours &&
    bestWindow.avgScore >= WINDOW_SCORING_THRESHOLDS.excellentAvgScore &&
    bestWindow.avgCloudCover < WINDOW_SCORING_THRESHOLDS.excellentCloudAvg &&
    bestWindow.moonlightImpact === "LOW"
  ) {
    return {
      level: "EXCELLENT",
      reason: `最佳窗口 ${formatWindow(bestWindow)}，低云低月光`,
      risks
    };
  }

  if (
    bestWindow.hours >= WINDOW_SCORING_THRESHOLDS.minCandidateHours &&
    bestWindow.avgScore >= WINDOW_SCORING_THRESHOLDS.fairAvgScore
  ) {
    return {
      level: "FAIR",
      reason: `可观测窗口 ${formatWindow(bestWindow)}`,
      risks
    };
  }

  return {
    level: "POOR",
    reason: `最佳窗口评分偏低 (${Math.round(bestWindow.avgScore)})`,
    risks
  };
}

// 光污染修正只做有限降级，why：地点长期属性应该约束暗弱目标上限，但不应掩盖实时可观测窗口
function applyLightPollutionPenalty(
  base: RatingResult,
  lightPollutionBortle: number | undefined
): RatingResult {
  if (lightPollutionBortle === undefined) {
    return {
      ...base,
      risks: [...base.risks, "光污染未标定，评分仅基于天气与月相"]
    };
  }

  const summary = getLightPollutionSummary(lightPollutionBortle);

  if (lightPollutionBortle >= LIGHT_POLLUTION_THRESHOLDS.forcePoorMin) {
    if (base.level === "EXCELLENT" || base.level === "FAIR") {
      return {
        ...base,
        level: base.level === "EXCELLENT" ? "FAIR" : base.level,
        reason:
          base.level === "EXCELLENT"
            ? `天气窗口可用，但光污染过重限制暗空目标 (${summary})`
            : base.reason,
        risks: base.risks
      };
    }
  }

  if (lightPollutionBortle === LIGHT_POLLUTION_THRESHOLDS.downgradeMax && base.level === "EXCELLENT") {
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
      reason: `天气虽优，但光污染限制银河/深空 (${summary})`
    };
  }

  return base;
}

function formatWindow(bestWindow: BestObservationWindow): string {
  return `${formatHour(bestWindow.startLocalTime)}-${formatHour(bestWindow.endLocalTime)}`;
}

function formatHour(localTime: string): string {
  return localTime.slice(11, 16);
}

// 只允许降一级，why：保留天气/月相作为主要排序依据，避免静态属性完全吞掉动态差异
function downgradeOneLevel(level: RatingLevel): RatingLevel {
  if (level === "EXCELLENT") return "FAIR";
  if (level === "FAIR") return "POOR";
  return "POOR";
}
