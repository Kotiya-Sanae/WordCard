"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useMemo } from "react";

const titleMap: Record<string, string> = {
  "/settings": "设置",
  "/settings/appearance": "外观设置",
  "/settings/learning": "学习设置",
  "/settings/about": "关于",
  "/settings/developer": "开发者模式",
  "/settings/data": "数据管理",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isMainSettingsPage = pathname === "/settings";
  const title = useMemo(() => titleMap[pathname] ?? "设置", [pathname]);

  return (
    <div>
      <header className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">{title}</h1>
      </header>
      {children}
    </div>
  );
}