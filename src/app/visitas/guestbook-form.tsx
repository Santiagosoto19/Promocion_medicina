"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signGuestbook } from "./actions";

const field = "bb-input";

export function GuestbookForm() {
  const [authorName, setAuthorName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    const r = await signGuestbook({ authorName, relationship: relationship || undefined, body });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setAuthorName("");
    setRelationship("");
    setBody("");
    setMsg({ ok: true, text: "¡Gracias! Lo revisará el admin antes de publicarlo." });
  }

  return (
    <div className="space-y-3">
      <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={80} placeholder="Tu nombre" className={field} />
      <input value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={60} placeholder="Parentesco o relación (ej. Mamá de Laura)" className={field} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} rows={4} placeholder="Tu mensaje" className={field} />
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-primary" : "text-red-700"}`}>{msg.text}</p>}
      <Button type="button" loading={busy} onClick={() => void submit()}>
        {busy ? "Enviando…" : "Dejar mensaje"}
      </Button>
    </div>
  );
}
