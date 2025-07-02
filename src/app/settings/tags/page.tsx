"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, setSyncingFromRealtime } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TagsPage() {
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<any | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  const supabase = createClient();

  const tags = useLiveQuery(() => db.tags.toArray(), []);

  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast.error("标签名不能为空");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("请先登录");
      return;
    }

    try {
      await db.transaction('rw', [db.tags, db.syncQueue], async () => {
        const existing = await db.tags.where('name').equalsIgnoreCase(trimmedName).first();
        if (existing) {
          throw new Error("该标签名已存在");
        }
        
        await db.tags.add({
          id: uuidv4(),
          userId: user.id,
          name: trimmedName,
          createdAt: new Date(),
        });
      });
      setNewTagName("");
      toast.success("标签创建成功");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "创建失败，请稍后重试");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await db.transaction('rw', db.tags, db.wordTags, db.syncQueue, async () => {
        // 1. "静音"钩子，然后在本地删除关联记录
        setSyncingFromRealtime(true);
        try {
          await db.wordTags.where('tagId').equals(tagId).delete();
        } finally {
          // 确保在操作完成后关闭“静音开关”
          setSyncingFromRealtime(false);
        }
        
        // 2. 然后正常删除标签本身，这个操作会触发同步钩子
        await db.tags.delete(tagId);
      });
      toast.success("标签删除成功");
    } catch (error) {
      console.error(error);
      toast.error("删除失败");
    }
  };

  const handleStartEdit = (tag: any) => {
    setEditingTag(tag);
    setEditingTagName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingTagName("");
  };

  const handleUpdateTag = async () => {
    const trimmedName = editingTagName.trim();
    if (!trimmedName || !editingTag) return;

    try {
      await db.transaction('rw', [db.tags, db.syncQueue], async () => {
        if (trimmedName.toLowerCase() !== editingTag.name.toLowerCase()) {
          const existing = await db.tags.where('name').equalsIgnoreCase(trimmedName).first();
          if (existing) {
            throw new Error("该标签名已存在");
          }
        }
        await db.tags.update(editingTag.id, { name: trimmedName });
      });
      toast.success("标签更新成功");
      handleCancelEdit();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "更新失败，请稍后重试");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">管理您的标签</h2>
        <p className="text-sm text-muted-foreground">
          在这里创建、编辑或删除您的自定义单词标签。
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="输入新标签名..."
        />
        <Button onClick={handleCreateTag}>创建</Button>
      </div>

      <div className="space-y-2">
        {tags?.map((tag) => (
          <div key={tag.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            {editingTag?.id === tag.id ? (
              <div className="flex-1 flex gap-2">
                <Input
                  value={editingTagName}
                  onChange={(e) => setEditingTagName(e.target.value)}
                  className="h-9"
                />
                <Button size="sm" onClick={handleUpdateTag}>保存</Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>取消</Button>
              </div>
            ) : (
              <>
                <span className="font-medium">{tag.name}</span>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleStartEdit(tag)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除标签 “{tag.name}” 将会移除它与所有单词的关联。此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>
                          确定删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}