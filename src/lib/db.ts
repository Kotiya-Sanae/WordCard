import Dexie, { type Table } from 'dexie';

// 1. 定义数据接口

export interface WordLibrary {
  id: string; // 使用UUID
  name: string;
  createdAt: Date;
}

export interface Word {
  id: string; // 使用UUID
  libraryId: string;
  term: string; // 单词或短语
  phonetics: string[]; // 音标数组
  definitions: string[]; // 释义数组
  examples: string[]; // 独立的例句数组
  createdAt: Date;
  modifiedAt: Date;
}

export type WordStatus = 'new' | 'learning' | 'mastered';

export interface StudyRecord {
  id: string; // 使用UUID，与Word的ID相同
  wordId: string;
  // SRS 核心字段
  dueDate: Date; // 下次复习日期
  stability: number; // 稳定性 (记忆强度)
  difficulty: number; // 难度
  reviewCount: number;
  lastReviewAt?: Date;
  status: WordStatus;
  modifiedAt: Date;
}

export interface Setting {
  key: string;
  value: any;
}

// 2. 创建数据库类
class WordCardDB extends Dexie {
  wordLibraries!: Table<WordLibrary>;
  words!: Table<Word>;
  studyRecords!: Table<StudyRecord>;
  settings!: Table<Setting>;

  constructor() {
    super('WordCardDB');
    this.version(1).stores({
      wordLibraries: '&id, name',
      words: '&id, libraryId, term',
      studyRecords: '&id, wordId, dueDate, status',
    });
    // 升级版本以添加新表
    this.version(2).stores({
      settings: '&key',
    });
    // 升级版本以修改 words 表
    this.version(3).stores({
      words: '&id, libraryId, term, *phonetics, *definitions, *examples', // 为数组添加索引
    }).upgrade(tx => {
      // 迁移函数：将旧的 string 字段转换为 string[]
      return tx.table('words').toCollection().modify(word => {
        word.phonetics = word.phonetic ? [word.phonetic] : [];
        word.definitions = word.definition ? [word.definition] : [];
        word.examples = word.example ? [word.example] : [];
        delete word.phonetic;
        delete word.definition;
        delete word.example;
      });
    });
    // 升级版本以添加 studyRecords 索引
    this.version(4).stores({
      studyRecords: '&id, wordId, dueDate, status, lastReviewAt',
    });
  }
}

// 3. 实例化并导出
export const db = new WordCardDB();

// 4. (可选) 添加一些种子数据用于开发
export async function populate() {
  const libraryId = 'c8a3e5e6-3d5b-4f8e-9c1a-2b3d4e5f6a7b';
  
  // 检查是否已有数据，避免重复添加
  const count = await db.words.count();
  if (count > 0) {
    console.log("Database already populated.");
    return;
  }

  await db.transaction('rw', db.wordLibraries, db.words, db.studyRecords, db.settings, async () => {
    // 添加默认设置
    await db.settings.bulkPut([
      { key: 'dailyGoal', value: 20 },
    ]);

    await db.wordLibraries.add({
      id: libraryId,
      name: '默认词库',
      createdAt: new Date(),
    });

    const mockWords = [
      { term: 'ephemeral', phonetics: ['/ɪˈfɛm(ə)rəl/'], definitions: ['adj. 短暂的, 瞬息的'], examples: ['The ephemeral beauty of the cherry blossoms.'] },
      { term: 'serendipity', phonetics: ['/ˌsɛrənˈdɪpɪti/'], definitions: ['n. 意外发现美好事物的能力'], examples: ['We all have experienced the serendipity of relevant information arriving just when we were least expecting it.'] },
      { term: 'eloquent', phonetics: ['/ˈɛləkwənt/'], definitions: ['adj. 雄辩的，有口才的'], examples: ['An eloquent speech.'] },
    ];

    for (const w of mockWords) {
      const wordId = crypto.randomUUID();
      await db.words.add({
        id: wordId,
        libraryId: libraryId,
        term: w.term,
        phonetics: w.phonetics,
        definitions: w.definitions,
        examples: w.examples,
        createdAt: new Date(),
        modifiedAt: new Date(),
      });

      await db.studyRecords.add({
        id: crypto.randomUUID(),
        wordId: wordId,
        dueDate: new Date(), // 立即可以学习
        stability: 0,
        difficulty: 0,
        reviewCount: 0,
        status: 'new',
        modifiedAt: new Date(),
      });
    }
  });

  console.log('Database populated with initial data.');
}