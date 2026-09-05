import { useCallback, useEffect, useState } from "react";
import { listColetas, searchColetas } from "@/lib/storage";
import type { ColetaLocal } from "@/lib/types";

export function useColetas(query = "") {
  const [items, setItems] = useState<ColetaLocal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listColetas();
      setItems(searchColetas(all, query));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingCount = items.filter((i) => !i.sincronizado).length;

  return { items, loading, refresh, pendingCount };
}
