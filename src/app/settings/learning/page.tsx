"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearningPage() {
  // 1. 从数据库获取持久化的值
  const persistedGoal = useLiveQuery(() => db.settings.get('dailyGoal'), []);

  // 2. 使用本地 state 管理输入框的显示值，实现更流畅的输入体验
  const [inputValue, setInputValue] = useState<string | number>("");

  // 3. 当从数据库加载到值后，用它来初始化输入框的显示值
  useEffect(() => {
    if (persistedGoal) {
      setInputValue(persistedGoal.value);
    } else if (persistedGoal === undefined) {
      // 还在加载中，可以不做任何事，或者显示一个加载状态
    } else {
      // 数据库中没有值 (null)，可以设置一个默认值
      setInputValue(20);
    }
  }, [persistedGoal]);

  // 4. 当用户输入时，只更新本地的显示值
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 5. 使用 useEffect + 防抖，在用户停止输入后，将合法的值同步到数据库
  useEffect(() => {
    const handler = setTimeout(() => {
      const numericValue = parseInt(String(inputValue), 10);
      if (!isNaN(numericValue) && numericValue > 0) {
        // 只有当值合法时，才写入数据库
        db.settings.put({ key: 'dailyGoal', value: numericValue });
      }
    }, 500); // 500ms 防抖

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">学习</h2>
      <div className="space-y-2">
        <Label htmlFor="daily-goal">每日学习目标</Label>
        {persistedGoal !== undefined ? (
          <Input
            id="daily-goal"
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            min="1"
            placeholder="例如：20"
          />
        ) : (
          <Skeleton className="h-10 w-full" />
        )}
      </div>
    </div>
  );
}