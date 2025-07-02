import Dexie, { type Table } from 'dexie';
import { triggerSync } from './sync-manager';

// 全局的“静音开关”
export let isSyncingFromRealtime = false;
export const setSyncingFromRealtime = (value: boolean) => { isSyncingFromRealtime = value; };

// 1. 定义数据接口

export interface WordLibrary {
  id:string;
  userId: string;
  name: string;
  description?: string;
  category?: '用户' | '内置';
  wordCount?: number;
  createdAt: Date;
}

export interface Word {
  id: string;
  userId: string;
  libraryId: string;
  term: string;
  phonetics: string[];
  definitions: string[];
  examples: string[];
  createdAt: Date;
  modifiedAt: Date;
}

export type WordStatus = 'new' | 'learning' | 'mastered';

export interface StudyRecord {
  id: string;
  wordId: string;
  userId: string;
  dueDate: Date;
  stability: number;
  difficulty: number;
  reviewCount: number;
  lastReviewAt?: Date;
  status: WordStatus;
  modifiedAt: Date;
}

export interface Setting {
  key: string;
  value: any;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'insert' | 'update' | 'delete';
  tableName: 'words' | 'studyRecords' | 'settings' | 'wordLibraries' | 'tags' | 'wordTags';
  payload: any;
  status: 'pending' | 'syncing' | 'failed';
  attempts: number;
  createdAt: Date;
}

export interface Tag {
  id: string; // uuid
  userId: string;
  name: string;
  createdAt: Date;
}

export interface WordTag {
  id: string; // uuid
  wordId: string;
  tagId: string;
  userId: string;
}

// 2. 创建数据库类
class WordCardDB extends Dexie {
  wordLibraries!: Table<WordLibrary>;
  words!: Table<Word>;
  studyRecords!: Table<StudyRecord>;
  settings!: Table<Setting>;
  syncQueue!: Table<SyncQueueItem>;
  tags!: Table<Tag>;
  wordTags!: Table<WordTag>;

  constructor() {
    super('WordCardDB');
    this.version(1).stores({
      wordLibraries: '&id, name',
      words: '&id, libraryId, term',
      studyRecords: '&id, wordId, dueDate, status',
    });
    this.version(2).stores({
      settings: '&key',
    });
    this.version(3).stores({
      words: '&id, libraryId, term, *phonetics, *definitions, *examples',
    }).upgrade(tx => {
      return tx.table('words').toCollection().modify(word => {
        word.phonetics = word.phonetic ? [word.phonetic] : [];
        word.definitions = word.definition ? [word.definition] : [];
        word.examples = word.example ? [word.example] : [];
        delete word.phonetic;
        delete word.definition;
        delete word.example;
      });
    });
    this.version(4).stores({
      studyRecords: '&id, wordId, dueDate, status, lastReviewAt',
    });
    this.version(5).stores({
      syncQueue: '++id, status',
    });
    this.version(6).stores({
      wordLibraries: '&id, name, category',
    });
    this.version(7).stores({
      tags: '&id, &name',
      wordTags: '++id, &[wordId+tagId], wordId, tagId',
    });

    this.on('ready', () => {
      this.words.hook('creating', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'insert', tableName: 'words', payload: obj, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.words.hook('updating', async (modifications, primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'update', tableName: 'words', payload: { id: primKey, changes: modifications }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.words.hook('deleting', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'delete', tableName: 'words', payload: { id: primKey }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });

      this.studyRecords.hook('creating', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'insert', tableName: 'studyRecords', payload: obj, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.studyRecords.hook('updating', async (modifications, primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'update', tableName: 'studyRecords', payload: { id: primKey, changes: modifications }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.studyRecords.hook('deleting', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'delete', tableName: 'studyRecords', payload: { id: primKey }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });

      this.wordLibraries.hook('creating', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'insert', tableName: 'wordLibraries', payload: obj, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.wordLibraries.hook('updating', async (modifications, primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'update', tableName: 'wordLibraries', payload: { id: primKey, changes: modifications }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.wordLibraries.hook('deleting', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'delete', tableName: 'wordLibraries', payload: { id: primKey }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });

      this.tags.hook('creating', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'insert', tableName: 'tags', payload: obj, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.tags.hook('updating', async (modifications, primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'update', tableName: 'tags', payload: { id: primKey, changes: modifications }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.tags.hook('deleting', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'delete', tableName: 'tags', payload: { id: primKey }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });

      this.wordTags.hook('creating', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'insert', tableName: 'wordTags', payload: obj, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
      this.wordTags.hook('deleting', async (primKey, obj, trans) => {
        if (isSyncingFromRealtime) return;
        await db.syncQueue.add({ operation: 'delete', tableName: 'wordTags', payload: { id: primKey }, status: 'pending', attempts: 0, createdAt: new Date() });
        triggerSync();
        return undefined;
      });
    });
  }
}

export const db = new WordCardDB();

export async function populate() {
  const libraryId = 'c8a3e5e6-3d5b-4f8e-9c1a-2b3d4e5f6a7b';
  
  const count = await db.words.count();
  if (count > 0) {
    console.log("Database already populated.");
    return;
  }

  await db.transaction('rw', db.wordLibraries, db.words, db.studyRecords, db.settings, async () => {
    await db.settings.bulkPut([
      { key: 'dailyGoal', value: 20 },
    ]);

    await db.wordLibraries.add({
      id: libraryId,
      userId: 'dev-user-id', // a placeholder for development
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
        userId: 'dev-user-id',
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
        userId: 'dev-user-id',
        dueDate: new Date(),
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