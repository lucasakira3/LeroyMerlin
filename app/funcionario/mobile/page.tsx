"use client";
import { useCallback, useEffect, useState } from "react";
import type { ChamadoMobile } from "@/types/mobile";

export default function AtendimentoMobile() {
  const [draftKey, setDraftKey] = useState("");
  const [key, setKey] = useState("");
  const [chamados, setChamados] = useState<ChamadoMobile[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    if (!key) return;
    try {
      const response = await fetch("/api/mobile/equipe", {
        headers: { "x-mobile-admin-key": key },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setChamados(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível atualizar.",
      );
    }
  }, [key]);
  useEffect(() => {
    if (!key) return;
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 5000);
    return () => clearInterval(timer);
  }, [key, load]);
  async function update(id: string, status: "a_caminho" | "atendido") {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/mobile/equipe", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-mobile-admin-key": key,
        },
        body: JSON.stringify({
          id,
          status,
          ...(mensagens[id]?.trim() ? { mensagem: mensagens[id].trim() } : {}),
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(
        data.avisoPush ??
          "Chamado atualizado e push aceito para envio. A entrega depende do aparelho e da conexão.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <p className="text-sm font-bold text-lm-green mb-2">
        NEXT · ATENDIMENTO MOBILE
      </p>
      <h1 className="text-3xl font-bold mb-3">Ajuda no corredor</h1>
      <p className="text-gray-600 mb-6">
        Chamados enviados pelos celulares dos visitantes. A fila atualiza a cada
        cinco segundos.
      </p>
      {!key ? (
        <form
          className="bg-white rounded-2xl border p-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setKey(draftKey);
            setDraftKey("");
          }}
        >
          <label className="block font-semibold" htmlFor="mobile-key">
            Chave da equipe
          </label>
          <input
            id="mobile-key"
            type="password"
            autoComplete="off"
            required
            minLength={32}
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            className="w-full border rounded-xl p-3"
          />
          <p className="text-sm text-gray-600">
            Use a chave configurada em MOBILE_ADMIN_KEY. Ela fica somente na
            memória desta página.
          </p>
          <button className="bg-lm-green text-white rounded-xl px-5 py-3 font-bold">
            Conectar ao atendimento
          </button>
        </form>
      ) : (
        <>
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => void load()}
              className="bg-lm-green text-white rounded-xl px-4 py-2"
            >
              Atualizar
            </button>
            <button
              onClick={() => {
                setKey("");
                setChamados([]);
                setMensagens({});
                setNotice("");
                setError("");
              }}
              className="border rounded-xl px-4 py-2"
            >
              Desconectar
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="bg-red-50 text-red-700 rounded-xl p-4 mb-4"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="bg-green-50 text-green-800 rounded-xl p-4 mb-4"
            >
              {notice}
            </p>
          )}
          {!chamados.length && !error && (
            <p className="bg-white border rounded-xl p-6">
              Nenhum chamado recebido ainda.
            </p>
          )}
          <div className="space-y-4">
            {chamados.map((c) => (
              <article
                key={c.id}
                className="bg-white border rounded-2xl p-5 space-y-3"
              >
                <div className="flex justify-between gap-4">
                  <h2 className="font-bold text-lg">
                    {c.clienteNome} · {c.corredor}
                  </h2>
                  <span className="text-sm">
                    {
                      {
                        pendente: "Pendente",
                        a_caminho: "A caminho",
                        atendido: "Concluído",
                      }[c.status]
                    }
                  </span>
                </div>
                <p>{c.produtoNome}</p>
                <p className="text-sm text-gray-600">
                  {new Date(c.criadoEm).toLocaleString("pt-BR")} · {c.mensagem}
                </p>
                {c.status !== "atendido" && (
                  <>
                    <label htmlFor={`msg-${c.id}`} className="block text-sm">
                      Mensagem opcional para o visitante
                    </label>
                    <input
                      id={`msg-${c.id}`}
                      value={mensagens[c.id] ?? ""}
                      maxLength={500}
                      onChange={(event) =>
                        setMensagens((previous) => ({
                          ...previous,
                          [c.id]: event.target.value,
                        }))
                      }
                      placeholder="Ex.: Estou indo ao corredor 03."
                      className="border rounded-xl p-3 w-full"
                    />
                    <div className="flex gap-3">
                      <button
                        disabled={busy !== null}
                        onClick={() => void update(c.id, "a_caminho")}
                        className="bg-lm-green disabled:opacity-50 text-white rounded-xl px-4 py-2"
                      >
                        {busy === c.id ? "Atualizando…" : "Estou a caminho"}
                      </button>
                      <button
                        disabled={busy !== null}
                        onClick={() => void update(c.id, "atendido")}
                        className="border disabled:opacity-50 rounded-xl px-4 py-2"
                      >
                        Concluir atendimento
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
