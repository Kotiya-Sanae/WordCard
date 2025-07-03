"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import { Header } from "@/components/layout/Header";

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
    <div className="flex flex-col h-full">
      <Header title={title} showBackButton />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}