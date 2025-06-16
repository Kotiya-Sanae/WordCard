"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, StudyRecord, Word } from "@/lib/db";
import { srs, Rating } from "@/lib/srs";
import { Flashcard } from "./Flashcard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewItem {
  word: Word;
  record: StudyRecord;
}

export function FlashcardPlayer() {
  const [learnedTodayIds, setLearnedTodayIds] = useState<Set<string>>(new Set());
  const [goalReached, setGoalReached] = useState(false);

  // 1. 获取每日目标
  const dailyGoal = useLiveQuery(
    async () => (await db.settings.get('dailyGoal'))?.value ?? 20,
    []
  );

  // 2. 获取今天需要复习的单词
  const reviewQueue = useLiveQuery(async () => {
    const now = new Date();
    const recordsToReview = await db.studyRecords
      .where('dueDate')
      .belowOrEqual(now)
      .toArray();
    
    const wordsToReview: ReviewItem[] = [];
    for (const record of recordsToReview) {
      const word = await db.words.get(record.wordId);
      if (word) {
        wordsToReview.push({ word, record });
      }
    }
    return wordsToReview;
  }, []);

  // 3. 处理用户反馈
  const handleRating = async (rating: Rating) => {
    if (!currentItem) return;

    const updatedRecord = srs(currentItem.record, rating);
    await db.studyRecords.put(updatedRecord);

    // 更新今日已学单词集合
    const newLearnedIds = new Set(learnedTodayIds).add(currentItem.word.id);
    setLearnedTodayIds(newLearnedIds);

    // 检查是否首次达到目标
    if (dailyGoal !== undefined && newLearnedIds.size === dailyGoal && !goalReached) {
      toast.success("今日目标已达成！",
      );
      setGoalReached(true); // 标记已祝贺过，避免重复提示
    }
  };

  // 每天重置已学记录和祝贺状态
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setLearnedTodayIds(new Set());
        setGoalReached(false);
      }
    }, 60000); // 每分钟检查一次
    return () => clearInterval(timer);
  }, []);


  if (!reviewQueue || dailyGoal === undefined) {
    return <div>加载学习队列中...</div>;
  }

  if (reviewQueue.length === 0) {
    return <div>今日任务已完成！🎉</div>;
  }

  const currentItem = reviewQueue[0];

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <Flashcard
        word={currentItem.word.term}
        phonetics={currentItem.word.phonetics || []}
        definitions={currentItem.word.definitions || []}
        examples={currentItem.word.examples || []}
      />
      <div className="flex items-center justify-center space-x-6 mt-8">
        <Button
          onClick={() => handleRating('again')}
          variant="outline"
          className="w-28 h-12 rounded-xl"
        >
          跳过
        </Button>
        <Button
          onClick={() => handleRating('easy')}
          className="w-28 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white"
        >
          已掌握
        </Button>
      </div>
    </div>
  );
}