# /style-tune - 页面样式调优

根据提供的页面路径或 URL，对目标页面进行样式调优，使其全屏适配且与 PointX 系统风格一致。

## 使用方式

用户提供一个页面路径（如 `/client/profile`）或文件路径（如 `src/pages/client/DashboardPage.tsx`），然后执行本 skill。

## 执行流程

### 第 1 步：调用 ui-ux-pro-max 获取设计指导

先执行 `/ui-ux-pro-max:ui-ux-pro-max` skill，获取 UI/UX 最佳实践参考。在调优过程中遵循其优先级规则（Accessibility > Touch & Interaction > Layout & Responsive > ...）。

### 第 2 步：定位并读取目标文件

1. 如果用户提供的是 URL 路径（如 `/client/profile`），在 `src/App.tsx` 中查找对应的路由配置，定位到实际的页面组件文件
2. 如果用户提供的是文件路径，直接读取
3. 同时读取目标页面所在的 Layout 组件（`src/layouts/ClientLayout.tsx` 或 `src/layouts/AdminLayout.tsx`），了解内容区域的容器约束（padding、overflow 等）
4. 读取同角色下其他已调优的页面作为风格参考

### 第 3 步：对比 PointX 设计规范

对照以下设计规范，逐一检查目标页面是否合规。**所有样式必须严格遵循此规范，不允许引入新色值、新阴影或新字体大小。**

#### 色彩规范（强制）

| 用途 | 色值 | Tailwind 写法 |
|------|------|---------------|
| 品牌主色 | `#ff7f32` | `text-[#ff7f32]` / `bg-[#ff7f32]` |
| 主色浅底 | `#ff7f32` 10% | `bg-[#ff7f32]/10` |
| 主色 hover | `#ff7f32` 5% | `bg-[#ff7f32]/5` |
| 渐变浅端 | `#ff9a5c` / `#ff8f4a` | `from-[#ff7f32] via-[#ff8f4a] to-[#ff9a5c]` |
| 标题文字 | `#1a1a1a` | `text-[#1a1a1a]` |
| 正文文字 | `#323232` | `text-[#323232]` |
| 次要文字 | `#646464` | `text-[#646464]` |
| 辅助文字 | `#969696` | `text-[#969696]` |
| 页面背景 | `#f9f9f9` | `bg-[#f9f9f9]` |
| 卡片背景 | `#ffffff` | `bg-white` |
| 通用边框 | `#e9ebec` | `border-[#e9ebec]` |
| 辅助图标底 | `#f9f9f9` | `bg-[#f9f9f9]` |
| 危险/错误 | `#eb2e2e` | `text-[#eb2e2e]` |
| 成功/正向 | `#22c55e` | `text-[#22c55e]` |
| 蓝色标签 | `#3b82f6` | `text-[#3b82f6]` / `bg-[#3b82f6]/10` |

#### 阴影规范（强制，不允许自定义新阴影）

| 场景 | 写法 |
|------|------|
| 卡片静止 | `shadow-[0_1px_3px_rgba(0,0,0,0.06)]` |
| 卡片悬停 | `shadow-[0_4px_12px_rgba(0,0,0,0.08)]` |
| 顶栏 | `shadow-[0px_0px_12px_-1px_rgba(0,0,0,0.06)]` |
| 导航激活 | `shadow-[inset_3px_0_0_0_#ff7f32,0_1px_2px_rgba(0,0,0,0.04)]` |

#### 圆角规范

| 场景 | 写法 |
|------|------|
| 内容卡片 | `rounded-xl` |
| 图标容器/子标题 | `rounded-lg` |
| 按钮/输入框/导航项 | `rounded-md` |
| 徽章/进度条/头像 | `rounded-full` |

#### 字号规范

| 用途 | 写法 |
|------|------|
| 页面大标题 | `text-xl` (20px) |
| 区块标题 | `text-lg` (18px) |
| 正文/导航/表格 | `text-sm` (14px) |
| 辅助文字/时间戳 | `text-xs` (12px) |
| 微标签 | `text-[11px]` |

#### 字重规范

| 用途 | 写法 |
|------|------|
| 页面标题/KPI | `font-bold` |
| 卡片标题/区块标题 | `font-semibold` |
| 表格内容/按钮/标签 | `font-medium` |
| 普通正文 | `font-normal` |

#### 间距规范

| 场景 | 写法 |
|------|------|
| 页面级区块间距 | `gap-5` 或 `space-y-6` |
| 卡片内边距 | `p-5` 或 `p-6` |
| 区块标题底边距 | `mb-4` 或 `mb-5` |
| 字段行间距 | `space-y-3` 或 `space-y-4` |
| 图标与文字间距 | `gap-2` 或 `gap-2.5` |

#### 布局规范

| 场景 | 写法 |
|------|------|
| 全屏页面根容器 | `flex h-full flex-col gap-5`（去掉 `max-w-*` 和 `mx-auto`） |
| 多列网格 | `grid grid-cols-3 gap-5`（按内容密度选 2/3/4 列） |
| 卡片通用 | `rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]` |

#### 图标规范

- 使用 `lucide-react` 图标库
- 导航图标 `size-4`，KPI 图标 `size-5`，行内小图标 `size-3` / `size-3.5`
- 图标容器：`flex size-7 items-center justify-center rounded-lg bg-[#ff7f32]/10`，内含 `size-3.5 text-[#ff7f32]` 的图标

### 第 4 步：执行调优

按照以下优先级逐一修复：

1. **全屏适配**：移除 `max-w-*`、`mx-auto` 等宽度限制，根容器改为 `flex h-full flex-col gap-5`，确保填满 Layout 的 main 区域
2. **色彩合规**：将所有非规范色值替换为上表中的标准色值
3. **阴影合规**：替换非标准阴影为规范中的四种阴影
4. **圆角/字号/字重合规**：统一为规范值
5. **间距对齐**：调整为规范的间距档位
6. **图标规范**：统一为 lucide-react + 规范尺寸 + 规范容器样式
7. **卡片通用样式**：统一为 `rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]`

### 第 5 步：验证

1. 运行 `npx tsc --noEmit` 确保类型检查通过
2. 检查是否引入了新色值、新阴影或非规范值（用 grep 搜索确认）
3. 输出调优摘要：改了哪些文件、从什么改成什么

## 输出格式

调优完成后，输出简要摘要：

```
调优完成：[页面名称]

文件：[文件路径]
改动点：
  - [改动 1]
  - [改动 2]
  - ...

类型检查：通过 / 未通过（原因）
```
