import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知途 · 天赋事业报告 | 看见优势，找到路径",
  description: "梳理个人天赋与商业路径，解答个人 IP、事业定位和变现方向等 8 个核心问题。提交个人资料，通过本地浏览器插件立即分析并展示结果。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
