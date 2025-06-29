import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/components/theme-provider";
import { DBProvider } from "@/components/db-provider";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { WelcomeToast } from "@/components/util/WelcomeToast";
import { SyncProvider } from "@/components/sync-provider";
import ServiceWorkerRegistrar from "@/components/util/ServiceWorkerRegistrar";
import { Analytics } from "@vercel/analytics/next";
import GoogleAnalytics from "@/components/util/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "WordCard - 你的单词记忆助手",
  description: "一个使用Next.js构建的现代单词卡片应用",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WordCard",
  },
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
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DBProvider>
            <SyncProvider>
              <div className="relative w-full max-w-md mx-auto h-screen bg-background shadow-lg flex flex-col">
                <main className="flex-1 overflow-y-auto pb-20">{children}</main>
                <BottomNav />
              </div>
            </SyncProvider>
          </DBProvider>
        </ThemeProvider>
        <Suspense fallback={null}>
          <WelcomeToast />
        </Suspense>
        <Toaster position="top-center" />
        <ServiceWorkerRegistrar />
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
