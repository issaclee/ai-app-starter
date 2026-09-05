"use client";

import { Code2, Eye } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";
import { htmlToMarkdown } from "@/lib/html-to-markdown";

const MAX_EDITOR_HEIGHT = 480;
type EditorMode = "visual" | "markdown";

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  const maxHeight = Math.min(MAX_EDITOR_HEIGHT, Math.max(240, window.innerHeight * 0.55));
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

const VisualSurface = memo(function VisualSurface({
  initialMarkdown,
  onChange,
  onCancel,
  onSave,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Visual response editor"
      aria-multiline="true"
      onInput={(event) => onChange(htmlToMarkdown(event.currentTarget.innerHTML))}
      onClick={(event) => {
        if ((event.target as Element).closest("a")) event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onSave();
        }
      }}
      className="visual-markdown-editor min-h-10 max-h-[min(480px,55vh)] overflow-y-auto outline-none"
    >
      <MarkdownContent>{initialMarkdown}</MarkdownContent>
    </div>
  );
});

export function ResponseEditor({
  initialValue,
  onCancel,
  onSave,
}: {
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
}) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const [value, setValue] = useState(initialValue);
  const [visualValue, setVisualValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);

  const save = useCallback(() => {
    const nextValue = valueRef.current.trim();
    if (nextValue) onSave(nextValue);
  }, [onSave]);

  const updateFromVisual = useCallback((markdown: string) => {
    valueRef.current = markdown;
    setValue(markdown);
  }, []);

  useEffect(() => {
    if (mode !== "markdown" || !textareaRef.current) return;
    resizeTextarea(textareaRef.current);
    textareaRef.current.focus();
  }, [mode, value]);

  function selectMode(nextMode: EditorMode) {
    if (nextMode === mode) return;
    if (nextMode === "visual") setVisualValue(valueRef.current);
    setMode(nextMode);
  }

  return (
    <div className="w-full">
      <div className="message-editor rounded-2xl bg-composer px-4 py-3.5 shadow-sm">
        <div className="mb-3 flex justify-end">
          <div className="inline-flex rounded-xl bg-background/70 p-1" role="group" aria-label="Editor mode">
            <button
              type="button"
              aria-pressed={mode === "visual"}
              onClick={() => selectMode("visual")}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${mode === "visual" ? "bg-panel text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Eye size={14} /> Visual
            </button>
            <button
              type="button"
              aria-pressed={mode === "markdown"}
              onClick={() => selectMode("markdown")}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${mode === "markdown" ? "bg-panel text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Code2 size={14} /> Markdown
            </button>
          </div>
        </div>

        {mode === "visual" ? (
          <VisualSurface
            initialMarkdown={visualValue}
            onChange={updateFromVisual}
            onCancel={onCancel}
            onSave={save}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              valueRef.current = event.target.value;
              setValue(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                onCancel();
              } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                save();
              }
            }}
            rows={1}
            spellCheck
            aria-label="Markdown response editor"
            className="block min-h-10 w-full resize-none bg-transparent font-mono text-sm leading-6 outline-none"
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-[11px] text-muted-foreground sm:inline">
          Esc to cancel · Ctrl/⌘+Enter to save
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!value.trim()}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-85 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}
