import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcana · 答案之外，看见更多可能",
  description:
    "从你在意的问题出发，通过塔罗梳理感受、理解当下，为下一步找到自己的方向。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
