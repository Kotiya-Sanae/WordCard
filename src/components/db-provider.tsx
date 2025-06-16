"use client";

import { populate } from "@/lib/db";
import { useEffect } from "react";

export function DBProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 在开发环境中填充初始数据
    if (process.env.NODE_ENV === 'development') {
      populate();
    }
  }, []);

  return <>{children}</>;
}