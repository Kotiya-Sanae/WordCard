"use client";

import { useState, useRef } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share, Upload, Trash2 } from "lucide-react";
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

export default function DataManagementPage() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    // ... (导出逻辑保持不变)
    const exportPromise = new Promise(async (resolve, reject) => {
      try {
        const words = await db.words.toArray();
        const studyRecords = await db.studyRecords.toArray();
        const settings = await db.settings.toArray();
        const wordLibraries = await db.wordLibraries.toArray();
        const dataToExport = { version: 1, exportedAt: new Date().toISOString(), data: { words, studyRecords, settings, wordLibraries } };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `wordcard-backup-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve("数据已成功导出！");
      } catch (error) {
        console.error("Failed to export data:", error);
        reject("数据导出失败");
      }
    });
    toast.promise(exportPromise, { loading: "正在准备数据...", success: (message) => message as string, error: (message) => message as string });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      setIsImportAlertOpen(true); // 读取文件后直接打开确认对话框
    };
    reader.readAsText(file);
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmImport = async () => {
    if (!fileContent) return;

    const importPromise = new Promise(async (resolve, reject) => {
      try {
        const parsedData = JSON.parse(fileContent);
        // 简单的结构验证
        if (parsedData.version !== 1 || !parsedData.data) {
          return reject("文件格式不正确或版本不兼容。");
        }
        const { words, studyRecords, settings, wordLibraries } = parsedData.data;
        if (!words || !studyRecords || !settings || !wordLibraries) {
          return reject("备份文件缺少必要的数据表。");
        }

        await db.transaction('rw', db.words, db.studyRecords, db.settings, db.wordLibraries, async () => {
          // 清空现有数据
          await Promise.all([
            db.words.clear(),
            db.studyRecords.clear(),
            db.settings.clear(),
            db.wordLibraries.clear(),
          ]);
          // 批量写入新数据
          await Promise.all([
            db.words.bulkPut(words),
            db.studyRecords.bulkPut(studyRecords),
            db.settings.bulkPut(settings),
            db.wordLibraries.bulkPut(wordLibraries),
          ]);
        });
        resolve("数据已成功导入！应用将重新加载。");
        setTimeout(() => window.location.reload(), 1500); // 延迟后刷新页面
      } catch (error) {
        console.error("Failed to import data:", error);
        reject("数据导入失败，文件可能已损坏。");
      }
    });

    toast.promise(importPromise, { loading: "正在导入数据...", success: (message) => message as string, error: (message) => message as string });
  };

  const handleConfirmReset = async () => {
    const resetPromise = new Promise(async (resolve, reject) => {
      try {
        await db.delete();
        await db.open();
        resolve("所有数据已清空，应用将重新加载。");
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error("Failed to reset database:", error);
        reject("重置失败，请手动清除浏览器缓存。");
      }
    });
    toast.promise(resetPromise, { loading: "正在重置应用...", success: (message) => message as string, error: (message) => message as string });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">数据管理</h2>
      <div className="p-4 border rounded-lg space-y-6">
        {/* 导出功能 */}
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">导出数据</h3>
          <p className="text-sm text-muted-foreground">
            将你的所有词库、学习记录和设置打包下载为一个JSON文件，用于本地备份或迁移。
          </p>
          <Button variant="outline" className="mt-2 w-full sm:w-auto" onClick={handleExport}>
            <Share className="mr-2 h-4 w-4" />
            导出全部数据
          </Button>
        </div>
        {/* 导入功能 */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          <h3 className="font-medium">导入数据</h3>
          <p className="text-sm text-muted-foreground">
            从之前导出的JSON文件中恢复数据。注意：此操作将覆盖你当前的所有数据。
          </p>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Button variant="outline" className="mt-2 w-full sm:w-auto" onClick={handleTriggerImport}>
            <Upload className="mr-2 h-4 w-4" />
            导入数据...
          </Button>
        </div>
        {/* 重置功能 */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          <h3 className="font-medium">重置应用</h3>
          <p className="text-sm text-muted-foreground">
            清除所有本地数据，包括所有单词、学习记录和设置，将应用恢复到初始状态。
          </p>
          <Button variant="destructive" className="mt-2 w-full sm:w-auto" onClick={() => setIsResetAlertOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            重置应用...
          </Button>
        </div>
      </div>

      {/* 导入确认对话框 */}
      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要导入数据吗？</AlertDialogTitle>
            <AlertDialogDescription>
              这是一个危险操作。导入新数据将会完全覆盖并替换你当前的所有单词、学习记录和设置。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileContent(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>确认导入</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置确认对话框 */}
      <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你确定要重置整个应用吗？</AlertDialogTitle>
            <AlertDialogDescription>
              这是一个非常危险的操作，将会**永久删除**你的所有本地数据，包括所有词库、学习记录和个人设置。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="bg-destructive hover:bg-destructive/90">我确定，重置应用</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}