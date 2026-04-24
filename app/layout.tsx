import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stargazing Planner",
  description: "多地点 x 多日期 观星条件对比矩阵"
};

// 浏览器 UI（地址栏 / 状态栏）颜色随系统主题
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d18" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 不强制 dark：颜色变量通过 prefers-color-scheme 媒体查询切换，跟随系统
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
