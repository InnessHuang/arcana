import { getDeepSeekConfig } from "@/lib/ai/config";
import { createReadingHandler } from "@/lib/ai/handler";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = createReadingHandler(getDeepSeekConfig);
