# 配置中心 迁移规则

## 组件映射
| 原始元素 | React 组件 | 说明 |
|---------|-----------|------|
| `<table class="data-table">` | `Table` (shadcn/ui) | 统一表格组件 |
| `<button class="btn btn--primary">` | `Button` | 新增按钮 |
| `<button class="link-btn">` | `Button variant="link"` | 行内操作按钮 |
| `openDrawer()` 新增/编辑 | `Sheet` (shadcn/ui) | 侧边抽屉表单 |
| `openDrawer()` 详情 | `Sheet` (shadcn/ui) | 只读详情展示 |
| `confirm()` 删除确认 | `AlertDialog` (shadcn/ui) | 删除二次确认弹窗 |
| `<input>` | `Input` (shadcn/ui) | 表单输入 |
| `<select>` | `Select` (shadcn/ui) | 下拉选择 |
| `<textarea>` | `Textarea` (shadcn/ui) | 多行文本 |
| `<label>` | `Label` (shadcn/ui) | 表单标签 |
| `<span class="tag tag--ok">` | `StatusBadge` | 复用已有状态标签组件 |

## 状态管理
- 每个页面用 `useState` 管理列表数据（初始值来自 mock）
- 抽屉模式用联合类型 `'create' | 'edit' | 'detail' | null` 控制
- 表单字段各自独立 `useState`，打开抽屉时重置/填充
- 服务套餐页的端口预设通过 `filteredPresets` 派生计算，选中后自动带出只读字段

## shadcn/ui 使用
- `Sheet` — 替代原始 `openDrawer()`，用于新增/编辑/详情
- `AlertDialog` — 替代原始 `confirm()` 删除确认
- `Select` — 替代原生 `<select>`，支持 placeholder
- `Table` — 替代原始 `<table class="data-table">`
- `Label` + `Input` + `Textarea` — 表单字段组合

## 可复用模式
- 抽屉模式状态管理模式：`DrawerMode = 'create' | 'edit' | 'detail' | null`
- 表单重置模式：打开 create 时清空，打开 edit 时填充当前行数据
- 表格 + 工具栏布局：`flex justify-between` 标题 + 新增按钮
- 详情抽屉用 `<dl>` 结构展示键值对

## 注意事项
- 服务节点的「节点类型」选择后自动填充节点名称（如果名称为空）
- 服务套餐的端口预设按选中节点过滤，选定后坐标系/挂载点/TLS/压缩置灰不可编辑
- 服务节点删除时需判断 `referenced` 字段，给出不同提示文案
- 商品规格的「商品」下拉从 products mock 数据获取选项
- 编辑模式下业务编号（code/id）不可修改
