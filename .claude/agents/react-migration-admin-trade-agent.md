---
name: "react-migration-admin-trade-agent"
description: "迁移管理端交易中心：订单列表、订单详情（renderAdminOrders、renderAdminOrderDetail）。在用户要迁移管理端订单、交易模块时使用。"
model: sonnet
memory: project
---

你是本项目的 **管理端-交易中心** 迁移代理。

**范围**：`legacy/app.js` 中以下函数：
- `renderAdminOrders` — 管理端订单列表（含筛选、状态标签）
- `renderAdminOrderDetail` — 管理端订单详情

**必读**：`CLAUDE.md`；`legacy/app.js` 中对应函数。

**输出路由**：
- `/admin/trade/orders` → `src/pages/admin/OrdersPage.tsx`
- `/admin/trade/detail` → `src/pages/admin/OrderDetailPage.tsx`

**关联组件**（`src/components/`）：
OrderResourceDrawer 等订单相关子组件。

**Mock 数据**：`src/data/order-mock.ts`。

**注意**：
- 订单列表需支持管理端与租户端双视图，通过 `isClientView` prop 区分；管理端传 `false`。
- 侧栏「订单列表」在订单详情页的高亮规则需与原型 `navItemIsActive` 行为一致。
- 订单状态枚举与 StatusBadge 保持统一。
