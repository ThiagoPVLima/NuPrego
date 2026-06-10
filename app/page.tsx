'use client';
import { useState, useEffect, useCallback } from 'react';
import { MESES } from '@/lib/format';
import MonthPicker from '@/components/molecules/MonthPicker';
import NovaTransacaoModal from '@/components/organisms/NovaTransacaoModal';
import TransacaoDetalheModal from '@/components/organisms/TransacaoDetalheModal';
import {
  HeroCard, ByCartaoCard, ByCategoriaCard,
  FixasCard, ParcelasCard, ListModal, FiltroModal, RendaModal,
} from '@/components/organisms/dashboard';

type FiltroTipo = { tipo: 'cartao' | 'categoria'; key: string; label: string };

export default function Dashboard() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editRenda, setEditRenda] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showLista, setShowLista] = useState<'fixas' | 'parceladas' | null>(null);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [txDetalhe, setTxDetalhe] = useState<any>(null);
  const [modalFiltro, setModalFiltro] = useState<FiltroTipo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/dashboard?ano=${ano}&mes=${mes}`);
    setData(await r.json());
    setLoading(false);
  }, [ano, mes]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]).then(([c, cat]) => {
      setCartoes(Array.isArray(c) ? c : []);
      setCategorias(Array.isArray(cat) ? cat : []);
    });
  }, []);

  const navMes = (d: number) => {
    let m = mes + d, a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m); setAno(a);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
    </div>
  );

  const total = Number(data?.total || 0);
  const fixas = Number(data?.porTipo?.fixa || 0);
  const parceladas = Number(data?.porTipo?.parcelada || 0);
  const avulsas = Number(data?.porTipo?.avulsa || 0);
  const rendaVal = Number(data?.renda || 0);
  const pixParceladosDoMes = Number(data?.pixParceladosDoMes || 0);

  const txsFiltrados = modalFiltro
    ? (data?.allTxs || []).filter((t: any) => {
        if (modalFiltro.tipo === 'cartao') {
          if (modalFiltro.key === 'pix') return t.meio_pagamento === 'pix';
          if (modalFiltro.key === 'dinheiro') return t.meio_pagamento === 'dinheiro';
          if (modalFiltro.key === 'sem_cartao') return !t.cartao_id && !t.meio_pagamento;
          return String(t.cartao_id) === modalFiltro.key;
        }
        const ids: number[] = Array.isArray(t.categoria_ids) && t.categoria_ids.length
          ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []);
        return ids.includes(Number(modalFiltro.key));
      })
    : [];

  const onSaved = () => { setTxDetalhe(null); setShowLista(null); load(); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard
          </h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {data?.quantidade || 0} transações · {MESES[mes - 1]} {ano}
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn-ghost" type="button" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</button>
          <MonthPicker ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
          <button className="btn-ghost" type="button" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</button>
          <button type="button" className="btn-primary" onClick={() => setShowNova(true)}>+ Nova transação</button>
        </div>
      </div>

      <HeroCard
        total={total} fixas={fixas} parceladas={parceladas} avulsas={avulsas}
        renda={rendaVal} mes={mes} onEditRenda={() => setEditRenda(true)}
      />

      <div className="two-col-grid">
        <ByCartaoCard
          items={data?.porCartao || []} total={total}
          onClickItem={(key, label) => setModalFiltro({ tipo: 'cartao', key, label })}
        />
        <ByCategoriaCard
          items={data?.porCategoria || []} total={total}
          onClickItem={(key, label) => setModalFiltro({ tipo: 'categoria', key, label })}
        />
      </div>

      <div className="two-col-grid">
        <FixasCard
          fixas={data?.fixasDoMes || []}
          onVerTodas={() => setShowLista('fixas')}
          onClickItem={setTxDetalhe}
        />
        <ParcelasCard
          parcelas={data?.parcelasAbertas || []}
          pixParcelados={pixParceladosDoMes}
          mes={mes}
          onVerTodas={() => setShowLista('parceladas')}
          onClickItem={setTxDetalhe}
        />
      </div>

      {showNova && (
        <NovaTransacaoModal
          onClose={() => setShowNova(false)}
          onSaved={() => { setShowNova(false); load(); }}
        />
      )}

      {showLista && (
        <ListModal
          tipo={showLista}
          fixas={data?.fixasDoMes || []}
          parcelas={data?.parcelasAbertas || []}
          pixParcelados={pixParceladosDoMes}
          mes={mes}
          onClose={() => setShowLista(null)}
          onClickItem={setTxDetalhe}
        />
      )}

      {txDetalhe && (
        <TransacaoDetalheModal
          transacao={txDetalhe}
          cartoes={cartoes}
          categorias={categorias}
          onClose={() => setTxDetalhe(null)}
          onSaved={onSaved}
        />
      )}

      {modalFiltro && !txDetalhe && (
        <FiltroModal
          label={modalFiltro.label}
          transactions={txsFiltrados}
          onClose={() => setModalFiltro(null)}
          onClickItem={setTxDetalhe}
        />
      )}

      {editRenda && (
        <RendaModal
          mes={mes} ano={ano} renda={rendaVal}
          onClose={() => setEditRenda(false)}
          onSaved={() => { setEditRenda(false); load(); }}
        />
      )}
    </div>
  );
}
