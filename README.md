# Stargazing Planner

多地点 × 多日期的观星条件对比矩阵单页应用。

## 技术栈

- 运行时：Bun
- 框架：Next.js 15 App Router + React 19
- 语言：TypeScript（strict）
- UI：Tailwind CSS + shadcn/ui 风格组件 + lucide-react
- 月相 / 日月出落：`suncalc`（服务端计算）
- 天气：`Open-Meteo Forecast API`（服务端拉取，hourly 字段使用新版命名）
- 日期：`date-fns` + `react-day-picker`

## 目录

```
app/
  layout.tsx
  page.tsx               # 服务端首屏预热 + 装配
  actions.ts             # 唯一 server action 入口
  globals.css
src/
  config/locations.ts    # 静态地点配置
  components/ui/         # shadcn 风格基础组件
  features/stargazing/
    constants.ts         # 业务常量与评分阈值
    types.ts             # 域模型与 DTO
    components/          # control-panel / planner-matrix / planner-cell-card / planner-page
    server/              # open-meteo / moon / aggregate / scoring / planner
tests/
  planner.test.ts        # 切片 + 评分关键场景
```

## 运行

```bash
bun install
bun run dev          # 开发
bun run typecheck    # 类型检查
bun test             # 单元测试
bun run build        # 生产构建
bun run start        # 生产服务（默认 3000）
```

## 业务规则

- 观测窗口：本地 `20:00` → 次日 `04:00`（exclusive，共 8 小时）。
- 聚合：总云量均/最、低云均、高云均、最低温、最小温露点差。
- 评分顺序固定：
  1. 月相亮度 > 70% → POOR
  2. 总云均/峰 > 60% → POOR
  3. 总云均 < 15% 且 月相 < 30% → EXCELLENT
  4. 最小温露点差 < 2°C → FAIR（结露/起雾风险）
  5. 否则 FAIR

## 已知限制

- 地点静态写死在 `src/config/locations.ts`。
- 未引入 seeing / transparency 高级气象模型。
- 未做用户系统、持久化、分享、订阅。
- Open-Meteo 默认仅支持未来约 16 天的预报窗口；超过会被 `MAX_DATE_RANGE_DAYS` 拦截。

## 验收

- `bun run typecheck`、`bun test`、`bun run build` 全绿。
- 首屏服务端预热即可见矩阵；切换日期/地点触发 server action 重算。
- 单地点失败不影响其余行；单格无数据显式标注，不静默 fallback。
