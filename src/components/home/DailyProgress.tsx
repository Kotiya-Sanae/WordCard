"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function DailyProgress() {
  const stats = useLiveQuery(async () => {
    // 获取每日目标设置
    const goalSetting = await db.settings.get('dailyGoal');
    const dailyGoal = goalSetting?.value ?? 20;

    // 精确计算今天学习过的不重复单词数
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysRecords = await db.studyRecords
      .where("lastReviewAt")
      .between(todayStart, todayEnd)
      .toArray();
    
    const learnedTodayIds = new Set(todaysRecords.map(r => r.wordId));
    const learnedTodayCount = learnedTodayIds.size;
    
    return { dailyGoal, learnedToday: learnedTodayCount };
  }, []);

  if (!stats) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full" />
      </div>
    );
  }

  const progressPercentage = stats.dailyGoal > 0 ? (stats.learnedToday / stats.dailyGoal) * 100 : 0;

  return (
    <div className="p-4">
      <div className="text-xs text-muted-foreground flex justify-between mb-1">
        <span>今日目标: {stats.learnedToday}/{stats.dailyGoal}</span>
        <span>完成度: {Math.min(progressPercentage, 100).toFixed(0)}%</span>
      </div>
      <Progress value={progressPercentage} />
    </div>
  );
}