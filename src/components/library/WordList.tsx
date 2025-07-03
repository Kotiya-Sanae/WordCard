"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Word, StudyRecord, WordStatus, Tag } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Pencil, Tags, ClipboardList, X, Filter } from "lucide-react";
import { WordTagsEditor } from "./WordTagsEditor";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EnrichedWord extends Word {
  record: StudyRecord | undefined;
  tags: Tag[];
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
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);

  const statusMap: Record<WordStatus, string> = {
    new: "新单词",
    learning: "学习中",
    mastered: "已掌握",
  };

  const statusColorMap: Record<WordStatus, string> = {
    new: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900 dark:text-blue-300",
    learning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-300",
    mastered: "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-300",
  };

  const handleDelete = async () => {
    try {
      await db.transaction('rw', db.words, db.studyRecords, db.syncQueue, async () => {
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
               <Badge variant="outline" className={cn("mt-1", statusColorMap[item.record.status])}>
                 {statusMap[item.record.status]}
               </Badge>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsTagEditorOpen(true)}>
                    <Tags className="mr-2 h-4 w-4" />
                    编辑标签
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
           {item.tags.length > 0 && (
             <div className="mt-2 flex flex-wrap gap-2">
               {item.tags.map(tag => (
                 <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
               ))}
             </div>
           )}
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

      <Dialog open={isTagEditorOpen} onOpenChange={setIsTagEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>为 “{item.term}” 编辑标签</DialogTitle>
          </DialogHeader>
          <WordTagsEditor wordId={item.id} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WordList() {
  const [filter, setFilter] = useState<WordStatus | "all">("all");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tagFilterLogic, setTagFilterLogic] = useState<'AND' | 'OR'>('AND');

  const wordsData = useLiveQuery(async () => {
    const allWords = await db.words.toArray();
    const allRecords = await db.studyRecords.toArray();
    const allTags = await db.tags.toArray();
    const allWordTags = await db.wordTags.toArray();

    const recordsMap = new Map(allRecords.map(r => [r.wordId, r]));
    const tagsMap = new Map(allTags.map(t => [t.id, t]));
    
    const wordIdToTagsMap = new Map<string, Tag[]>();
    allWordTags.forEach(wt => {
      const tag = tagsMap.get(wt.tagId);
      if (tag) {
        if (!wordIdToTagsMap.has(wt.wordId)) {
          wordIdToTagsMap.set(wt.wordId, []);
        }
        wordIdToTagsMap.get(wt.wordId)!.push(tag);
      }
    });

    const enrichedWords: EnrichedWord[] = allWords.map(word => ({
      ...word,
      record: recordsMap.get(word.id),
      tags: wordIdToTagsMap.get(word.id) || [],
    }));

    return enrichedWords;
  }, []);

  const words = useMemo(() => {
    if (!wordsData) return undefined;

    // 1. 先按标签筛选
    const taggedWords = selectedTagIds.length > 0
      ? wordsData.filter(word => {
          if (tagFilterLogic === 'AND') {
            return selectedTagIds.every(tagId =>
              word.tags.some(tag => tag.id === tagId)
            );
          } else { // OR logic
            return selectedTagIds.some(tagId =>
              word.tags.some(tag => tag.id === tagId)
            );
          }
        })
      : wordsData;

    // 2. 再按状态筛选
    if (filter === "all") {
      return taggedWords;
    }
    return taggedWords.filter(item => item.record?.status === filter);
  }, [wordsData, filter, selectedTagIds, tagFilterLogic]);

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
      await db.transaction('rw', db.words, db.studyRecords, db.syncQueue, async () => {
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

  const counts = useMemo(() => {
    if (!wordsData) return { all: 0, new: 0, learning: 0, mastered: 0 };
    const result = {
      all: wordsData.length,
      new: 0,
      learning: 0,
      mastered: 0,
    };
    wordsData.forEach(word => {
      if (word.record?.status) {
        result[word.record.status]++;
      }
    });
    return result;
  }, [wordsData]);

  const allTags = useLiveQuery(() => db.tags.toArray(), []);
  const selectedTags = useMemo(() => {
    if (!allTags) return [];
    return allTags.filter(tag => selectedTagIds.includes(tag.id));
  }, [allTags, selectedTagIds]);

  return (
    <div className="relative pb-24">
      <div className="mb-4 flex flex-col gap-2">
        {/* 第一行：状态筛选 */}
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as WordStatus | "all")} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">所有 ({counts.all})</TabsTrigger>
            <TabsTrigger value="new">新单词 ({counts.new})</TabsTrigger>
            <TabsTrigger value="learning">学习中 ({counts.learning})</TabsTrigger>
            <TabsTrigger value="mastered">已掌握 ({counts.mastered})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 第二行：标签筛选和操作按钮 */}
        <div className="flex justify-between items-center h-9">
          <div className="flex-1 flex items-center gap-2 overflow-hidden">
            {selectedTags.length > 0 ? (
              <>
                <span className="text-sm text-muted-foreground flex-shrink-0">筛选中:</span>
                <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
                  {selectedTags.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="flex-shrink-0">{tag.name}</Badge>
                  ))}
                </div>
                <Button variant="link" size="sm" onClick={() => setSelectedTagIds([])} className="h-auto p-1 text-xs flex-shrink-0">清空</Button>
              </>
            ) : (
              <div /> // 空div用于占位，确保右侧按钮对齐
            )}
          </div>

          <div className="flex items-center flex-shrink-0">
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
                        <RadioGroupItem value="AND" id="logic-and" />
                        <Label htmlFor="logic-and">满足所有已选标签 (AND)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="OR" id="logic-or" />
                        <Label htmlFor="logic-or">满足任一已选标签 (OR)</Label>
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
                              id={`lib-filter-tag-${tag.id}`}
                              checked={selectedTagIds.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                setSelectedTagIds(prev =>
                                  checked ? [...prev, tag.id] : prev.filter(id => id !== tag.id)
                                );
                              }}
                            />
                            <Label htmlFor={`lib-filter-tag-${tag.id}`}>{tag.name}</Label>
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
            <Button variant="ghost" size="icon" onClick={handleToggleMultiSelect}>
              {isMultiSelectMode ? <X className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
            </Button>
          </div>
        </div>
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