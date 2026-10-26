import type { Metadata } from "next";
import { ReadingExperience } from "@/components/reading/reading-experience";
export const metadata: Metadata = {
  title: "一次探索 · Arcana",
  description: "带着你的问题，通过塔罗梳理感受。本地模拟解读，仅供反思与娱乐。",
};
export default function ReadingPage() {
  return (
    <main className="wrap">
      <ReadingExperience />
    </main>
  );
}
