import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ColetaForm } from "@/components/ColetaForm";

/**
 * Sempre remonta o formulário vazio ao focar a aba "Coletar"
 * (nova coleta não reaproveita dados da anterior).
 */
export default function NovaColetaScreen() {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFormKey((k) => k + 1);
    }, []),
  );

  return (
    <ColetaForm
      key={formKey}
      onSaved={(item) => {
        router.replace(`/coleta/${item.id}`);
      }}
    />
  );
}
