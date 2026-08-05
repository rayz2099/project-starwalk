// 地点分组：why：页面核心是跨区域横向比较，分组是信息组织主维度
export type LocationGroupId =
  | "jiangzhe"
  | "guangdongCoast"
  | "yunnan"
  | "shennongjia"
  | "chuanxi"
  | "search";

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
  lightPollutionBortle?: number;
  // 动态来源标识，why：搜索地点没有本地静态光污染标定，展示和评分要显式区分
  source?: "static" | "geocoding";
}

// 评分枚举
export type RatingLevel = "EXCELLENT" | "FAIR" | "POOR";
export type MoonlightImpact = "LOW" | "MEDIUM" | "HIGH";
export type ObservationTarget = "BRIGHT_STARS" | "PLANETS" | "METEORS" | "MILKY_WAY" | "DEEP_SKY";

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
  precipitationMm: number;
  precipitationProbability: number;
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
  // 夜间合计降水量 mm，why：hard gate 用合计而不是单点尖刺
  precipitationSumMm: number;
  // 夜间最大小时降水 mm
  precipitationMaxMm: number;
  // 夜间最大降水概率 %，why：展示用 max 防呆，不进评分
  precipitationProbabilityMax: number;
  // 湿小时数（> soft 下沿）
  wetHourCount: number;
}

// 小时级观测片段：why：观星条件不是整夜单点值，月落/月升会让同一夜不同时段差异很大
export interface HourlyObservationSlot {
  localTime: string;
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverHigh: number;
  temperature: number;
  dewPointSpread: number;
  precipitationMm: number;
  precipitationProbability: number;
  // 是否因降水被踢出候选，why：窗口分析与 UI 共用同一判定
  wetKilled: boolean;
  moonAltitudeDeg: number;
  moonIllumination: number;
  moonAboveHorizon: boolean;
  moonlightImpact: MoonlightImpact;
  score: number;
}

// 最佳连续观测窗口：why：最终决策应该回答“几点到几点值得看”，而不是只给整夜均值
export interface BestObservationWindow {
  startLocalTime: string;
  endLocalTime: string;
  hours: number;
  avgScore: number;
  avgCloudCover: number;
  maxCloudCover: number;
  moonlightImpact: MoonlightImpact;
  targetSuitability: ObservationTarget[];
}

export interface NightlyWindowAnalysis {
  slots: HourlyObservationSlot[];
  bestWindow: BestObservationWindow | null;
}

// 月相信息（按业务日的本地午夜计算）
export interface MoonInfo {
  businessDate: string;
  // 0~1 亮度
  illumination: number;
  // 0~1 月相位（0 新月 0.25 上弦 0.5 满月 0.75 下弦）
  phase: number;
  phaseLabel: string;
  phaseIcon: string;
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
  windowAnalysis: NightlyWindowAnalysis | null;
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
  // 地址搜索产生的临时地点，不入库；服务端按 id 与 locationIds 取交集
  customLocations?: LocationConfig[];
}
