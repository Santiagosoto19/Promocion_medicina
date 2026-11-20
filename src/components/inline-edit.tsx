"use client";

import { useState } from "react";

// Texto que el admin puede editar en la propia página: clic, escribe y sale del campo para guardar.
export function InlineEdit({
  value,
  editable,
  onSave,
  className,
  as: Tag = "p",
}: {
  value: string;
  editable: boolean;
  onSave: (value: string) => Promise<{ ok: boolean; error?: string }>;
  className?: string;
  as?: "h1" | "p";
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<string | null>(null);

  if (!editable) return <Tag className={className}>{value}</Tag>;

  async function commit(e: React.FocusEvent<HTMLElement>) {
    const next = e.currentTarget.innerText.trim();
    if (next === text) return;
    const r = await onSave(next);
    if (r.ok) {
      setText(next);
      setStatus("Guardado");
    } else {
      setStatus(r.error ?? "No se pudo guardar");
      e.currentTarget.innerText = text;
    }
    setTimeout(() => setStatus(null), 1500);
  }

  return (
    <span className="relative inline-block">
      <Tag
        className={`${className ?? ""} cursor-text rounded-md outline-dashed outline-1 outline-offset-4 outline-gold/60 hover:outline-gold focus:outline-2`}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => void commit(e)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      >
        {text}
      </Tag>
      {status && <span className="absolute -top-6 left-0 text-xs text-primary">{status}</span>}
    </span>
  );
}
