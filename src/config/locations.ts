import type { LocationConfig, LocationGroupConfig } from "@/features/stargazing/types";

// 地点分组静态配置：why：矩阵和控制区都要围绕区域决策来组织，而不是简单平铺地点
export const LOCATION_GROUPS: LocationGroupConfig[] = [
  {
    id: "jiangzhe",
    label: "江浙",
    description: "以上海、江苏、浙江、皖南周边的常用候选点为主"
  },
  {
    id: "guangdongCoast",
    label: "广东沿海",
    description: "以近海、海岛、海湾类开阔天际线点位为主"
  },
  {
    id: "yunnan",
    label: "云南",
    description: "以滇西北高海拔、低光害候选点为主"
  },
  {
    id: "search",
    label: "搜索地点",
    description: "由全国地址搜索临时加入的观测点"
  }
];

// 静态地点配置：当前默认聚焦江浙沪与皖南周边，保证首页首屏就是可直接对比的候选观星点
// 坐标优先落在景区/观景点附近而非市区中心，避免天气与月相窗口偏离真实观测环境
export const LOCATIONS: LocationConfig[] = [
  {
    id: "shanghai-chongming-dongtan",
    name: "上海崇明 · 东滩",
    groupId: "jiangzhe",
    latitude: 31.5192,
    longitude: 121.9449,
    elevation: 4,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 6
  },
  {
    id: "jiangsu-dafeng-yeludang",
    name: "江苏盐城大丰 · 野鹿荡",
    groupId: "jiangzhe",
    latitude: 33.2863,
    longitude: 120.885,
    elevation: 2,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 5
  },
  {
    id: "jiangsu-xuyi-tianquanhu",
    name: "江苏盱眙 · 天泉湖",
    groupId: "jiangzhe",
    latitude: 32.7868,
    longitude: 118.586,
    elevation: 120,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 4
  },
  {
    id: "zhejiang-chunan-qiandaohu",
    name: "浙江淳安 · 千岛湖",
    groupId: "jiangzhe",
    latitude: 29.6093,
    longitude: 119.0729,
    elevation: 136,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 4
  },
  {
    id: "zhejiang-linan-taizijian",
    name: "浙江临安 · 太子尖",
    groupId: "jiangzhe",
    latitude: 30.1783,
    longitude: 118.8932,
    elevation: 1558,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  },
  {
    id: "zhejiang-linan-qianniugang",
    name: "浙江临安 · 牵牛岗",
    groupId: "jiangzhe",
    latitude: 30.0266,
    longitude: 119.0011,
    elevation: 1489,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  },
  {
    id: "zhejiang-anji-tianhuangping",
    name: "浙江安吉 · 天荒坪（江南天池）",
    groupId: "jiangzhe",
    latitude: 30.4709,
    longitude: 119.5941,
    elevation: 900,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 4
  },
  {
    id: "zhejiang-fuyang-andingshan",
    name: "浙江富阳 · 安顶山",
    groupId: "jiangzhe",
    latitude: 29.9885,
    longitude: 119.8936,
    elevation: 790,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 4
  },
  {
    id: "zhejiang-songyang-xingchenshan",
    name: "浙江松阳 · 星辰山",
    groupId: "jiangzhe",
    latitude: 28.2338,
    longitude: 119.3759,
    elevation: 1000,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  },
  {
    id: "anhui-huangshan-guangmingding",
    name: "安徽黄山 · 光明顶",
    groupId: "jiangzhe",
    latitude: 30.1347,
    longitude: 118.164,
    elevation: 1860,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  },
  {
    id: "guangdong-shenzhen-dapeng-dongxichong",
    name: "广东深圳大鹏 · 东西涌",
    groupId: "guangdongCoast",
    latitude: 22.5107,
    longitude: 114.5924,
    elevation: 40,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 5
  },
  {
    id: "guangdong-huizhou-yanzhoudao",
    name: "广东惠州惠东 · 盐洲岛",
    groupId: "guangdongCoast",
    latitude: 22.6739,
    longitude: 114.9007,
    elevation: 8,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 5
  },
  {
    id: "guangdong-shanwei-honghaiwan-zhelang",
    name: "广东汕尾红海湾 · 遮浪角",
    groupId: "guangdongCoast",
    latitude: 22.6675,
    longitude: 115.5171,
    elevation: 12,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 5
  },
  {
    id: "guangdong-yangjiang-hailingdao-maweidao",
    name: "广东阳江海陵岛 · 马尾岛",
    groupId: "guangdongCoast",
    latitude: 21.5375,
    longitude: 111.8093,
    elevation: 10,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 6
  },
  {
    id: "guangdong-zhuhai-wailingdingdao",
    name: "广东珠海万山 · 外伶仃岛",
    groupId: "guangdongCoast",
    latitude: 22.1062,
    longitude: 114.0417,
    elevation: 35,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 4
  },
  {
    id: "yunnan-deqin-yubeng",
    name: "云南德钦 · 雨崩",
    groupId: "yunnan",
    latitude: 28.3914,
    longitude: 98.8995,
    elevation: 3000,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "yunnan-deqin-feilaisi",
    name: "云南德钦 · 飞来寺",
    groupId: "yunnan",
    latitude: 28.4863,
    longitude: 98.8804,
    elevation: 3380,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  },
  {
    id: "yunnan-shangrila-balagezong",
    name: "云南香格里拉 · 巴拉格宗",
    groupId: "yunnan",
    latitude: 27.6066,
    longitude: 99.3759,
    elevation: 3200,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "yunnan-lijiang-yulongxueshan-maoniuping",
    name: "云南丽江玉龙雪山 · 牦牛坪",
    groupId: "yunnan",
    latitude: 27.1612,
    longitude: 100.2445,
    elevation: 3700,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  },
  {
    id: "yunnan-ninglang-luguhu-lige",
    name: "云南宁蒗泸沽湖 · 里格",
    groupId: "yunnan",
    latitude: 27.7399,
    longitude: 100.7991,
    elevation: 2690,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  }
];

// 默认全选整组候选点，why：这个页面的核心价值就是多地点横向比较，而不是单点钻取
export const DEFAULT_LOCATION_IDS = LOCATIONS.map((location) => location.id);
