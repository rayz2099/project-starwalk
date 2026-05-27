import { LIGHT_POLLUTION_THRESHOLDS } from "./constants";

// 统一解释静态 Bortle 原始值，why：服务端评分和前端展示必须复用同一套语义，避免 UI 和规则漂移
export function getLightPollutionLabel(bortle: number | undefined): string {
  if (bortle === undefined) return "未标定";
  if (bortle <= 2) return "暗空";
  if (bortle === 3) return "乡野暗空";
  if (bortle === 4) return "乡郊过渡";
  if (bortle === 5) return "郊区边缘";
  if (bortle === 6) return "明亮郊区";
  return "城市天幕";
}

// 输出给 UI 的统一文案，why：让用户直接看到原始值而不是只看到抽象等级
export function getLightPollutionSummary(bortle: number | undefined): string {
  if (bortle === undefined) return "光污染未标定";
  return `B${bortle} · ${getLightPollutionLabel(bortle)}`;
}

// 给 UI 一个稳定的语义分段，why：颜色表达要和评分逻辑保持同一阈值
export function getLightPollutionTier(bortle: number | undefined): "dark" | "moderate" | "bright" | "unknown" {
  if (bortle === undefined) return "unknown";
  if (bortle <= LIGHT_POLLUTION_THRESHOLDS.darkSkyMax) return "dark";
  if (bortle <= LIGHT_POLLUTION_THRESHOLDS.downgradeMax) return "moderate";
  return "bright";
}
