# /figma-to-code - 按 Figma 设计稿生成/修改代码

根据用户提供的 Figma 设计稿链接和目标实现位置，生成与当前项目风格一致的代码。

## 使用方式

用户提供：
1. **Figma 链接**（如 `https://www.figma.com/design/xxx?node-id=89-2014`）
2. **目标位置**（如路由路径 `/admin/instances`、文件路径 `src/components/XxxDrawer.tsx`、或描述"实例编辑弹窗"）

## 执行流程

### 第 1 步：获取设计稿

从 Figma URL 中提取 `fileKey` 和 `nodeId`：
- URL 格式 `figma.com/design/:fileKey/:name?node-id=X-Y` → fileKey 为 `:fileKey`，nodeId 为 `X:Y`（`-` 替换为 `:`）

并行执行：
1. 调用 `mcp__figma__get_design_context` 获取设计上下文（代码参考 + 组件结构）
2. 调用 `mcp__figma__get_screenshot` 获取设计稿截图，用于理解视觉细节

**重要**：Figma 返回的代码是 React+Tailwind **参考**，不是最终代码。必须根据项目实际情况适配。

### 第 2 步：定位并读取当前代码

根据用户描述的目标位置，定位相关文件：

1. 如果用户提供路由路径（如 `/admin/instances`），在 `src/App.tsx` 中查找路由配置定位组件文件
2. 如果用户提供文件路径，直接读取
3. 如果用户描述功能（如"实例编辑弹窗"），用 Explore agent 搜索相关组件

读取所有相关文件，理解当前实现结构。

### 第 3 步：读取项目风格参考

读取以下文件作为风格基准（只需读取其中 2-3 个即可，避免过度读取）：

1. `CLAUDE.md` — 技术栈和规范
2. `.claude/skills/style-tune.md` — 完整的 PointX 设计规范（色彩、阴影、圆角、字号、间距等）
3. 同模块下已实现的一个页面作为风格参考

**必须严格遵循 style-tune.md 中的色彩、阴影、圆角、字号、间距规范，不允许引入新色值或新阴影。**

### 第 4 步：对比差异

对比设计稿与当前代码，列出需要修改的差异点。输出简要对比：

```
设计稿 vs 当前实现的差异：
  - [差异 1：标题文字 / 布局结构 / 组件类型 / 字段变化等]
  - [差异 2]
  - ...
```

### 第 5 步：生成代码

按照以下原则生成/修改代码：

#### 技术栈（强制）
- React 18 + TypeScript
- Tailwind CSS 4（只写 class，不写 CSS 文件）
- shadcn/ui 组件库（替代原生表单元素）
- lucide-react 图标库
- 每个页面对应 `src/pages/XxxPage.tsx`，公共组件放 `src/components/`

#### 代码风格要求
- 组件用函数式 + hooks（useState / useEffect）
- 不要用 `any`，给明确类型
- 不写多余注释，只在 WHY 不明显时加一行
- 不引入新的 CSS 文件
- 样式用 Tailwind 还原，保持布局和视觉层级即可，不需要像素级一致
- Figma 设计稿中的绝对定位（absolute）必须转换为 Tailwind flex/grid 布局

#### 从 Figma 到代码的转换规则
- Figma 的绝对定位 → flex/grid 流式布局
- Figma 的固定像素值 → Tailwind 间距档位（gap-2 / gap-4 / p-5 等）
- Figma 的字体 → `text-sm font-normal text-[#323232]` 等规范写法
- Figma 的按钮 → 使用 `Button` 组件 + 项目规范色值
- Figma 的输入框 → 使用 `Input` / `Select` 等 shadcn/ui 组件
- Figma 的弹窗/侧栏 → 使用 `Sheet` / `Dialog` 组件
- Figma 的下拉选择 → 使用 `Select` 或 `Popover` + `Checkbox`
- Figma 的颜色 → 映射到 style-tune.md 中的规范色值，不要直接使用 Figma 的色值

#### 组件选择对照

| Figma 设计元素 | 使用组件 |
|----------------|----------|
| 按钮（主色） | `Button` + `bg-[#ff7f32] border-[#ffa05c]` |
| 按钮（次要） | `Button variant="outline"` + `bg-[#e9ebec]` |
| 输入框 | `Input` + `h-8 rounded-lg border-[#e9ebec]` |
| 下拉选择 | `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` |
| 多选标签 | `Popover` + `Checkbox` 组合（标签用橙色芯片样式） |
| 侧栏抽屉 | `Sheet` / `SheetContent` / `SheetHeader` / `SheetFooter` |
| 对话框 | `Dialog` / `DialogContent` / `DialogHeader` |
| 表格 | `Table` / `TableRow` / `TableCell` 等 |
| 必填标记 | `<span className="text-[#eb2e2e]">*</span>` |

### 第 6 步：验证

1. 运行 `npx tsc --noEmit` 确保类型检查通过
2. 如有未使用的 import，清理掉
3. 输出修改摘要

## 输出格式

```
已完成：[功能描述]

修改文件：
  - [文件路径]：[改动概述]

设计稿差异对齐：
  - [差异 1]：已修改为 ...
  - [差异 2]：已修改为 ...

类型检查：通过
```
