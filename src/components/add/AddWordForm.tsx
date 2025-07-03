"use client";

import { useState, useEffect } from "react";
import { db, Word, Tag } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { WordTagsEditor } from "@/components/library/WordTagsEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "dexie-react-hooks";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";

interface AddWordFormProps {
  initialData?: Word;
}

export function AddWordForm({ initialData }: AddWordFormProps) {
  const [term, setTerm] = useState("");
  const [phonetics, setPhonetics] = useState("");
  const [definitions, setDefinitions] = useState("");
  const [examples, setExamples] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const router = useRouter();
  const allTags = useLiveQuery(() => db.tags.toArray(), []);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isEditMode) {
      setTerm(initialData.term);
      setPhonetics(initialData.phonetics.join('\n'));
      setDefinitions(initialData.definitions.join('\n'));
      setExamples(initialData.examples.join('\n'));
    }
  }, [initialData, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term || !definitions || isSubmitting) return;

    setIsSubmitting(true);

    const processToArray = (str: string) => str.split('\n').map(s => s.trim()).filter(Boolean);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("请先登录后再添加单词。");
      setIsSubmitting(false);
      return;
    }

    const wordData = {
      term,
      phonetics: processToArray(phonetics),
      definitions: processToArray(definitions),
      examples: processToArray(examples),
      modifiedAt: new Date(),
      userId: user.id, // 注入 userId
    };

    try {
      if (isEditMode) {
        // 更新模式
        await db.transaction('rw', db.words, db.syncQueue, async () => {
          await db.words.update(initialData.id, wordData);
        });
        toast.success("单词更新成功！");
        router.push('/library');
      } else {
        // 创建模式
        const newWordId = crypto.randomUUID();
        
        // 从本地数据库获取当前用户唯一的词库
        const userLibrary = await db.wordLibraries.toCollection().first();
        if (!userLibrary) {
          toast.error("无法找到您的词库，请稍后再试。");
          setIsSubmitting(false);
          return;
        }

        await db.transaction('rw', db.words, db.studyRecords, db.wordTags, db.syncQueue, async () => {
          // 1. 添加单词
          await db.words.add({
            ...wordData,
            id: newWordId,
            libraryId: userLibrary.id,
            createdAt: new Date(),
          });

          // 2. 添加学习记录
          await db.studyRecords.add({
            id: crypto.randomUUID(),
            wordId: newWordId,
            userId: user.id,
            // 确保 due_date 不会是未来的时间，减去1秒作为缓冲
            dueDate: new Date(Date.now() - 1000),
            stability: 0,
            difficulty: 0,
            reviewCount: 0,
            status: 'new',
            modifiedAt: new Date(),
          });

          // 3. 添加标签关联
          if (selectedTagIds.length > 0) {
            const wordTagRecords = selectedTagIds.map(tagId => ({
              id: crypto.randomUUID(),
              wordId: newWordId,
              tagId: tagId,
              userId: user.id,
            }));
            await db.wordTags.bulkAdd(wordTagRecords);
          }
        });
        toast.success("单词添加成功！");
        router.push('/library');
      }
    } catch (error) {
      console.error("操作失败:", error);
      toast.error("操作失败，请查看控制台信息。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="space-y-2">
        <Label htmlFor="term">单词 / 短语 *</Label>
        <Input
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="例如：ephemeral"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phonetic">音标</Label>
        <Textarea
          id="phonetic"
          value={phonetics}
          onChange={(e) => setPhonetics(e.target.value)}
          placeholder="支持多个音标，请用换行分隔"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="definition">释义 *</Label>
        <Textarea
          id="definition"
          value={definitions}
          onChange={(e) => setDefinitions(e.target.value)}
          placeholder="支持多个释义，请用换行分隔"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="example">例句</Label>
        <Textarea
          id="example"
          value={examples}
          onChange={(e) => setExamples(e.target.value)}
          placeholder="支持多个例句，请用换行分隔"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">标签</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditMode && initialData ? (
            <WordTagsEditor wordId={initialData.id} />
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[24px]">
                {allTags
                  ?.filter(tag => selectedTagIds.includes(tag.id))
                  .map(tag => (
                    <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                  ))
                }
              </div>
              <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Tags className="mr-2 h-4 w-4" />
                    {selectedTagIds.length > 0 ? "编辑标签" : "添加标签"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>选择标签</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                    {allTags && allTags.length > 0 ? (
                      allTags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-tag-${tag.id}`}
                            checked={selectedTagIds.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              setSelectedTagIds(prev =>
                                checked ? [...prev, tag.id] : prev.filter(id => id !== tag.id)
                              );
                            }}
                          />
                          <Label htmlFor={`add-tag-${tag.id}`}>{tag.name}</Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        暂无标签。请先在“设置”-“标签管理”中创建。
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsTagDialogOpen(false)}>完成</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "保存中..." : (isEditMode ? "更新单词" : "保存单词")}
      </Button>
    </form>
  );
}