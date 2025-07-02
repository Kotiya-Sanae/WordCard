"use client";

import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface WordTagsEditorProps {
  wordId: string;
}

export function WordTagsEditor({ wordId }: WordTagsEditorProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

  const allTags = useLiveQuery(() => db.tags.toArray(), []);
  const wordTags = useLiveQuery(
    () => db.wordTags.where('wordId').equals(wordId).toArray(),
    [wordId]
  );

  const wordTagIds = new Set(wordTags?.map(wt => wt.tagId));

  const handleTagChange = async (checked: boolean, tagId: string) => {
    if (!userId) {
      toast.error("用户未登录");
      return;
    }

    if (checked) {
      // Add the tag
      try {
        await db.transaction('rw', db.wordTags, db.syncQueue, async () => {
          await db.wordTags.add({
            id: uuidv4(),
            wordId,
            tagId,
            userId,
          });
        });
      } catch (error) {
        console.error("Failed to add tag to word", error);
        toast.error("添加标签失败");
      }
    } else {
      // Remove the tag
      try {
        const recordToDelete = wordTags?.find(wt => wt.tagId === tagId);
        if (recordToDelete) {
          await db.transaction('rw', db.wordTags, db.syncQueue, async () => {
            await db.wordTags.delete(recordToDelete.id);
          });
        }
      } catch (error) {
        console.error("Failed to remove tag from word", error);
        toast.error("移除标签失败");
      }
    }
  };

  if (!allTags) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-semibold">编辑单词标签</h3>
      <div className="space-y-2">
        {allTags.length > 0 ? (
          allTags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={wordTagIds.has(tag.id)}
                onCheckedChange={(checked) => handleTagChange(!!checked, tag.id)}
              />
              <Label htmlFor={`tag-${tag.id}`}>{tag.name}</Label>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            您还没有创建任何标签。请先在“设置”-“标签管理”中创建标签。
          </p>
        )}
      </div>
    </div>
  );
}