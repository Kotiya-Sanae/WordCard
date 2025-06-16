# 单词卡片应用 (WordCard) - 技术方案文档

## 1. 项目概述

本项目旨在开发一款基于Web技术的单词卡片移动应用。应用的核心功能是帮助用户通过卡片翻转和间隔重复系统（Spaced Repetition System, SRS）高效地学习和记忆单词。项目初期将以一个功能完善的渐进式Web应用（PWA）为目标，并具备通过Capacitor打包成原生iOS和Android应用的能力。

**核心特性:**
- 单词卡片学习与翻转动画
- 基于SRS的智能复习计划
- 用户自定义词库与单词添加
- 学习进度与统计数据可视化
- 完整的离线使用能力
- 跨设备数据同步

## 2. 技术栈

为了构建一个现代化、高性能且可维护的应用，我们选用以下技术栈：

- **框架**: [Next.js](https://nextjs.org/) (App Router) - 提供服务器端渲染、静态站点生成、路由和API等功能。
- **UI库**: [React](https://react.dev/) - 用于构建用户界面的核心库。
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 一个工具类优先的CSS框架，用于快速构建自定义设计。
- **组件库**: [Shadcn UI](https://ui.shadcn.com/) - 一套可复用、可访问的组件集合，与Tailwind CSS深度集成。
- **图标**: [Lucide React](https://lucide.dev/) - 简洁、一致的开源图标库。
- **代码格式化**: [Prettier](https://prettier.io/) - 保证代码风格一致性。
- **后端服务 (BaaS)**: [Supabase](https://supabase.com/) - 提供PostgreSQL数据库、用户认证、即时API和实时数据同步功能。
- **客户端数据库**: [Dexie.js](https://dexie.org/) - 一个对浏览器IndexedDB的友好封装，用于实现本地优先和离线功能。
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs/) - 一个轻量、快速的全局状态管理库。
- **打包工具**: [Capacitor](https://capacitorjs.com/) - 用于将Web应用打包成原生移动应用。

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

### 4.1. Supabase (PostgreSQL) 数据表

```sql
-- 用户表 (由Supabase Auth自动管理)
-- public.users

-- 词库表
CREATE TABLE word_libraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 单词表
CREATE TABLE words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    library_id UUID REFERENCES word_libraries(id) ON DELETE CASCADE,
    term TEXT NOT NULL, -- 单词或短语
    phonetic TEXT, -- 音标
    definition TEXT NOT NULL, -- 释义
    example TEXT, -- 例句
    created_at TIMESTAMPTZ DEFAULT now(),
    -- 用于同步
    last_modified_at TIMESTAMPTZ DEFAULT now()
);

-- 学习记录表 (SRS核心)
CREATE TABLE study_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    word_id UUID REFERENCES words(id) ON DELETE CASCADE,
    -- SRS 核心字段
    due_date TIMESTAMPTZ NOT NULL, -- 下次复习日期
    stability INT NOT NULL DEFAULT 0, -- 稳定性 (记忆强度)
    difficulty INT NOT NULL DEFAULT 0, -- 难度
    review_count INT NOT NULL DEFAULT 0,
    last_review_at TIMESTAMPTZ,
    -- 状态: 0:待学习, 1:学习中, 2:已掌握
    status INT NOT NULL DEFAULT 0, 
    -- 用于同步
    last_modified_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2. Dexie.js (IndexedDB) 表定义

```typescript
// src/lib/db.ts
import Dexie, { Table } from 'dexie';

export interface WordLibrary {
  id: string;
  name: string;
  // ...
}

export interface Word {
  id: string;
  library_id: string;
  term: string;
  phonetic?: string;
  definition: string;
  example?: string;
  last_modified_at: Date;
}

export interface StudyRecord {
  id: string;
  word_id: string;
  due_date: Date;
  stability: number;
  difficulty: number;
  review_count: number;
  last_review_at?: Date;
  status: 0 | 1 | 2;
  last_modified_at: Date;
}

class WordCardDB extends Dexie {
  wordLibraries!: Table<WordLibrary>;
  words!: Table<Word>;
  studyRecords!: Table<StudyRecord>;

  constructor() {
    super('WordCardDB');
    this.version(1).stores({
      wordLibraries: '&id, name',
      words: '&id, library_id, term',
      studyRecords: '&id, word_id, due_date, status',
    });
  }
}

export const db = new WordCardDB();
```

## 5. 组件化方案

基于UI设计稿，项目组件结构规划如下：

```
src/
└── components/
    ├── layout/
    │   ├── Header.tsx         # 应用头部，包含标题和设置入口
    │   └── BottomNav.tsx      # 底部导航栏
    ├── home/
    │   ├── DailyProgress.tsx  # 每日学习进度条
    │   └── FlashcardPlayer.tsx# 单词卡片播放器，管理卡片状态
    │       └── Flashcard.tsx  # 单词卡片本身，处理翻转动画
    ├── library/
    │   ├── WordList.tsx       # 词库列表
    │   └── WordListItem.tsx   # 列表中的单个单词条目
    ├── add/
    │   └── AddWordForm.tsx    # 添加/编辑单词的表单
    ├── stats/
    │   ├── StatsSummary.tsx   # 统计总览卡片
    │   ├── WeeklyChart.tsx    # 每周学习趋势图
    │   └── MasteryPieChart.tsx# 掌握程度分布图
    └── ui/                    # Shadcn UI 组件
        ├── button.tsx
        ├── card.tsx
        └── ...
```

## 6. 路由规划 (Next.js App Router)

```
src/
└── app/
    ├── (main)/                # 主应用路由组，共享布局
    │   ├── layout.tsx         # 主布局，包含Header和BottomNav
    │   ├── page.tsx           # 首页 (学习)
    │   ├── library/
    │   │   └── page.tsx       # 词库页面
    │   ├── add/
    │   │   └── page.tsx       # 添加单词页面
    │   ├── stats/
    │   │   └── page.tsx       # 学习统计页面
    │   └── settings/
    │       └── page.tsx       # 设置页面
    ├── auth/                  # 认证相关页面
    │   └── ...
    └── layout.tsx             # 根布局
```

## 7. 核心功能实现思路

### 7.1. 间隔重复系统 (SRS)
- **算法**: 可以实现一个简化的FSRS（Free Spaced Repetition Scheduler）或类似Anki的SM-2算法。
- **核心逻辑**:
  1. 当用户对一个单词卡片做出反应（例如：`Again`, `Hard`, `Good`, `Easy`）。
  2. 根据用户的选择，更新该单词的`stability`（记忆稳固度）和`difficulty`（难度）。
  3. 基于新的`stability`和`difficulty`，计算出下一次最佳的复习日期 (`due_date`)。
  4. 将更新后的`StudyRecord`保存到Dexie.js，并触发后台同步至Supabase。
- **实现**: 在 `src/lib/srs.ts` 中封装SRS算法逻辑。

### 7.2. 数据同步
- **上行 (Local -> Cloud)**:
  - 使用Dexie.js的`"creating"`, `"updating"`, `"deleting"`钩子函数。
  - 当本地数据发生变化时，将变更记录到一个“待同步队列”表中。
  - 使用Web Workers或Service Workers定期检查队列，并将变更通过Supabase API推送到云端。
- **下行 (Cloud -> Local)**:
  - 使用Supabase的实时订阅功能 (`realtime-js`)。
  - 订阅`words`, `study_records`等表的变化。
  - 收到云端变更后，与本地数据进行比对（基于`last_modified_at`时间戳），并更新本地Dexie.js数据库。

## 8. 开发阶段规划

1.  **阶段一：项目初始化与基础搭建 (1周)**
    - [ ] 初始化Next.js项目，集成Tailwind CSS, Prettier, Shadcn UI。
    - [ ] 设置Supabase项目，定义数据库表结构。
    - [ ] 搭建基本的路由和页面布局 (`layout.tsx`, `BottomNav.tsx`)。

2.  **阶段二：核心学习功能 (2周)**
    - [ ] 实现`Flashcard`组件的翻转效果。
    - [ ] 实现`FlashcardPlayer`组件，用于加载和管理当前学习队列。
    - [ ] 在`src/lib/srs.ts`中实现SRS算法。
    - [ ] 集成Dexie.js，实现单词和学习记录的本地存取。
    - [ ] 完成首页的核心学习闭环。

3.  **阶段三：词库管理与数据同步 (2周)**
    - [ ] 完成“词库”页面，展示所有单词列表。
    - [ ] 完成“添加/编辑单词”页面和表单。
    - [ ] 实现Supabase用户认证。
    - [ ] 实现本地Dexie.js与云端Supabase之间的数据同步逻辑。

4.  **阶段四：统计与PWA (1周)**
    - [ ] 完成“学习统计”页面，包括图表的可视化。
    - [ ] 配置`next-pwa`插件，使应用具备PWA能力（可安装、离线缓存）。

5.  **阶段五：打包与发布 (1周)**
    - [ ] 集成Capacitor，将Web应用打包成iOS和Android项目。
    - [ ] 在Xcode和Android Studio中进行调试和构建。
    - [ ] 准备应用商店上架材料。