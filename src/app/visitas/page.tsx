import { desc, eq } from "drizzle-orm";
import { PageShell } from "@/components/page-shell";
import { db } from "@/db";
import { guestbook } from "@/db/schema";
import { getSettings } from "@/lib/access";
import { GuestbookForm } from "./guestbook-form";

export const revalidate = 10;

export default async function VisitasPage() {
  const settings = await getSettings();
  const entries = await db
    .select({ id: guestbook.id, authorName: guestbook.authorName, relationship: guestbook.relationship, body: guestbook.body })
    .from(guestbook)
    .where(eq(guestbook.status, "approved"))
    .orderBy(desc(guestbook.createdAt));

  return (
    <PageShell eyebrow="Familia e invitados" title="Libro de visitas" lede="Deja un mensaje para la promoción." width="max-w-2xl">
        {settings.guestsEnabled ? (
          <section className="paper-card p-5">
            <GuestbookForm />
          </section>
        ) : (
          <p className="text-muted">El libro de visitas se abrirá pronto.</p>
        )}

        <ul className="mt-10 space-y-6">
          {entries.map((e) => (
            <li key={e.id} className="paper-card -rotate-1 p-6 even:rotate-1">
              <p className="font-hand text-2xl leading-snug whitespace-pre-line">{e.body}</p>
              <p className="mt-2 text-sm text-muted">— {e.authorName}{e.relationship ? `, ${e.relationship}` : ""}</p>
            </li>
          ))}
        </ul>
    </PageShell>
  );
}
