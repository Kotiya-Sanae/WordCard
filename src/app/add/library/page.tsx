"use client";

import { LibraryCard } from "@/components/add/LibraryCard";
import { db, type Word } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from "@/utils/supabase/client";

interface ManifestItem {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  path: string;
}

export default function AddLibraryPage() {
  const [manifest, setManifest] = useState<ManifestItem[]>([]);

  const addedLibraries = useLiveQuery(
    () => db.wordLibraries.where('category').equals('内置').toArray(),
    []
  ) || [];

  const addedLibraryNames = addedLibraries.map(lib => lib.name);

  useEffect(() => {
    fetch('/word-libraries/manifest.json')
      .then(res => res.json())
      .then(data => setManifest(data));
  }, []);

  const handleAddLibrary = async (item: ManifestItem) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("请先登录再添加词库。");
      return;
    }

    try {
      const response = await fetch(item.path);
      const data = await response.json();

      await db.transaction('rw', [db.wordLibraries, db.words, db.studyRecords, db.tags, db.wordTags, db.syncQueue], async () => {
        const newLibraryId = uuidv4();
        const tagName = item.name; // e.g., "CET-4 高频词汇"
        
        // 1. 查找或创建标签
        let tag = await db.tags.where('name').equals(tagName).first();
        if (!tag) {
          const newTagId = uuidv4();
          tag = {
            id: newTagId,
            userId: user.id,
            name: tagName,
            createdAt: new Date(),
          };
          await db.tags.add(tag);
        }
        const tagId = tag.id;

        // 2. 创建新词库
        await db.wordLibraries.add({
          id: newLibraryId,
          userId: user.id,
          name: data.library.name,
          description: data.library.description,
          category: '内置',
          wordCount: data.words.length,
          createdAt: new Date(),
        });

        const wordsToAdd: Word[] = data.words.map((word: any) => ({
          ...word,
          id: uuidv4(),
          libraryId: newLibraryId,
          userId: user.id,
          createdAt: new Date(),
          modifiedAt: new Date(),
        }));

        const recordsToAdd = wordsToAdd.map(word => ({
          id: uuidv4(),
          wordId: word.id,
          userId: user.id,
          dueDate: new Date(),
          stability: 0,
          difficulty: 0,
          reviewCount: 0,
          status: 'new' as const,
          modifiedAt: new Date(),
        }));
        
        const wordTagsToAdd = wordsToAdd.map(word => ({
          id: uuidv4(),
          wordId: word.id,
          tagId: tagId,
          userId: user.id,
        }));

        // 3. 批量添加单词
        await db.words.bulkAdd(wordsToAdd);
        // 4. 批量添加对应的学习记录
        await db.studyRecords.bulkAdd(recordsToAdd);
        // 5. 批量添加单词与标签的关联
        await db.wordTags.bulkAdd(wordTagsToAdd);
      });

      toast.success(`词库 "${item.name}" 添加成功!`);
    } catch (error) {
      console.error("Failed to add library:", error);
      toast.error("添加词库失败，请稍后重试。");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {manifest.map(item => (
        <LibraryCard
          key={item.id}
          name={item.name}
          description={item.description}
          wordCount={item.wordCount}
          isAdded={addedLibraryNames.includes(item.name)}
          onAdd={() => handleAddLibrary(item)}
        />
      ))}
    </div>
  );
}