# Light Pollution And Grouped Locations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为观星矩阵增加静态光污染基线、广东沿海与云南高海拔候选点，并在控制区和结果矩阵中支持按区域分组显示。

**Architecture:** 继续保持“静态地点配置 + 服务端纯函数评分 + 组件只做展示”的结构。光污染作为地点长期属性保存在 `src/config/locations.ts`，评分先按天气/月相得出基础等级，再按光污染有限降级；UI 直接显示光污染原始值并按分组组织地点。

**Tech Stack:** Next.js App Router, React 19, TypeScript, Bun, Tailwind CSS, shadcn/ui, date-fns, suncalc

---

### Task 1: 扩展地点与分组模型

**Files:**
- Modify: `src/features/stargazing/types.ts`
- Modify: `src/config/locations.ts`

- [ ] 增加地点分组与光污染字段类型
- [ ] 补充 `江浙 / 广东沿海 / 云南` 分组元数据
- [ ] 将地点扩展到 20 个并填写静态光污染基线

### Task 2: 先写评分红灯测试

**Files:**
- Modify: `tests/planner.test.ts`

- [ ] 写出“低光害不降级 / 中光害最多降一级 / 高光害直接压到 POOR”的失败用例
- [ ] 写出“地点分组数量正确”的失败用例
- [ ] 运行 `bun test tests/planner.test.ts` 观察红灯

### Task 3: 实现评分与分组配置

**Files:**
- Modify: `src/features/stargazing/constants.ts`
- Modify: `src/features/stargazing/server/scoring.ts`

- [ ] 增加光污染阈值与标签辅助函数
- [ ] 实现基础评分后的光污染降级逻辑
- [ ] 在风险说明中补入光污染原始值

### Task 4: 改造控制区与矩阵展示

**Files:**
- Modify: `src/features/stargazing/components/control-panel.tsx`
- Modify: `src/features/stargazing/components/planner-matrix.tsx`
- Modify: `src/features/stargazing/components/planner-cell-card.tsx`
- Modify: `app/page.tsx`

- [ ] 控制区按区域分组展示地点，并支持每组全选/清空
- [ ] 结果矩阵按区域插入分组标题行
- [ ] 单元格与行头显示光污染等级与原始值
- [ ] 文案补充“光污染静态基线”

### Task 5: 绿灯验证

**Files:**
- Modify: `tests/planner.test.ts`

- [ ] 运行 `bun test tests/planner.test.ts`
- [ ] 运行 `bun run typecheck`
- [ ] 视结果修正类型或实现问题
