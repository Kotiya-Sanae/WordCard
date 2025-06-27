"use client";

import { populate } from "@/lib/db";
import { useEffect } from "react";

export function DBProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 在开发环境中填充初始数据
    // NOTE: The populate() function is disabled as it conflicts with the cloud sync logic.
    // The single source of truth is now the cloud database.
    // if (process.env.NODE_ENV === 'development') {
    //   populate();
    // }
  }, []);

  return <>{children}</>;
}