# 资源中心 迁移规则

## 组件映射
| 原始元素 | React 组件 | 说明 |
|---------|-----------|------|
| `<table class="data-table">` | shadcn `Table` | 使用 TableHeader/TableBody/TableRow/TableCell 组合 |
| `<input type="search" class="btn">` | shadcn `Input` | 筛选栏输入框 |
| `<button class="btn btn--primary">` | shadcn `Button` | 主操作按钮 |
| `<details class="action-more">` | shadcn `DropdownMenu` | CORS 行内"更多"操作菜单 |
| `<input type="checkbox">` | shadcn `Checkbox` | SDK 资源批量选择 |
| 自定义 drawer（openDrawer） | shadcn `Sheet` | 详情/开通账号侧边抽屉 |
| `<select>` | shadcn `Select` | 表单下拉选择 |
| 状态标签 HTML 拼接 | `StatusBadge` 组件 | 基于 shadcn Badge + 条件样式 |
| `<div class="panel">` | shadcn `Card` | 资源信息面板卡片 |
| 进度条 HTML | Tailwind div + width style | 资源用量进度条 |

## 状态管理
- 筛选条件：每个页面独立 `useState`（company/region/spec）
- 批量选择：`useState<Set<string>>` 管理选中的 sdkResKey
- 抽屉开关：`useState<string | null>` 存储当前查看的资源 key
- 注册码显隐：`useState<Set<string>>` 管理已揭示的注册码行
- 资源池面板折叠：`useState<boolean>`

## shadcn/ui 使用
- `Table`：替代原始 data-table，保持列结构一致
- `Sheet`：替代自定义 openDrawer 函数，用于详情和表单
- `Badge`：状态标签（激活/服务/CORS 状态）
- `DropdownMenu`：CORS 行操作"更多"菜单
- `Checkbox`：SDK 资源批量选择
- `Card`：资源信息页面板容器
- `Input/Select/Button`：表单和工具栏

## 可复用模式
- `StatusBadge` 组件：通用状态标签，variant 区分激活/服务/CORS 三种场景
- `isClientView` prop：同一组件通过 prop 切换超管/大客户视图（隐藏企业列等）
- 详情抽屉模式：fields 数组 + dl/grid 布局，可复用于其他模块
- 筛选工具栏模式：Input + Button + flex spacer + 操作按钮

## 注意事项
- 超管视图和大客户视图共用同一组件，通过 `isClientView` prop 控制列显隐
- 注册码默认密文显示，点击切换明文（保留原始交互）
- CORS 状态需标准化后判断启用/禁用按钮的 disabled 状态
- 批量操作按钮在无选中项时 disabled
- 资源信息页的进度条用纯 Tailwind 实现，无需额外依赖
