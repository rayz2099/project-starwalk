import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stargazing Planner",
  description: "多地点 x 多日期 观星条件对比矩阵"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="dark">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
