import NetInfo from "@react-native-community/netinfo";
import {
  postColeta,
  ApiRequestError,
  fetchRemoteColetaIndex,
} from "@/lib/api";
import {
  listPending,
  listColetas,
  markSynced,
  markSyncError,
  deleteColetas,
} from "@/lib/storage";
import type { ColetaLocal } from "@/lib/types";

export type SyncResult = {
  total: number;
  success: number;
  failed: number;
  pruned: number;
  skippedBecauseBusy: boolean;
  errors: Array<{ id: string; message: string }>;
};

let inFlight: Promise<SyncResult> | null = null;

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function syncOne(item: ColetaLocal): Promise<void> {
  try {
    const { pesquisaId } = await postColeta(item.payload);
    await markSynced(item.id, pesquisaId);
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? `${error.code}: ${error.message}`
        : error instanceof Error
          ? error.message
          : "Falha desconhecida";
    await markSyncError(item.id, message);
    throw error;
  }
}

/**
 * Remove do aparelho coletas já sincronizadas que não existem mais no servidor
 * (ex.: exclusão feita no dashboard/API).
 */
export async function pruneDeletedRemoteColetas(): Promise<number> {
  const online = await isOnline();
  if (!online) return 0;

  const { pesquisaIds, alunoMomentoKeys } = await fetchRemoteColetaIndex();
  const local = await listColetas();
  const toRemove: string[] = [];

  for (const item of local) {
    if (!item.sincronizado) continue;

    if (item.serverPesquisaId) {
      if (!pesquisaIds.has(item.serverPesquisaId)) {
        toRemove.push(item.id);
      }
      continue;
    }

    const key =
      `${item.payload.aluno.codigoAluno}|${item.payload.momento.codigo}`.toUpperCase();
    if (!alunoMomentoKeys.has(key)) {
      toRemove.push(item.id);
    }
  }

  return deleteColetas(toRemove);
}

/** Envia pendências e remove do app o que foi apagado no servidor. */
export async function syncPending(): Promise<SyncResult> {
  // Reutiliza a mesma Promise — evita 2º clique/auto-sync devolver total:0 mentiroso
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async (): Promise<SyncResult> => {
    const result: SyncResult = {
      total: 0,
      success: 0,
      failed: 0,
      pruned: 0,
      skippedBecauseBusy: false,
      errors: [],
    };

    const online = await isOnline();
    if (!online) {
      return result;
    }

    const pending = await listPending();
    result.total = pending.length;

    for (const item of pending) {
      try {
        await syncOne(item);
        result.success += 1;
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          id: item.id,
          message:
            error instanceof Error ? error.message : "Falha desconhecida",
        });
      }
    }

    try {
      result.pruned = await pruneDeletedRemoteColetas();
    } catch {
      result.pruned = 0;
    }

    return result;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/** Assina NetInfo e sincroniza automaticamente ao voltar online. */
export function subscribeAutoSync(onDone?: (r: SyncResult) => void): () => void {
  return NetInfo.addEventListener((state) => {
    const online = Boolean(
      state.isConnected && state.isInternetReachable !== false,
    );
    if (online) {
      void syncPending().then((r) => onDone?.(r));
    }
  });
}
