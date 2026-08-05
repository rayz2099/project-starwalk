import type { LocationConfig, LocationGroupConfig } from "@/features/stargazing/types";

// 地点分组静态配置：why：矩阵和控制区都要围绕区域决策来组织，而不是简单平铺地点
export const LOCATION_GROUPS: LocationGroupConfig[] = [
  {
    id: "jiangzhe",
    label: "江浙",
    description: "上海、苏浙皖周边近场徒步/露营候选"
  },
  {
    id: "guangdongCoast",
    label: "广东沿海",
    description: "近海、海岛、海湾类开阔天际线"
  },
  {
    id: "yunnan",
    label: "云南",
    description: "滇西北高海拔、低光害"
  },
  {
    id: "shennongjia",
    label: "神农架",
    description: "鄂西高海拔湿地与林区长线"
  },
  {
    id: "chuanxi",
    label: "川西",
    description: "高原暗空与长线徒步节点"
  },
  {
    id: "search",
    label: "搜索地点",
    description: "由全国地址搜索临时加入的观测点"
  }
];

// 静态地点配置：坐标优先落在景区/营地附近，避免市区中心天气偏离真实观测环境
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
    id: "zhejiang-linan-damingshan",
    name: "浙江临安 · 大明山",
    groupId: "jiangzhe",
    latitude: 30.0418,
    longitude: 118.9864,
    elevation: 1480,
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
    id: "zhejiang-yuyao-simingshan-yangtianhu",
    name: "浙江余姚 · 四明山仰天湖",
    groupId: "jiangzhe",
    latitude: 29.752,
    longitude: 121.085,
    elevation: 600,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 4
  },
  {
    id: "zhejiang-jiande-gechuanjian",
    name: "浙江建德 · 搁船尖",
    groupId: "jiangzhe",
    latitude: 29.552,
    longitude: 119.288,
    elevation: 1080,
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
  },
  {
    id: "hubei-shennongjia-dajiuhu",
    name: "湖北神农架 · 大九湖",
    groupId: "shennongjia",
    latitude: 31.489,
    longitude: 110.008,
    elevation: 1730,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "hubei-shennongjia-shennongding",
    name: "湖北神农架 · 神农顶",
    groupId: "shennongjia",
    latitude: 31.445,
    longitude: 110.288,
    elevation: 3105,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "sichuan-kangding-xinduqiao",
    name: "四川康定 · 新都桥",
    groupId: "chuanxi",
    latitude: 30.041,
    longitude: 101.486,
    elevation: 3300,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "sichuan-litang-wuliangta",
    name: "四川理塘 · 无量塔草原",
    groupId: "chuanxi",
    latitude: 29.998,
    longitude: 100.269,
    elevation: 4014,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "sichuan-daocheng-yading-chonggu",
    name: "四川稻城 · 亚丁冲古寺",
    groupId: "chuanxi",
    latitude: 28.36,
    longitude: 100.355,
    elevation: 3880,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 1
  },
  {
    id: "sichuan-xiaojin-siguniangshan-shuangqiao",
    name: "四川小金 · 四姑娘山双桥沟",
    groupId: "chuanxi",
    latitude: 31.105,
    longitude: 102.901,
    elevation: 2500,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "sichuan-seda-larong",
    name: "四川色达 · 喇荣外围",
    groupId: "chuanxi",
    latitude: 32.268,
    longitude: 100.333,
    elevation: 3500,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "sichuan-kangding-tagong",
    name: "四川康定 · 塔公草原",
    groupId: "chuanxi",
    latitude: 30.278,
    longitude: 101.522,
    elevation: 3730,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 2
  },
  {
    id: "sichuan-xiaojin-balangshan-yakou",
    name: "四川小金 · 巴朗山垭口",
    groupId: "chuanxi",
    latitude: 30.905,
    longitude: 102.898,
    elevation: 4487,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 1
  },
  {
    id: "sichuan-batang-cuopugou",
    name: "四川巴塘 · 措普沟",
    groupId: "chuanxi",
    latitude: 30.195,
    longitude: 99.548,
    elevation: 4000,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 1
  },
  {
    id: "sichuan-danba-jiaju",
    name: "四川丹巴 · 甲居外围",
    groupId: "chuanxi",
    latitude: 30.878,
    longitude: 101.882,
    elevation: 2200,
    timezone: "Asia/Shanghai",
    lightPollutionBortle: 3
  }
];

// 默认只勾近场江浙组，why：远点长线不应污染周末对比首屏与 Open-Meteo fan-out
export const DEFAULT_LOCATION_IDS = LOCATIONS.filter(
  (location) => location.groupId === "jiangzhe"
).map((location) => location.id);
