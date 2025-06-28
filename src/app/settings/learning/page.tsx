"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function LearningPage() {
  const [inputValue, setInputValue] = useState<string | number>("");
  const [isLoading, setIsLoading] = useState(true);

  // 1. 仅在组件首次加载时，从数据库获取一次初始值
  useEffect(() => {
    const fetchInitialGoal = async () => {
      const persistedGoal = await db.settings.get('dailyGoal');
      if (persistedGoal) {
        setInputValue(persistedGoal.value);
      } else {
        // 如果数据库中没有值，设置一个默认值
        setInputValue(20);
      }
      setIsLoading(false);
    };

    fetchInitialGoal();
  }, []); // 空依赖数组确保此 effect 只运行一次

  // 2. 当用户输入时，只更新本地的显示值
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 3. 使用 useEffect + 防抖，在用户停止输入后，将合法的值同步到数据库
  useEffect(() => {
    // 在加载初始值时，不触发写入操作
    if (isLoading) return;

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
  }, [inputValue, isLoading]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">学习</h2>
      <div className="space-y-2">
        <Label htmlFor="daily-goal">每日学习目标</Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Input
            id="daily-goal"
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            min="1"
            placeholder="例如：20"
          />
        )}
      </div>
    </div>
  );
}