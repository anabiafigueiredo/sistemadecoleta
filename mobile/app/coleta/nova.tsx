import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ColetaForm } from "@/components/ColetaForm";

/**
 * Sempre remonta o formulário vazio ao abrir Nova entrevista.
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
        // Sync ok → Realizadas; ainda pendente → fila de sync
        if (item.sincronizado) {
          router.replace("/entrevistas");
        } else {
          router.replace("/sync");
        }
      }}
    />
  );
}
