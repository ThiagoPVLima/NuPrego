'use client';
import { useState, useEffect, useCallback } from 'react';
import { fmt, tipoCor, meioCor, meioLabel } from '@/lib/format';
import MonthPicker from '@/components/molecules/MonthPicker';
import NovaTransacaoModal from '@/components/organisms/NovaTransacaoModal';
import ConfirmarModal from '@/components/molecules/ConfirmarModal';
import TransacaoDetalheModal from '@/components/organisms/TransacaoDetalheModal';
import { TransacoesTabs, TransacoesTabela, TransacaoRow } from '@/components/organisms/transacoes';
import type { Aba } from '@/components/organisms/transacoes';
import { MESES } from '@/lib/format';
import CustomSelect from '@/components/molecules/CustomSelect';
import Button from '@/components/atoms/Button';

export default function Transacoes() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>('avulsa');
  const [showNova, setShowNova] = useState(false);
  const [novaInit, setNovaInit] = useState<any>(null);
  const [txDetalhe, setTxDetalhe] = useState<any>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState<any>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCartao, setFiltroCartao] = useState('');
  const [pixNextTxs, setPixNextTxs] = useState<any[]>([]);

  const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAno = mes === 12 ? ano + 1 : ano;
  const nextMesStr = `${nextAno}-${String(nextMes).padStart(2, '0')}`;
  const nextMesLabel = MESES[nextMes - 1];

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ mes: mesStr });
    if (filtroCartao) p.set('cartao_id', filtroCartao);
    if (busca) p.set('busca', busca);
    const pNext = new URLSearchParams({ mes: nextMesStr, tipo: 'parcelada' });
    const pixNextFetch = filtroCartao
      ? Promise.resolve([])
      : fetch(`/api/transacoes?${pNext}`).then(r => r.json()).catch(() => []);
    const [t, c, cat, pn] = await Promise.all([
      fetch(`/api/transacoes?${p}`).then(r => r.json()),
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
      pixNextFetch,
    ]);
    setTxs(Array.isArray(t) ? t : []);
    setCartoes(Array.isArray(c) ? c : []);
    setCategorias(Array.isArray(cat) ? cat : []);
    setPixNextTxs((Array.isArray(pn) ? pn : []).filter((x: any) => !x.cartao_id && !x.projetado));
    setLoading(false);
  }, [mesStr, nextMesStr, filtroCartao, busca]);

  useEffect(() => { load(); }, [load]);

  const navMes = (d: number) => {
    let m = mes + d, a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m); setAno(a);
  };

  const togglePago = async (t: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const novoPago = !t.pago;
    setTxs(prev => prev.map(tx => tx.id === t.id ? { ...tx, pago: novoPago } : tx));
    await fetch(`/api/transacoes/${t.id}?pago_only=1`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pago: novoPago }),
    });
  };

  const marcarProjetadaPaga = async (t: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = {
      descricao: t.descricao, valor: t.valor, data: t.data, tipo: t.tipo, cartao_id: null,
      categoria_ids: Array.isArray(t.categoria_ids) && t.categoria_ids.length
        ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
      meio_pagamento: t.meio_pagamento || null, pago: true,
    };
    await fetch('/api/transacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    load();
  };

  const excluirConfirmado = async () => {
    if (!confirmarExcluir) return;
    setExcluindo(true);
    const t = confirmarExcluir;
    const url = t.tipo === 'parcelada' && t.grupo_parcela
      ? `/api/transacoes/${t.id}?grupo=${t.grupo_parcela}`
      : `/api/transacoes/${t.id}`;
    await fetch(url, { method: 'DELETE' });
    setConfirmarExcluir(null); setExcluindo(false); load();
  };

  const getMeio = (t: any) => {
    if (t.meio_pagamento === 'pix') return { label: 'Pix', cor: meioCor.pix };
    if (t.meio_pagamento === 'dinheiro') return { label: 'Dinheiro', cor: meioCor.dinheiro };
    if (t.cartoes) return { label: t.cartoes.nome.replace('Cartão ', ''), cor: t.cartoes.cor };
    return null;
  };

  const txsAvulsas = txs.filter(t => t.tipo === 'avulsa');
  const txsParceladas = txs.filter(t => t.tipo === 'parcelada');
  const txsFixas = txs.filter(t => t.tipo === 'fixa');

  const totalAvulsas = txsAvulsas.reduce((s, t) => s + Number(t.valor), 0);
  const totalParceladas = txsParceladas.filter(t => !t.projetado).reduce((s, t) => s + Number(t.valor), 0);
  const totalFixas = txsFixas.reduce((s, t) => s + Number(t.valor), 0);
  const totalPix = pixNextTxs.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const totalGeral = totalAvulsas + totalParceladas + totalFixas;

  const abaAtual = aba === 'avulsa' ? txsAvulsas
    : aba === 'parcelada' ? txsParceladas
    : aba === 'fixa' ? txsFixas
    : pixNextTxs;

  const ABAS: { key: Aba; label: string; total: number; cor: string }[] = [
    { key: 'avulsa', label: 'Avulsas', total: totalAvulsas, cor: tipoCor.avulsa },
    { key: 'parcelada', label: 'Parceladas', total: totalParceladas, cor: tipoCor.parcelada },
    { key: 'fixa', label: 'Fixas', total: totalFixas, cor: tipoCor.fixa },
    { key: 'pix', label: 'PIX / Dinheiro', total: totalPix, cor: meioCor.pix },
  ];

  const emptyLabels: Record<Aba, string> = {
    avulsa: 'Nenhuma transação avulsa neste mês',
    parcelada: 'Nenhuma transação parcelada neste mês',
    fixa: 'Nenhuma transação fixa neste mês',
    pix: 'Nenhum parcelado PIX / Dinheiro neste mês',
  };

  const onClickRow = (t: any) => {
    if (t.projetado) {
      setNovaInit({
        descricao: t.descricao, valor: String(t.valor), tipo: t.tipo,
        meio: t.meio_pagamento || (t.cartao_id ? 'cartao' : 'cartao'),
        cartao_id: t.cartao_id ? String(t.cartao_id) : '',
        categoria_ids: Array.isArray(t.categoria_ids) && t.categoria_ids.length
          ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
      });
      setShowNova(true);
    } else {
      setTxDetalhe(t);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>
            Transações
          </h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {txs.filter(t => !t.projetado).length} lançadas
            <span style={{ margin: '0 6px', color: 'var(--outline-variant)' }}>·</span>
            <span style={{ color: tipoCor.avulsa }}>{txsAvulsas.length} avulsas {fmt(totalAvulsas)}</span>
            <span style={{ margin: '0 6px', color: 'var(--outline-variant)' }}>·</span>
            <span style={{ color: tipoCor.parcelada }}>{txsParceladas.filter(t => !t.projetado).length} parceladas {fmt(totalParceladas)}</span>
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
        <input placeholder="Buscar transação..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: '220px' }} />
        <CustomSelect
          value={filtroCartao}
          onChange={setFiltroCartao}
          options={[
            { value: '', label: 'Todos os cartões' },
            ...cartoes.map((c: any) => ({ value: String(c.id), label: c.nome })),
          ]}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <TransacoesTabs abas={ABAS} aba={aba} onChange={setAba} />
        <TransacoesTabela aba={aba} loading={loading} emptyLabel={emptyLabels[aba]}>
          {abaAtual.map((t, idx) => (
            <TransacaoRow
              key={t.projetado ? `proj-${t.descricao}-${idx}` : t.id}
              transacao={t}
              aba={aba}
              nextMesLabel={nextMesLabel}
              categorias={categorias}
              getMeio={getMeio}
              onClick={() => onClickRow(t)}
              onTogglePago={e => togglePago(t, e)}
              onExcluir={e => { e.stopPropagation(); setConfirmarExcluir(t); }}
              onMarcarProjetadaPaga={e => marcarProjetadaPaga(t, e)}
            />
          ))}
        </TransacoesTabela>
      </div>

      {showNova && (
        <NovaTransacaoModal
          initialData={novaInit ?? undefined}
          onClose={() => { setShowNova(false); setNovaInit(null); }}
          onSaved={() => { setShowNova(false); setNovaInit(null); load(); }}
        />
      )}

      {txDetalhe && (
        <TransacaoDetalheModal
          transacao={txDetalhe}
          cartoes={cartoes}
          categorias={categorias}
          onClose={() => setTxDetalhe(null)}
          onSaved={() => { setTxDetalhe(null); load(); }}
        />
      )}

      {confirmarExcluir && (
        <ConfirmarModal
          mensagem={confirmarExcluir.tipo === 'parcelada' && confirmarExcluir.grupo_parcela
            ? 'Excluir todas as parcelas?' : 'Excluir esta transação?'}
          detalhe={confirmarExcluir.descricao}
          textoConfirmar="Excluir"
          confirmando={excluindo}
          onConfirmar={excluirConfirmado}
          onCancelar={() => setConfirmarExcluir(null)}
        />
      )}
    </div>
  );
}
