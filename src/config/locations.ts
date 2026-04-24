import type { LocationConfig } from "@/features/stargazing/types";

// 静态地点配置：当前默认聚焦江浙沪与皖南周边，保证首页首屏就是可直接对比的候选观星点
// 坐标优先落在景区/观景点附近而非市区中心，避免天气与月相窗口偏离真实观测环境
export const LOCATIONS: LocationConfig[] = [
  {
    id: "shanghai-chongming-dongtan",
    name: "上海崇明 · 东滩",
    latitude: 31.5192,
    longitude: 121.9449,
    elevation: 4,
    timezone: "Asia/Shanghai"
  },
  {
    id: "jiangsu-dafeng-yeludang",
    name: "江苏盐城大丰 · 野鹿荡",
    latitude: 33.2863,
    longitude: 120.885,
    elevation: 2,
    timezone: "Asia/Shanghai"
  },
  {
    id: "jiangsu-xuyi-tianquanhu",
    name: "江苏盱眙 · 天泉湖",
    latitude: 32.7868,
    longitude: 118.586,
    elevation: 120,
    timezone: "Asia/Shanghai"
  },
  {
    id: "zhejiang-chunan-qiandaohu",
    name: "浙江淳安 · 千岛湖",
    latitude: 29.6093,
    longitude: 119.0729,
    elevation: 136,
    timezone: "Asia/Shanghai"
  },
  {
    id: "zhejiang-linan-taizijian",
    name: "浙江临安 · 太子尖",
    latitude: 30.1783,
    longitude: 118.8932,
    elevation: 1558,
    timezone: "Asia/Shanghai"
  },
  {
    id: "zhejiang-linan-qianniugang",
    name: "浙江临安 · 牵牛岗",
    latitude: 30.0266,
    longitude: 119.0011,
    elevation: 1489,
    timezone: "Asia/Shanghai"
  },
  {
    id: "zhejiang-anji-tianhuangping",
    name: "浙江安吉 · 天荒坪（江南天池）",
    latitude: 30.4709,
    longitude: 119.5941,
    elevation: 900,
    timezone: "Asia/Shanghai"
  },
  {
    id: "zhejiang-fuyang-andingshan",
    name: "浙江富阳 · 安顶山",
    latitude: 29.9885,
    longitude: 119.8936,
    elevation: 790,
    timezone: "Asia/Shanghai"
  },
  {
    id: "zhejiang-songyang-xingchenshan",
    name: "浙江松阳 · 星辰山",
    latitude: 28.2338,
    longitude: 119.3759,
    elevation: 1000,
    timezone: "Asia/Shanghai"
  },
  {
    id: "anhui-huangshan-guangmingding",
    name: "安徽黄山 · 光明顶",
    latitude: 30.1347,
    longitude: 118.164,
    elevation: 1860,
    timezone: "Asia/Shanghai"
  }
];

// 默认全选整组候选点，why：这个页面的核心价值就是多地点横向比较，而不是单点钻取
export const DEFAULT_LOCATION_IDS = LOCATIONS.map((location) => location.id);
