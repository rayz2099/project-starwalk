// 业务常量集中配置，禁止散落 hardcode

// 夜间窗口：本地 20:00 开始，到次日 04:00（不含）
export const NIGHT_WINDOW_START_HOUR = 20;
export const NIGHT_WINDOW_END_HOUR = 4; // exclusive，次日
export const NIGHT_WINDOW_HOURS = 24 - NIGHT_WINDOW_START_HOUR + NIGHT_WINDOW_END_HOUR; // 8

// 评分阈值
export const RATING_THRESHOLDS = {
  moonBrightPoor: 0.7,
  cloudPoor: 60, // % ，平均或最大任一超过即 POOR
  cloudExcellent: 15,
  moonExcellent: 0.3,
  dewPointSpreadFair: 2 // °C
} as const;

// 默认日期范围（业务日数）
export const DEFAULT_DATE_RANGE_DAYS = 7;
// 上限
export const MAX_DATE_RANGE_DAYS = 14;

// Open-Meteo 调用上限，用于服务端守护
export const OPEN_METEO_REQUEST_TIMEOUT_MS = 8000;
export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
