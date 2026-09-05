import type { ChatMessage } from "@/lib/chat-schema";

export type ProviderKind = "openai" | "ollama" | "unconfigured";
export type ProviderConfig = {
  LLM_PROVIDER?: string;
  OPENAI_PROVIDER_NAME?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OLLAMA_PROVIDER_NAME?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
};

export type ProviderOption = {
  id: Exclude<ProviderKind, "unconfigured">;
  name: string;
  model: string;
};

type Fetcher = typeof fetch;

export class ProviderError extends Error {
  constructor(public readonly publicMessage: string, cause?: unknown) {
    super(publicMessage, { cause });
    this.name = "ProviderError";
  }
}

export function selectProvider(config: ProviderConfig): ProviderKind {
  const provider = config.LLM_PROVIDER?.trim().toLowerCase();
  if (provider === "openai" && config.OPENAI_BASE_URL?.trim()) return "openai";
  if (provider === "ollama" && config.OLLAMA_BASE_URL?.trim()) return "ollama";
  return "unconfigured";
}

function environmentConfig(): ProviderConfig {
  return {
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    OPENAI_PROVIDER_NAME: process.env.OPENAI_PROVIDER_NAME,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OLLAMA_PROVIDER_NAME: process.env.OLLAMA_PROVIDER_NAME,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  };
}

export function currentProvider() {
  return selectProvider(environmentConfig());
}

function normalizeBaseUrl(value: string, providerName: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid protocol");
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    throw new ProviderError(`${providerName} has an invalid base URL. Check the server configuration.`, error);
  }
}

function textStream(content: string) {
  const bytes = new TextEncoder().encode(content);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function resolveOpenAIModel(config: ProviderConfig, baseUrl: string, headers: HeadersInit, fetcher: Fetcher) {
  const configured = config.OPENAI_MODEL?.trim();
  if (configured) return configured;

  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/models`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new ProviderError("Unable to discover an available model from the OpenAI-compatible provider.", error);
  }
  if (!response.ok) {
    throw new ProviderError("No OpenAI model is configured, and the provider's available models could not be loaded.");
  }
  const data = await response.json() as { data?: Array<{ id?: string }> };
  const model = data.data?.find((entry) => entry.id?.trim())?.id?.trim();
  if (!model) throw new ProviderError("No OpenAI model is configured and the provider reported no available models.");
  return model;
}

async function resolveOllamaModel(config: ProviderConfig, baseUrl: string, fetcher: Fetcher) {
  const configured = config.OLLAMA_MODEL?.trim();
  if (configured) return configured;

  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new ProviderError("Unable to discover an available Ollama model.", error);
  }
  if (!response.ok) throw new ProviderError("No Ollama model is configured, and available models could not be loaded.");
  const data = await response.json() as { models?: Array<{ name?: string }> };
  const model = data.models?.find((entry) => entry.name?.trim())?.name?.trim();
  if (!model) throw new ProviderError("No Ollama model is configured and Ollama has no downloaded models.");
  return model;
}

export async function providerModelName(config: ProviderConfig = environmentConfig(), fetcher: Fetcher = fetch) {
  const provider = selectProvider(config);
  try {
    if (provider === "openai") {
      const baseUrl = normalizeBaseUrl(config.OPENAI_BASE_URL!, "The OpenAI-compatible provider");
      const headers: Record<string, string> = {};
      const apiKey = config.OPENAI_API_KEY?.trim();
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      return await resolveOpenAIModel(config, baseUrl, headers, fetcher);
    }
    if (provider === "ollama") {
      const baseUrl = normalizeBaseUrl(config.OLLAMA_BASE_URL!, "Ollama");
      return await resolveOllamaModel(config, baseUrl, fetcher);
    }
  } catch {
    return "Model unavailable";
  }
  return "Model unavailable";
}

export async function providerOptions(config: ProviderConfig = environmentConfig(), fetcher: Fetcher = fetch) {
  const candidates: Array<{ id: ProviderOption["id"]; name: string }> = [];
  if (config.OPENAI_BASE_URL?.trim()) {
    candidates.push({ id: "openai", name: config.OPENAI_PROVIDER_NAME?.trim() || "OpenAI compatible" });
  }
  if (config.OLLAMA_BASE_URL?.trim()) {
    candidates.push({ id: "ollama", name: config.OLLAMA_PROVIDER_NAME?.trim() || "Ollama" });
  }

  const checkedProviders = await Promise.all(candidates.map(async ({ id, name }): Promise<ProviderOption | null> => {
    try {
      if (id === "openai") {
        const baseUrl = normalizeBaseUrl(config.OPENAI_BASE_URL!, "The OpenAI-compatible provider");
        const headers: Record<string, string> = {};
        const apiKey = config.OPENAI_API_KEY?.trim();
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        const response = await fetcher(`${baseUrl}/models`, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) return null;
        const data = await response.json() as { data?: Array<{ id?: string }> };
        const model = config.OPENAI_MODEL?.trim() || data.data?.find((entry) => entry.id?.trim())?.id?.trim();
        return model ? { id, name, model } : null;
      }

      const baseUrl = normalizeBaseUrl(config.OLLAMA_BASE_URL!, "Ollama");
      const response = await fetcher(`${baseUrl}/api/tags`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) return null;
      const data = await response.json() as { models?: Array<{ name?: string }> };
      const model = config.OLLAMA_MODEL?.trim() || data.models?.find((entry) => entry.name?.trim())?.name?.trim();
      return model ? { id, name, model } : null;
    } catch {
      return null;
    }
  }));
  const providers = checkedProviders.filter((provider): provider is ProviderOption => provider !== null);
  const configured = config.LLM_PROVIDER?.trim().toLowerCase();
  const initialProvider = providers.some(({ id }) => id === configured)
    ? configured as ProviderOption["id"]
    : providers[0]?.id;

  return { providers, initialProvider };
}

function openAIStream(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().then((data: { choices?: Array<{ message?: { content?: string } }> }) => {
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new ProviderError("The OpenAI-compatible provider returned an empty response.");
      return textStream(content);
    });
  }

  if (!response.body) throw new ProviderError("The OpenAI-compatible provider did not return a response stream.");
  const upstream = response.body;
  return Promise.resolve(new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";
          for (const event of events) {
            for (const line of event.split(/\r?\n/)) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              const data = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }>; error?: { message?: string } };
              if (data.error) throw new ProviderError("The OpenAI-compatible provider stopped while generating a response.");
              const content = data.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            }
          }
          if (done) break;
        }
        controller.close();
      } catch (error) {
        controller.error(error instanceof ProviderError ? error : new ProviderError("The OpenAI-compatible response stream was interrupted.", error));
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      return upstream.cancel();
    },
  }));
}

async function openAIReplyStream(config: ProviderConfig, messages: ChatMessage[], fetcher: Fetcher) {
  const baseUrl = normalizeBaseUrl(config.OPENAI_BASE_URL!, "The OpenAI-compatible provider");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = config.OPENAI_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const model = await resolveOpenAIModel(config, baseUrl, headers, fetcher);

  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, stream: true }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    throw new ProviderError("The OpenAI-compatible provider is unavailable. Check its URL and network connection.", error);
  }
  if (response.status === 401 || response.status === 403) {
    throw new ProviderError("The OpenAI-compatible provider rejected the configured API key.");
  }
  if (!response.ok) {
    throw new ProviderError(`The OpenAI-compatible provider returned an error (HTTP ${response.status}). Check its URL and model.`);
  }
  return openAIStream(response);
}

function ollamaStream(response: Response) {
  if (!response.body) throw new ProviderError("Ollama did not return a response stream.");
  const upstream = response.body;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          if (done && buffer) lines.push(buffer);
          for (const line of lines) {
            if (!line.trim()) continue;
            const data = JSON.parse(line) as { message?: { content?: string }; error?: string };
            if (data.error) throw new ProviderError("Ollama stopped while generating a response.");
            if (data.message?.content) controller.enqueue(encoder.encode(data.message.content));
          }
          if (done) break;
        }
        controller.close();
      } catch (error) {
        controller.error(error instanceof ProviderError ? error : new ProviderError("The Ollama response stream was interrupted.", error));
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      return upstream.cancel();
    },
  });
}

async function ollamaReplyStream(config: ProviderConfig, messages: ChatMessage[], fetcher: Fetcher) {
  const baseUrl = normalizeBaseUrl(config.OLLAMA_BASE_URL!, "Ollama");
  const model = await resolveOllamaModel(config, baseUrl, fetcher);
  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    throw new ProviderError("Ollama is unavailable. Make sure it is running and check OLLAMA_BASE_URL.", error);
  }
  if (!response.ok) throw new ProviderError(`Ollama returned an error (HTTP ${response.status}). Check the configured model.`);
  return ollamaStream(response);
}

export async function createReplyStream(config: ProviderConfig, messages: ChatMessage[], fetcher: Fetcher = fetch) {
  const provider = selectProvider(config);
  if (provider === "openai") return openAIReplyStream(config, messages, fetcher);
  if (provider === "ollama") return ollamaReplyStream(config, messages, fetcher);
  throw new ProviderError("No LLM provider is configured. Set LLM_PROVIDER and the selected provider's base URL.");
}

export function generateReplyStream(messages: ChatMessage[], provider?: ProviderOption["id"]) {
  const config = environmentConfig();
  return createReplyStream(provider ? { ...config, LLM_PROVIDER: provider } : config, messages);
}
