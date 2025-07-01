"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/add/manual");
  }, [router]);

  return null; // 或者可以显示一个加载指示器
}