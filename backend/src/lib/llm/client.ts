import { getLlmConfig } from "@/config/llm.config.js";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    status?: string;
    message?: string;
  };
}

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 60_000;
const INITIAL_RETRY_DELAY_MS = 500;
const MAX_OUTPUT_TOKENS = 4096;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export async function generateLlmText(prompt: string): Promise<string> {
  const config = getLlmConfig();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            thinkingConfig: {
              thinkingLevel: "low",
            },
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      const isTimeout = error instanceof Error && error.name === "TimeoutError";

      console.error("LLM request failed:", {
        type: isTimeout ? "timeout" : "network",
        message: error instanceof Error ? error.message : "Unknown error",
        attempt: attempt + 1,
      });

      // Do not retry timed-out requests: each attempt can take 15 seconds.
      throw new Error(isTimeout ? "LLM_REQUEST_TIMEOUT" : "LLM_REQUEST_FAILED");
    }

    const responseText = await response.text();

    let result: unknown;

    try {
      result = JSON.parse(responseText);
    } catch {
      result = null;
    }

    if (!response.ok) {
      const apiError = isGeminiResponse(result) ? result.error : undefined;

      console.error("Gemini API error:", {
        httpStatus: response.status,
        providerStatus: apiError?.status,
        providerCode: apiError?.code,
        message: apiError?.message,
        attempt: attempt + 1,
      });

      if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
        await delay(INITIAL_RETRY_DELAY_MS * 2 ** attempt);
        continue;
      }

      throw new Error("LLM_REQUEST_FAILED");
    }

    if (!isGeminiResponse(result)) {
      throw new Error("LLM_INVALID_RESPONSE");
    }

    const generatedText = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!generatedText) {
      throw new Error("LLM_EMPTY_RESPONSE");
    }

    return generatedText;
  }

  throw new Error("LLM_REQUEST_FAILED");
}

function isGeminiResponse(value: unknown): value is GeminiResponse {
  return typeof value === "object" && value !== null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
