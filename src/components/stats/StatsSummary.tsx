"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsSummary() {
  const stats = useLiveQuery(async () => {
    const totalWords = await db.words.count();
    const newCount = await db.studyRecords.where("status").equals("new").count();
    const learningCount = await db.studyRecords.where("status").equals("learning").count();
    const masteredCount = await db.studyRecords.where("status").equals("mastered").count();

    return {
      totalWords,
      newCount,
      learningCount,
      masteredCount,
    };
  }, []);

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          总词汇量
        </CardTitle>
        <p className="text-4xl font-bold">{stats.totalWords}</p>
      </CardHeader>
      <CardContent className="flex justify-between text-center">
        <div className="w-1/3">
          <p className="text-lg font-semibold">{stats.masteredCount}</p>
          <p className="text-xs text-muted-foreground">已掌握</p>
        </div>
        <div className="w-1/3">
          <p className="text-lg font-semibold">{stats.learningCount}</p>
          <p className="text-xs text-muted-foreground">学习中</p>
        </div>
        <div className="w-1/3">
          <p className="text-lg font-semibold">{stats.newCount}</p>
          <p className="text-xs text-muted-foreground">待学习</p>
        </div>
      </CardContent>
    </Card>
  );
}