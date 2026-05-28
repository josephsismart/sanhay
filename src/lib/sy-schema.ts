/**
 * Returns the PostgreSQL schema name (sy1 or sy2) for the currently active
 * school year, and the active SY record itself.
 *
 * Rule: global.tbl_sy.id=1 → sy1, id=2 → sy2
 */
import { prisma } from "@/lib/prisma";

export type SyInfo = {
  schema: "sy1" | "sy2";
  syId: number;
  description: string;
  inputGradesQrtr: number;
};

let cached: SyInfo | null = null;
let cachedAt = 0;
const TTL_MS = 60_000; // re-fetch at most once per minute

export async function getActiveSySchema(): Promise<SyInfo> {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached;

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, description, input_grades_qrtr FROM global.tbl_sy WHERE is_active = true LIMIT 1`
  );

  if (!rows.length) {
    // fallback: use sy2 if nothing active
    cached = { schema: "sy2", syId: 2, description: "", inputGradesQrtr: 0 };
  } else {
    const r = rows[0];
    const id = Number(r.id);
    cached = {
      schema: id === 1 ? "sy1" : "sy2",
      syId: id,
      description: r.description,
      inputGradesQrtr: Number(r.input_grades_qrtr ?? 0),
    };
  }

  cachedAt = now;
  return cached;
}
