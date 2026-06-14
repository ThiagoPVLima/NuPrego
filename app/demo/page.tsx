'use client';
import { useState } from 'react';
import { MESES } from '@/lib/format';
import { useDemoContext } from '@/contexts/DemoContext';
import MonthPicker from '@/components/molecules/MonthPicker';
import NovaTransacaoModal from '@/components/organisms/NovaTransacaoModal';
import TransacaoDetalheModal from '@/components/organisms/TransacaoDetalheModal';
import {
  HeroCard, ByCartaoCard, ByCategoriaCard,
  FixasCard, ParcelasCard, ListModal, FiltroModal, RendaModal,
} from '@/components/organisms/dashboard';
import Button from '@/components/atoms/Button';

type FiltroTipo = { tipo: 'cartao' | 'categoria'; key: string; label: string };

export default function DemoDashboard() {
  const demo = useDemoContext();
  const [ano, setAno] = useState(2026);
  const [mes, setMes] = useState(6);
  const [showNova, setShowNova] = useState(false);
  const [showLista, setShowLista] = useState<'fixas' | 'parceladas' | null>(null);
  const [txDetalhe, setTxDetalhe] = useState<any>(null);
  const [modalFiltro, setModalFiltro] = useState<FiltroTipo | null>(null);
  const [editRenda, setEditRenda] = useState(false);

  const data = demo.computeDashboard(ano, mes) as any;

  const navMes = (d: number) => {
    let m = mes + d, a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m); setAno(a);
  };

  const total = Number(data?.total || 0);
  const fixas = Number(data?.porTipo?.fixa || 0);
  const parceladas = Number(data?.porTipo?.parcelada || 0);
  const avulsas = Number(data?.porTipo?.avulsa || 0);
  const rendaVal = Number(data?.renda || 0);

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

  const onSaved = () => { setTxDetalhe(null); setShowLista(null); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {data?.quantidade || 0} transações · {MESES[mes - 1]} {ano}
          </div>
        </div>
        <div className="page-header-actions">
          <Button variant="ghost" type="button" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</Button>
          <MonthPicker ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
          <Button variant="ghost" type="button" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</Button>
          <Button type="button" variant="primary" onClick={() => setShowNova(true)}>+ Nova transação</Button>
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
          pixParcelados={0}
          mes={mes}
          onVerTodas={() => setShowLista('parceladas')}
          onClickItem={setTxDetalhe}
        />
      </div>

      {showNova && (
        <NovaTransacaoModal
          cartoesList={demo.cartoes}
          categoriasList={demo.categorias}
          onClose={() => setShowNova(false)}
          onSaved={() => setShowNova(false)}
          onDemoSave={demo.addTransacao}
        />
      )}

      {showLista && (
        <ListModal
          tipo={showLista}
          fixas={data?.fixasDoMes || []}
          parcelas={data?.parcelasAbertas || []}
          pixParcelados={0}
          mes={mes}
          onClose={() => setShowLista(null)}
          onClickItem={setTxDetalhe}
        />
      )}

      {txDetalhe && (
        <TransacaoDetalheModal
          transacao={txDetalhe}
          cartoes={demo.cartoes}
          categorias={demo.categorias}
          onClose={() => setTxDetalhe(null)}
          onSaved={onSaved}
          demoHandlers={{
            onUpdate: demo.updateTransacao,
            onDelete: demo.deleteTransacao,
          }}
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
          onSaved={() => setEditRenda(false)}
          onDemoSave={(renda) => demo.setRenda(ano, mes, renda)}
        />
      )}
    </div>
  );
}
