# 单词卡片应用 (WordCard) - 技术方案文档 (v2.0)

## 1. 项目概述

本项目旨在开发一款基于Web技术的单词卡片移动应用。应用的核心功能是帮助用户通过卡片翻转和间隔重复系统（Spaced Repetition System, SRS）高效地学习和记忆单词。项目初期将以一个功能完善的渐进式Web应用（PWA）为目标，并具备通过Capacitor打包成原生iOS和Android应用的能力。

**核心特性:**
- 单词卡片学习与翻转动画
- 基于SRS的智能复习计划
- 用户自定义词库与单词添加、编辑、删除
- 学习进度与统计数据可视化
- 完整的离线使用能力
- 跨设备数据同步

## 2. 技术栈

为了构建一个现代化、高性能且可维护的应用，我们选用以下技术栈：

- **框架**: [Next.js](https://nextjs.org/) **v15** (App Router)
- **UI库**: [React](https://react.dev/) **v19**
- **样式**: [Tailwind CSS](https://tailwindcss.com/) **v4**
- **组件库**: [Shadcn UI](https://ui.shadcn.com/)
- **通知组件**: [Sonner](https://sonner.emilkowal.ski/) (Toast)
- **图表库**: [Recharts](https://recharts.org/) (通过 Shadcn Chart 封装)
- **图标**: [Lucide React](https://lucide.dev/)
- **代码格式化**: [Prettier](https://prettier.io/)
- **后端服务 (BaaS)**: [Supabase](https://supabase.com/)
  - **认证库**: **`@supabase/ssr`**
- **客户端数据库**: [Dexie.js](https://dexie.org/)
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs/)
- **打包工具**: [Capacitor](https://capacitorjs.com/)

## 3. 架构设计：本地优先 (Local-First)

为了提供极致的用户体验（即时响应、离线可用），我们将采用本地优先架构。

```mermaid
graph LR
    subgraph 用户设备 (浏览器/原生App)
        A[Next.js/React 应用]
        B[Dexie.js (IndexedDB)]
        A -- "所有读写操作 (极速, 离线)" --> B
    end

    subgraph 云端
        C[Supabase (PostgreSQL)]
    end

    B -- "数据同步 (需要网络)" -- C

    style B fill:#dbeafe,stroke:#3b82f6,stroke-width:2px
    style C fill:#dcfce7,stroke:#16a34a,stroke-width:2px
```

**工作流程:**
1.  **用户认证**: 用户通过Supabase Auth进行登录/注册。
2.  **首次数据拉取**: 登录后，应用从Supabase拉取该用户的全部单词、词库和学习记录。
3.  **本地存储**: 拉取的数据完整地存入客户端的Dexie.js数据库中。
4.  **本地操作**: 应用的所有日常操作（学习、添加、修改单词）都直接与本地的Dexie.js数据库交互，实现零延迟。
5.  **后台同步**:
    - **上行同步**: 当本地数据发生变更时，一个后台服务会将这些变更推送至Supabase。
    - **下行同步**: 应用通过Supabase的实时订阅功能监听云端变化。若用户在其他设备上做了修改，当前设备会自动接收更新并写入本地Dexie.js。

## 4. 数据模型

### 4.1. Dexie.js (IndexedDB) 表定义

我们采用简化的扁平化数组结构，以平衡简单性和扩展性。

```typescript
// src/lib/db.ts

// 单词接口
export interface Word {
  id: string;
  libraryId: string;
  term: string;
  phonetics: string[];   // 音标数组
  definitions: string[]; // 释义数组
  examples: string[];    // 独立的例句数组
  createdAt: Date;
  lastModifiedAt: Date;
}

// 其他接口... (WordLibrary, StudyRecord, Setting)

// 数据库定义
class WordCardDB extends Dexie {
  // ...
  constructor() {
    super('WordCardDB');
    // 版本链
    this.version(1).stores({ /* 初始 schema */ });
    this.version(2).stores({ /* 添加 settings 表 */ });
    this.version(3).stores({ /* 修改 words 表 */ }).upgrade(/* ... */);
    this.version(4).stores({ /* 为 studyRecords 添加索引 */ });
  }
}
```

### 4.2. Supabase (PostgreSQL) 数据表
Supabase 的表结构将与 Dexie.js 的接口保持一致，但字段类型会映射为 PostgreSQL 类型（例如 `string[]` -> `TEXT[]`）。

## 5. 组件化方案

项目组件结构已演变为：
```
src/
└── components/
    ├── add/
    │   └── AddWordForm.tsx      # 可复用的添加/编辑表单
    ├── home/
    │   ├── DailyProgress.tsx
    │   ├── Flashcard.tsx
    │   └── FlashcardPlayer.tsx
    ├── layout/
    │   ├── BottomNav.tsx
    │   ├── Header.tsx
    │   └── ThemeToggle.tsx
    ├── library/
    │   └── WordList.tsx         # 包含列表项和多选逻辑
    ├── settings/
    │   └── (多个具体设置组件)
    ├── stats/
    │   ├── MasteryPieChart.tsx
    │   └── StatsSummary.tsx
    ├── ui/                      # Shadcn UI 组件
    └── (providers)/
        ├── db-provider.tsx
        └── theme-provider.tsx
```

## 6. 路由规划 (Next.js App Router)

路由结构已演变为包含动态路由和嵌套布局的复杂结构：
```
src/
└── app/
    ├── page.tsx           # 首页
    ├── add/page.tsx
    ├── library/
    │   ├── page.tsx
    │   └── [id]/edit/page.tsx # 动态编辑页
    ├── stats/page.tsx
    └── settings/
        ├── layout.tsx         # 设置页的共享布局
        ├── page.tsx           # 设置主页
        ├── appearance/page.tsx
        ├── learning/page.tsx
        ├── data/page.tsx
        ├── developer/page.tsx
        └── about/page.tsx
```

## 7. 开发阶段回顾与展望

### **阶段一：本地单机版开发 (已完成)**

-   **[✔] 初始化与基础搭建**: 完成了项目初始化、技术栈选型与配置、依赖问题解决。
-   **[✔] UI框架与组件**: 搭建了完整的移动端UI框架，实现了黑暗模式、Toast通知，并构建了所有核心UI组件。
-   **[✔] 核心学习功能**: 实现了基于SRS算法的智能学习循环。
-   **[✔] 词库管理**: 实现了完整的单词增、删、改、查（CRUD）功能，以及高效的多选批量管理。
-   **[✔] 数据统计**: 实现了动态的数据总览和掌握程度可视化图表。
-   **[✔] 应用设置**: 实现了可扩展的设置页面，包括外观、学习、数据管理、开发者模式和关于页面。
-   **[✔] 数据模型**: 建立了健壮的客户端数据库，并成功完成了一次数据模型升级和迁移。

### **阶段二：云同步与用户系统 (已完成)**

-   **[✔] 实现Supabase用户认证**:
    - [✔] 创建了登录、注册页面，并使用 `@supabase/ssr` 实现了完整的用户认证流程。
    - [✔] 实现了基于Email的密码认证和邮件确认流程。
-   **[✔] 配置数据库行级安全 (RLS)**:
    - [✔] 为所有用户数据表（`word_libraries`, `words`, `study_records`, `settings`）编写并启用了RLS策略。
    - [✔] 通过数据库触发器，实现了新用户注册时自动创建默认词库的功能。
-   **[✔] 实现数据同步服务**:
    - [✔] **首次下行同步**: 实现了用户首次登录时，从云端拉取其全部数据到本地的功能。
    - [✔] **上行增量同步**: 利用 Dexie.js 钩子，将本地所有写操作（增、删、改）记录到同步队列。
    - [✔] **离线支持**: 实现了同步处理器，可在设备恢复在线时，自动、可靠地将队列中的变更推送到云端。
    - [ ] **实时下行同步**: 因本地开发环境限制，无法测试功能，因此回退到实现之前，待部署后验证。

### **阶段三：打包与发布 (未来)**
-   **[ ] PWA优化**: 完善 `manifest.json` 和 Service Worker 缓存策略。
-   **[ ] Capacitor打包**: 将应用打包成iOS和Android原生App。