import { createClient } from '@/utils/supabase/client';
import { db } from './db';
import { toast } from 'sonner';
import { triggerSync } from './sync-manager';

/**
 * 执行实际的下行同步逻辑。
 */
async function performSync(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("用户未登录，无法同步。");
  }

  console.log("开始下行同步...");

  const [
    librariesRes,
    wordsRes,
    recordsRes,
    settingsRes
  ] = await Promise.all([
    supabase.from('word_libraries').select('*'),
    supabase.from('words').select('*'),
    supabase.from('study_records').select('*'),
    supabase.from('settings').select('*')
  ]);

  if (librariesRes.error) throw librariesRes.error;
  if (wordsRes.error) throw wordsRes.error;
  if (recordsRes.error) throw recordsRes.error;
  if (settingsRes.error) throw settingsRes.error;

  const wordLibraries = librariesRes.data?.map(lib => ({
    id: lib.id,
    name: lib.name,
    createdAt: new Date(lib.created_at),
    modifiedAt: new Date(lib.modified_at),
    userId: lib.user_id,
  }));

  const words = wordsRes.data?.map(w => ({
    id: w.id,
    libraryId: w.library_id,
    term: w.term,
    phonetics: w.phonetics,
    definitions: w.definitions,
    examples: w.examples,
    createdAt: new Date(w.created_at),
    modifiedAt: new Date(w.modified_at),
    userId: w.user_id,
  }));

  const studyRecords = recordsRes.data?.map(r => ({
    id: r.id,
    wordId: r.word_id,
    dueDate: new Date(r.due_date),
    stability: r.stability,
    difficulty: r.difficulty,
    reviewCount: r.review_count,
    lastReviewAt: r.last_review_at ? new Date(r.last_review_at) : undefined,
    status: r.status,
    modifiedAt: new Date(r.modified_at),
    userId: r.user_id,
  }));

  const settings = settingsRes.data?.map(s => ({
    key: s.key,
    value: s.value,
    userId: s.user_id,
  }));

  console.log(`数据转换完成：获取到 ${wordLibraries?.length} 个词库, ${words?.length} 个单词, ${studyRecords?.length} 条记录, ${settings?.length} 个设置。`);

  await db.transaction('rw', db.wordLibraries, db.words, db.studyRecords, db.settings, async () => {
    console.log("清空本地数据表...");
    await Promise.all([
      db.wordLibraries.clear(),
      db.words.clear(),
      db.studyRecords.clear(),
      db.settings.clear(),
    ]);

    console.log("批量写入新数据到本地...");
    await Promise.all([
      db.wordLibraries.bulkPut(wordLibraries || []),
      db.words.bulkPut(words || []),
      db.studyRecords.bulkPut(studyRecords || []),
      db.settings.bulkPut(settings || []),
    ]);
  });

  await db.settings.put({ key: 'lastSyncTimestamp', value: new Date().toISOString() });
  
  console.log("下行同步成功完成。");
  return "数据已成功从云端同步！";
}

export function syncDownstream() {
  toast.promise(performSync(), {
    loading: '正在从云端同步您的数据...',
    success: (message) => message,
    error: (err: any) => {
      const errorMessage = err.message || "从云端同步数据失败，请稍后重试。";
      console.error("下行同步失败:", err);
      return errorMessage;
    },
  });
}

// =================================================================
//                 上行同步处理器 (Upstream Sync Processor)
// =================================================================

function toSnakeCase(obj: any) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = obj[key];
    return acc;
  }, {} as any);
}

const tableNameMap = {
  words: 'words',
  studyRecords: 'study_records',
  wordLibraries: 'word_libraries',
  settings: 'settings',
};

let isSyncing = false;

export async function processSyncQueue() {
  if (isSyncing || !navigator.onLine) {
    return;
  }

  isSyncing = true;
  const supabase = createClient();

  try {
    const pendingTasks = await db.syncQueue.where('status').equals('pending').toArray();
    if (pendingTasks.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`开始处理同步队列，共 ${pendingTasks.length} 个任务。`);

    for (const task of pendingTasks) {
      try {
        await db.syncQueue.update(task.id!, { status: 'syncing' });

        let error;
        const supabaseTableName = tableNameMap[task.tableName];
        if (!supabaseTableName) {
          throw new Error(`未知的表名: ${task.tableName}`);
        }

        switch (task.operation) {
          case 'insert':
            ({ error } = await supabase.from(supabaseTableName).insert(toSnakeCase(task.payload)));
            break;
          case 'update':
            ({ error } = await supabase.from(supabaseTableName).update(task.payload.changes).eq('id', task.payload.id));
            break;
          case 'delete':
            ({ error } = await supabase.from(supabaseTableName).delete().eq('id', task.payload.id));
            break;
        }

        if (error) throw error;

        await db.syncQueue.delete(task.id!);
        console.log(`任务 #${task.id} (${task.operation} on ${supabaseTableName}) 同步成功。`);

      } catch (error) {
        await db.syncQueue.update(task.id!, { status: 'failed', attempts: task.attempts + 1 });
        console.error(`任务 #${task.id} 同步失败:`, task, error);
      }
    }
  } finally {
    isSyncing = false;
  }

  const remainingTasks = await db.syncQueue.where('status').equals('pending').count();
  if (remainingTasks > 0) {
    console.log(`队列中还有 ${remainingTasks} 个任务，将再次尝试。`);
    triggerSync(); // 使用 triggerSync 进行递归调用
  } else {
    console.log("同步队列已清空。");
  }
}