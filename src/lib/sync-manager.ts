import { processSyncQueue } from './sync';

/**
 * 这是一个简单的事件触发器，用于解耦 db.ts 和 sync.ts
 * 
 * 我们使用一个微任务 (Promise.resolve().then()) 来调用 processSyncQueue，
 * 这样可以确保它在当前的 Dexie 事务完成之后再执行，避免了潜在的冲突。
 */
export function triggerSync() {
  Promise.resolve().then(processSyncQueue);
}