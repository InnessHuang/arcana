import { z } from "zod";
import {
  parseAIReading,
  type AIReading,
  type ReadingRequest,
} from "./contracts";
import { READING_SYSTEM_PROMPT } from "./prompt";

export interface DeepSeekConfig {
  apiKey: string;
  endpoint: string;
  model: string;
  timeoutMs: number;
  temperature: number;
  maxTokens: number;
}
export const errorDetails = {
  INVALID_INPUT: {
    status: 400,
    message: "问题或牌面数据无效，请返回首页重新开始。",
  },
  TOO_LARGE: { status: 413, message: "输入内容过长，请缩短背景说明后重试。" },
  NOT_CONFIGURED: {
    status: 503,
    message: "AI 解读尚未配置。请在服务端设置 DEEPSEEK_API_KEY 后重启服务。",
  },
  CONFIG_ERROR: { status: 503, message: "AI 服务配置有误，请检查服务端配置。" },
  RATE_LIMITED: {
    status: 429,
    message: "请求较频繁或服务额度暂不可用，请稍后重试。",
  },
  TIMEOUT: { status: 504, message: "AI 解读超时，牌面已保留，请稍后重试。" },
  PROVIDER_AUTH: {
    status: 503,
    message: "AI 服务认证或余额不可用，请检查服务端凭据与账户。",
  },
  PROVIDER_ERROR: {
    status: 502,
    message: "AI 服务暂时不可用，牌面已保留，请稍后重试。",
  },
  INVALID_OUTPUT: {
    status: 502,
    message: "AI 返回的解读格式或牌面信息不符合要求，请重试。",
  },
  CANCELLED: { status: 499, message: "本次解读请求已取消。" },
} as const;
export type ReadingErrorCode = keyof typeof errorDetails;
export class ReadingAPIError extends Error {
  constructor(public readonly code: ReadingErrorCode) {
    super(errorDetails[code].message);
  }
}
const envelopeSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.literal("stop"),
        message: z.object({ content: z.string().min(1).max(40000) }),
      }),
    )
    .min(1)
    .max(1),
});
export async function readLimitedText(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  code: ReadingErrorCode,
): Promise<string> {
  if (!body) throw new ReadingAPIError(code);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ReadingAPIError(code);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
export async function generateReading(
  input: ReadingRequest,
  config: DeepSeekConfig,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<AIReading> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) throw new ReadingAPIError("CANCELLED");
  signal?.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  // The race bounds the whole operation, including response body consumption.
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new ReadingAPIError("TIMEOUT"));
    }, config.timeoutMs);
  });
  const operation = async () => {
    const response = await fetcher(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: READING_SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: { type: "json_object" },
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      // Never read or return the provider's raw error (it may contain credentials).
      await response.body?.cancel();
      if (response.status === 429) throw new ReadingAPIError("RATE_LIMITED");
      if ([401, 402, 403].includes(response.status))
        throw new ReadingAPIError("PROVIDER_AUTH");
      throw new ReadingAPIError("PROVIDER_ERROR");
    }
    try {
      const text = await readLimitedText(
        response.body,
        96000,
        "INVALID_OUTPUT",
      );
      if (text.includes(config.apiKey))
        throw new Error("Sensitive provider output");
      const envelope = envelopeSchema.parse(JSON.parse(text));
      const reading = parseAIReading(
        JSON.parse(envelope.choices[0].message.content),
        input,
      );
      if (JSON.stringify(reading).includes(config.apiKey))
        throw new Error("Sensitive provider output");
      return reading;
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new ReadingAPIError("INVALID_OUTPUT");
    }
  };
  try {
    return await Promise.race([operation(), deadline]);
  } catch (error) {
    if (timedOut) throw new ReadingAPIError("TIMEOUT");
    if (signal?.aborted) throw new ReadingAPIError("CANCELLED");
    if (error instanceof ReadingAPIError) throw error;
    throw new ReadingAPIError("PROVIDER_ERROR");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
