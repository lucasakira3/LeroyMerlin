import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ProdutoMobile,
  ProjetoMobile,
  SessaoMobile,
} from "../../types/mobile";
import { api } from "./api";

export interface ItemLista {
  produto: ProdutoMobile;
  quantidade: number;
  coletado: boolean;
}
interface Saved {
  lista: ItemLista[];
  projetos: ProjetoMobile[];
  produtos: ProdutoMobile[];
}
interface Context extends Saved {
  pronto: boolean;
  erroStorage: string | null;
  sessao: SessaoMobile | null;
  adicionar: (produto: ProdutoMobile) => void;
  quantidade: (id: string, delta: number) => void;
  coletar: (id: string) => void;
  lembrarProduto: (produto: ProdutoMobile) => void;
  salvarProjeto: (projeto: ProjetoMobile) => void;
  entrar: (nome: string) => Promise<SessaoMobile>;
  sair: () => Promise<void>;
}
const Store = createContext<Context | null>(null);
const KEY = "leroy-mobile-v1";
const SESSION_KEY = "leroy-mobile-session-v1";
const empty: Saved = { lista: [], projetos: [], produtos: [] };
export function feedback() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
    () => undefined,
  );
}
export function AppStore({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(empty);
  const [sessao, setSessao] = useState<SessaoMobile | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erroStorage, setErroStorage] = useState<string | null>(null);
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [raw, session] = await Promise.all([
          AsyncStorage.getItem(KEY),
          SecureStore.isAvailableAsync().then((available) =>
            available ? SecureStore.getItemAsync(SESSION_KEY) : null,
          ),
        ]);
        if (!active) return;
        if (raw) {
          const value = JSON.parse(raw) as Saved;
          if (
            !Array.isArray(value.lista) ||
            !Array.isArray(value.projetos) ||
            !Array.isArray(value.produtos)
          )
            throw new Error();
          setSaved(value);
        }
        if (session) {
          const value = JSON.parse(session) as SessaoMobile;
          if (value.expiraEm > Date.now()) setSessao(value);
        }
      } catch {
        if (active)
          setErroStorage("Não foi possível recuperar seus dados locais.");
      } finally {
        if (active) setPronto(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!pronto) return;
    writes.current = writes.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(saved)))
      .catch(() =>
        setErroStorage(
          "Não foi possível salvar no aparelho. Sua lista está disponível nesta sessão.",
        ),
      );
  }, [saved, pronto]);
  const remember = (current: Saved, produto: ProdutoMobile): ProdutoMobile[] =>
    [produto, ...current.produtos.filter((p) => p.id !== produto.id)].slice(
      0,
      100,
    );
  const context: Context = {
    ...saved,
    pronto,
    erroStorage,
    sessao,
    adicionar(produto) {
      feedback();
      setSaved((current) => ({
        ...current,
        produtos: remember(current, produto),
        lista: current.lista.some((i) => i.produto.id === produto.id)
          ? current.lista.map((i) =>
              i.produto.id === produto.id
                ? { ...i, quantidade: i.quantidade + 1 }
                : i,
            )
          : [...current.lista, { produto, quantidade: 1, coletado: false }],
      }));
    },
    quantidade(id, delta) {
      setSaved((current) => ({
        ...current,
        lista: current.lista
          .map((i) =>
            i.produto.id === id
              ? { ...i, quantidade: Math.max(0, i.quantidade + delta) }
              : i,
          )
          .filter((i) => i.quantidade > 0),
      }));
    },
    coletar(id) {
      feedback();
      setSaved((current) => ({
        ...current,
        lista: current.lista.map((i) =>
          i.produto.id === id ? { ...i, coletado: !i.coletado } : i,
        ),
      }));
    },
    lembrarProduto(produto) {
      setSaved((current) => ({
        ...current,
        produtos: remember(current, produto),
      }));
    },
    salvarProjeto(projeto) {
      setSaved((current) => ({
        ...current,
        projetos: [
          projeto,
          ...current.projetos.filter((p) => p.titulo !== projeto.titulo),
        ].slice(0, 10),
      }));
    },
    async entrar(nome) {
      const value = await api.sessao(nome);
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(value));
      setSessao(value);
      return value;
    },
    async sair() {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      setSessao(null);
    },
  };
  return <Store.Provider value={context}>{children}</Store.Provider>;
}
export function useApp() {
  const context = useContext(Store);
  if (!context) throw new Error("AppStore ausente");
  return context;
}
