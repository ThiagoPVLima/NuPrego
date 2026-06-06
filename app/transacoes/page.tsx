'use client';
import { useState, useEffect, useCallback } from 'react';
import CatMultiSelect from '@/components/CatMultiSelect';
import NovaTransacaoModal from '@/components/NovaTransacaoModal';
import ConfirmarModal from '@/components/ConfirmarModal';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const tipoCor: Record<string, string> = { fixa: '#8083ff', parcelada: '#ffb783', avulsa: '#6edab4' };
const meioCor: Record<string, string> = { pix: '#00b8d4', dinheiro: '#6edab4' };
const meioLabel: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro' };

type Aba = 'avulsa' | 'parcelada' | 'fixa' | 'pix';

export default function Transacoes() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>('avulsa');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [showNova, setShowNova] = useState(false);
  const [novaInit, setNovaInit] = useState<any>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState<any>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCartao, setFiltroCartao] = useState('');
  const [form, setForm] = useState({
    descricao: '', valor: '', data: now.toISOString().split('T')[0],
    tipo: 'avulsa', meio: 'cartao', cartao_id: '', categoria_ids: [] as number[], total_parcelas: '1',
  });

  const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
  const nextMesStr = (() => {
    const m = mes === 12 ? 1 : mes + 1;
    const a = mes === 12 ? ano + 1 : ano;
    return `${a}-${String(m).padStart(2, '0')}`;
  })();

  const [pixNextTxs, setPixNextTxs] = useState<any[]>([]);

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

  const abrirEditar = (t: any) => {
    setEditando(t);
    setErroSalvar(null);
    const meio = t.meio_pagamento || 'cartao';
    const catIds = Array.isArray(t.categoria_ids) && t.categoria_ids.length
      ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []);
    setForm({
      descricao: t.descricao, valor: String(t.valor), data: t.data,
      tipo: t.tipo, meio, cartao_id: String(t.cartao_id || ''),
      categoria_ids: catIds, total_parcelas: String(t.total_parcelas || 1),
    });
    setShowModal(true);
  };

  const salvar = async () => {
    setSalvando(true); setErroSalvar(null);
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')),
      data: form.data, tipo: form.tipo,
      cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
      categoria_ids: form.categoria_ids,
      total_parcelas: parseInt(form.total_parcelas),
      meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
    };
    try {
      const r = editando
        ? await fetch(`/api/transacoes/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/transacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await r.json();
      if (!r.ok) { setErroSalvar(json.error || 'Erro ao salvar'); return; }
      setShowModal(false); load();
    } catch { setErroSalvar('Erro de conexão'); }
    finally { setSalvando(false); }
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
      categoria_ids: Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
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
    setConfirmarExcluir(null); setShowModal(false); setExcluindo(false); load();
  };

  const meioPagamento = (t: any) => {
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

  const abaAtual = aba === 'avulsa' ? txsAvulsas : aba === 'parcelada' ? txsParceladas : aba === 'fixa' ? txsFixas : pixNextTxs;

  const ABAS: { key: Aba; label: string; total: number; cor: string }[] = [
    { key: 'avulsa', label: 'Avulsas', total: totalAvulsas, cor: tipoCor.avulsa },
    { key: 'parcelada', label: 'Parceladas', total: totalParceladas, cor: tipoCor.parcelada },
    { key: 'fixa', label: 'Fixas', total: totalFixas, cor: tipoCor.fixa },
    { key: 'pix', label: 'PIX / Dinheiro', total: totalPix, cor: meioCor.pix },
  ];

  const renderRow = (t: any, idx: number) => {
    const mp = meioPagamento(t);
    const projetado = !!t.projetado;
    const handleClick = () => {
      if (projetado) {
        setNovaInit({
          descricao: t.descricao, valor: String(t.valor), tipo: t.tipo,
          meio: t.meio_pagamento || (t.cartao_id ? 'cartao' : 'cartao'),
          cartao_id: t.cartao_id ? String(t.cartao_id) : '',
          categoria_ids: Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
        });
        setShowNova(true);
      } else {
        abrirEditar(t);
      }
    };

    return (
      <div
        key={projetado ? `proj-${t.descricao}-${idx}` : t.id}
        className="table-row table-row-data"
        style={{ gridTemplateColumns: aba === 'parcelada' ? '1fr 130px 150px 80px 90px' : aba === 'pix' ? '1fr 130px 150px 80px 90px' : '1fr 130px 150px 90px', cursor: 'pointer' }}
        onClick={handleClick}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '14px', color: 'var(--on-surface)' }}>{t.descricao}</span>
            {projetado && (
              <span style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--surface-high)', padding: '1px 6px', borderRadius: '999px', flexShrink: 0 }}>
                recorrente
              </span>
            )}
          </div>
          {(() => {
            const ids: number[] = Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []);
            const cats = ids.map((id: number) => categorias.find((c: any) => c.id === id)).filter(Boolean);
            return cats.length > 0 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                {cats.map((c: any) => (
                  <span key={c.id} style={{ fontSize: '10px', color: c.cor || '#8083ff', background: `${c.cor || '#8083ff'}18`, padding: '1px 6px', borderRadius: '999px', fontFamily: 'Manrope, sans-serif' }}>
                    {c.icone ? `${c.icone} ` : ''}{c.nome}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          <div className="row-meta-mobile" style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
            {mp && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: mp.cor, display: 'inline-block' }}></span>{mp.label}</span>}
            {(aba === 'parcelada' || aba === 'pix') && t.parcela_atual && t.total_parcelas && <span>{t.parcela_atual}/{t.total_parcelas}</span>}
          </div>
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 500, color: 'var(--on-surface)' }}>{fmt(Number(t.valor))}</div>

        <div className="table-col-hide-mobile">
          {mp ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--on-surface-muted)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: mp.cor, display: 'inline-block', flexShrink: 0 }}></span>
              {mp.label}
            </span>
          ) : <span style={{ color: 'var(--outline-variant)' }}>—</span>}
        </div>

        {(aba === 'parcelada' || aba === 'pix') && (
          <div className="table-col-hide-mobile">
            {t.parcela_atual && t.total_parcelas ? (
              <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                {t.parcela_atual}<span style={{ color: 'var(--outline-variant)' }}>/{t.total_parcelas}</span>
              </span>
            ) : <span style={{ color: 'var(--outline-variant)', fontSize: '12px' }}>—</span>}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: t.pago ? 'var(--outline-variant)' : 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', textDecoration: t.pago ? 'line-through' : 'none' }}>
            {projetado ? '—' : new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
          {projetado ? (
            !t.cartao_id && (
              <button type="button" title="Marcar como paga" onClick={e => marcarProjetadaPaga(t, e)}
                style={{ fontSize: '13px', padding: '3px 5px', background: 'none', border: 'none', cursor: 'pointer', color: '#6edab4', borderRadius: '4px', lineHeight: 1 }}>✓</button>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button type="button" title={t.pago ? 'Marcar como não pago' : 'Marcar como pago'} onClick={e => togglePago(t, e)}
                style={{ fontSize: '13px', padding: '3px 5px', background: 'none', border: 'none', cursor: 'pointer', color: t.pago ? '#6edab4' : 'var(--outline-variant)', borderRadius: '4px', lineHeight: 1 }}>
                {t.pago ? '✓' : '○'}
              </button>
              <button type="button" className="btn-ghost" onClick={e => { e.stopPropagation(); setConfirmarExcluir(t); }} style={{ fontSize: '13px', padding: '4px 6px' }}>✕</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>Transações</h1>
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
          <button type="button" className="btn-ghost" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</button>
          <div className="month-display">{MESES[mes-1]} {ano}</div>
          <button type="button" className="btn-ghost" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</button>
          <button type="button" className="btn-primary" onClick={() => setShowNova(true)}>+ Nova transação</button>
        </div>
      </div>

      <div className="filters-row">
        <input placeholder="Buscar transação..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: '220px' }} />
        <select aria-label="Filtrar por cartão" value={filtroCartao} onChange={e => setFiltroCartao(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="">Todos os cartões</option>
          {cartoes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface-low)' }}>
          {ABAS.map(a => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAba(a.key)}
              style={{
                padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: aba === a.key ? `2px solid ${a.cor}` : '2px solid transparent',
                color: aba === a.key ? a.cor : 'var(--outline)',
                fontFamily: 'Manrope, sans-serif', fontWeight: aba === a.key ? 700 : 400,
                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '-1px', transition: 'color 0.15s',
              }}
            >
              {a.label}
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', opacity: 0.8 }}>{fmt(a.total)}</span>
            </button>
          ))}
        </div>

        <div className="table-responsive-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div style={{ minWidth: (aba === 'parcelada' || aba === 'pix') ? '580px' : '520px' }}>
            {/* Header da tabela */}
            <div className="table-row table-header-hide-mobile" style={{
              gridTemplateColumns: (aba === 'parcelada' || aba === 'pix') ? '1fr 130px 150px 80px 90px' : '1fr 130px 150px 90px',
              background: 'var(--surface-low)', fontSize: '11px', color: 'var(--outline)',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em',
            }}>
              <span>DESCRIÇÃO</span>
              <span>VALOR</span>
              <span>PAGAMENTO</span>
              {(aba === 'parcelada' || aba === 'pix') && <span>PARCELA</span>}
              <span>DATA</span>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
            ) : abaAtual.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>
                {aba === 'pix' ? 'Nenhum parcelado PIX / Dinheiro neste mês' : `Nenhuma transação ${aba === 'avulsa' ? 'avulsa' : aba === 'parcelada' ? 'parcelada' : 'fixa'} neste mês`}
              </div>
            ) : abaAtual.map(renderRow)}
          </div>
        </div>
      </div>

      {showNova && (
        <NovaTransacaoModal
          initialData={novaInit ?? undefined}
          onClose={() => { setShowNova(false); setNovaInit(null); }}
          onSaved={() => { setShowNova(false); setNovaInit(null); load(); }}
        />
      )}

      {confirmarExcluir && (
        <ConfirmarModal
          mensagem={confirmarExcluir.tipo === 'parcelada' && confirmarExcluir.grupo_parcela ? 'Excluir todas as parcelas?' : 'Excluir esta transação?'}
          detalhe={confirmarExcluir.descricao}
          textoConfirmar="Excluir"
          confirmando={excluindo}
          onConfirmar={excluirConfirmado}
          onCancelar={() => setConfirmarExcluir(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--on-surface)', margin: 0 }}>
                {editando ? 'Editar transação' : 'Nova transação'}
              </h2>
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
                <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Netflix, Supermercado..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR (R$)</label>
                  <input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DATA</label>
                  <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>TIPO</label>
                  <select aria-label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                    <option value="avulsa">Avulsa</option>
                    <option value="fixa">Fixa</option>
                    <option value="parcelada">Parcelada</option>
                  </select>
                </div>
                {form.tipo === 'parcelada' && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>Nº PARCELAS</label>
                    <input type="number" min="2" max="60" value={form.total_parcelas} onChange={e => setForm({ ...form, total_parcelas: e.target.value })} />
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FORMA DE PAGAMENTO</label>
                <select aria-label="Forma de pagamento" value={form.meio}
                  onChange={e => setForm({ ...form, meio: e.target.value, cartao_id: ['pix', 'dinheiro'].includes(e.target.value) ? '' : form.cartao_id })}>
                  <option value="cartao">Cartão de crédito</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              {form.meio === 'cartao' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CARTÃO</label>
                  <select aria-label="Cartão" value={form.cartao_id} onChange={e => setForm({ ...form, cartao_id: e.target.value })}>
                    <option value="">Sem cartão específico</option>
                    {cartoes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CATEGORIAS</label>
                <CatMultiSelect value={form.categoria_ids} onChange={ids => setForm({ ...form, categoria_ids: ids })} categorias={categorias} />
              </div>
              {(form.meio === 'pix' || form.meio === 'dinheiro') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: `${meioCor[form.meio]}15`, border: `1px solid ${meioCor[form.meio]}30`, borderRadius: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meioCor[form.meio], display: 'inline-block' }}></span>
                  <span style={{ fontSize: '13px', color: 'var(--on-surface-muted)' }}>
                    Pagamento via <strong style={{ color: meioCor[form.meio] }}>{meioLabel[form.meio]}</strong>
                  </span>
                </div>
              )}
              {erroSalvar && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px' }}>
                  ❌ {erroSalvar}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {editando && (
                  <button type="button" className="btn-danger" onClick={() => { setShowModal(false); setConfirmarExcluir(editando); }}>✕ Excluir</button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={salvar} disabled={salvando} style={{ flex: 1, justifyContent: 'center', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
