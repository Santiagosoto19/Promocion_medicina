"use client";

import { useRouter } from "next/navigation";
import BataFirmas, { type Firma } from "@/components/bata-firmas";

export function FirmaClient({ firmas }: { firmas: Firma[] }) {
  const router = useRouter();
  return <BataFirmas firmas={firmas} onFirmar={() => router.push("/firma/firmar")} />;
}
