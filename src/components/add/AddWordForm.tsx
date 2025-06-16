"use client";

import { useState, useEffect } from "react";
import { db, Word } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AddWordFormProps {
  initialData?: Word;
}

export function AddWordForm({ initialData }: AddWordFormProps) {
  const [term, setTerm] = useState("");
  const [phonetics, setPhonetics] = useState("");
  const [definitions, setDefinitions] = useState("");
  const [examples, setExamples] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

    const wordData = {
      term,
      phonetics: processToArray(phonetics),
      definitions: processToArray(definitions),
      examples: processToArray(examples),
      lastModifiedAt: new Date(),
    };

    try {
      if (isEditMode) {
        // 更新模式
        await db.words.update(initialData.id, wordData);
        toast.success("单词更新成功！");
        router.push('/library');
      } else {
        // 创建模式
        const newWordId = crypto.randomUUID();
        await db.transaction('rw', db.words, db.studyRecords, async () => {
          await db.words.add({
            ...wordData,
            id: newWordId,
            libraryId: 'c8a3e5e6-3d5b-4f8e-9c1a-2b3d4e5f6a7b', // 临时 ID
            createdAt: new Date(),
          });
          await db.studyRecords.add({
            id: crypto.randomUUID(),
            wordId: newWordId,
            dueDate: new Date(),
            stability: 0,
            difficulty: 0,
            reviewCount: 0,
            status: 'new',
            lastModifiedAt: new Date(),
          });
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
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "保存中..." : (isEditMode ? "更新单词" : "保存单词")}
      </Button>
    </form>
  );
}