"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { saveSignature } from "./actions";

type StudentOption = { id: string; fullName: string; nickname: string | null };
type Point = [number, number];

export function SignForm({ students }: { students: StudentOption[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [studentId, setStudentId] = useState("");
  const [phrase, setPhrase] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function toNormalized(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    return [Math.min(1000, Math.max(0, x)), Math.min(1000, Math.max(0, y))];
  }

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1E3A8A";
    for (const stroke of strokesRef.current) {
      ctx.beginPath();
      stroke.forEach(([x, y], i) => {
        const px = (x / 1000) * canvas.width;
        const py = (y / 1000) * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([toNormalized(e)]);
    redraw();
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const current = strokesRef.current[strokesRef.current.length - 1];
    if (current) current.push(toNormalized(e));
    redraw();
  }

  function onUp() {
    drawingRef.current = false;
  }

  function clear() {
    strokesRef.current = [];
    redraw();
    setMessage(null);
  }

  async function submit() {
    if (!studentId) return setMessage({ type: "error", text: "Elige tu nombre primero." });
    if (strokesRef.current.length === 0) return setMessage({ type: "error", text: "Dibuja tu firma en el recuadro." });
    setBusy(true);
    const result = await saveSignature({
      studentId,
      strokes: JSON.stringify({ v: 1, strokes: strokesRef.current }),
      phrase: phrase || undefined,
    });
    setBusy(false);
    if (!result.ok) return setMessage({ type: "error", text: result.error });
    clear();
    setPhrase("");
    setMessage({
      type: "ok",
      text: result.status === "pending" ? "¡Firma guardada! Aparecerá en la bata cuando el admin la apruebe." : "¡Firma guardada en la bata!",
    });
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="bb-label">¿Quién eres?</span>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="bb-input">
          <option value="">Elige tu nombre</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
              {s.nickname ? ` · ${s.nickname}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="paper-card p-3">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          className="aspect-2/1 w-full touch-none rounded-xl bg-paper"
          aria-label="Área para firmar"
        />
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={clear} className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm text-muted hover:text-text">Borrar</button>
        </div>
      </div>

      <label className="block">
        <span className="bb-label">Una frase para la bata (opcional)</span>
        <input value={phrase} maxLength={140} onChange={(e) => setPhrase(e.target.value)} className="bb-input" />
      </label>

      {message && <p role={message.type === "error" ? "alert" : "status"} className={message.type === "error" ? "text-sm text-red-700" : "text-sm text-primary"}>{message.text}</p>}

      <Button type="button" loading={busy} onClick={() => void submit()} className="w-full">
        {busy ? "Guardando…" : "Firmar la bata"}
      </Button>
    </div>
  );
}
