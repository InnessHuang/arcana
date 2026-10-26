import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcana · 让灵感成为可能",
  description: "Arcana 是一个整理想法、连接知识与探索灵感的空间。让零散的思考逐渐成为清晰的方向。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
