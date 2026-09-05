import type { RawRow } from "./sanitize";

export function parseTsv(content: string): RawRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim());
  const rows: RawRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const row: RawRow = {};
    headers.forEach((header, idx) => {
      row[header] = cols[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}
