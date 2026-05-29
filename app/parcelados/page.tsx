'use client';
import { useState, useEffect, useCallback } from 'react';
import CatMultiSelect from '@/components/CatMultiSelect';
import NovaTransacaoModal from '@/components/NovaTransacaoModal';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const hoje = new Date().toISOString().split('T')[0];

type Filtro = 'abertos' | 'todos' | 'finalizados';

type Grupo = {
  descricao: string;
  valorParcela: number;
  totalParcelas: number;
  pagas: number;
  cartaoId: number | null;
  categoriaId: number | null;
  categoriaIds: number[];
  meioP: string | null;
  grupo: string | null;
  id: number;
  dataInicio: string;
  parcelas: { id: number; data: string; parcela_atual: number; pago: boolean }[];
};

type Secao = {
  key: string;
  titulo: string;
  cor: string;
  itens: Grupo[];
  totalMes: number;
  totalRestante: number;
  totalGeral: number;
};

export default function Parcelados() {
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('abertos');
  const [secoesAbertas, setSecoesAbertas] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Grupo | null>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', cartao_id: '', categoria_ids: [] as number[], meio: 'cartao', dataInicio: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [adiantando, setAdiantando] = useState<{ key: string; qual: 'proxima' | 'ultima' } | null>(null);
  const [marcandoPago, setMarcandoPago] = useState<string | null>(null);
  const [showNova, setShowNova] = useState(false);
  const novaInit = { tipo: 'parcelada' };

  const load = useCallback(async () => {
    setLoading(true);
    const [t, c, cat] = await Promise.all([
      fetch('/api/transacoes?tipo=parcelada').then(r => r.json()),
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]);
    setTxs(Array.isArray(t) ? t : []);
    setCartoes(Array.isArray(c) ? c : []);
    setCategorias(Array.isArray(cat) ? cat : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grupos: Record<string, Grupo> = txs.reduce((acc, t) => {
    const baseDesc = t.descricao.replace(/ \d+\/\d+$/, '');
    const key = t.grupo_parcela || `${baseDesc}__${t.cartao_id ?? 'null'}__${t.total_parcelas}`;
    if (!acc[key]) {
      acc[key] = {
        descricao: baseDesc,
        valorParcela: Number(t.valor),
        totalParcelas: t.total_parcelas,
        pagas: 0,
        cartaoId: t.cartao_id,
        categoriaId: t.categoria_id,
        categoriaIds: Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
        meioP: t.meio_pagamento,
        grupo: t.grupo_parcela,
        id: t.id,
        dataInicio: t.data,
        parcelas: [],
      };
    }
    acc[key].parcelas.push({ id: t.id, data: t.data, parcela_atual: t.parcela_atual, pago: !!t.pago });
    if (t.pago) acc[key].pagas++;
    if (t.data < acc[key].dataInicio) acc[key].dataInicio = t.data;
    return acc;
  }, {} as Record<string, Grupo>);

  const lista = Object.values(grupos);

  const filtradas = lista.filter(g => {
    if (filtro === 'abertos') return g.pagas < g.totalParcelas;
    if (filtro === 'finalizados') return g.pagas >= g.totalParcelas;
    return true;
  });

  const buildSecao = (key: string, titulo: string, cor: string, itens: Grupo[]): Secao => {
    const abertas = itens.filter(g => g.pagas < g.totalParcelas);
    return {
      key, titulo, cor, itens,
      totalMes:      abertas.reduce((s, g) => s + g.valorParcela, 0),
      totalRestante: itens.reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0),
      totalGeral:    itens.reduce((s, g) => s + g.valorParcela * g.totalParcelas, 0),
    };
  };

  const secoes: Secao[] = [];
  const cartoesComParcelas = cartoes.filter(c => filtradas.some(g => g.cartaoId === c.id));
  for (const c of cartoesComParcelas) {
    const itens = filtradas.filter(g => g.cartaoId === c.id);
    if (itens.length) secoes.push(buildSecao(String(c.id), c.nome, c.cor, itens));
  }
  const semCartaoItens = filtradas.filter(g => !g.cartaoId);
  if (semCartaoItens.length) {
    secoes.push(buildSecao('sem_cartao', 'Pix / Dinheiro / Sem cartão', '#908fa0', semCartaoItens));
  }

  const totalMesGlobal = lista
    .filter(g => g.pagas < g.totalParcelas)
    .reduce((s, g) => s + g.valorParcela, 0);
  const totalRestanteGlobal = filtradas
    .reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0);

  const toggleSecao = (key: string) => {
    setSecoesAbertas(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const abrirEditar = (g: Grupo) => {
    setEditando(g);
    setErroSalvar(null);
    setForm({
      descricao: g.descricao,
      valor: String(g.valorParcela),
      cartao_id: String(g.cartaoId || ''),
      categoria_ids: g.categoriaIds ?? (g.categoriaId ? [g.categoriaId] : []),
      meio: g.meioP || 'cartao',
      dataInicio: g.dataInicio,
    });
    setShowModal(true);
  };

  const salvar = async () => {
    if (!editando) return;
    setSalvando(true);
    setErroSalvar(null);
    const url = editando.grupo
      ? `/api/transacoes/${editando.id}?grupo=${editando.grupo}`
      : `/api/transacoes/${editando.id}`;
    try {
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: form.descricao,
          valor: parseFloat(form.valor.replace(',', '.')),
          cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
          categoria_ids: form.categoria_ids,
          meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
          data_inicio: form.dataInicio || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok) { setErroSalvar(json.error || 'Erro ao salvar'); return; }
      setShowModal(false);
      load();
    } catch {
      setErroSalvar('Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!editando) return;
    if (!confirm(editando.grupo ? `Excluir todas as ${editando.totalParcelas} parcelas de "${editando.descricao}"?` : `Excluir "${editando.descricao}"?`)) return;
    setExcluindo(true);
    setErroSalvar(null);
    try {
      const url = editando.grupo
        ? `/api/transacoes/${editando.id}?grupo=${editando.grupo}`
        : `/api/transacoes/${editando.id}`;
      const r = await fetch(url, { method: 'DELETE' });
      const json = await r.json();
      if (!r.ok) { setErroSalvar(json.error || 'Erro ao excluir'); return; }
      setShowModal(false);
      load();
    } catch {
      setErroSalvar('Erro de conexão');
    } finally {
      setExcluindo(false);
    }
  };

  const filtroOpts: { key: Filtro; label: string }[] = [
    { key: 'abertos',     label: '⊙ Em aberto' },
    { key: 'todos',       label: '◎ Todos' },
    { key: 'finalizados', label: '✓ Finalizados' },
  ];

  const emptyMsg =
    filtro === 'abertos'     ? 'em aberto' :
    filtro === 'finalizados' ? 'finalizados' : '';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Parcelados</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {filtradas.length} compras · {fmt(totalMesGlobal)}/mês · {fmt(totalRestanteGlobal)} restantes
          </div>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={() => setShowNova(true)}
          >
            + Novo parcelado
          </button>
          {filtroOpts.map(f => (
            <button
              key={f.key}
              type="button"
              className={filtro === f.key ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
          carregando...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>
          Nenhum parcelado {emptyMsg}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {secoes.map(sec => {
            const isAberta = secoesAbertas.has(sec.key);
            return (
              <div key={sec.key}>
                {/* ── Cabeçalho sanfona ── */}
                <div
                  className="card"
                  style={{
                    padding: '18px 22px',
                    cursor: 'pointer',
                    borderRadius: isAberta ? '12px 12px 0 0' : '12px',
                    borderBottom: isAberta ? '1px solid transparent' : undefined,
                    borderTop: `2px solid ${sec.cor}`,
                  }}
                  onClick={() => toggleSecao(sec.key)}
                >
                  {/* Nome + chevron */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sec.cor, flexShrink: 0, display: 'inline-block' }}></span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7' }}>{sec.titulo}</span>
                      <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {sec.itens.length} compra{sec.itens.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span style={{
                      color: 'var(--outline)',
                      fontSize: '18px',
                      display: 'inline-block',
                      transition: 'transform 0.2s',
                      transform: isAberta ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}>›</span>
                  </div>

                  {/* Estatísticas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'TOTAL MÊS',   value: sec.totalMes,      color: 'var(--tertiary)' },
                      { label: 'RESTANTE',     value: sec.totalRestante, color: '#ffb783' },
                      { label: 'TOTAL GERAL',  value: sec.totalGeral,    color: 'var(--on-surface-muted)' },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: s.color }}>{fmt(s.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Itens (expandidos) ── */}
                {isAberta && (
                  <div style={{
                    background: 'var(--surface-low)',
                    border: '1px solid var(--outline-variant)',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '10px 12px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {sec.itens.map(g => {
                      const pct = g.totalParcelas > 0 ? (g.pagas / g.totalParcelas) * 100 : 0;
                      const restantes = Math.max(0, g.totalParcelas - g.pagas);
                      const finalizado = g.pagas >= g.totalParcelas;
                      const fillColor = finalizado ? '#6edab4' : pct >= 75 ? '#6edab4' : pct >= 40 ? '#ffb783' : '#8083ff';

                      return (
                        <div
                          key={g.grupo || g.id}
                          className="card"
                          style={{ padding: '14px 18px', cursor: 'pointer', opacity: finalizado ? 0.6 : 1 }}
                          onClick={e => { e.stopPropagation(); abrirEditar(g); }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#dfe3e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {g.descricao}
                                </span>
                                {finalizado && (
                                  <span style={{ fontSize: '10px', color: '#6edab4', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(110,218,180,0.12)', padding: '2px 7px', borderRadius: '999px', flexShrink: 0 }}>
                                    QUITADO
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                                desde {new Date(g.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                                {g.categoriaId && categorias.find(c => c.id === g.categoriaId) && (
                                  <span style={{ marginLeft: '8px', color: 'var(--outline-variant)' }}>
                                    · {categorias.find(c => c.id === g.categoriaId)?.nome}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: finalizado ? 'var(--outline)' : 'var(--tertiary)' }}>
                                {fmt(g.valorParcela)}
                                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span>
                              </div>
                              {!finalizado && (
                                <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {fmt(g.valorParcela * restantes)} rest.
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--outline)', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                              <span>{g.pagas}/{g.totalParcelas} pagas</span>
                              <span style={{ color: fillColor }}>
                                {Math.round(pct)}%{!finalizado && ` · ${restantes} restante${restantes !== 1 ? 's' : ''}`}
                              </span>
                            </div>
                            <div className="progress-track" style={{ height: '5px' }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal edição */}
      {showModal && editando && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#dfe3e7', margin: 0 }}>
                {editando.descricao}
              </h2>
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', padding: '14px', background: 'var(--surface-low)', borderRadius: '10px' }}>
              {[
                { label: 'PAGAS',    value: `${editando.pagas}/${editando.totalParcelas}` },
                { label: 'TOTAL',    value: fmt(editando.valorParcela * editando.totalParcelas) },
                { label: 'RESTANTE', value: fmt(editando.valorParcela * Math.max(0, editando.totalParcelas - editando.pagas)) },
              ].map(i => (
                <div key={i.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{i.label}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>{i.value}</div>
                </div>
              ))}
            </div>

            {/* Adiantar parcela + Tudo pago */}
            {editando.pagas < editando.totalParcelas && (() => {
              const futuras = [...editando.parcelas]
                .filter(p => !p.pago)
                .sort((a, b) => a.data.localeCompare(b.data));
              const proxima = futuras[0];
              const ultima = futuras[futuras.length - 1];
              const gKey = editando.grupo || String(editando.id);
              const isLoading = !!adiantando || !!marcandoPago;

              const adiantar = async (parcela: { id: number; parcela_atual: number }, qual: 'proxima' | 'ultima') => {
                setAdiantando({ key: gKey, qual });
                try {
                  await fetch(`/api/transacoes/${parcela.id}?adiantar=1`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
                  });
                  setShowModal(false); load();
                } finally { setAdiantando(null); }
              };

              const marcarPago = async () => {
                setMarcandoPago(gKey);
                try {
                  if (editando.grupo) {
                    await fetch(`/api/transacoes/${editando.id}?pago_grupo=1`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ grupo_parcela: editando.grupo }),
                    });
                  } else {
                    await Promise.all(editando.parcelas.map(p =>
                      fetch(`/api/transacoes/${p.id}?pago_only=1`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pago: true }),
                      })
                    ));
                  }
                  setShowModal(false); load();
                } finally { setMarcandoPago(null); }
              };

              return (
                <div style={{ padding: '12px 14px', background: 'var(--surface-low)', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '10px' }}>ADIANTAR / QUITAR</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {proxima && (
                      <button type="button" className="btn-secondary" disabled={isLoading}
                        onClick={() => adiantar(proxima, 'proxima')}
                        style={{ fontSize: '12px', opacity: isLoading ? 0.6 : 1 }}>
                        {adiantando?.qual === 'proxima' && adiantando.key === gKey ? '...' : `⤴ próxima (${proxima.parcela_atual}/${editando.totalParcelas})`}
                      </button>
                    )}
                    {ultima && ultima.id !== proxima?.id && (
                      <button type="button" className="btn-secondary" disabled={isLoading}
                        onClick={() => adiantar(ultima, 'ultima')}
                        style={{ fontSize: '12px', opacity: isLoading ? 0.6 : 1 }}>
                        {adiantando?.qual === 'ultima' && adiantando.key === gKey ? '...' : `⤴ última (${ultima.parcela_atual}/${editando.totalParcelas})`}
                      </button>
                    )}
                    <button type="button" className="btn-secondary" disabled={isLoading}
                      onClick={marcarPago}
                      style={{ fontSize: '12px', color: '#6edab4', borderColor: 'rgba(110,218,180,0.3)', opacity: isLoading ? 0.6 : 1 }}>
                      {marcandoPago === gKey ? '...' : '✓ Tudo pago'}
                    </button>
                  </div>
                </div>
              );
            })()}

            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>
              Alterações aplicadas a todas as {editando.totalParcelas} parcelas
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
                <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR POR PARCELA (R$)</label>
                  <input type="number" step="0.01" aria-label="Valor por parcela" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DATA DA 1ª PARCELA</label>
                  <input type="date" aria-label="Data da primeira parcela" value={form.dataInicio} onChange={e => setForm({ ...form, dataInicio: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FORMA DE PAGAMENTO</label>
                <select
                  aria-label="Forma de pagamento"
                  value={form.meio}
                  onChange={e => setForm({ ...form, meio: e.target.value, cartao_id: ['pix', 'dinheiro'].includes(e.target.value) ? '' : form.cartao_id })}
                >
                  <option value="cartao">Cartão de crédito</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              {form.meio === 'cartao' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CARTÃO</label>
                  <select aria-label="Cartão" value={form.cartao_id} onChange={e => setForm({ ...form, cartao_id: e.target.value })}>
                    <option value="">Sem cartão</option>
                    {cartoes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CATEGORIAS</label>
                <CatMultiSelect value={form.categoria_ids} onChange={ids => setForm({ ...form, categoria_ids: ids })} categorias={categorias} />
              </div>
              {erroSalvar && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px' }}>
                  ❌ {erroSalvar}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-danger" onClick={excluir} disabled={excluindo} style={{ opacity: excluindo ? 0.6 : 1 }}>
                  {excluindo ? '...' : '✕ Excluir'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={salvar} disabled={salvando} style={{ flex: 1, justifyContent: 'center', opacity: salvando ? 0.6 : 1 }}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nova transação */}
      {showNova && (
        <NovaTransacaoModal
          onClose={() => setShowNova(false)}
          onSaved={() => { setShowNova(false); load(); }}
          initialData={novaInit}
        />
      )}
    </div>
  );
}
