"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { syncDownstream, processSyncQueue } from '@/lib/sync';
import { db, setSyncingFromRealtime } from '@/lib/db';
import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import GoogleAnalytics from './util/GoogleAnalytics';

// snake_case to camelCase 转换器
function snakeToCamel(obj: any) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    acc[camelKey] = obj[key];
    return acc;
  }, {} as any);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    // 设置实时订阅
    const realtimeChannel = supabase.channel('public:all_tables')
      .on('postgres_changes', { event: '*', schema: 'public' },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('接收到云端变更:', payload);
          const { eventType, new: newRecord, old: oldRecord, table } = payload;

          const convertedRecord = snakeToCamel(newRecord);

          // 在写入前，打开“静音开关”
          setSyncingFromRealtime(true);
          try {
            switch (table) {
              case 'words':
                await db.transaction('rw', db.words, db.syncQueue, async () => {
                  if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    await db.words.put(convertedRecord);
                  } else if (eventType === 'DELETE') {
                    await db.words.delete(oldRecord.id);
                  }
                });
                break;
              case 'study_records':
                await db.transaction('rw', db.studyRecords, db.syncQueue, async () => {
                  if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    await db.studyRecords.put(convertedRecord);
                  } else if (eventType === 'DELETE') {
                    await db.studyRecords.delete(oldRecord.id);
                  }
                });
                break;
              case 'tags':
                await db.transaction('rw', db.tags, db.syncQueue, async () => {
                  if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    await db.tags.put(convertedRecord);
                  } else if (eventType === 'DELETE') {
                    await db.tags.delete(oldRecord.id);
                  }
                });
                break;
              case 'word_tags':
                await db.transaction('rw', db.wordTags, db.syncQueue, async () => {
                  if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    await db.wordTags.put(convertedRecord);
                  } else if (eventType === 'DELETE') {
                    await db.wordTags.delete(oldRecord.id);
                  }
                });
                break;
            }
          } finally {
            // 确保在操作完成后，无论成功与否，都关闭“静音开关”
            setSyncingFromRealtime(false);
          }
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        console.log("用户已登录，准备执行同步检查...");
        setUserId(session.user.id);
        
        const libraryCount = await db.wordLibraries.count();
        if (libraryCount === 0) {
          let isCreationInProgress = false;
          await db.transaction('rw', db.settings, async () => {
            const lock = await db.settings.get('creatingDefaultData');
            if (lock) {
              isCreationInProgress = true;
              return;
            }
            await db.settings.put({ key: 'creatingDefaultData', value: true });
          });

          if (isCreationInProgress) {
            console.log("默认数据创建正在进行中，跳过本次操作。");
            return;
          }

          try {
            console.log("本地无词库，判定为新用户/新设备，开始创建默认数据...");
            const defaultLibraryId = crypto.randomUUID();
            const word1Id = crypto.randomUUID();
            const word2Id = crypto.randomUUID();
            const word3Id = crypto.randomUUID();

            await db.transaction('rw', [db.wordLibraries, db.words, db.studyRecords, db.syncQueue], async () => {
              await db.wordLibraries.add({
                id: defaultLibraryId,
                userId: session.user.id,
                name: '默认词库',
                description: '您的第一个词库',
                category: '用户',
                createdAt: new Date(),
              });

              await db.words.bulkAdd([
                { id: word1Id, libraryId: defaultLibraryId, userId: session.user.id, term: 'ephemeral', phonetics: ['/ɪˈfɛm(ə)rəl/'], definitions: ['adj. 短暂的, 瞬息的'], examples: ['The ephemeral beauty of the cherry blossoms.'], createdAt: new Date(), modifiedAt: new Date() },
                { id: word2Id, libraryId: defaultLibraryId, userId: session.user.id, term: 'serendipity', phonetics: ['/ˌsɛrənˈdɪpɪti/'], definitions: ['n. 意外发现美好事物的能力'], examples: ['We all have experienced the serendipity of relevant information.'], createdAt: new Date(), modifiedAt: new Date() },
                { id: word3Id, libraryId: defaultLibraryId, userId: session.user.id, term: 'eloquent', phonetics: ['/ˈɛləkwənt/'], definitions: ['adj. 雄辩的，有口才的'], examples: ['An eloquent speech.'], createdAt: new Date(), modifiedAt: new Date() },
              ]);

              await db.studyRecords.bulkAdd([
                { id: crypto.randomUUID(), userId: session.user.id, wordId: word1Id, dueDate: new Date(), stability: 0, difficulty: 0, reviewCount: 0, status: 'new', modifiedAt: new Date() },
                { id: crypto.randomUUID(), userId: session.user.id, wordId: word2Id, dueDate: new Date(), stability: 0, difficulty: 0, reviewCount: 0, status: 'new', modifiedAt: new Date() },
                { id: crypto.randomUUID(), userId: session.user.id, wordId: word3Id, dueDate: new Date(), stability: 0, difficulty: 0, reviewCount: 0, status: 'new', modifiedAt: new Date() },
              ]);
            });
            console.log("默认数据创建成功，将通过上行同步推送到云端。");
          } finally {
            // 无论成功与否，都释放锁
            await db.settings.delete('creatingDefaultData');
          }
        } else {
          const lastSync = await db.settings.get('lastSyncTimestamp');
          if (!lastSync) {
              console.log("未找到上次同步记录，开始执行首次下行同步。");
              await syncDownstream();
          } else {
              console.log(`本地数据已于 ${lastSync.value} 同步，跳过首次同步。`);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(undefined);
        console.log("用户已登出，正在清除本地数据...");
        await Promise.all([
          db.wordLibraries.clear(),
          db.words.clear(),
          db.studyRecords.clear(),
          db.settings.clear(),
          db.syncQueue.clear(),
          db.tags.clear(),
          db.wordTags.clear(),
        ]);
        console.log("本地数据已清除。");
      }
    });

    // 监听网络状态变化，并在恢复在线时触发上行同步
    window.addEventListener('online', processSyncQueue);
    processSyncQueue();

    return () => {
      supabase.removeChannel(realtimeChannel);
      subscription.unsubscribe();
      window.removeEventListener('online', processSyncQueue);
    };
  }, []);

  return (
    <>
      {children}
      <GoogleAnalytics userId={userId} />
    </>
  );
}