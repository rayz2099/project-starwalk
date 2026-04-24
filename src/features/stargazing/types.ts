// 地点分组：why：页面核心是跨区域横向比较，分组是信息组织主维度
export type LocationGroupId = "jiangzhe" | "guangdongCoast" | "yunnan";

// 分组静态配置
export interface LocationGroupConfig {
  id: LocationGroupId;
  label: string;
  description: string;
}

// 地点静态配置
export interface LocationConfig {
  id: string;
  name: string;
  groupId: LocationGroupId;
  latitude: number;
  longitude: number;
  elevation: number;
  // IANA 时区名，用于将 UTC 小时数据切回本地夜间窗口
  timezone: string;
  // Bortle 1~9，why：光污染是地点长期属性，适合放到静态配置里
  lightPollutionBortle: number;
}

// 评分枚举
export type RatingLevel = "EXCELLENT" | "FAIR" | "POOR";

// 单地点单小时天气片段（已对齐 Open-Meteo 当前字段名）
export interface HourlyWeatherPoint {
  // 该点对应的 UTC 时刻（毫秒）
  timestampUtcMs: number;
  // 该点对应的本地时刻字符串（仅供调试，不参与运算）
  localIsoNoTz: string;
  temperature2m: number;
  dewPoint2m: number;
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverHigh: number;
}

// 夜间窗口聚合结果
export interface NightlyAggregation {
  // 业务日（本地日历日，"yyyy-MM-dd"）
  businessDate: string;
  // 夜间窗口起止 UTC ms，便于前端校验
  windowStartUtcMs: number;
  windowEndUtcMs: number;
  // 是否数据点完整（小时数 == 期望值）
  complete: boolean;
  // 实际命中的小时数
  hoursCovered: number;
  cloudCoverAvg: number;
  cloudCoverMax: number;
  cloudCoverLowAvg: number;
  cloudCoverHighAvg: number;
  minTemperature: number;
  // min(T - Td) ；越小越容易结露/起雾
  minDewPointSpread: number;
}

// 月相信息（按业务日的本地午夜计算）
export interface MoonInfo {
  businessDate: string;
  // 0~1 亮度
  illumination: number;
  // 0~1 月相位（0 新月 0.25 上弦 0.5 满月 0.75 下弦）
  phase: number;
  phaseLabel: string;
  phaseIcon: string; // emoji
}

// 评分结果
export interface RatingResult {
  level: RatingLevel;
  // 主因，按命中顺序记录的简短理由
  reason: string;
  risks: string[];
}

// 单格 DTO（地点 x 业务日）
export interface MatrixCell {
  locationId: string;
  businessDate: string;
  // 仅在不可计算时为 null
  aggregation: NightlyAggregation | null;
  moon: MoonInfo;
  rating: RatingResult | null;
  // 不可计算时的简要错误说明
  error?: string;
}

// 单地点维度的全部数据
export interface MatrixRow {
  location: LocationConfig;
  // hourly 拉取层面是否完全失败
  fetchError?: string;
  cells: MatrixCell[];
}

// 顶层矩阵 DTO
export interface PlannerMatrix {
  // 业务日列（本地日期 yyyy-MM-dd）
  dates: string[];
  rows: MatrixRow[];
  generatedAtUtcMs: number;
}

// 入参
export interface PlannerInput {
  startDate: string; // yyyy-MM-dd（按各地点本地日期理解）
  endDate: string; // 含
  locationIds: string[];
}
