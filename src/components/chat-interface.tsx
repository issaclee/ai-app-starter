"use client";

import { ArrowUp, Bot, LoaderCircle, RotateCcw, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat-schema";

const MAX_COMPOSER_HEIGHT = 200;

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const reset = () => {
      setMessages([]);
      setDraft("");
      setError("");
      textareaRef.current?.focus();
    };
    window.addEventListener("plainchat:new", reset);
    return () => { window.removeEventListener("plainchat:new", reset); };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_COMPOSER_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, [draft]);

  async function send() {
    const content = draft.trim();
    if (!content || pending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok || !data.message) throw new Error(data.error ?? "Unable to get a response.");
      setMessages([...nextMessages, { role: "assistant", content: data.message }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to get a response.");
    } finally {
      setPending(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          {messages.length === 0 ? (
            <div className="grid min-h-[55vh] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand text-white">
                  <Bot size={22} />
                </span>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight">What can I help with?</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Start a conversation. Without model configuration, AIAppStarter safely echoes your latest message.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  {["Outline a project plan", "Draft a concise update", "Explain a technical idea"].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setDraft(prompt); textareaRef.current?.focus(); }}
                      className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {messages.map((message, index) => (
                <article className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`} key={`${message.role}-${index}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full ${message.role === "user" ? "bg-brand-emphasis text-white" : "bg-brand-secondary/30 text-brand"}`}>
                    {message.role === "user" ? <User size={15} /> : <Bot size={16} />}
                  </span>
                  <div className={`max-w-[85%] whitespace-pre-wrap text-sm leading-7 ${message.role === "user" ? "rounded-3xl bg-muted px-4 py-2.5" : "py-1"}`}>
                    {message.content}
                  </div>
                </article>
              ))}
              {pending && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid size-8 place-items-center rounded-full bg-muted"><Bot size={16} /></span>
                  <LoaderCircle className="animate-spin" size={17} /> Thinking…
                </div>
              )}
              {error && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-brand-danger/15 px-4 py-3 text-sm text-brand-danger">
                  <span>{error}</span>
                  <button onClick={send} className="inline-flex items-center gap-1 font-medium"><RotateCcw size={14} /> Retry</button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 px-3 pb-4 pt-2 backdrop-blur sm:px-4 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          <div className="chat-composer flex items-end gap-2 rounded-[26px] bg-composer p-2 pl-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <label htmlFor="message" className="sr-only">Message</label>
            <textarea
              ref={textareaRef}
              id="message"
              rows={1}
              maxLength={8000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Message AIAppStarter"
              className="min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm leading-5 outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => void send()}
              disabled={!draft.trim() || pending}
              aria-label="Send message"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-emphasis disabled:opacity-30"
            >
              <ArrowUp size={17} />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">AIAppStarter can make mistakes. Check important information.</p>
        </div>
      </div>
    </div>
  );
}
