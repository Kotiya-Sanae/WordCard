import { createClient } from '@/utils/supabase/client';
import { db } from './db';
import { toast } from 'sonner';

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

  // 1. 并发从 Supabase 获取所有用户数据
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

  // 2. 显式地将从 Supabase (snake_case) 获取的数据转换为 Dexie (camelCase) 期望的格式
  const wordLibraries = librariesRes.data?.map(lib => ({
    id: lib.id,
    name: lib.name,
    createdAt: new Date(lib.created_at),
    modifiedAt: new Date(lib.modified_at),
    userId: lib.user_id, // 确保 userId 也被转换
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

  // 3. 在一个事务中，清空并批量写入转换后的数据
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

  // 4. 记录本次同步时间
  await db.settings.put({ key: 'lastSyncTimestamp', value: new Date().toISOString() });
  
  console.log("下行同步成功完成。");
  return "数据已成功从云端同步！";
}

/**
 * 导出的函数，它调用核心逻辑并将其包装在 toast.promise 中以提供UI反馈。
 */
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