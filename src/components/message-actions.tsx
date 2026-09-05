import { Check, ChevronDown, Copy, Download, Pencil } from "lucide-react";

type Props = {
  copied: boolean;
  disabled?: boolean;
  downloadOpen?: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onToggleDownload?: () => void;
  onDownload?: (format: "md" | "pdf" | "docx") => void;
  downloadingFormat?: string | null;
};

export function MessageActions({
  copied,
  disabled,
  downloadOpen,
  onCopy,
  onEdit,
  onToggleDownload,
  onDownload,
  downloadingFormat,
}: Props) {
  const buttonClass = "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40";

  return (
    <div className="relative flex items-center gap-0.5" aria-label="Message actions">
      <button type="button" disabled={disabled} onClick={onCopy} className={buttonClass}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span className="sr-only sm:not-sr-only">{copied ? "Copied" : "Copy"}</span>
      </button>
      <button type="button" disabled={disabled} onClick={onEdit} className={buttonClass}>
        <Pencil size={14} /> <span className="sr-only sm:not-sr-only">Edit</span>
      </button>
      {onDownload && onToggleDownload && (
        <div className="relative">
          <button type="button" disabled={disabled} onClick={onToggleDownload} className={buttonClass} aria-expanded={downloadOpen} aria-haspopup="menu">
            <Download size={14} /> <span className="sr-only sm:not-sr-only">Download</span> <ChevronDown size={12} />
          </button>
          {downloadOpen && (
            <div role="menu" className="absolute left-0 top-9 z-30 min-w-44 rounded-xl border border-border bg-panel p-1.5 shadow-xl">
              {([
                ["md", "Markdown (.md)"],
                ["pdf", "PDF document (.pdf)"],
                ["docx", "Microsoft Word (.docx)"],
              ] as const).map(([format, label]) => (
                <button
                  key={format}
                  type="button"
                  role="menuitem"
                  disabled={Boolean(downloadingFormat)}
                  onClick={() => onDownload(format)}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                >
                  {downloadingFormat === format ? "Preparing…" : label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
