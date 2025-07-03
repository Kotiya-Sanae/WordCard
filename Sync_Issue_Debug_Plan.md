# 临时文档：解决实时下行同步不稳定的问题

## 1. 问题描述 (Problem Description)

当前应用存在一个核心的、偶发的同步问题：

*   **现象**: 在一个设备（如浏览器A）上创建或修改数据（如添加新单词、新标签）后，这些变更能够成功上行同步到 Supabase 云端。但是，在另一个已打开的设备（如浏览器B）上，无法稳定地通过实时同步（Realtime）接收到这些变更。
*   **特征**:
    *   该问题“时好时坏”，有时能同步，有时不能，行为难以预测。
    *   通过清空浏览器B的本地数据并强制刷新，可以触发首次下行同步（`syncDownstream`），此时能拉取到云端的最新数据，证明云端数据是正确的。
*   **结论**: 问题根源不在于上行同步、RLS策略或数据库复制设置，而在于客户端**处理收到的实时消息的环节**存在缺陷。

## 2. 根源分析 (Root Cause Analysis)

经过多轮排查，我们最终将问题定位在 `SyncProvider.tsx` 中处理实时消息的方式上。

**核心缺陷：并发事务冲突与死锁 (Concurrent Transaction Conflict & Deadlock)**

当前的实现方式是：
```typescript
// src/components/sync-provider.tsx (简化逻辑)
supabase.channel(...).on('postgres_changes', async (payload) => {
  // ...
  switch (payload.table) {
    case 'words':
      await db.transaction('rw', db.words, ..., async () => { /* ... */ });
      break;
    case 'study_records':
      await db.transaction('rw', db.studyRecords, ..., async () => { /* ... */ });
      break;
    // ...
  }
});
```
当一个操作（如添加新单词）在云端产生多条记录的变更时（一条 `words` 记录和一条 `study_records` 记录），Supabase 会向客户端**几乎同时推送多条**实时消息。

我们的代码会为这每一条消息都**立即启动一个独立的数据库事务**。由于 Dexie.js 的事务是互斥的，当多个事务几乎同时尝试写入数据库时，就会发生**竞态条件**，极易导致**事务冲突或死锁**。失败的事务会静默地中止，导致部分数据未能成功写入本地数据库，从而表现为“同步时好时坏”。

## 3. 解决方案 (Solution Plan)

为了从根本上解决这个问题，我们必须避免并发的数据库写入操作。最健壮的方案是实现一个**批处理机制**。

**计划步骤**:

1.  **引入消息队列 (Message Queue)**:
    *   在 `SyncProvider.tsx` 中，创建一个 React state (`const [payloadQueue, setPayloadQueue] = useState<Payload[]>([]);`) 作为接收实时消息的缓冲区。
    *   当 `.on('postgres_changes', ...)` 回调被触发时，我们不再是立即处理 `payload`，而是简单地将它追加到 `payloadQueue` 队列中。

2.  **实现批处理器 (Batch Processor)**:
    *   在 `SyncProvider.tsx` 中，创建一个 `useEffect`，它会监听 `payloadQueue` 的变化。
    *   在这个 `useEffect` 中，使用一个**防抖 (debounce)** 计时器（例如 100-200 毫秒）。这意味着，无论在短时间内有多少条消息涌入队列，真正的处理逻辑只会在最后一-条消息到达后的指定延迟后执行一次。
    *   当防抖计时器触发时，执行核心处理函数。

3.  **实现核心处理函数 (Core Handler)**:
    *   这个函数会获取当前 `payloadQueue` 中的**所有**消息。
    *   清空队列。
    *   启动一个**包含了所有可能被修改的表的大事务** (`db.transaction('rw', [db.words, db.studyRecords, db.tags, ...], ...)`）。
    *   在**这一个事务内部**，按顺序遍历并处理队列中的每一条消息（执行 `db.words.put()`, `db.tags.delete()` 等）。

**这个方案的优势**:
*   **消除并发**: 将所有并发的、零散的写入请求，合并成了一个单一的、串行的、原子性的操作。
*   **保证顺序**: 在单个大事务内部处理消息，可以更好地保证操作的顺序性。
*   **健壮可靠**: 从根本上杜绝了事务冲突和死锁的可能性，确保了实时下行同步的可靠性。

---

明天见！