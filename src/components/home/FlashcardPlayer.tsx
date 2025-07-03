"use client";

import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, StudyRecord, Word, Tag } from "@/lib/db";
import { srs, Rating } from "@/lib/srs";
import { Flashcard } from "./Flashcard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReviewItem {
  word: Word;
  record: StudyRecord;
}

export function FlashcardPlayer() {
  const [learnedTodayIds, setLearnedTodayIds] = useState<Set<string>>(new Set());
  const [goalReached, setGoalReached] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tagFilterLogic, setTagFilterLogic] = useState<'AND' | 'OR'>('AND');

  // 1. 获取每日目标
  const dailyGoal = useLiveQuery(
    async () => (await db.settings.get('dailyGoal'))?.value ?? 20,
    []
  );

  // 2. 获取所有标签
  const allTags = useLiveQuery(() => db.tags.toArray(), []);

  // 3. 获取今天需要复习的单词
  const reviewQueue = useLiveQuery(async () => {
    const now = new Date();
    let recordsToReview: StudyRecord[];

    if (selectedTagIds.length > 0) {
      const allWordTags = await db.wordTags.toArray();
      const wordIdToTags = new Map<string, string[]>();
      allWordTags.forEach(wt => {
        if (!wordIdToTags.has(wt.wordId)) {
          wordIdToTags.set(wt.wordId, []);
        }
        wordIdToTags.get(wt.wordId)!.push(wt.tagId);
      });

      const filteredWordIds = new Set<string>();
      wordIdToTags.forEach((tags, wordId) => {
        let match = false;
        if (tagFilterLogic === 'AND') {
          match = selectedTagIds.every(tagId => tags.includes(tagId));
        } else { // OR logic
          match = selectedTagIds.some(tagId => tags.includes(tagId));
        }
        if (match) {
          filteredWordIds.add(wordId);
        }
      });

      if (filteredWordIds.size === 0) return [];

      recordsToReview = await db.studyRecords
        .where('dueDate').belowOrEqual(now)
        .and(record => filteredWordIds.has(record.wordId))
        .toArray();
    } else {
      // 不筛选
      recordsToReview = await db.studyRecords
        .where('dueDate')
        .belowOrEqual(now)
        .toArray();
    }
    
    const wordsToReview: ReviewItem[] = [];
    for (const record of recordsToReview) {
      const word = await db.words.get(record.wordId);
      if (word) {
        wordsToReview.push({ word, record });
      }
    }
    return wordsToReview;
  }, [selectedTagIds, tagFilterLogic]);

  // 3. 处理用户反馈
  const handleRating = async (rating: Rating) => {
    if (!currentItem) return;

    const updatedRecord = srs(currentItem.record, rating);
    await db.transaction('rw', db.studyRecords, db.syncQueue, async () => {
      await db.studyRecords.put(updatedRecord);
    });

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

  const selectedTags = useMemo(() => {
    if (!allTags) return [];
    return allTags.filter(tag => selectedTagIds.includes(tag.id));
  }, [allTags, selectedTagIds]);

  if (!reviewQueue || dailyGoal === undefined) {
    return <div>加载学习队列中...</div>;
  }

  if (reviewQueue.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="mb-4">今日任务已完成！🎉</p>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            <span className="text-sm text-muted-foreground">当前筛选:</span>
            {selectedTags.map(tag => (
              <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
            ))}
            <Button variant="link" size="sm" onClick={() => setSelectedTagIds([])}>清空筛选</Button>
          </div>
        )}
      </div>
    );
  }

  const currentItem = reviewQueue[0];

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="w-full flex justify-end mb-2">
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>筛选</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">标签筛选逻辑</h4>
                <RadioGroup value={tagFilterLogic} onValueChange={(value: 'AND' | 'OR') => setTagFilterLogic(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AND" id="f-logic-and" />
                    <Label htmlFor="f-logic-and">满足所有已选标签 (AND)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OR" id="f-logic-or" />
                    <Label htmlFor="f-logic-or">满足任一已选标签 (OR)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">选择标签</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allTags && allTags.length > 0 ? (
                    allTags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-tag-${tag.id}`}
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTagIds(prev =>
                              checked ? [...prev, tag.id] : prev.filter(id => id !== tag.id)
                            );
                          }}
                        />
                        <Label htmlFor={`filter-tag-${tag.id}`}>{tag.name}</Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">没有可用的标签。</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsFilterOpen(false)}>完成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-muted-foreground">筛选中:</span>
          {selectedTags.map(tag => (
            <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
          ))}
        </div>
      )}

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