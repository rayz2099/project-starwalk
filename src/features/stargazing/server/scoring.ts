import { RATING_THRESHOLDS } from "../constants";
import type { MoonInfo, NightlyAggregation, RatingResult } from "../types";

// 评分纯函数。规则顺序与 AGENTS.md 严格一致：
// 1) 月相亮度 > 70%      => POOR
// 2) 总云量平均/最大 > 60% => POOR
// 3) 总云量 < 15% 且 月相 < 30% => EXCELLENT
// 4) 最小温露点差 < 2°C   => FAIR（带结露/起雾风险）
// 5) 其余 => FAIR
export function scoreNight(agg: NightlyAggregation, moon: MoonInfo): RatingResult {
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
