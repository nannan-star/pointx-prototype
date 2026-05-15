## 技术栈
  - React 18 + TypeScript + Vite
  - Tailwind CSS 4
  - shadcn/ui 组件库
  - 文件路由用 react-router

  ## 规范
  - 组件用函数式 + hooks
  - 样式只用 Tailwind class，不写 CSS 文件
  - 每个页面对应 src/pages/XxxPage.tsx
  - 公共组件放 src/components/
  - 不要用 any，给明确类型

  ## 表单字段联动规范
  新增或修改表单字段时，必须主动检查并同步以下所有相关位置（不需要每次都问用户）：
  1. **mock 数据**：Instance 接口类型定义 + mock 数据默认值
  2. **新增表单**：如 InstanceCreateDrawer
  3. **编辑表单**：如 InstanceEditDrawer、详情页内编辑抽屉
  4. **详情页展示**：如 InstanceDetailPage 基本信息区
  5. **表单宽度统一**：所有抽屉内的 Select / Input 统一使用 `w-[300px]`

  2. 迁移时的提示词结构

  每次让 AI 转换一个模块时，这样给：

  把下面的 HTML 页面转换为 React 组件。

  要求：
  - 用 shadcn/ui 替代原生表单元素
  - 样式用 Tailwind 还原，不需要像素级一致，保持布局和视觉层级即可
  - 拆分为合理的子组件
  - 保留原有的交互逻辑，用 useState/useEffect 实现

  原始文件：src/login.html（贴代码或让它读文件）
  输出到：src/pages/LoginPage.tsx

  3. 关键技巧

  - 一次只转一个页面/模块，别一次性丢整个项目
  - 先让 AI 搭好脚手架（路由、布局、导航），再逐页迁移
  - 把原始 HTML 文件留在项目里（比如放 legacy/ 目录），方便 AI 直接读取对照
  - 交互逻辑复杂的部分单独说明，比如"这个表格有筛选+分页，数据从这个 JSON mock 来"

  4. 迭代时的提示词

  迁移完之后日常改需求：

  修改 src/components/UserTable.tsx，新增一列"操作"，
  包含编辑和删除按钮，点击弹出确认弹窗。用 shadcn/ui 的 Dialog。

  文件路径 + 具体改动 + 用什么组件，AI 命中率最高。