"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download } from "lucide-react";

interface LibraryCardProps {
  name: string;
  description: string;
  wordCount: number;
  isAdded: boolean;
  onAdd: () => void;
}

export function LibraryCard({ name, description, wordCount, isAdded, onAdd }: LibraryCardProps) {
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
        <Button onClick={onAdd} disabled={isAdded} className="w-full">
          {isAdded ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              已添加
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              添加到我的词库
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}