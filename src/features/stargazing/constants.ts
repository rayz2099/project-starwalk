// 业务常量集中配置，禁止散落 hardcode

// 夜间窗口：本地 20:00 开始，到次日 04:00（不含）
export const NIGHT_WINDOW_START_HOUR = 20;
export const NIGHT_WINDOW_END_HOUR = 4; // exclusive，次日
export const NIGHT_WINDOW_HOURS = 24 - NIGHT_WINDOW_START_HOUR + NIGHT_WINDOW_END_HOUR; // 8

// 评分阈值
export const RATING_THRESHOLDS = {
  cloudPoor: 60, // % ，平均或最大任一超过即 POOR
  cloudExcellent: 15,
  dewPointSpreadFair: 2 // °C
} as const;

// 降水阈值：why 偏松对齐“找可用时段”，避免梅雨季矩阵全红
export const PRECIP_THRESHOLDS = {
  // 夜间合计超过该值 → hard gate POOR
  hardGateSumMm: 5.0,
  // 单小时超过该值 → 踢出候选窗口
  windowKillMm: 0.5,
  // soft risk 区间下沿：有可感知湿气但不足以判死
  softRiskMinMm: 0.2,
  // 湿小时 soft risk 下沿
  wetHourSoftMinMm: 0.1
} as const;

// 最佳观测窗口阈值，why：满月不应直接判死，关键是能否找到连续低云低月光时段
export const WINDOW_SCORING_THRESHOLDS = {
  minCandidateScore: 45,
  minCandidateHours: 2,
  excellentHours: 3,
  excellentAvgScore: 75,
  fairAvgScore: 50,
  excellentCloudAvg: 25,
  maxCandidateCloudAvg: 60
} as const;

// 光污染阈值：why：让光污染只做静态修正，不取代天气/月相作为首要决策因子
export const LIGHT_POLLUTION_THRESHOLDS = {
  darkSkyMax: 3,
  excellentCapMax: 4,
  downgradeMax: 5,
  forcePoorMin: 6
} as const;

// 默认日期范围（业务日数）
export const DEFAULT_DATE_RANGE_DAYS = 4;
// 上限
export const MAX_DATE_RANGE_DAYS = 14;

// 单次查询地点上限，why：保护 Open-Meteo fan-out 与矩阵可读宽度
export const MAX_SELECTED_LOCATIONS = 16;

// 默认只勾近场组，why：远点长线不应污染周末对比首屏
export const DEFAULT_LOCATION_GROUP_ID = "jiangzhe" as const;

// Open-Meteo 调用上限，用于服务端守护
export const OPEN_METEO_REQUEST_TIMEOUT_MS = 8000;
export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
export const NOMINATIM_GEOCODING_BASE_URL = "https://nominatim.openstreetmap.org/search";
export const LOCATION_SEARCH_RESULT_LIMIT = 8;
