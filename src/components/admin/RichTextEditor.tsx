"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline,
  Unlink,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Self-contained, dependency-free rich text editor.
 *
 * Built on the browser's native `contenteditable` + execCommand so it ships no
 * extra packages, yet covers the full blogging toolset (formatting, headings,
 * lists, quotes, links, image upload, undo/redo). Value in/out is HTML — exactly
 * what WordPress stores. The editing surface uses the same `.prose-ina` class as
 * the public article, so what you type is what readers see.
 *
 * The component is intentionally framed behind a minimal {value, onChange} props
 * contract so it can be swapped for a library editor (e.g. Tiptap) later without
 * touching the editor pages.
 */

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Uploads a file and returns its public URL (used for inline images). */
  onImageUpload?: (file: File) => Promise<string>;
}

type ToolbarAction =
  | { type: "command"; command: string; value?: string; state?: string }
  | { type: "link" }
  | { type: "image" };

type ToolbarButton = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: ToolbarAction;
};

// Pure, ref-free toolbar config (module scope keeps it out of render churn).
const TOOLBAR_GROUPS: ToolbarButton[][] = [
  [
    { icon: Bold, label: "Bold", action: { type: "command", command: "bold", state: "bold" } },
    { icon: Italic, label: "Italic", action: { type: "command", command: "italic", state: "italic" } },
    { icon: Underline, label: "Underline", action: { type: "command", command: "underline", state: "underline" } },
  ],
  [
    { icon: Heading2, label: "Heading", action: { type: "command", command: "formatBlock", value: "H2", state: "formatBlock:h2" } },
    { icon: Heading3, label: "Subheading", action: { type: "command", command: "formatBlock", value: "H3", state: "formatBlock:h3" } },
    { icon: Quote, label: "Quote", action: { type: "command", command: "formatBlock", value: "BLOCKQUOTE", state: "formatBlock:blockquote" } },
  ],
  [
    { icon: List, label: "Bullet list", action: { type: "command", command: "insertUnorderedList", state: "insertUnorderedList" } },
    { icon: ListOrdered, label: "Numbered list", action: { type: "command", command: "insertOrderedList", state: "insertOrderedList" } },
  ],
  [
    { icon: Link2, label: "Add link", action: { type: "link" } },
    { icon: Unlink, label: "Remove link", action: { type: "command", command: "unlink" } },
    { icon: ImageIcon, label: "Insert image", action: { type: "image" } },
  ],
  [
    { icon: Undo2, label: "Undo (Ctrl+Z)", action: { type: "command", command: "undo" } },
    { icon: Redo2, label: "Redo (Ctrl+Y)", action: { type: "command", command: "redo" } },
    { icon: RemoveFormatting, label: "Clear formatting", action: { type: "command", command: "removeFormat" } },
  ],
];

function isActive(state?: string): boolean {
  if (!state || typeof document === "undefined") return false;
  try {
    if (state.startsWith("formatBlock:")) {
      return (
        document.queryCommandValue("formatBlock").toLowerCase() ===
        state.split(":")[1]
      );
    }
    return document.queryCommandState(state);
  } catch {
    return false;
  }
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your story…",
  onImageUpload,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Start empty (not `value`) so the sync effect below always populates the
  // editor's DOM on first mount — otherwise an existing post's content, which
  // equals the initial ref, would be skipped and the editor would render blank.
  const lastHtmlRef = useRef<string>("");
  const [isEmpty, setIsEmpty] = useState(!value);
  const [uploading, setUploading] = useState(false);
  const [, forceTick] = useState(0); // re-render to refresh active states

  // Link dialog state. The selection is saved when the dialog opens (focusing
  // the input would otherwise clear it) and restored before applying the link.
  const savedRangeRef = useRef<Range | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Sync external value into the DOM only when it diverges from what the user
  // last produced (initial load, loading a different post) — avoids cursor jumps.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastHtmlRef.current && value !== el.innerHTML) {
      el.innerHTML = value || "";
      lastHtmlRef.current = value;
      setIsEmpty(!el.textContent?.trim() && !el.querySelector("img"));
    }
  }, [value]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastHtmlRef.current = html;
    setIsEmpty(!el.textContent?.trim() && !el.querySelector("img"));
    onChange(html);
  }, [onChange]);

  const runCommand = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      emit();
      forceTick((n) => n + 1);
    },
    [emit],
  );

  const handleLink = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      toast.info("Select the text you want to turn into a link first.");
      return;
    }
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    setLinkUrl("");
    setLinkDialogOpen(true);
  }, []);

  const applyLink = useCallback(() => {
    const raw = linkUrl.trim();
    const el = editorRef.current;
    const selection = window.getSelection();
    if (raw && el && selection && savedRangeRef.current) {
      const safe = /^(https?:|mailto:|tel:|\/)/i.test(raw)
        ? raw
        : `https://${raw}`;
      el.focus();
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
      document.execCommand("createLink", false, safe);
      emit();
    }
    savedRangeRef.current = null;
    setLinkDialogOpen(false);
  }, [linkUrl, emit]);

  const handleImageButton = useCallback(() => {
    if (!onImageUpload) {
      toast.error("Image upload is not available.");
      return;
    }
    fileInputRef.current?.click();
  }, [onImageUpload]);

  const handleAction = useCallback(
    (action: ToolbarAction) => {
      if (action.type === "command") runCommand(action.command, action.value);
      else if (action.type === "link") handleLink();
      else handleImageButton();
    },
    [runCommand, handleLink, handleImageButton],
  );

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !onImageUpload) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file.");
        return;
      }
      setUploading(true);
      try {
        const url = await onImageUpload(file);
        editorRef.current?.focus();
        document.execCommand("insertImage", false, url);
        emit();
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [emit, onImageUpload],
  );

  const refreshActiveStates = useCallback(() => forceTick((n) => n + 1), []);

  // Keyboard undo/redo. Handled explicitly (rather than relying on the
  // browser's native contentEditable history) so it stays in sync with React
  // state via emit() and shares the exact same path as the toolbar buttons.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        runCommand("undo");
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        runCommand("redo");
      }
    },
    [runCommand],
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400/40 transition-colors">
      {/* Toolbar — sticks below the admin header while a long post scrolls.
          The container intentionally has no `overflow-hidden`, since that would
          disable position: sticky. */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-1 rounded-t-xl border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1 h-5 w-px bg-slate-200" />}
            {group.map((btn) => {
              const state =
                btn.action.type === "command" ? btn.action.state : undefined;
              const active = isActive(state);
              const isImage = btn.action.type === "image";
              return (
                <button
                  key={btn.label}
                  type="button"
                  title={btn.label}
                  aria-label={btn.label}
                  aria-pressed={active}
                  disabled={isImage && uploading}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAction(btn.action)}
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50",
                    active && "bg-sky-100 text-sky-800 hover:bg-sky-100",
                  )}
                >
                  {isImage && uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <btn.icon className="size-4" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Editable surface */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-5 top-4 text-slate-400 select-none">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Post content"
          onInput={emit}
          onBlur={emit}
          onKeyDown={handleKeyDown}
          onKeyUp={refreshActiveStates}
          onMouseUp={refreshActiveStates}
          className="prose-ina min-h-80 max-w-none px-5 py-4 outline-none"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* App-styled link dialog (replaces the native window.prompt) */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
            <DialogDescription>
              Enter the URL to link the selected text to.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://example.com"
            className="h-9 rounded-lg"
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={applyLink}
              disabled={!linkUrl.trim()}
            >
              Add link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
