# 订单列表 迁移规则

## 组件映射
| 原始元素 | React 组件 | 说明 |
|---------|-----------|------|
| `renderAdminOrders()` | `OrdersPage.tsx` | 订单列表主页面 |
| `renderAdminOrderDetail()` | `OrderDetailPage.tsx` | 订单详情页 |
| `openOrderResourceDetailDrawer()` | `OrderResourceDrawer.tsx` | 资源明细抽屉 |
| `<table class="data-table">` | shadcn `Table` | 订单列表表格 |
| `<span class="tag tag--ok">` | shadcn `Badge` + Tailwind | 状态标签 |
| `<a href="#/admin/trade/detail">` | `useNavigate` + `Button variant="link"` | 详情链接 |
| `entityDetailBackToolbar()` | `Button variant="ghost"` + `ArrowLeft` | 返回按钮 |
| `openDrawer()` | shadcn `Sheet` | 抽屉容器 |
| `<dl class="desc-list entity-detail-kv">` | 自定义 `KvItem` 组件 | KV 描述列表 |

## 状态管理
- `drawerOpen` / `setDrawerOpen` — 控制资源明细抽屉开关
- `selectedOrder` — 当前选中的订单（用于抽屉展示）
- 路由参数 `?no=xxx` 通过 `useSearchParams` 获取订单号

## shadcn/ui 使用
- `Table` 系列 — 订单列表表格
- `Badge` — 订单状态标签（已付款/已完成/待处理）
- `Button` — 操作按钮、返回按钮、链接按钮
- `Sheet` — 资源明细抽屉（替代原始 openDrawer）

## 可复用模式
- `orderStatusClass(status)` — 订单状态颜色映射，可提取为通用工具
- `KvItem` 组件 — 键值对描述项，多个详情页可复用
- `pseudoResourceId()` — 演示用 FNV-1a hash 生成资源 ID

## 注意事项
- 订单详情页通过 query string `?no=` 传递订单号，非路径参数
- 资源明细数量取 `min(quantity, 40)`，至少 1 条
- SAP 参考号为空时显示 `—`
- 订单列表同时用于超管和大客户视图（共用组件）
- 原始代码中 `tagForOrderStatus` 对「已支付/已付款/已完成」统一绿色处理
