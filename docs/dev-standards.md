# dsh-workspace 开发规范摘要

> 本文档从 `deepseek-harness` 仓库的官方文档中提炼，作为 **dsh-workspace** 独立插件开发的规范参考。
> 源文档：`docs/cookbook/extension-cookbook.zh.md`、`docs/cookbook/adding-a-package.zh.md`、`docs/subsystems/client-modules.zh.md`、`packages/client/AGENTS.md`。
> 适用对象：在 DSH 生态内开发的 **host 端插件**（Node）与 **client 端插件**（浏览器 Web GUI）。

---

## 1. 插件形态总览

DSH 是"一切皆插件"的 agent harness。扩展点通过 Cordis 的 `ctx.effect()` / `ctx.on()` 注册；**所有注册都返回 disposer**（随 fiber 释放自动清理，HMR 安全）。

| 插件类型 | 注册面 | 典型用途 |
|---|---|---|
| 工具插件 | `ctx.tools.register()`（`defineTool` 类型化或原生 JSON Schema） | 给模型暴露工具 |
| 钩子插件 | `ctx.on('tools/pre-execute', ...)` 等 waterfall 监听器 | 权限门禁、策略、拦截 |
| UI 插件 | `ctx.slots.register({...}, Component)` | 渲染 GUI 组件 |
| 外部协议驱动 | 对接 `ctx.agents`，协议请求映射为 `followup()`/`cancel()` | ACP/stdio 桥 |
| Web 客户端插件 | 声明 `dsh.client` + 导出 `./client` bundle | 浏览器侧 UI |

**dsh-workspace 定位**：同时是 host 插件（文件树/Git/终端/搜索 API 路由）与 client 插件（VSCode 风格工作台 UI）。

---

## 2. 项目结构规范（参考 `adding-a-package.md`）

### 2.1 目录骨架

```
dsh-workspace/
├── package.json          # 插件清单（name/version/exports/dsh.*/files）
├── tsconfig.json         # 编译配置（extends 基座）
├── tsconfig.build.json   # 类型声明产物（lib/types）
├── tsdown.config.ts      # host + client bundle 构建
├── cordis.patch.yml      # 可选：bundle patch 层（内置插件渠道）
├── dsh.plugin.json       # 外部插件注册表渠道（client.main）
├── src/
│   ├── index.ts          # host 插件入口（name/inject/apply/Config）
│   ├── invariant.ts      # 配套（真实 reason）
│   ├── context-types.ts  # Context 增强 + 服务面（host/client 共用）
│   └── client/           # 浏览器侧 UI（独立 bundle 入口）
└── tests/                # vitest 测试
```

### 2.2 package.json 不变式

- `"type": "module"`（ESM 优先）
- `main: "lib/index.js"`、`types: "lib/types/index.d.ts"`
- `exports` 必须包含：
  - `"."` → types + default
  - `"./invariant"` → 配套
  - `"./client"` → client bundle（`dsh.client` 扫描强制要求）
  - `"./src/*"` → 源码通道（消费方/工具用）
  - `"./package.json"`
- `@deepseek-ai/cordis` 同时出现在 peerDependencies 和 devDependencies（同范围）
- **每个 dsh peerDependency 都要在 devDependencies 中镜像**
- `files` 精确列出产物（`lib/index.js`、`lib/invariant.js`、`lib/client.js`、`lib/types/**/*.d.ts`；不发布 `src`、声明 map、JS map）
- 相对导入源码使用显式 `.ts` 后缀（编译后重写为 `.js`）

### 2.3 dsh.client 清单语义（client 插件）

```jsonc
"dsh": {
  "client": {
    "inject": ["@deepseek-ai/dsh-client-runtime", "..."],  // 信息性依赖边
    "platform": "web",                                     // 总是 'web'
    "immediately": true                                    // 仅 stage-one 预取基建行
  }
}
```

- `platform: 'web'` 固定；**必须**有 `./client` export（否则扫描抛错）
- `inject` 仅作 preflight 展示 / HMR diff，**不决定激活顺序**（激活顺序 = Cordis fiber 的 service 等待）
- `external`（非基线模块）会将其动态供应商排到消费方之前

---

## 3. Host 端插件规范

### 3.1 入口形态

```ts
export const name = 'dsh-workspace'        // 插件标识
export const inject = ['webServer', 'sessions', 'webRuntime', 'settings']  // 服务依赖
export function apply(ctx: Context, config?: WorkspaceConfig): void {
  // 1. 解析配置
  // 2. 注册路由（每个注册用 ctx.effect 包裹 → HMR 安全）
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/workspace/api',
    handler: async (req, res) => { /* ... */ },
  }), 'dsh-workspace: json api')
}
```

### 3.2 关键规范

| 规范 | 说明 |
|---|---|
| **注册即副作用** | 一切贡献走 `ctx.effect()` / `ctx.on()`；registry 的 `register()` 返回 disposer |
| **waterfall 必须 next()** | 瀑布监听器必须调用 `next()` 委托，否则短路整条链 |
| **能力缝完整** | 一条能力缝 = Service Definition / Provider / Consumer 三角色，只拆需要独立演进的角色 |
| **显式 > 隐式** | 跨包边界的默认值是 `resolve(request): Spec` 显式步骤，禁止在 `run()` 里隐藏 `?? default` |
| **无硬编码可调项** | 部署相关可调项必须是 `Config` 字段（cordis.yml 可改）；`DEFAULT_*` 常量不算可配置 |
| **失败要大声** | 自包含的误配置在加载时大声失败；否则在最早可解析点失败，绝不静默跳过 |
| **空 catch 必须说明** | 命名吞掉什么、为什么其他错误不可能到达；try 只包一个语句 |
| **工具 UI 意图** | 工具设计时就定 `generic`/`terminal`/`diff`/`locations` 渲染意图 |

### 3.3 Web 路由信任栅栏（重要）

外部插件提供的浏览器 HTTP 路由必须与 `/api` 网关同源信任策略：
- 校验 Host 头为 loopback 或 `trustedHosts`（`ctx.webRuntime.trustedHosts`，boot 时采样 LAN IP 字面量 + `--trusted-host`）
- 未通过 → 403
- 每个请求实时读取 live service value（替换列表立即生效，无需重启）

---

## 4. Client 端插件规范（Web GUI）

来源：`packages/client/AGENTS.md`（浏览器侧硬性规则）

### 4.1 组合模型：slot 纪律

1. **单一 API**：插件只能通过 `ctx.slots.register({ name, children?, store?, inject? }, Component)` 组合 UI；没有其他插槽定义入口。只有 shell 渲染 `'root'`。
2. **children = 声明 + 授权**：组件渲染的 slot 必须恰好是自己 `register` 的 `children` keys。渲染未声明的 slot、或声明别人已声明的 slot → 加载失败（不要绕过，冲突即设计）。
3. **插槽命名**：`<domain>.<entry>.<hole>`（如 `'tool.call.toolview'`）。
4. **组件 props = 四个 share（全部派生）**：
   - `PropsRuntime<K>`（owner params + session scope 的 `useSession`/`sessionId` + 全局 `useSessions`/`useWorkspaces`）
   - `PropsRenderSlots<S>`（children keys）
   - `PropsStore<H>`（store factory）
   - inject face
   - 绝不手写 share 已派生的成员
5. **Hook 只能框架制造**：`useSession`/`useSessions`/`useWorkspaces`/`useStore`/`renderSlot` 五个常设席位 + renderer 绑定的 `use<Name>`。业务代码不创建 hook/selector 作为 prop 值。
6. **实时数据三通道**：
   - 父级知道 → renderSlot 站点的 owner props
   - 仅组件知道 → 本地 state
   - 跨 entry 共享 / 重挂载存活 → register 时声明的 store
7. **Store 纪律**：
   - 读 `props.useStore`，写 `props.actions.*`（actions 是完整变更 API）
   - store 写成导出的 `createXXXStore()` 工厂（**禁止模块级单例**）
   - 生产代码绝不在 `apply` 外调用工厂/`.create()`；测试可以（零机制路径）
   - 多个 register 共享一个 store handle：在 `apply` 内创建后传入
8. **inject 只返回纯数据和回调**：无手写 hook、无 ReactNode 生产者、无整个 service 对象。注册私有响应式事实用保留的 `hooks` compartment。

### 4.2 响应式读取与契约纪律

- **渲染读到的任何"会变"的数据都必须来自框架 hook**；事件处理器可读 live snapshot
- 业务组件**不包含订阅机制**（无 `useSyncExternalStore`、无手动 subscribe、无镜像快照到本地 state）
- **数据访问阶梯**：框架 hooks → 声明 store → inject 回调 → 新框架扩展点（需仲裁）
- UI 域之间只共享 JSON 兼容数据和回调；ReactNode 内容走 slot

### 4.3 新组件清单

1. 通过 register 组合：slot 加入 `SlotMap` → 父 entry `children` 声明 → 注册组件
2. props 用四 share 类型（派生，不手写）
3. 组件测试直接喂 props（`createXXXStore().create()` 造 store 数据；框架 hooks 用 stub）
4. **token 只在 CSS；中文产品文案；英文注释**
5. 非平凡变更需 Agent Note

---

## 5. 客户端模块系统（`client-modules.md`）

- `ctx.clientModules`（`ClientModuleRegistry`）扫描宿主 Loader 的 entry，找出声明 `dsh.client` 的包
- 组合出 `window.__DSH_BOOT__` entry 图，在 `/plugins/<id>/client.js?rev=` 提供 bundle
- 经 index 转换注入启动 manifest；无有效 manifest 的页面无法启动（大声抛错）
- `rev` = bundle 内容哈希，作缓存失效锚点
- 包元数据按名缓存永不过期：**插件集合变更在重启后生效**（dsh-workspace 发布新版需重装/重启）

---

## 6. 构建与验证命令

```sh
pnpm install              # 安装依赖（workspace）
pnpm run build            # tsc 类型 + tsdown bundle（host lib + client bundle）
pnpm run typecheck        # tsc --noEmit
pnpm run test             # vitest 单元测试
pnpm run lint             # 代码检查
```

仓库内（作为 monorepo 包时）：
```sh
pnpm run doc-sync
pnpm run constraints && pnpm run typecheck && pnpm run lint
pnpm run build && pnpm run hygiene
```

**dsh-workspace 作为独立仓库**：`dsh --profile web add "file:./dsh-workspace"`（或 `github:owner/repo#branch`）安装；client bundle 变更后必须重新构建（registry 提供 `lib/client.js`，不是源码）。

---

## 7. dsh-workspace 落地要点（结合本项目）

1. **host 端**：`src/index.ts` 注册 `/workspace/api` 前缀路由（文件树/Git/终端/搜索），全部 `ctx.effect` 包裹 + trust-fence + session-scoped（cwd 从 session header 解析）
2. **client 端**：`src/client/index.tsx` 作为 bundle 入口，`apply(ctx)` 挂载 VSCode 风格工作台（活动栏/侧边栏/编辑器/对话/终端）
3. **独立窗口**：桌面端通过 `?dshWindow=workspace` 参数启动独立 BrowserWindow；client 检测参数后全屏挂载工作台，跳过主界面专属拦截
4. **对话区域**：保留原项目 `conversation` slot 渲染（复用 `ui-conversation`），工作台三栏：文件树 | 编辑 | 对话
5. **会话联动**：`sessions.list` 的 `current` 变化 → 工作台跟随切换 → 文件树按新会话 cwd 重拉
6. **性能**：避免每帧布局动画；大目录树虚拟滚动；懒加载 chunk（CodeMirror/xterm 走独立 bundle）；隐藏页面暂停时钟

---

## 8. 其他约定（来自根 AGENTS.md）

- 全程中文回复 / 中文产品文案；代码注释用英文
- 提交前跑相关检查；不默认全量套件
- 非平凡改动需 Agent Note（`.agents/notes/implemented/...` 三件套：`.md` + `.zh.md` + `.i18n.yaml`）
- 先提交再推送；向 fork push 不建 PR（`git push origin master`）
- `git diff --cached --check` 门禁（末尾恰好一个换行）
