import { createClient } from '@/utils/supabase/client';
import { db, setSyncingFromRealtime } from './db';
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
    settingsRes,
    tagsRes,
    wordTagsRes
  ] = await Promise.all([
    supabase.from('word_libraries').select('*'),
    supabase.from('words').select('*'),
    supabase.from('study_records').select('*'),
    supabase.from('settings').select('*'),
    supabase.from('tags').select('*'),
    supabase.from('word_tags').select('*')
  ]);

  if (librariesRes.error) throw librariesRes.error;
  if (wordsRes.error) throw wordsRes.error;
  if (recordsRes.error) throw recordsRes.error;
  if (settingsRes.error) throw settingsRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (wordTagsRes.error) throw wordTagsRes.error;

  const wordLibraries = librariesRes.data?.map((lib: any) => ({
    id: lib.id,
    name: lib.name,
    description: lib.description,
    category: lib.category,
    wordCount: lib.word_count,
    createdAt: new Date(lib.created_at),
    modifiedAt: new Date(lib.modified_at),
    userId: lib.user_id,
  }));

  const words = wordsRes.data?.map((w: any) => ({
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

  const studyRecords = recordsRes.data?.map((r: any) => ({
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

  const settings = settingsRes.data?.map((s: any) => ({
    key: s.key,
    value: s.value,
    userId: s.user_id,
  }));

  const rawTags = tagsRes.data || [];
  const uniqueTagsMap = new Map<string, typeof rawTags[0]>();
  rawTags.forEach((t: any) => {
    // 使用 toLowerCase() 来处理潜在的大小写不一致问题
    const lowerCaseName = t.name.toLowerCase();
    if (!uniqueTagsMap.has(lowerCaseName)) {
      uniqueTagsMap.set(lowerCaseName, t);
    }
  });
  const tags = Array.from(uniqueTagsMap.values()).map((t: any) => ({
    id: t.id,
    name: t.name,
    createdAt: new Date(t.created_at),
    userId: t.user_id,
  }));

  const wordTags = wordTagsRes.data?.map((wt: any) => ({
    id: wt.id,
    wordId: wt.word_id,
    tagId: wt.tag_id,
    userId: wt.user_id,
  }));

  console.log(`数据转换完成：获取到 ${wordLibraries?.length} 个词库, ${words?.length} 个单词, ${studyRecords?.length} 条记录, ${settings?.length} 个设置, ${tags?.length} 个标签, ${wordTags?.length} 个单词标签关联。`);

  // 在写入前，打开“静音开关”
  setSyncingFromRealtime(true);
  try {
    await db.transaction('rw', [db.wordLibraries, db.words, db.studyRecords, db.settings, db.tags, db.wordTags], async () => {
      console.log("清空本地数据表...");
      await Promise.all([
        db.wordLibraries.clear(),
        db.words.clear(),
        db.studyRecords.clear(),
        db.settings.clear(),
        db.tags.clear(),
        db.wordTags.clear(),
      ]);

      console.log("批量写入新数据到本地...");
      await Promise.all([
        db.wordLibraries.bulkPut(wordLibraries || []),
        db.words.bulkPut(words || []),
        db.studyRecords.bulkPut(studyRecords || []),
        db.settings.bulkPut(settings || []),
        db.tags.bulkPut(tags || []),
        db.wordTags.bulkPut(wordTags || []),
      ]);
    });
  } finally {
    // 确保在操作完成后关闭“静音开关”
    setSyncingFromRealtime(false);
  }

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
  tags: 'tags',
  wordTags: 'word_tags',
};

let isSyncing = false;

export async function processSyncQueue() {
  if (isSyncing || !navigator.onLine) {
    return;
  }

  isSyncing = true;
  const supabase = createClient();

  try {
    let pendingTasks = await db.syncQueue.where('status').equals('pending').toArray();
    if (pendingTasks.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`开始处理同步队列，共 ${pendingTasks.length} 个任务。`);

    const MAX_ATTEMPTS_PER_CYCLE = 3;
    let attempts = 0;

    while (pendingTasks.length > 0 && attempts < MAX_ATTEMPTS_PER_CYCLE) {
      attempts++;
      console.log(`同步周期尝试 #${attempts}`);
      let failedTasksInCycle = [];

      // 定义操作的优先级顺序
      const priority: (typeof pendingTasks[0]['tableName'])[] = [
        'wordLibraries', 'tags', 'words', 'studyRecords', 'wordTags', 'settings'
      ];
      
      // 排序，优先处理删除（按相反顺序），然后是创建/更新
      pendingTasks.sort((a, b) => {
        if (a.operation === 'delete' && b.operation !== 'delete') return -1;
        if (a.operation !== 'delete' && b.operation === 'delete') return 1;

        const aPrio = priority.indexOf(a.tableName);
        const bPrio = priority.indexOf(b.tableName);
        
        if (a.operation === 'delete') { // 删除按反向优先级
          return bPrio - aPrio;
        }
        return aPrio - bPrio; // 创建/更新按正向优先级
      });

      for (const task of pendingTasks) {
        try {
          await db.syncQueue.update(task.id!, { status: 'syncing' });

          let error;
          const supabaseTableName = tableNameMap[task.tableName];
          if (!supabaseTableName) throw new Error(`未知的表名: ${task.tableName}`);

          switch (task.operation) {
            case 'insert':
              if (supabaseTableName === 'word_tags') {
                ({ error } = await supabase.from(supabaseTableName).upsert(toSnakeCase(task.payload), { onConflict: 'word_id,tag_id', ignoreDuplicates: false }));
              } else {
                ({ error } = await supabase.from(supabaseTableName).insert(toSnakeCase(task.payload)));
              }
              break;
            case 'update':
              ({ error } = await supabase.from(supabaseTableName).update(toSnakeCase(task.payload.changes)).eq('id', task.payload.id));
              break;
            case 'delete':
              ({ error } = await supabase.from(supabaseTableName).delete().eq('id', task.payload.id));
              break;
          }

          if (error) {
            // 如果是外键约束错误，我们认为是可恢复的，将其放入失败列表以便重试
            if (error.code === '23503') {
              console.warn(`任务 #${task.id} 暂时失败 (外键约束)，将在本周期内重试。`, task);
              failedTasksInCycle.push(task);
              await db.syncQueue.update(task.id!, { status: 'pending' }); // 重置回pending
            } else {
              throw error; // 其他错误直接抛出
            }
          } else {
            await db.syncQueue.delete(task.id!);
            console.log(`任务 #${task.id} (${task.operation} on ${supabaseTableName}) 同步成功。`);
          }

        } catch (error) {
          await db.syncQueue.update(task.id!, { status: 'failed', attempts: task.attempts + 1 });
          console.error(`任务 #${task.id} 同步失败:`, task, error);
        }
      }
      
      pendingTasks = failedTasksInCycle; // 下一轮循环只处理本轮失败的任务
    }

    if (pendingTasks.length > 0) {
      console.error(`经过 ${MAX_ATTEMPTS_PER_CYCLE} 次尝试后，仍有 ${pendingTasks.length} 个任务无法完成。`);
    }

  } finally {
    isSyncing = false;
  }

  const remainingTasks = await db.syncQueue.where('status').equals('pending').count();
  if (remainingTasks > 0) {
    console.log(`队列中还有 ${remainingTasks} 个任务，将再次尝试。`);
    triggerSync();
  } else {
    console.log("同步队列已清空。");
  }
}