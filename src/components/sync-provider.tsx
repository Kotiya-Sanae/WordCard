"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { syncDownstream } from '@/lib/sync';
import { db } from '@/lib/db';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log("用户已登录，准备执行同步检查...");
        
        // 新的检查逻辑：检查是否存在上次同步的时间戳
        const lastSync = await db.settings.get('lastSyncTimestamp');
        
        if (!lastSync) {
            console.log("未找到上次同步记录，开始执行首次下行同步。");
            await syncDownstream();
        } else {
            console.log(`本地数据已于 ${lastSync.value} 同步，跳过首次同步。`);
        }
      } else if (event === 'SIGNED_OUT') {
        // 用户登出时，我们应该清除本地数据库，以确保下一个登录的用户获得干净的环境
        console.log("用户已登出，正在清除本地数据...");
        // 使用更安全的方式：逐一清空所有表，而不是删除整个数据库
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

    return () => {
      subscription.unsubscribe();
    };
  }, []); // 移除了 isInitialSyncDone，这个 effect 只需要运行一次来设置监听器

  return <>{children}</>;
}