# 需求文档说明页：置顶字段标准表 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use @superpowers/subagent-driven-development（推荐）或 @superpowers/executing-plans，按任务勾选推进。

**Goal:** 在「需求文档说明」每个页面级条目中，于标题下、原有 bullets 之上渲染**五列字段标准表**；数据结构支持可选行；先以「实例管理」为试点填行。

**Architecture:** 在 `ModuleDocsPage` 的数据模型上为每个 `item` 增加可选 `fieldStandards`（五列与 spec 一致）；页面内用原生 `<table>` + Tailwind 与现有卡片视觉对齐。字段文案以 spec 与产品口径为准；与当前原型控件不一致处在「备注」中点明，本期不强制改 `InstanceCreateDrawer` 校验逻辑。

**Tech Stack:** React 18、TypeScript、Tailwind CSS 4、Vite；无 Vitest/Jest，**不**新增测试依赖；验收以 `yarn build` + 路由手动打开为准。

**Spec 依据:** `docs/superpowers/specs/2026-05-15-module-docs-field-standards-design.md`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/pages/ModuleDocsPage.tsx` | 定义 `FieldStandardRow` 类型、`sections` 条目扩展、表格区块渲染、试点数据 |
| （可选拆分）`src/data/module-docs-content.ts` | 仅当 `ModuleDocsPage.tsx` 超过 ~250 行时再抽离 `sections` 与类型；**首期可 YAGNI 全放同一文件** |

---

### Task 1: 类型与数据结构

**Files:**
- Modify: `src/pages/ModuleDocsPage.tsx`

- [ ] **Step 1.1: 定义行类型（五列，全部为 `string`，避免 `any`）**

```ts
export type FieldStandardRow = {
  /** 与界面 Label 一致 */
  field: string
  /** 是 / 否 / 条件必填（+ 条件说明） */
  required: string
  /** 校验、长度、格式、默认值、只读 */
  rules: string
  /** 枚举、接口、mock、计算字段 */
  dataSource: string
  /** 演示口径、新建/编辑差异、后续迭代 */
  notes: string
}
```

- [ ] **Step 1.2: 扩展每个 `item` 的类型**

将当前匿名 `items` 显式为含 `title`、`bullets: string[]`，并增加可选字段：

```ts
fieldStandards?: FieldStandardRow[]
```

- [ ] **Step 1.3: 在「资源中心 → 实例管理」条目上挂试点数据**

建议行（可按产品最终口径微调文案，但五列语义不变）：

| field | required | rules | dataSource | notes |
|-------|----------|-------|------------|-------|
| 企业名称 | 是 | 须先选择企业再提交 | 企业下拉列表（原型 mock） | 目标口径：已创建实例的企业过滤掉；多实例后策略另述。当前原型若仍为静态列表，在备注已说明即可。 |
| 实例名称 | 是 | 目标口径：2～50 个字符 | 文本输入 | 当前原型 `maxLength` 等与口径不一致时，仅文档对齐目标，或后续单任务改表单。 |
| 资源共享情况 | 是 | 须选择一项 | 枚举：全球分发、区域限定 | 对应「新增实例」抽屉。 |
| 服务节点 | 是 | 至少选一个节点 | 固定多选列表（中国、亚太…） | 与抽屉内 `SERVICE_NODES` 一致。 |
| 设备自动入库 | 是 | 是 / 否 | 枚举 | 默认值「是」与抽屉一致可写入 rules。 |
| 激活方式 | 是 | 须选择一项 | 枚举：设备 SN 绑定、手动激活、在线激活 | 提交前校验与抽屉一致。 |
| 账号前缀 | 否 | 若填写：4 位小写字母（以占位提示为准） | 文本输入 | 与 Label「账号前缀」一致。 |

---

### Task 2: 表格 UI（置顶）

**Files:**
- Modify: `src/pages/ModuleDocsPage.tsx`

- [ ] **Step 2.1: 在子模块标题 `<h3>` 下方、`bullets` 列表上方插入条件渲染**

逻辑：`item.fieldStandards?.length` 为真时渲染表格；否则不渲染（不要求每页必有表）。

- [ ] **Step 2.2: 表头五列文案**

与 spec 对齐，表头建议：**字段**、**必填**、**规则与说明**、**数据/选项来源**、**备注**。

- [ ] **Step 2.3: 样式约束**

- 使用 `overflow-x-auto` 包裹 `table`，避免窄屏撑破卡片。
- 表头 `bg-[#f9f9f9]` 或等价浅底、行边框 `border-[#e9ebec]`、正文字号与现有 bullet 一致（约 `text-[13px]`），表头略加粗。
- **不**新建 `.css` 文件（项目约定 Tailwind only）。

---

### Task 3: 验证

**Files:** 无新增

- [ ] **Step 3.1: TypeScript 与构建**

运行：

```bash
cd "/Users/工作/ACode/SADMIN/adoc/pointx-prototype" && yarn build
```

预期：退出码 0，无 TS 报错。

- [ ] **Step 3.2: 手动冒烟**

1. 启动 `yarn dev`，访问 `/admin/module-docs` 与 `/client/module-docs`（若同组件复用则两处都看）。
2. 展开「资源中心」卡片，确认「实例管理」下**先**出现五列表，**再**出现原有 bullet。
3. 缩小浏览器宽度，确认横向滚动可用、卡片不溢出布局。

---

### Task 4: 文档与提交（按团队习惯）

- [ ] **Step 4.1:** 若试点 OK，再按需为其他 `item` 补 `fieldStandards`（可拆多次 PR，不必一次填全）。

- [ ] **Step 4.2:** 按仓库策略提交（用户未要求则由执行者决定是否 `git commit`）。

---

## Plan review

本仓库未包含 `plan-document-reviewer` 自动化提示词；可由人工对照本 plan 与 spec 做一次一致性检查后再开工。

---

## Execution handoff

**Plan 已保存至:** `docs/superpowers/plans/2026-05-15-module-docs-field-standards.md`

**两种执行方式：**

1. **Subagent-Driven（推荐）** — 每任务派生子代理、任务间 review；需配合 @superpowers/subagent-driven-development  
2. **Inline Execution** — 本会话内按勾选逐项改；需配合 @superpowers/executing-plans  

你回复 **1** 或 **2**（或直接说「按计划在主会话实现」），我再开始改代码。
