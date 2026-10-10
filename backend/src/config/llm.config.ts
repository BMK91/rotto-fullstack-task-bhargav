import { env } from "./env.js";

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export function getLlmConfig(): LlmConfig {
  const apiKey = env.LLM_API_KEY;
  const model = env.LLM_MODEL;
  const apiUrl = env.LLM_API_URL?.replace("{{}}", model!);

  // console.log(apiUrl);

  if (!apiUrl || !apiKey || !model) {
    throw new Error("LLM_CONFIGURATION_ERROR");
  }

  return {
    apiUrl,
    apiKey,
    model,
  };
}
