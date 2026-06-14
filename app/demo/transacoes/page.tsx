'use client';
import { useState, useMemo } from 'react';
import { fmt, tipoCor, meioCor } from '@/lib/format';
import { MESES } from '@/lib/format';
import { useDemoContext } from '@/contexts/DemoContext';
import MonthPicker from '@/components/molecules/MonthPicker';
import NovaTransacaoModal from '@/components/organisms/NovaTransacaoModal';
import TransacaoDetalheModal from '@/components/organisms/TransacaoDetalheModal';
import { TransacoesTabs, TransacoesTabela, TransacaoRow } from '@/components/organisms/transacoes';
import type { Aba } from '@/components/organisms/transacoes';
import CustomSelect from '@/components/molecules/CustomSelect';
import Button from '@/components/atoms/Button';

export default function DemoTransacoes() {
  const demo = useDemoContext();
  const [ano, setAno] = useState(2026);
  const [mes, setMes] = useState(6);
  const [aba, setAba] = useState<Aba>('avulsa');
  const [showNova, setShowNova] = useState(false);
  const [novaInit, setNovaInit] = useState<any>(null);
  const [txDetalhe, setTxDetalhe] = useState<any>(null);
  const [busca, setBusca] = useState('');
  const [filtroCartao, setFiltroCartao] = useState('');

  const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAno = mes === 12 ? ano + 1 : ano;
  const nextMesLabel = MESES[nextMes - 1];

  const txs = useMemo(() => demo.getTransacoes({
    mes: mesStr,
    busca: busca || undefined,
    cartao_id: filtroCartao || undefined,
  }), [demo, mesStr, busca, filtroCartao]) as any[];

  const navMes = (d: number) => {
    let m = mes + d, a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m); setAno(a);
  };

  const getMeio = (t: any) => {
    if (t.meio_pagamento === 'pix') return { label: 'Pix', cor: meioCor.pix };
    if (t.meio_pagamento === 'dinheiro') return { label: 'Dinheiro', cor: meioCor.dinheiro };
    if (t.cartoes) return { label: t.cartoes.nome.replace('Cartão ', ''), cor: t.cartoes.cor };
    return null;
  };

  const txsAvulsas = txs.filter((t: any) => t.tipo === 'avulsa');
  const txsParceladas = txs.filter((t: any) => t.tipo === 'parcelada');
  const txsFixas = txs.filter((t: any) => t.tipo === 'fixa');

  const totalAvulsas = txsAvulsas.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const totalParceladas = txsParceladas.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const totalFixas = txsFixas.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const totalGeral = totalAvulsas + totalParceladas + totalFixas;

  const abaAtual = aba === 'avulsa' ? txsAvulsas
    : aba === 'parcelada' ? txsParceladas
    : aba === 'fixa' ? txsFixas
    : [];

  const ABAS: { key: Aba; label: string; total: number; cor: string }[] = [
    { key: 'avulsa', label: 'Avulsas', total: totalAvulsas, cor: tipoCor.avulsa },
    { key: 'parcelada', label: 'Parceladas', total: totalParceladas, cor: tipoCor.parcelada },
    { key: 'fixa', label: 'Fixas', total: totalFixas, cor: tipoCor.fixa },
    { key: 'pix', label: 'PIX / Dinheiro', total: 0, cor: meioCor.pix },
  ];

  const emptyLabels: Record<Aba, string> = {
    avulsa: 'Nenhuma transação avulsa neste mês',
    parcelada: 'Nenhuma transação parcelada neste mês',
    fixa: 'Nenhuma transação fixa neste mês',
    pix: 'Nenhum parcelado PIX / Dinheiro neste mês',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transações</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {txs.length} lançadas
            <span style={{ margin: '0 6px', color: 'var(--outline-variant)' }}>·</span>
            <span style={{ color: tipoCor.avulsa }}>{txsAvulsas.length} avulsas {fmt(totalAvulsas)}</span>
            <span style={{ margin: '0 6px', color: 'var(--outline-variant)' }}>·</span>
            <span style={{ color: tipoCor.parcelada }}>{txsParceladas.length} parceladas {fmt(totalParceladas)}</span>
            <span style={{ margin: '0 6px', color: 'var(--outline-variant)' }}>·</span>
            <span style={{ color: tipoCor.fixa }}>{txsFixas.length} fixas {fmt(totalFixas)}</span>
            <span style={{ margin: '0 8px', color: 'var(--outline-variant)' }}>·</span>
            <span style={{ fontWeight: 600, color: 'var(--on-surface-muted)' }}>total {fmt(totalGeral)}</span>
          </div>
        </div>
        <div className="page-header-actions">
          <Button type="button" variant="ghost" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</Button>
          <MonthPicker ano={ano} mes={mes} onChange={(a, m) => { setAno(a); setMes(m); }} />
          <Button type="button" variant="ghost" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</Button>
          <Button type="button" variant="primary" onClick={() => setShowNova(true)}>+ Nova transação</Button>
        </div>
      </div>

      <div className="filters-row">
        <input
          placeholder="Buscar transação..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ maxWidth: '220px' }}
        />
        <CustomSelect
          value={filtroCartao}
          onChange={setFiltroCartao}
          options={[
            { value: '', label: 'Todos os cartões' },
            ...demo.cartoes.map((c: any) => ({ value: String(c.id), label: c.nome })),
          ]}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <TransacoesTabs abas={ABAS} aba={aba} onChange={setAba} />
        <TransacoesTabela aba={aba} loading={false} emptyLabel={emptyLabels[aba]}>
          {abaAtual.map((t: any, idx: number) => (
            <TransacaoRow
              key={t.id ?? idx}
              transacao={t}
              aba={aba}
              nextMesLabel={nextMesLabel}
              categorias={demo.categorias}
              getMeio={getMeio}
              onClick={() => setTxDetalhe(t)}
              onTogglePago={(e) => { e.stopPropagation(); demo.updateTransacao(t.id, { pago: !t.pago }); }}
              onExcluir={(e) => { e.stopPropagation(); demo.deleteTransacao(t.id); }}
              onMarcarProjetadaPaga={(e) => { e.stopPropagation(); }}
            />
          ))}
        </TransacoesTabela>
      </div>

      {showNova && (
        <NovaTransacaoModal
          initialData={novaInit ?? undefined}
          cartoesList={demo.cartoes}
          categoriasList={demo.categorias}
          onClose={() => { setShowNova(false); setNovaInit(null); }}
          onSaved={() => { setShowNova(false); setNovaInit(null); }}
          onDemoSave={demo.addTransacao}
        />
      )}

      {txDetalhe && (
        <TransacaoDetalheModal
          transacao={txDetalhe}
          cartoes={demo.cartoes}
          categorias={demo.categorias}
          onClose={() => setTxDetalhe(null)}
          onSaved={() => setTxDetalhe(null)}
          demoHandlers={{
            onUpdate: demo.updateTransacao,
            onDelete: demo.deleteTransacao,
          }}
        />
      )}
    </div>
  );
}
