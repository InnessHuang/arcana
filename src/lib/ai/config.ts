import "server-only";
import type { DeepSeekConfig } from "./deepseek";
import { ReadingAPIError } from "./deepseek";

// Only this server-only module reads provider credentials/configuration.
export function getDeepSeekConfig(): DeepSeekConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) throw new ReadingAPIError("NOT_CONFIGURED");
  const base = new URL(
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  );
  if (
    base.protocol !== "https:" ||
    base.hostname !== "api.deepseek.com" ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.port ||
    !["/", "/v1", "/v1/"].includes(base.pathname)
  )
    throw new ReadingAPIError("CONFIG_ERROR");
  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(model))
    throw new ReadingAPIError("CONFIG_ERROR");
  return {
    apiKey,
    endpoint: base.toString().replace(/\/$/, "") + "/chat/completions",
    model,
    timeoutMs: 45000,
    temperature: 0.6,
    maxTokens: 4000,
  };
}
