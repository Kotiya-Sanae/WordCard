import { processSyncQueue } from './sync';

let syncTimeout: NodeJS.Timeout | null = null;

/**
 * 这是一个带有防抖功能的事件触发器，用于解耦 db.ts 和 sync.ts
 *
 * 在短时间内（例如 500 毫秒）无论 triggerSync 被调用多少次，
 * processSyncQueue 只会在最后一次调用后的 500 毫秒被执行一次。
 * 这可以防止因快速连续操作而导致的同步竞态条件。
 */
export function triggerSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    processSyncQueue();
    syncTimeout = null;
  }, 500); // 500ms 防抖延迟
}