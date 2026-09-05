import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ColetaForm } from "@/components/ColetaForm";
import { PrimaryButton } from "@/components/BoolSwitch";
import { deleteColeta, getColeta } from "@/lib/storage";
import { isOnline, syncOne } from "@/lib/sync";
import type { ColetaLocal } from "@/lib/types";

export default function DetalheColetaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ColetaLocal | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setItem(await getColeta(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color="#0F766E" />;
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Registro não encontrado.</Text>
      </View>
    );
  }

  if (editing) {
    return (
      <ColetaForm
        initial={item}
        onSaved={(saved) => {
          setItem(saved);
          setEditing(false);
        }}
      />
    );
  }

  const { aluno, familia, responsavel, pesquisa, momento } = item.payload;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View
        style={[
          styles.status,
          item.sincronizado ? styles.statusOk : styles.statusPending,
        ]}
      >
        <Text style={styles.statusText}>
          {item.sincronizado
            ? `Sincronizado · ${momento.codigo}`
            : `Pendente · ${momento.codigo}`}
        </Text>
        {item.lastError ? (
          <Text style={styles.error}>{item.lastError}</Text>
        ) : null}
      </View>

      <Block title="Aluno">
        <Line label="Código" value={aluno.codigoAluno} />
        <Line label="Nome" value={aluno.nome} />
        <Line label="CPF" value={aluno.cpf ?? "—"} />
        <Line label="Nascimento" value={aluno.dataNascimento ?? "—"} />
        <Line label="Sexo" value={aluno.sexo ?? "—"} />
      </Block>

      <Block title="Família">
        <Line label="Código" value={familia.codigoFamilia} />
        <Line label="Endereço" value={familia.endereco} />
        <Line label="Bairro" value={familia.bairro} />
        <Line label="Comunidade" value={familia.comunidade} />
        <Line label="Moradores" value={String(familia.qtdMoradores)} />
        <Line
          label="Renda"
          value={`R$ ${familia.rendaFamiliarMensal.toFixed(2)}`}
        />
        <Line
          label="Benefício"
          value={
            familia.recebeBeneficioSocial
              ? (familia.beneficioSocial ?? "Sim")
              : "Não"
          }
        />
        <Line
          label="Internet"
          value={
            familia.possuiInternetCasa
              ? (familia.tipoAcessoInternet ?? "Sim")
              : "Não"
          }
        />
      </Block>

      <Block title="Responsável">
        <Line label="Nome" value={responsavel.nome} />
        <Line label="Parentesco" value={responsavel.parentesco} />
        <Line label="CPF" value={responsavel.cpf ?? "—"} />
        <Line label="Telefone" value={responsavel.telefone ?? "—"} />
        <Line label="E-mail" value={responsavel.email ?? "—"} />
      </Block>

      <Block title="Pesquisa">
        <Line label="Transporte" value={pesquisa.meioTransporteEscola} />
        <Line
          label="Deslocamento"
          value={`${pesquisa.tempoDeslocamentoMin} min`}
        />
        <Line label="Frequência" value={`${pesquisa.frequenciaEscolarPct}%`} />
        <Line label="Ano/série" value={pesquisa.anoSerie} />
        <Line label="Turno" value={pesquisa.turno} />
        <Line
          label="NEE"
          value={
            pesquisa.necessidadeEducacionalEspecial
              ? (pesquisa.descricaoNecessidade ?? "Sim")
              : "Não"
          }
        />
        <Line label="Obs." value={pesquisa.observacao ?? "—"} />
      </Block>

      <PrimaryButton title="Editar" onPress={() => setEditing(true)} />

      {!item.sincronizado ? (
        <PrimaryButton
          title="Sincronizar agora"
          variant="secondary"
          onPress={() => {
            void (async () => {
              if (!(await isOnline())) {
                Alert.alert("Sem internet", "Conecte-se para sincronizar.");
                return;
              }
              try {
                await syncOne(item);
                await load();
                Alert.alert("OK", "Registro sincronizado.");
              } catch (e) {
                Alert.alert(
                  "Falha",
                  e instanceof Error ? e.message : "Erro ao sincronizar",
                );
                await load();
              }
            })();
          }}
        />
      ) : null}

      <PrimaryButton
        title="Excluir local"
        variant="danger"
        onPress={() => {
          Alert.alert("Excluir?", "Remove apenas do aparelho.", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir",
              style: "destructive",
              onPress: () => {
                void deleteColeta(item.id).then(() => router.replace("/"));
              },
            },
          ]);
        }}
      />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, backgroundColor: "#F1F5F9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  status: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statusOk: { backgroundColor: "#D1FAE5" },
  statusPending: { backgroundColor: "#FFEDD5" },
  statusText: { fontWeight: "700", color: "#134E4A" },
  error: { marginTop: 6, color: "#B91C1C", fontSize: 12 },
  block: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
    marginBottom: 8,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  lineLabel: { color: "#64748B", fontSize: 13, width: 110 },
  lineValue: { color: "#0F172A", fontSize: 13, flex: 1, textAlign: "right" },
});
