"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { castVote } from "./actions";

type Award = { id: string; title: string; description: string | null; status: string; winner: { name: string; total: number } | null };
type Student = { id: string; fullName: string; nickname: string | null };

export function PrizesView({ awards, students }: { awards: Award[]; students: Student[] }) {
  const [voter, setVoter] = useState("");
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function vote(awardId: string) {
    if (!voter) return setMsg({ ok: false, text: "Elige tu nombre primero." });
    const nominee = choice[awardId];
    if (!nominee) return setMsg({ ok: false, text: "Elige a quién votas." });
    setBusy(awardId);
    const r = await castVote({ awardId, voterStudentId: voter, nomineeStudentId: nominee });
    setBusy(null);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setVoted((v) => ({ ...v, [awardId]: true }));
    setMsg({ ok: true, text: "¡Voto registrado!" });
  }

  const field = "bb-input";

  return (
    <div className="space-y-6">
      <select aria-label="¿Quién eres?" value={voter} onChange={(e) => setVoter(e.target.value)} className={field}>
        <option value="">¿Quién eres?</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.fullName}{s.nickname ? ` · ${s.nickname}` : ""}</option>
        ))}
      </select>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-primary" : "text-red-700"}`}>{msg.text}</p>}

      {awards.length === 0 && <p className="text-muted">Todavía no hay categorías.</p>}

      {awards.map((a) => (
        <article key={a.id} className="paper-card p-5">
          <h2 className="font-display text-2xl text-secondary">{a.title}</h2>
          {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}

          {a.status === "open" && !voted[a.id] && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select aria-label={`Elige a quién votas en ${a.title}`} value={choice[a.id] ?? ""} onChange={(e) => setChoice((c) => ({ ...c, [a.id]: e.target.value }))} className={field}>
                <option value="">Elige a quién votas</option>
                {students.filter((s) => s.id !== voter).map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
              <Button type="button" loading={busy === a.id} onClick={() => void vote(a.id)}>
                Votar
              </Button>
            </div>
          )}
          {a.status === "open" && voted[a.id] && <p className="mt-3 text-sm text-primary">Ya votaste en esta categoría.</p>}
          {a.status === "closed" && <p className="mt-3 text-sm text-muted">Votación cerrada. Resultados en la ceremonia.</p>}

          {a.winner && (
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-gold bg-white p-4">
              <span className="text-3xl" aria-hidden="true">🏆</span>
              <div>
                <p className="font-hand text-lg text-muted">Ganador</p>
                <p className="font-display text-2xl text-secondary">{a.winner.name}</p>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
