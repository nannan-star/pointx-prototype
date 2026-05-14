# POINTX 控制台 · React 原型（pointx-prototype）

基于 Vite 的多租户**管理端 / 企业端**控制台界面原型：路由、布局、列表与抽屉交互为主，数据来自 `src/data/` 下的 **Mock**，**不接真实后端**。

---

## 技术栈

| 类别 | 说明 |
|------|------|
| 运行时 | React 18、TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`，主题变量见 `src/index.css`） |
| 组件 | 函数组件 + Hooks；UI 基座为 **shadcn/ui 风格**（`src/components/ui/`，底层多为 **Radix** + `radix-ui` / `@radix-ui/*`） |
| 路由 | React Router 6（`BrowserRouter`，声明式路由在 `src/App.tsx`） |
| 图标 | `lucide-react`（界面图标用 SVG，不用 emoji） |

路径别名：`@/*` → `src/*`（见 `vite.config.ts`、`tsconfig.app.json`）。

---

## 本地运行

**开发（推荐）**——需编译 TSX，请用 Vite：

```bash
npm install
npm run dev
```

默认一般为 `http://localhost:5173`（以终端输出为准）。

**生产构建与预览**

```bash
npm run build    # tsc -b 类型检查 + vite build，产物在 dist/
npm run preview  # 本地预览 dist
```

**不推荐**：对仓库根目录执行 `npx serve .` 或静态 `python -m http.server` **直接打开源码**——不会经过 Vite 编译，`*.tsx` 无法在浏览器中运行。若需静态托管，请 `npm run build` 后 **`serve dist`** 或 `npm run preview`。

---

## 目录结构（约定）

| 路径 | 作用 |
|------|------|
| `src/main.tsx` | 入口：挂载 `BrowserRouter`、`DemoPersonaProvider`、`App` |
| `src/App.tsx` | 全局路由：`/admin/*`、`/client/*`、未匹配路径重定向 |
| `src/layouts/` | `AdminLayout`、`ClientLayout`（侧栏 + 顶栏 + `<Outlet />`） |
| `src/pages/` | 页面组件，如 `admin/*Page.tsx`、`client/*Page.tsx` |
| `src/components/` | 可复用业务组件（抽屉、表格行、筛选条等） |
| `src/components/ui/` | 通用 UI 原语（Button、Table、Dialog、Tooltip…） |
| `src/context/` | 全局 React Context（如演示视角 `DemoPersonaContext`） |
| `src/lib/` | 与页面解耦的工具与常量（如 `cn()`、`demo-persona`） |
| `src/data/` | Mock 数据与类型，供列表/详情引用 |
| `legacy/` | 旧版静态原型（HTML/JS/CSS），仅对照用，不参与 Vite 构建 |

更细的协作规范见仓库根目录 **`CLAUDE.md`**。

---

## 路由与入口

- **管理端**：`/admin`，默认重定向到 `/admin/instances`；子路由含资源中心、交易中心、配置中心、系统管理、个人中心等（见 `App.tsx`）。
- **企业端**：`/client`，默认重定向到 `/client/dashboard`。
- **未匹配路径**（`*`）：根据 `sessionStorage` 中保存的**演示角色**跳转到对应首页（`lib/demo-persona.ts` + `DemoEntryRedirect`）。

当前原型**无独立登录页**；侧栏「退出登录」等行为跳转至管理端演示入口（以 `AdminLayout` / `ClientLayout` 实现为准）。

---

## 演示视角（非鉴权）

顶栏 **「当前视角」** 用于在「管理员、新加坡智联、欧洲智联」等演示身份之间切换，并写入 `sessionStorage`（选项定义见 `src/lib/demo-persona.ts`）。  
**不是真实登录态**，仅用于切换壳层与部分列表口径（如企业端 `SdkResourcesPage` 的 `isClientView`）。

---

## 新增页面（简要）

1. 在 `src/pages/` 增加页面组件。  
2. 在 `src/App.tsx` 的 `/admin` 或 `/client` 下增加 `<Route>`。  
3. 在对应 `layouts/*Layout.tsx` 的导航配置中加入菜单项。  
4. 需要列表数据时在 `src/data/` 增加或扩展 Mock，并保持类型明确（避免 `any`）。

---

## 常见问题

**Q：改完代码页面没变化？**  
确认使用的是 `npm run dev` 打开的 Vite 地址，而不是对根目录做静态托管。

**Q：类型检查失败？**  
`npm run build` 会跑 `tsc -b`，需先通过再谈发布产物。

---

## 许可证

私有项目（`package.json` 中 `"private": true`）。具体许可证以仓库所有者为准。
