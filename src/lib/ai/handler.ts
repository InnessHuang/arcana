import { readingRequestSchema } from "./contracts";
import {
  generateReading,
  readLimitedText,
  ReadingAPIError,
  errorDetails,
  type DeepSeekConfig,
} from "./deepseek";

// Kept injectable for route-level tests; production configuration is server-only.
export function createReadingHandler(
  configure: () => DeepSeekConfig,
  fetcher: typeof fetch = fetch,
) {
  return async function POST(request: Request) {
    const headers = {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    };
    try {
      if (
        request.headers
          .get("content-type")
          ?.split(";")[0]
          .trim()
          .toLowerCase() !== "application/json"
      )
        throw new ReadingAPIError("INVALID_INPUT");
      const origin = request.headers.get("origin");
      if (origin) {
        // Next may normalize request.url to localhost behind its local server.
        // Compare the browser origin with the actual incoming Host, not that internal URL.
        let source: URL;
        try {
          source = new URL(origin);
        } catch {
          throw new ReadingAPIError("INVALID_INPUT");
        }
        if (
          !["http:", "https:"].includes(source.protocol) ||
          source.host !==
            (request.headers.get("host") || new URL(request.url).host)
        )
          throw new ReadingAPIError("INVALID_INPUT");
      }
      const raw = await readLimitedText(request.body, 16000, "TOO_LARGE");
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new ReadingAPIError("INVALID_INPUT");
      }
      const parsed = readingRequestSchema.safeParse(data);
      if (!parsed.success) throw new ReadingAPIError("INVALID_INPUT");
      let config: DeepSeekConfig;
      try {
        config = configure();
      } catch (error) {
        if (error instanceof ReadingAPIError) throw error;
        throw new ReadingAPIError("CONFIG_ERROR");
      }
      const reading = await generateReading(
        parsed.data,
        config,
        fetcher,
        request.signal,
      );
      return Response.json({ reading }, { headers });
    } catch (error) {
      const code =
        error instanceof ReadingAPIError ? error.code : "PROVIDER_ERROR";
      return Response.json(
        { error: { code, message: errorDetails[code].message } },
        {
          status: errorDetails[code].status,
          headers: {
            ...headers,
            ...(code === "RATE_LIMITED" ? { "Retry-After": "30" } : {}),
          },
        },
      );
    }
  };
}
