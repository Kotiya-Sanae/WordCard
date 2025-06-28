# WordCard 应用开发 - 第三阶段规划：打包与发布

## 1. 第二阶段成果总结

我们已成功完成第二阶段的开发，将应用从一个本地单机版升级为了一个功能完备、支持云端备份和离线操作的“本地优先”网络服务。核心成果包括完整的用户认证系统和健壮的上下行数据同步功能。

---

## 2. 第三阶段目标：从 Web 应用到可分发产品

第三阶段的核心目标是将我们功能强大的 Web 应用，进行优化和打包，使其成为可以被用户轻松安装和使用的渐进式Web应用 (PWA) 和原生移动应用 (iOS/Android)。

---

## 3. 第三阶段开发任务分解

### 任务一：PWA (渐进式Web应用) 优化

**目标**: 确保应用可以被“添加到主屏幕”，并拥有类似原生应用的启动和离线体验。

- **子任务 1.1: 完善 Web App Manifest**
  - [ ] 详细配置 `public/manifest.json` 文件，包括 `short_name`, `name`, `icons` (提供512x512, 192x192等尺寸), `start_url`, `display: 'standalone'`, `background_color`, `theme_color`。

- **子任务 1.2: 配置 Service Worker 缓存策略**
  - [ ] (可选) 集成一个 Service Worker 库（如 `workbox`）来简化缓存管理。
  - [ ] 定义核心资源（应用 Shell：HTML, JS, CSS）的缓存策略，采用 `CacheFirst` 或 `StaleWhileRevalidate`。
  - [ ] 确保应用在离线状态下仍能从缓存中启动和运行。

### 任务二：Capacitor 打包

**目标**: 将我们的 Next.js 应用打包成可以在 iOS 和 Android 上运行的原生 App。

- **子任务 2.1: 集成 Capacitor 到项目中**
  - [ ] 安装 Capacitor CLI 和核心库: `npm install @capacitor/cli @capacitor/core`
  - [ ] 初始化 Capacitor 项目: `npx cap init [appName] [appId]`
  - [ ] 配置 `capacitor.config.ts`，将 `webDir` 指向 Next.js 的导出目录 (`out`)。
  - [ ] 修改 `package.json` 的 `build` 脚本为: `"build": "next build && next export"`。

- **子任务 2.2: 添加原生平台**
  - [ ] 添加 iOS 平台: `npx cap add ios`
  - [ ] 添加 Android 平台: `npx cap add android`
  - [ ] 同步 Web 资源到原生平台: `npx cap sync`

- **子任务 2.3: 原生功能集成 (可选，但推荐)**
  - [ ] **状态栏**: 使用 `@capacitor/status-bar` 插件，根据应用主题设置状态栏的样式，以实现沉浸式体验。
  - [ ] **启动画面**: 使用 `@capacitor/splash-screen` 插件，设计并配置一个美观的应用启动画面，取代默认的白屏。

### 任务三：部署后验证

**目标**: 在真实的托管环境中，验证并最终启用因本地开发环境限制而暂缓的功能。

- **子任务 3.1: 重新启用并测试实时下行同步**
  - [ ] **背景**: 由于 `localhost` 环境下的 `cookie` 策略限制，导致 WebSocket 连接失败，我们暂时移除了实时同步的代码。
  - [ ] **步骤**:
    1.  将应用部署到一个测试环境 (如 Vercel, Netlify)。
    2.  从 Git 历史中恢复 `src/components/sync-provider.tsx` 文件中与实时订阅相关的代码。
    3.  在真实的托管域名下，进行双浏览器（或双设备）测试，验证在一个设备上的操作能否被另一个设备实时接收并更新UI。
    4.  确认功能稳定后，将代码合并到主分支。