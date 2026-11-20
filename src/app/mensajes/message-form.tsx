"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { saveMessage } from "./actions";

type StudentOption = { id: string; fullName: string; nickname: string | null };

export function MessageForm({ students }: { students: StudentOption[] }) {
  const [studentId, setStudentId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { avisar } = useToast();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function submit() {
    if (!studentId) return setMessage({ type: "error", text: "Elige tu nombre primero." });
    setBusy(true);
    const result = await saveMessage({ studentId, text, recipient: recipient || undefined });
    setBusy(false);
    if (!result.ok) return setMessage({ type: "error", text: result.error });
    setText("");
    setRecipient("");
    setMessage({ type: "ok", text: result.status === "pending" ? "¡Mensaje enviado! Aparecerá cuando el admin lo apruebe." : "¡Mensaje publicado!" });
    avisar(result.status === "pending" ? "Mensaje enviado: lo revisa el admin" : "¡Mensaje publicado en el muro!", "ok");
  }

  const field = "bb-input";

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="bb-label">¿Quién eres?</span>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={field}>
          <option value="">Elige tu nombre</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}{s.nickname ? ` · ${s.nickname}` : ""}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="bb-label">Para (opcional)</span>
        <input value={recipient} maxLength={80} onChange={(e) => setRecipient(e.target.value)} placeholder="La promoción, un compañero, mi yo del futuro…" className={field} />
      </label>
      <label className="block">
        <span className="bb-label">Tu mensaje</span>
        <textarea value={text} maxLength={500} rows={5} onChange={(e) => setText(e.target.value)} className={field} />
        <span className="mt-1 block text-right text-xs text-muted">{text.length}/500</span>
      </label>
      {message && <p role={message.type === "error" ? "alert" : "status"} className={`text-sm ${message.type === "error" ? "text-red-700" : "text-primary"}`}>{message.text}</p>}
      <Button type="button" loading={busy} onClick={() => void submit()} className="relative z-10 w-full">
        {busy ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </div>
  );
}
