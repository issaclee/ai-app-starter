"use client";

import { ArrowUp, Bot, Folder, LoaderCircle, Plus, RotateCcw, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";
import { MessageActions } from "@/components/message-actions";
import { ResponseEditor } from "@/components/response-editor";
import type { ChatMessage } from "@/lib/chat-schema";
import type { ProviderOption } from "@/lib/llm";

const MAX_COMPOSER_HEIGHT = 200;
const MAX_MESSAGE_EDITOR_HEIGHT = 480;
type UiMessage = ChatMessage & { id: string };
type EditState = { id: string; draft: string } | null;
type ExportFormat = "md" | "pdf" | "docx";

function createMessage(role: ChatMessage["role"], content: string): UiMessage {
  return { id: crypto.randomUUID(), role, content };
}

function apiMessages(messages: UiMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.content.trim())
    .map(({ role, content }) => ({ role, content }));
}

function resizeMessageEditor(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const viewportLimit = Math.max(240, window.innerHeight * 0.55);
  const maxHeight = Math.min(MAX_MESSAGE_EDITOR_HEIGHT, viewportLimit);
  const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

export function ChatInterface({
  chatId,
  providers,
  initialProvider,
}: {
  chatId?: string;
  providers: ProviderOption[];
  initialProvider?: ProviderOption["id"];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(chatId));
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EditState>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadMenuId, setDownloadMenuId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<{ id: string; format: ExportFormat } | null>(null);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(initialProvider ?? providers[0]?.id ?? "");
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageEditorRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const editingId = editing?.id;
  const selectedProviderOption = providers.find(({ id }) => id === selectedProvider);

  useEffect(() => {
    let active = true;

    if (!chatId) {
      return () => { active = false; };
    }

    void fetch(`/api/chats/${encodeURIComponent(chatId)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "This chat no longer exists." : "Unable to load this chat.");
        return response.json() as Promise<{ messages: ChatMessage[] }>;
      })
      .then((data) => {
        if (active) setMessages(data.messages.map((message) => createMessage(message.role, message.content)));
      })
      .catch((reason) => {
        if (!active) return;
        setMessages([]);
        setError(reason instanceof Error ? reason.message : "Unable to load this chat.");
      })
      .finally(() => { if (active) setLoadingHistory(false); });

    return () => { active = false; };
  }, [chatId]);

  useEffect(() => {
    const reset = () => {
      abortRef.current?.abort();
      setMessages([]);
      setDraft("");
      setError("");
      setEditing(null);
      setPending(false);
      setPendingMessageId(null);
      setActiveChatId(undefined);
      textareaRef.current?.focus();
    };
    window.addEventListener("plainchat:new", reset);
    return () => {
      abortRef.current?.abort();
      window.removeEventListener("plainchat:new", reset);
    };
  }, []);

  async function persistChat(history: UiMessage[]) {
    const payload = { messages: apiMessages(history) };
    const currentId = activeChatId;
    const response = await fetch(currentId ? `/api/chats/${encodeURIComponent(currentId)}` : "/api/chats", {
      method: currentId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("The conversation could not be saved to chat history.");
    const saved = await response.json() as { id: string };
    setActiveChatId(saved.id);
    window.dispatchEvent(new Event("plainchat:history-changed"));
    if (!currentId) router.replace(`/chat/${saved.id}`);
  }

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

  useEffect(() => {
    const textarea = messageEditorRef.current;
    if (!textarea || !editingId) return;
    resizeMessageEditor(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [editingId]);

  useEffect(() => {
    const textarea = messageEditorRef.current;
    if (!textarea || !editingId) return;
    resizeMessageEditor(textarea);
  }, [editing?.draft, editingId]);

  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDownloadMenuId(null);
        setAttachmentMenuOpen(false);
        setEditing(null);
      }
    };
    const closeAttachmentMenu = (event: MouseEvent) => {
      if (!attachmentMenuRef.current?.contains(event.target as Node)) setAttachmentMenuOpen(false);
    };
    document.addEventListener("keydown", closeMenus);
    document.addEventListener("mousedown", closeAttachmentMenu);
    return () => {
      document.removeEventListener("keydown", closeMenus);
      document.removeEventListener("mousedown", closeAttachmentMenu);
    };
  }, []);

  async function requestAssistant(history: UiMessage[]) {
    if (pending) return;
    const assistant = createMessage("assistant", "");
    const requestMessages = apiMessages(history);
    setMessages([...history, assistant]);
    setPending(true);
    setPendingMessageId(assistant.id);
    setError("");
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, provider: selectedProvider || undefined }),
        signal: abortController.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Unable to get a response.");
      }
      if (!response.body) throw new Error("The assistant did not return a response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { value, done } = await reader.read();
        content += decoder.decode(value, { stream: !done });
        setMessages((current) => current.map((message) => (
          message.id === assistant.id ? { ...message, content } : message
        )));
        if (done) break;
      }
      if (!content.trim()) throw new Error("The assistant returned an empty response.");
      const completedHistory = [...history, { ...assistant, content }];
      try {
        await persistChat(completedHistory);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "The conversation could not be saved to chat history.");
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setMessages((current) => current.filter((message) => message.id !== assistant.id || message.content));
      setError(reason instanceof TypeError
        ? "The assistant is unavailable or the response stream was interrupted. Please try again."
        : reason instanceof Error ? reason.message : "Unable to get a response.");
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
      setPending(false);
      setPendingMessageId(null);
      textareaRef.current?.focus();
    }
  }

  function send() {
    const content = draft.trim();
    if (!content || pending) return;
    const nextMessages = [...messages, createMessage("user", content)];
    setDraft("");
    void requestAssistant(nextMessages);
  }

  function retry() {
    const lastUserIndex = messages.findLastIndex((message) => message.role === "user");
    if (lastUserIndex < 0 || pending) return;
    void requestAssistant(messages.slice(0, lastUserIndex + 1));
  }

  function resendEditedMessage() {
    if (!editing?.draft.trim() || pending) return;
    const index = messages.findIndex((message) => message.id === editing.id && message.role === "user");
    if (index < 0) return;
    const edited = { ...messages[index], content: editing.draft.trim() };
    const history = [...messages.slice(0, index), edited];
    setEditing(null);
    void requestAssistant(history);
  }

  function saveAssistantEdit(value?: string) {
    const content = value?.trim() ?? editing?.draft.trim();
    if (!content || !editing) return;
    const updatedMessages = messages.map((message) => (
      message.id === editing.id ? { ...message, content } : message
    ));
    setMessages(updatedMessages);
    setEditing(null);
    void persistChat(updatedMessages).catch(() => setError("The edited response could not be saved to chat history."));
  }

  async function copyMessage(message: UiMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((current) => current === message.id ? null : current), 1500);
    } catch {
      setError("The message could not be copied. Check your browser's clipboard permission.");
    }
  }

  async function downloadResponse(message: UiMessage, format: ExportFormat) {
    setDownloading({ id: message.id, format });
    setError("");
    try {
      const response = await fetch("/api/chat/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.content, format }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "The response could not be downloaded.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `assistant-response.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setDownloadMenuId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The response could not be downloaded.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          {loadingHistory ? (
            <div className="grid min-h-[55vh] place-items-center text-muted-foreground" role="status">
              <span className="inline-flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={17} /> Loading conversation…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="grid min-h-[55vh] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand text-white"><Bot size={22} /></span>
                <h1 className="mt-5 text-2xl font-semibold tracking-tight">What can I help with?</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Start a conversation with the configured language model.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  {["Outline a project plan", "Draft a concise update", "Explain a technical idea"].map((prompt) => (
                    <button key={prompt} onClick={() => { setDraft(prompt); textareaRef.current?.focus(); }} className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isEditing = editing?.id === message.id;
                return (
                  <article className={`group flex w-full items-start gap-3 sm:gap-4 ${isUser ? "flex-row-reverse" : ""}`} key={message.id}>
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full ${isUser ? "bg-brand-emphasis text-white" : "bg-brand-secondary/30 text-brand"}`}>
                      {isUser ? <User size={15} /> : <Bot size={16} />}
                    </span>
                    <div className={`min-w-0 ${isUser && !isEditing ? "max-w-[85%]" : "flex-1"}`}>
                      {isEditing && isUser ? (
                        <div className="message-editor rounded-2xl bg-composer p-3 shadow-sm">
                          <textarea
                            ref={messageEditorRef}
                            value={editing.draft}
                            onChange={(event) => setEditing({ ...editing, draft: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.preventDefault();
                                event.stopPropagation();
                                setEditing(null);
                              } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                event.preventDefault();
                                resendEditedMessage();
                              }
                            }}
                            rows={1}
                            spellCheck
                            className="block min-h-10 w-full resize-none bg-transparent text-sm leading-6 outline-none"
                          />
                          <div className="mt-3 flex justify-end gap-2">
                            <button type="button" onClick={() => setEditing(null)} className="button-secondary min-h-8 px-3 py-1.5 text-xs">Cancel</button>
                            <button type="button" onClick={resendEditedMessage} disabled={!editing.draft.trim()} className="button-primary min-h-8 px-3 py-1.5 text-xs">Resend</button>
                          </div>
                        </div>
                      ) : isEditing ? (
                        <ResponseEditor
                          initialValue={editing.draft}
                          onCancel={() => setEditing(null)}
                          onSave={saveAssistantEdit}
                        />
                      ) : isUser ? (
                        <div className="rounded-3xl rounded-tr-md bg-muted px-4 py-2.5 whitespace-pre-wrap text-sm leading-7">{message.content}</div>
                      ) : message.id === pendingMessageId && !message.content ? (
                        <div className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={17} /> Thinking…</div>
                      ) : (
                        <MarkdownContent>{message.content}</MarkdownContent>
                      )}
                      {!isEditing && message.content && (
                        <div className={`mt-1 flex ${isUser ? "justify-end" : "justify-start"} opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100`}>
                          <MessageActions
                            copied={copiedId === message.id}
                            disabled={pending}
                            onCopy={() => void copyMessage(message)}
                            onEdit={() => setEditing({ id: message.id, draft: message.content })}
                            downloadOpen={!isUser && downloadMenuId === message.id}
                            onToggleDownload={!isUser ? () => setDownloadMenuId((current) => current === message.id ? null : message.id) : undefined}
                            onDownload={!isUser ? (format) => void downloadResponse(message, format) : undefined}
                            downloadingFormat={downloading?.id === message.id ? downloading.format : null}
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {error && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-brand-danger/15 px-4 py-3 text-sm text-brand-danger">
                  <span>{error}</span>
                  <button type="button" disabled={pending} onClick={retry} className="inline-flex shrink-0 items-center gap-1 font-medium disabled:opacity-50"><RotateCcw size={14} /> Retry</button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/95 px-3 pb-4 pt-2 backdrop-blur sm:px-4 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          <div className="chat-composer rounded-[26px] bg-composer p-2 ring-1 ring-black/5 dark:ring-white/10">
            <div className="flex items-end pl-2">
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
                    send();
                  }
                }}
                placeholder="How can I help?"
                className="min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm leading-5 outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="mt-1 flex min-h-8 items-center justify-between px-1">
              <div className="relative" ref={attachmentMenuRef}>
                <button
                  type="button"
                  aria-label="Add to prompt"
                  aria-haspopup="menu"
                  aria-expanded={attachmentMenuOpen}
                  onClick={() => setAttachmentMenuOpen((open) => !open)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Plus size={19} />
                </button>
                {attachmentMenuOpen && (
                  <div role="menu" className="absolute bottom-10 left-0 z-40 w-48 rounded-xl border border-border bg-panel p-1.5 shadow-xl">
                    <button type="button" role="menuitem" disabled className="flex w-full cursor-default items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground disabled:opacity-70">
                      <Folder size={16} /> Files and folders
                    </button>
                  </div>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-1">
                <label htmlFor="llm-provider" className="sr-only">LLM provider</label>
                <select
                  id="llm-provider"
                  value={selectedProvider}
                  disabled={pending || !providers.length}
                  onChange={(event) => setSelectedProvider(event.target.value as ProviderOption["id"])}
                  className="min-w-0 max-w-[9rem] cursor-pointer truncate rounded-lg bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="LLM provider"
                >
                  {!providers.length && <option value="">No provider</option>}
                  {providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}</option>)}
                </select>
                {selectedProviderOption && (
                  <span className="max-w-[min(35vw,14rem)] truncate px-2 text-right text-xs font-medium text-muted-foreground" title={selectedProviderOption.model}>
                    {selectedProviderOption.model}
                  </span>
                )}
                <button type="button" onClick={send} disabled={!draft.trim() || pending || !selectedProviderOption} aria-label="Send message" className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-emphasis disabled:opacity-30">
                  {pending ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowUp size={16} />}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">LLM can make mistakes. Check important information.</p>
        </div>
      </div>
    </div>
  );
}
