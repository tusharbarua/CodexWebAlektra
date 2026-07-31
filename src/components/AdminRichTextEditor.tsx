"use client";

import { useEffect, useRef, useState } from "react";
import { plainTextToHtml, sanitizeRichHtml, looksLikeHtml } from "@/lib/safe-html";

type EditorButton = {
  label: string;
  title: string;
  command: string;
  value?: string;
};

const buttons: EditorButton[] = [
  { label: "P", title: "Paragraph", command: "formatBlock", value: "p" },
  { label: "H2", title: "Heading 2", command: "formatBlock", value: "h2" },
  { label: "H3", title: "Heading 3", command: "formatBlock", value: "h3" },
  { label: "B", title: "Bold", command: "bold" },
  { label: "I", title: "Italic", command: "italic" },
  { label: "U", title: "Underline", command: "underline" },
  { label: "Bullets", title: "Bulleted list", command: "insertUnorderedList" },
  { label: "1. List", title: "Numbered list", command: "insertOrderedList" },
  { label: "Quote", title: "Blockquote", command: "formatBlock", value: "blockquote" },
  { label: "Undo", title: "Undo", command: "undo" },
  { label: "Redo", title: "Redo", command: "redo" },
  { label: "Clear", title: "Clear formatting", command: "removeFormat" }
];

export function AdminRichTextEditor({
  name,
  label,
  value,
  help,
  required = true
}: {
  name: string;
  label: string;
  value?: string | null;
  help?: string;
  required?: boolean;
}) {
  const initialHtml = looksLikeHtml(value) ? sanitizeRichHtml(value) : plainTextToHtml(value);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(initialHtml);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
    // Intentionally only run on first mount for the current server value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    setHtml(sanitizeRichHtml(editorRef.current?.innerHTML ?? ""));
  }

  function run(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function insertLink() {
    const url = window.prompt("Paste the link URL");
    if (!url) return;
    run("createLink", url);
  }

  async function uploadInlineImage(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) {
      throw new Error(result.message || "Image upload failed. Please try again.");
    }
    editorRef.current?.focus();
    document.execCommand("insertImage", false, result.url);
    setMessage("Image uploaded successfully.");
    sync();
  }

  return (
    <div className="field wide admin-rich-editor-field">
      <span>{label}</span>
      {help ? <small>{help}</small> : null}
      <input type="hidden" name={name} value={html} required={required} />
      <div className="admin-rich-toolbar" aria-label={`${label} formatting toolbar`}>
        {buttons.map((button) => (
          <button type="button" key={`${button.command}-${button.value ?? button.label}`} title={button.title} onClick={() => run(button.command, button.value)}>
            {button.label}
          </button>
        ))}
        <button type="button" title="Insert or edit link" onClick={insertLink}>Link</button>
        <button type="button" title="Upload and insert image" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading..." : "Image"}
        </button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={() => window.setTimeout(sync, 0)}
      />
      <input
        ref={fileRef}
        className="admin-rich-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setMessage(null);
          setUploading(true);
          uploadInlineImage(file)
            .catch((error) => setMessage(error instanceof Error ? error.message : "Image upload failed. Please try again."))
            .finally(() => setUploading(false));
        }}
      />
      {message ? <small className={message.includes("failed") || message.includes("valid") ? "admin-rich-error" : "admin-rich-success"}>{message}</small> : null}
    </div>
  );
}
