"use client";

import { Header } from "@/components/layout/Header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";
import React from "react";

export default function AddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = pathname.split("/").pop() || "manual";

  const handleTabChange = (value: string) => {
    router.push(`/add/${value}`);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="添加内容" showBackButton />
      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手动添加</TabsTrigger>
            <TabsTrigger value="library">添加词库</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-y-auto mt-4">
        {children}
      </div>
    </div>
  );
}