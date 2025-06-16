"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function DeveloperPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleClearTodayRecords = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todaysRecords = await db.studyRecords
        .where("lastReviewAt")
        .between(todayStart, todayEnd)
        .toArray();

      if (todaysRecords.length === 0) {
        toast.info("今天还没有学习记录，无需清除。");
        return;
      }

      const recordsToUpdate = todaysRecords.map(record => {
        return {
          ...record,
          dueDate: new Date(), // 重置为今天到期
          lastReviewAt: undefined, // 清除上次复习时间
        };
      });
      
      await db.studyRecords.bulkPut(recordsToUpdate);

      toast.success(`已成功重置 ${recordsToUpdate.length} 条今日学习记录。`);

    } catch (error) {
      console.error("Failed to clear today's records:", error);
      toast.error("操作失败，请查看控制台。");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">开发者选项</h2>
      <div className="p-4 border rounded-lg">
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">重置今日学习进度</h3>
          <p className="text-sm text-muted-foreground">
            此操作会将今天所有已复习的单词状态重置为“待复习”，以便重新测试每日目标、进度条等功能。
          </p>
          <Button
            variant="destructive"
            className="mt-2 w-full sm:w-auto"
            onClick={() => setIsAlertOpen(true)}
          >
            清除今日学习记录
          </Button>
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要清除吗？</AlertDialogTitle>
            <AlertDialogDescription>
              这将重置你今天所有的学习记录，将它们的复习日期设为今天，并清除“上次复习时间”。此操作主要用于测试。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearTodayRecords} className="bg-destructive hover:bg-destructive/90">
              确认清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}