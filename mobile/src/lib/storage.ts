import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { STORAGE_KEY } from "@/lib/config";
import type { ColetaLocal, ColetaPayload } from "@/lib/types";

async function readAll(): Promise<ColetaLocal[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ColetaLocal[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: ColetaLocal[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listColetas(): Promise<ColetaLocal[]> {
  const items = await readAll();
  return items.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getColeta(id: string): Promise<ColetaLocal | null> {
  const items = await readAll();
  return items.find((i) => i.id === id) ?? null;
}

export async function saveColeta(
  payload: ColetaPayload,
  existingId?: string,
): Promise<ColetaLocal> {
  const items = await readAll();
  const now = new Date().toISOString();

  if (existingId) {
    const idx = items.findIndex((i) => i.id === existingId);
    if (idx >= 0) {
      const updated: ColetaLocal = {
        ...items[idx],
        payload,
        sincronizado: false,
        updatedAt: now,
        lastError: null,
        serverPesquisaId: null,
      };
      items[idx] = updated;
      await writeAll(items);
      return updated;
    }
  }

  const created: ColetaLocal = {
    id: Crypto.randomUUID(),
    sincronizado: false,
    createdAt: now,
    updatedAt: now,
    lastError: null,
    serverPesquisaId: null,
    payload,
  };
  items.unshift(created);
  await writeAll(items);
  return created;
}

export async function markSynced(
  id: string,
  serverPesquisaId?: string | null,
): Promise<void> {
  const items = await readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  items[idx] = {
    ...items[idx],
    sincronizado: true,
    lastError: null,
    serverPesquisaId: serverPesquisaId ?? items[idx].serverPesquisaId,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(items);
}

export async function markSyncError(id: string, error: string): Promise<void> {
  const items = await readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  items[idx] = {
    ...items[idx],
    sincronizado: false,
    lastError: error,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(items);
}

export async function listPending(): Promise<ColetaLocal[]> {
  const items = await listColetas();
  return items.filter((i) => !i.sincronizado);
}

export async function deleteColeta(id: string): Promise<void> {
  const items = await readAll();
  await writeAll(items.filter((i) => i.id !== id));
}

export async function deleteColetas(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const remove = new Set(ids);
  const items = await readAll();
  const next = items.filter((i) => !remove.has(i.id));
  await writeAll(next);
  return items.length - next.length;
}

export function searchColetas(
  items: ColetaLocal[],
  query: string,
): ColetaLocal[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const { aluno, familia } = item.payload;
    return (
      aluno.nome.toLowerCase().includes(q) ||
      aluno.codigoAluno.toLowerCase().includes(q) ||
      familia.codigoFamilia.toLowerCase().includes(q) ||
      familia.bairro.toLowerCase().includes(q)
    );
  });
}
