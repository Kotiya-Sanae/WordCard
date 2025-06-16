"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Word, StudyRecord, WordStatus } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EnrichedWord extends Word {
  record: StudyRecord | undefined;
}

interface WordListItemProps {
  item: EnrichedWord;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function WordListItem({ item, isMultiSelectMode, isSelected, onSelect }: WordListItemProps) {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const statusMap: Record<WordStatus, string> = {
    new: "新单词",
    learning: "学习中",
    mastered: "已掌握",
  };

  const statusColorMap: Record<WordStatus, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    learning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    mastered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };

  const handleDelete = async () => {
    try {
      await db.transaction('rw', db.words, db.studyRecords, async () => {
        await db.words.delete(item.id);
        if (item.record) {
          await db.studyRecords.delete(item.record.id);
        }
      });
      toast.success(`单词 "${item.term}" 已删除`);
    } catch (error) {
      console.error("Failed to delete word:", error);
      toast.error("删除失败！");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isMultiSelectMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(item.id)}
            className="h-5 w-5"
          />
        )}
        <Card className={cn("w-full transition-colors", isSelected && "border-primary")}>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">{item.term}</CardTitle>
              {item.record && (
                <div className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[item.record.status]}`}>
                  {statusMap[item.record.status]}
                </div>
              )}
            </div>
            {!isMultiSelectMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/library/${item.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsAlertOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {item.definitions?.[0] || "暂无释义"}
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除单词 “<span className="font-semibold">{item.term}</span>” 及其所有学习记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function WordList() {
  const [filter, setFilter] = useState<WordStatus | "all">("all");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);

  const words = useLiveQuery(async () => {
    const allWords = await db.words.toArray();
    const allRecords = await db.studyRecords.toArray();
    const recordsMap = new Map(allRecords.map(r => [r.wordId, r]));

    const enrichedWords: EnrichedWord[] = allWords.map(word => ({
      ...word,
      record: recordsMap.get(word.id),
    }));

    if (filter === "all") {
      return enrichedWords;
    }
    return enrichedWords.filter(item => item.record?.status === filter);
  }, [filter]);

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedIds([]); // 退出时清空选择
  };

  const handleSelectWord = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (words && selectedIds.length === words.length) {
      setSelectedIds([]);
    } else if (words) {
      setSelectedIds(words.map(w => w.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await db.transaction('rw', db.words, db.studyRecords, async () => {
        const recordsToDelete = await db.studyRecords.where('wordId').anyOf(selectedIds).toArray();
        const recordIdsToDelete = recordsToDelete.map(r => r.id);
        await db.words.bulkDelete(selectedIds);
        await db.studyRecords.bulkDelete(recordIdsToDelete);
      });
      setIsMultiSelectMode(false);
      setSelectedIds([]);
      toast.success(`成功删除 ${selectedIds.length} 个单词`);
    } catch (error) {
      console.error("Failed to bulk delete words:", error);
      toast.error("批量删除失败！");
    }
  };

  const isAllSelected = words ? selectedIds.length === words.length && words.length > 0 : false;

  return (
    <div className="relative pb-24">
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as WordStatus | "all")}>
          <TabsList>
            <TabsTrigger value="all">所有</TabsTrigger>
            <TabsTrigger value="new">新单词</TabsTrigger>
            <TabsTrigger value="learning">学习中</TabsTrigger>
            <TabsTrigger value="mastered">已掌握</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" onClick={handleToggleMultiSelect}>
          {isMultiSelectMode ? "取消" : "选择"}
        </Button>
      </div>

      <div className="space-y-3">
        {words ? (
          words.length > 0 ? (
            words.map((item) => (
              <WordListItem
                key={item.id}
                item={item}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedIds.includes(item.id)}
                onSelect={handleSelectWord}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground mt-8">没有找到符合条件的单词。</p>
          )
        ) : (
          <p className="text-center text-muted-foreground mt-8">加载中...</p>
        )}
      </div>

      {isMultiSelectMode && selectedIds.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 w-full max-w-md mx-auto p-4 bg-background border-t border-border shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                {isAllSelected ? "取消全选" : "全选"}
              </label>
              <span className="text-sm text-muted-foreground">| 已选择 {selectedIds.length} 项</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteAlertOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除所选项目吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除所选的 {selectedIds.length} 个单词及其所有学习记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}