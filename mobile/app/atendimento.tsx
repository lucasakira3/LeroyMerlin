import { useCallback, useRef, useState } from "react";
import { Alert, AppState, Text } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import type { ChamadoMobile } from "../../types/mobile";
import { api, ApiError, mensagemErro } from "../src/api";
import { registrarPush } from "../src/notifications";
import { useApp } from "../src/storage";
import { Button, Card, Heading, Input, Notice, Screen, s } from "../src/ui";

export default function Atendimento() {
  const app = useApp();
  const params = useLocalSearchParams<{ produtoId?: string }>();
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [chamados, setChamados] = useState<ChamadoMobile[]>([]);
  const [busy, setBusy] = useState(false);
  const creating = useRef(false);
  const lastRequested = useRef<string | null>(null);
  const token = app.sessao?.token;
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setChamados([]);
        return;
      }
      let active = true;
      let fetching = false;
      async function update() {
        if (fetching || AppState.currentState !== "active") return;
        fetching = true;
        try {
          const values = await api.chamados(token!);
          if (active) {
            setChamados(values);
            setError("");
          }
        } catch (err) {
          if (active) {
            setError(mensagemErro(err));
            if (err instanceof ApiError && err.status === 401) void app.sair();
          }
        } finally {
          fetching = false;
        }
      }
      void update();
      const timer = setInterval(() => void update(), 5000);
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void update();
      });
      return () => {
        active = false;
        clearInterval(timer);
        listener.remove();
      };
    }, [token]),
  );
  async function enter() {
    if (!nome.trim() || creating.current) return;
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      const session = await app.entrar(nome.trim());
      if (params.produtoId) {
        await api.ajuda(params.produtoId, session.token);
        lastRequested.current = params.produtoId;
      }
      setChamados(await api.chamados(session.token));
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setBusy(false);
      creating.current = false;
    }
  }
  async function sendPending() {
    if (!params.produtoId || !token || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.ajuda(params.produtoId, token);
      lastRequested.current = params.produtoId;
      setChamados(await api.chamados(token));
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setBusy(false);
    }
  }
  async function enablePush() {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      await registrarPush(token);
      setInfo("Notificações ativadas para este aparelho.");
    } catch (err) {
      setError(mensagemErro(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="AJUDA DE VERDADE"
        title="A equipe\nvem até você."
        subtitle="O pedido chega ao painel do estande. Acompanhe por aqui ou ative as notificações."
      />
      {error ? <Notice error>{error}</Notice> : null}
      {info ? <Notice>{info}</Notice> : null}
      {!app.sessao ? (
        <Card>
          <Text style={s.h2}>Como podemos te chamar?</Text>
          <Input
            accessibilityLabel="Seu nome"
            placeholder="Seu primeiro nome"
            maxLength={60}
            value={nome}
            onChangeText={setNome}
          />
          <Button
            title={
              params.produtoId
                ? "Entrar e pedir ajuda"
                : "Entrar como visitante"
            }
            disabled={!nome.trim()}
            loading={busy}
            onPress={() => void enter()}
          />
          <Text style={s.small}>
            Sem senha ou cadastro. Seu nome identifica o atendimento do evento e
            a sessão dura sete dias.
          </Text>
        </Card>
      ) : (
        <>
          <Notice>Olá, {app.sessao.nome}.</Notice>
          {params.produtoId && lastRequested.current !== params.produtoId && (
            <Button
              title="Enviar pedido para este produto"
              loading={busy}
              onPress={() => void sendPending()}
            />
          )}
          <Button
            title="Ativar notificações de atendimento"
            secondary
            loading={busy}
            onPress={() => void enablePush()}
          />
          {chamados.length === 0 && !error ? (
            <Notice>
              Você ainda não pediu ajuda. Abra um produto e toque em Pedir ajuda
              neste corredor.
            </Notice>
          ) : (
            chamados.map((c) => (
              <Card key={c.id}>
                <Text style={s.small}>
                  {new Date(c.criadoEm).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {c.corredor}
                </Text>
                <Text style={s.h3}>{c.produtoNome}</Text>
                <Text style={s.h2}>
                  {
                    {
                      pendente: "Aguardando especialista",
                      a_caminho: "Especialista a caminho",
                      atendido: "Atendimento concluído",
                    }[c.status]
                  }
                </Text>
                <Text style={s.body}>{c.mensagem}</Text>
              </Card>
            ))
          )}
          <Button
            title="Encerrar minha sessão"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "Encerrar sessão?",
                "Você deixará de acompanhar estes chamados no aparelho.",
                [
                  { text: "Continuar", style: "cancel" },
                  {
                    text: "Encerrar",
                    onPress: () => {
                      void app
                        .sair()
                        .catch((err) => setError(mensagemErro(err)));
                    },
                  },
                ],
              )
            }
          />
        </>
      )}
    </Screen>
  );
}
