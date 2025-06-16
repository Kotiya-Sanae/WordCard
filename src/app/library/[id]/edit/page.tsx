"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AddWordForm } from "@/components/add/AddWordForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditWordPage() {
  const params = useParams();
  const id = params.id as string;

  const word = useLiveQuery(() => db.words.get(id), [id]);

  if (!word) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">编辑单词</h1>
      </div>
      <AddWordForm initialData={word} />
    </div>
  );
}