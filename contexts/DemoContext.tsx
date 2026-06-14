'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import {
  DEMO_CARTOES, DEMO_CATEGORIAS, DEMO_TRANSACOES_INICIAIS, DEMO_RENDAS_INICIAIS,
  type DemoTx, type DemoCartao, type DemoCategoria,
} from '@/lib/demo-data';
import { MEIO_CORES } from '@/lib/constants';

// ── Types ──────────────────────────────────────────────────────────────────

type AddTxPayload = {
  descricao: string; valor: number; data: string;
  tipo: string; cartao_id: number | null; categoria_ids: number[];
  meio_pagamento: string | null; total_parcelas: number; observacao: string | null;
};

interface DemoCtx {
  cartoes: DemoCartao[];
  categorias: DemoCategoria[];
  fixasConfigs: Record<string, boolean>;
  computeDashboard: (ano: number, mes: number) => Record<string, unknown>;
  getTransacoes: (filters: { mes?: string; busca?: string; tipo?: string; cartao_id?: string }) => unknown[];
  addTransacao: (payload: AddTxPayload) => void;
  updateTransacao: (id: number, payload: Partial<DemoTx>) => void;
  batchUpdateTransacoes: (updates: Array<{ id: number; payload: Partial<DemoTx> }>) => void;
  deleteTransacao: (id: number) => void;
  setRenda: (ano: number, mes: number, renda: number) => void;
  setFixaAtiva: (descricao: string, ativa: boolean) => void;
  addCartao: (cartao: Omit<DemoCartao, 'id'>) => void;
  updateCartao: (id: number, payload: Partial<DemoCartao>) => void;
  deleteCartao: (id: number) => void;
  addCategoria: (cat: Omit<DemoCategoria, 'id'>) => void;
  updateCategoria: (id: number, payload: Partial<DemoCategoria>) => void;
  deleteCategoria: (id: number) => void;
}

const DemoContext = createContext<DemoCtx | null>(null);

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoContext must be used within DemoProvider');
  return ctx;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

let _nextId = 9000;
let _nextCartaoId = 100;
let _nextCatId = 100;

function enrich(tx: DemoTx, cartoes: DemoCartao[], categorias: DemoCategoria[]) {
  return {
    ...tx,
    cartoes: tx.cartao_id ? (cartoes.find(c => c.id === tx.cartao_id) ?? null) : null,
    categorias: tx.categoria_id ? (categorias.find(c => c.id === tx.categoria_id) ?? null) : null,
  };
}

function computeDashboard(
  txs: DemoTx[], cartoes: DemoCartao[], categorias: DemoCategoria[],
  ano: number, mes: number, renda: number,
) {
  const monthTxs = txs.filter(t => t.fatura_ano === ano && t.fatura_mes === mes);
  const total = monthTxs.reduce((s, t) => s + Number(t.valor), 0);

  const porTipo = {
    fixa:      monthTxs.filter(t => t.tipo === 'fixa').reduce((s, t) => s + t.valor, 0),
    parcelada: monthTxs.filter(t => t.tipo === 'parcelada').reduce((s, t) => s + t.valor, 0),
    avulsa:    monthTxs.filter(t => t.tipo === 'avulsa').reduce((s, t) => s + t.valor, 0),
  };

  const cartaoMap: Record<string | number, number> = {};
  for (const t of monthTxs) {
    const key = t.cartao_id != null ? t.cartao_id
      : t.meio_pagamento === 'pix' ? 'pix'
      : t.meio_pagamento === 'dinheiro' ? 'dinheiro'
      : 'sem_cartao';
    cartaoMap[key] = (cartaoMap[key] ?? 0) + Number(t.valor);
  }
  const porCartao = [
    ...cartoes.map(c => ({ ...c, total: cartaoMap[c.id] ?? 0 })).filter(c => c.total > 0),
  ];
  if (cartaoMap['pix']) (porCartao as unknown[]).push({ id: 'pix', nome: 'Pix', cor: MEIO_CORES.pix, total: cartaoMap['pix'], fechamento: 0, vencimento: 0, ativo: true, limite: 0 });
  if (cartaoMap['dinheiro']) (porCartao as unknown[]).push({ id: 'dinheiro', nome: 'Dinheiro', cor: MEIO_CORES.dinheiro, total: cartaoMap['dinheiro'], fechamento: 0, vencimento: 0, ativo: true, limite: 0 });
  if (cartaoMap['sem_cartao']) (porCartao as unknown[]).push({ id: 'sem_cartao', nome: 'Sem cartão', cor: '#908fa0', total: cartaoMap['sem_cartao'], fechamento: 0, vencimento: 0, ativo: true, limite: 0 });
  porCartao.sort((a, b) => (b.total as number) - (a.total as number));

  const catMap: Record<number, unknown> = {};
  for (const t of monthTxs) {
    if (!t.categoria_id) continue;
    const cat = categorias.find(c => c.id === t.categoria_id);
    if (!cat) continue;
    if (!catMap[t.categoria_id]) catMap[t.categoria_id] = { ...cat, total: 0 };
    (catMap[t.categoria_id] as Record<string, unknown>).total =
      ((catMap[t.categoria_id] as Record<string, unknown>).total as number) + Number(t.valor);
  }
  const porCategoria = Object.values(catMap).sort((a: unknown, b: unknown) =>
    ((b as Record<string, number>).total) - ((a as Record<string, number>).total)
  ).slice(0, 8);

  const sortByData = (a: DemoTx, b: DemoTx) => b.data.localeCompare(a.data);
  const allTxs = [...monthTxs].sort(sortByData).map(t => enrich(t, cartoes, categorias));

  return {
    total, renda, saldo: renda - total, quantidade: monthTxs.length,
    porCartao, porTipo, porCategoria,
    parcelasAbertas: monthTxs.filter(t => t.tipo === 'parcelada').sort(sortByData).map(t => enrich(t, cartoes, categorias)),
    fixasDoMes: monthTxs.filter(t => t.tipo === 'fixa').sort(sortByData).map(t => enrich(t, cartoes, categorias)),
    pixParceladosDoMes: 0,
    allTxs,
  };
}

function filterTransacoes(
  txs: DemoTx[], cartoes: DemoCartao[], categorias: DemoCategoria[],
  { mes, busca, tipo, cartao_id }: { mes?: string; busca?: string; tipo?: string; cartao_id?: string },
) {
  let result = [...txs];
  if (mes) {
    const [y, m] = mes.split('-').map(Number);
    result = result.filter(t => t.fatura_ano === y && t.fatura_mes === m);
  }
  if (tipo) result = result.filter(t => t.tipo === tipo);
  if (cartao_id) result = result.filter(t => String(t.cartao_id) === cartao_id);
  if (busca) result = result.filter(t => t.descricao.toLowerCase().includes(busca.toLowerCase()));
  result.sort((a, b) => b.data.localeCompare(a.data));
  return result.map(t => enrich(t, cartoes, categorias));
}

// ── Provider ────────────────────────────────────────────────────────────────

export default function DemoProvider({ children }: { children: React.ReactNode }) {
  const [transacoes, setTransacoes] = useState<DemoTx[]>(DEMO_TRANSACOES_INICIAIS);
  const [rendas, setRendas] = useState<Record<string, number>>(DEMO_RENDAS_INICIAIS);
  const [cartoesState, setCartoes] = useState<DemoCartao[]>(DEMO_CARTOES);
  const [categoriasState, setCategorias] = useState<DemoCategoria[]>(DEMO_CATEGORIAS);
  const [fixasConfigs, setFixasConfigs] = useState<Record<string, boolean>>({});

  const addTransacao = useCallback((payload: AddTxPayload) => {
    const now = new Date();
    const [y, m] = payload.data.split('-').map(Number);
    const catId = payload.categoria_ids[0] ?? null;
    const newTx: DemoTx = {
      id: _nextId++,
      descricao: payload.descricao,
      valor: payload.valor,
      data: payload.data,
      tipo: payload.tipo as DemoTx['tipo'],
      cartao_id: payload.cartao_id,
      categoria_id: catId,
      categoria_ids: payload.categoria_ids,
      meio_pagamento: payload.meio_pagamento,
      parcela_atual: 1,
      total_parcelas: payload.total_parcelas,
      grupo_parcela: null,
      fatura_ano: y || now.getFullYear(),
      fatura_mes: m || now.getMonth() + 1,
      pago: true,
      observacao: payload.observacao,
    };
    setTransacoes(prev => [newTx, ...prev]);
  }, []);

  const updateTransacao = useCallback((id: number, payload: Partial<DemoTx>) => {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
  }, []);

  const batchUpdateTransacoes = useCallback((updates: Array<{ id: number; payload: Partial<DemoTx> }>) => {
    setTransacoes(prev => {
      let result = prev;
      for (const { id, payload } of updates) {
        result = result.map(t => t.id === id ? { ...t, ...payload } : t);
      }
      return result;
    });
  }, []);

  const deleteTransacao = useCallback((id: number) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  }, []);

  const setRenda = useCallback((ano: number, mes: number, renda: number) => {
    setRendas(prev => ({ ...prev, [`${ano}-${mes}`]: renda }));
  }, []);

  const setFixaAtiva = useCallback((descricao: string, ativa: boolean) => {
    setFixasConfigs(prev => ({ ...prev, [descricao.toLowerCase()]: ativa }));
  }, []);

  const addCartao = useCallback((cartao: Omit<DemoCartao, 'id'>) => {
    setCartoes(prev => [...prev, { ...cartao, id: _nextCartaoId++ }]);
  }, []);

  const updateCartao = useCallback((id: number, payload: Partial<DemoCartao>) => {
    setCartoes(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
  }, []);

  const deleteCartao = useCallback((id: number) => {
    setCartoes(prev => prev.filter(c => c.id !== id));
  }, []);

  const addCategoria = useCallback((cat: Omit<DemoCategoria, 'id'>) => {
    setCategorias(prev => [...prev, { ...cat, id: _nextCatId++ }]);
  }, []);

  const updateCategoria = useCallback((id: number, payload: Partial<DemoCategoria>) => {
    setCategorias(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
  }, []);

  const deleteCategoria = useCallback((id: number) => {
    setCategorias(prev => prev.filter(c => c.id !== id));
  }, []);

  const computeDashboardCtx = useCallback((ano: number, mes: number) => {
    const renda = rendas[`${ano}-${mes}`] ?? 0;
    return computeDashboard(transacoes, cartoesState, categoriasState, ano, mes, renda);
  }, [transacoes, rendas, cartoesState, categoriasState]);

  const getTransacoes = useCallback((filters: { mes?: string; busca?: string; tipo?: string; cartao_id?: string }) => {
    return filterTransacoes(transacoes, cartoesState, categoriasState, filters);
  }, [transacoes, cartoesState, categoriasState]);

  return (
    <DemoContext.Provider value={{
      cartoes: cartoesState,
      categorias: categoriasState,
      fixasConfigs,
      computeDashboard: computeDashboardCtx,
      getTransacoes,
      addTransacao,
      updateTransacao,
      batchUpdateTransacoes,
      deleteTransacao,
      setRenda,
      setFixaAtiva,
      addCartao,
      updateCartao,
      deleteCartao,
      addCategoria,
      updateCategoria,
      deleteCategoria,
    }}>
      {children}
    </DemoContext.Provider>
  );
}
