import { describe, expect, it, vi } from "vitest";
import { createReplyStream, providerModelName, providerOptions, selectProvider } from "@/lib/llm";

async function readStream(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).text();
}

describe("selectProvider", () => {
  it("reports incomplete or invalid configuration", () => {
    expect(selectProvider({})).toBe("unconfigured");
    expect(selectProvider({ LLM_PROVIDER: "other" })).toBe("unconfigured");
    expect(selectProvider({ LLM_PROVIDER: "openai" })).toBe("unconfigured");
    expect(selectProvider({ LLM_PROVIDER: "ollama" })).toBe("unconfigured");
  });

  it("selects providers from their base URL without requiring a key or model", () => {
    expect(selectProvider({ LLM_PROVIDER: "openai", OPENAI_BASE_URL: "http://localhost:8080/v1" })).toBe("openai");
    expect(selectProvider({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://localhost:11434" })).toBe("ollama");
  });
});

describe("providerModelName", () => {
  it("shows the configured model without exposing other provider settings", async () => {
    await expect(providerModelName({ LLM_PROVIDER: "openai", OPENAI_BASE_URL: "https://provider.test/v1", OPENAI_MODEL: "gpt-example" })).resolves.toBe("gpt-example");
    await expect(providerModelName({ LLM_PROVIDER: "ollama", OLLAMA_BASE_URL: "http://localhost:11434", OLLAMA_MODEL: "llama-example" })).resolves.toBe("llama-example");
  });

  it("discovers the actual model name through the provider API", async () => {
    const fetcher = vi.fn(async () => Response.json({ data: [{ id: "gpt-oss-20b" }] })) as typeof fetch;
    await expect(providerModelName({
      LLM_PROVIDER: "openai",
      OPENAI_BASE_URL: "https://provider.test/v1",
      OPENAI_API_KEY: "secret",
    }, fetcher)).resolves.toBe("gpt-oss-20b");
    expect(fetcher).toHaveBeenCalledWith("https://provider.test/v1/models", expect.objectContaining({
      headers: { Authorization: "Bearer secret" },
    }));
  });

  it("uses a clear fallback when model discovery is unavailable", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 503 })) as typeof fetch;
    await expect(providerModelName({ LLM_PROVIDER: "openai", OPENAI_BASE_URL: "https://provider.test/v1" }, fetcher)).resolves.toBe("Model unavailable");
    await expect(providerModelName({})).resolves.toBe("Model unavailable");
  });
});

describe("providerOptions", () => {
  it("uses provider names from the environment and honors the initial provider", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/models")
      ? Response.json({ data: [{ id: "gpt-oss-20b" }] })
      : Response.json({ models: [{ name: "llama-local" }] })) as typeof fetch;
    const config = {
      LLM_PROVIDER: "ollama",
      OPENAI_PROVIDER_NAME: "vLLM",
      OPENAI_BASE_URL: "https://provider.test/v1",
      OPENAI_MODEL: "gpt-oss-20b",
      OLLAMA_PROVIDER_NAME: "Ollama",
      OLLAMA_BASE_URL: "http://localhost:11434",
      OLLAMA_MODEL: "llama-local",
    };
    await expect(providerOptions(config, fetcher)).resolves.toEqual({
      providers: [
        { id: "openai", name: "vLLM", model: "gpt-oss-20b" },
        { id: "ollama", name: "Ollama", model: "llama-local" },
      ],
      initialProvider: "ollama",
    });
    await expect(providerOptions({ ...config, LLM_PROVIDER: "openai" }, fetcher)).resolves.toMatchObject({
      initialProvider: "openai",
    });
  });

  it("omits unavailable providers and reports no provider when all checks fail", async () => {
    const config = {
      LLM_PROVIDER: "openai",
      OPENAI_PROVIDER_NAME: "vLLM",
      OPENAI_BASE_URL: "https://provider.test/v1",
      OPENAI_MODEL: "gpt-oss-20b",
      OLLAMA_PROVIDER_NAME: "Ollama",
      OLLAMA_BASE_URL: "http://localhost:11434",
      OLLAMA_MODEL: "llama-local",
    };
    const onlyOllama = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/models")
      ? new Response(null, { status: 503 })
      : Response.json({ models: [{ name: "llama-local" }] })) as typeof fetch;
    await expect(providerOptions(config, onlyOllama)).resolves.toEqual({
      providers: [{ id: "ollama", name: "Ollama", model: "llama-local" }],
      initialProvider: "ollama",
    });

    const unavailable = vi.fn(async () => new Response(null, { status: 503 })) as typeof fetch;
    await expect(providerOptions(config, unavailable)).resolves.toEqual({
      providers: [],
      initialProvider: undefined,
    });
  });
});

describe("createReplyStream", () => {
  it("normalizes an OpenAI-compatible SSE stream", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: "Bearer secret" });
      expect(JSON.parse(String(init?.body))).toMatchObject({ model: "chat-model", stream: true });
      return new Response([
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        'data: {"choices":[{"delta":{"content":" world"}}]}',
        "data: [DONE]",
        "",
      ].join("\n\n"), { headers: { "Content-Type": "text/event-stream" } });
    }) as typeof fetch;

    const stream = await createReplyStream({
      LLM_PROVIDER: "openai",
      OPENAI_BASE_URL: "http://provider.test/v1/",
      OPENAI_API_KEY: "secret",
      OPENAI_MODEL: "chat-model",
    }, [{ role: "user", content: "Hi" }], fetcher);

    expect(await readStream(stream)).toBe("Hello world");
    expect(fetcher).toHaveBeenCalledWith("http://provider.test/v1/chat/completions", expect.any(Object));
  });

  it("discovers an OpenAI-compatible model when none is configured", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/models")) {
        return Response.json({ data: [{ id: "available-model" }] });
      }
      expect(JSON.parse(String(init?.body)).model).toBe("available-model");
      return Response.json({ choices: [{ message: { content: "Discovered" } }] });
    }) as typeof fetch;

    const stream = await createReplyStream({
      LLM_PROVIDER: "openai",
      OPENAI_BASE_URL: "http://provider.test/v1",
    }, [{ role: "user", content: "Hi" }], fetcher);
    expect(await readStream(stream)).toBe("Discovered");
  });

  it("discovers an Ollama model and normalizes its NDJSON stream", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/api/tags")) {
        return Response.json({ models: [{ name: "llama-test" }] });
      }
      expect(JSON.parse(String(init?.body))).toMatchObject({ model: "llama-test", stream: true });
      return new Response([
        '{"message":{"content":"Hello"},"done":false}',
        '{"message":{"content":" Ollama"},"done":true}',
        "",
      ].join("\n"));
    }) as typeof fetch;

    const stream = await createReplyStream({
      LLM_PROVIDER: "ollama",
      OLLAMA_BASE_URL: "http://localhost:11434",
    }, [{ role: "user", content: "Hi" }], fetcher);
    expect(await readStream(stream)).toBe("Hello Ollama");
  });

  it("returns a user-facing error for incomplete configuration", async () => {
    await expect(createReplyStream({}, [{ role: "user", content: "Hi" }])).rejects.toMatchObject({
      publicMessage: expect.stringContaining("No LLM provider is configured"),
    });
  });
});
