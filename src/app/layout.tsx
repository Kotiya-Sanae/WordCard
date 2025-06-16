import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/components/theme-provider";
import { DBProvider } from "@/components/db-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "WordCard - 你的单词记忆助手",
  description: "一个使用Next.js构建的现代单词卡片应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DBProvider>
            <div className="relative w-full max-w-md mx-auto h-screen bg-background shadow-lg flex flex-col">
              <main className="flex-1 overflow-y-auto pb-20">{children}</main>
              <BottomNav />
            </div>
          </DBProvider>
        </ThemeProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
