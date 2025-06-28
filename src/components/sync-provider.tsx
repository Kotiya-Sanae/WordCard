"use client";

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { syncDownstream, processSyncQueue } from '@/lib/sync';
import { db } from '@/lib/db';
import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        console.log("用户已登录，准备执行同步检查...");
        
        const lastSync = await db.settings.get('lastSyncTimestamp');
        
        if (!lastSync) {
            console.log("未找到上次同步记录，开始执行首次下行同步。");
            await syncDownstream();
        } else {
            console.log(`本地数据已于 ${lastSync.value} 同步，跳过首次同步。`);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("用户已登出，正在清除本地数据...");
        await Promise.all([
          db.wordLibraries.clear(),
          db.words.clear(),
          db.studyRecords.clear(),
          db.settings.clear(),
          db.syncQueue.clear(),
        ]);
        console.log("本地数据已清除。");
      }
    });

    window.addEventListener('online', processSyncQueue);
    processSyncQueue();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', processSyncQueue);
    };
  }, []);

  return <>{children}</>;
}