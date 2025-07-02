"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, RefreshCw } from "lucide-react";

interface LibraryCardProps {
  name: string;
  description: string;
  wordCount: number;
  isAdded: boolean;
  onAdd: () => void;
  onRestore: () => void;
}

export function LibraryCard({ name, description, wordCount, isAdded, onAdd, onRestore }: LibraryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">包含 {wordCount} 个单词</p>
      </CardContent>
      <CardFooter>
        {isAdded ? (
          <Button onClick={onRestore} className="w-full" variant="secondary">
            <RefreshCw className="mr-2 h-4 w-4" />
            检查更新 / 恢复
          </Button>
        ) : (
          <Button onClick={onAdd} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            添加到我的词库
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}