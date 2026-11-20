"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { celebrar } from "@/lib/celebrar";
import { useState } from "react";
import { saveCapsuleLetter } from "./actions";

const field = "bb-input";

export function CapsuleForm({ students }: { students: { id: string; fullName: string; nickname: string | null }[] }) {
  const [studentId, setStudentId] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { avisar } = useToast();

  async function submit() {
    if (!studentId) return setMsg({ ok: false, text: "Elige tu nombre primero." });
    setBusy(true);
    const r = await saveCapsuleLetter({ studentId, body });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setBody("");
    const texto = r.status === "pending" ? "Carta sellada. La revisará el admin antes de guardarla." : "¡Carta sellada!";
    setMsg({ ok: true, text: texto });
    avisar(texto, "ok");
    void celebrar();
  }

  return (
    <div className="space-y-4">
      <select aria-label="¿Quién eres?" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={field}>
        <option value="">Elige tu nombre</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.fullName}{s.nickname ? ` · ${s.nickname}` : ""}</option>
        ))}
      </select>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} rows={6} placeholder="Querido yo del futuro…" className={field} />
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-primary" : "text-red-700"}`}>{msg.text}</p>}
      <Button type="button" loading={busy} onClick={() => void submit()} className="w-full">
        {busy ? "Sellando…" : "Sellar la carta"}
      </Button>
    </div>
  );
}
