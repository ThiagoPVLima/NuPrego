'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const limiteAtiva = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  d.setDate(1);
  return d.toISOString().split('T')[0];
})();

type Filtro = 'ativas' | 'todas' | 'inativas';

type Fixa = {
  key: string;
  descricao: string;
  valorAtual: number;
  totalPago: number;
  mesesAtivos: number;
  primeiraData: string;
  ultimaData: string;
  ativa: boolean;
  cartaoId: number | null;
  categoriaId: number | null;
  meioP: string | null;
  id: number;
};

type Secao = {
  key: string;
  titulo: string;
  cor: string;
  itens: Fixa[];
  totalMes: number;
  totalAnual: number;
};

export default function Fixas() {
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('ativas');
  const [secoesAbertas, setSecoesAbertas] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fixa | null>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', cartao_id: '', categoria_id: '', meio: 'cartao' });

  const load = useCallback(async () => {
    setLoading(true);
    const [t, c, cat] = await Promise.all([
      fetch('/api/transacoes?tipo=fixa').then(r => r.json()),
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]);
    setTxs(Array.isArray(t) ? t : []);
    setCartoes(Array.isArray(c) ? c : []);
    setCategorias(Array.isArray(cat) ? cat : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grupos: Record<string, Fixa> = txs.reduce((acc, t) => {
    const key = `${t.descricao}__${t.cartao_id ?? 'null'}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        descricao: t.descricao,
        valorAtual: Number(t.valor),
        totalPago: 0,
        mesesAtivos: 0,
        primeiraData: t.data,
        ultimaData: t.data,
        ativa: false,
        cartaoId: t.cartao_id,
        categoriaId: t.categoria_id,
        meioP: t.meio_pagamento,
        id: t.id,
      };
    }
    const g = acc[key];
    g.totalPago += Number(t.valor);
    g.mesesAtivos++;
    if (t.data < g.primeiraData) g.primeiraData = t.data;
    if (t.data > g.ultimaData) {
      g.ultimaData = t.data;
      g.valorAtual = Number(t.valor);
      g.id = t.id;
    }
    return acc;
  }, {} as Record<string, Fixa>);

  const lista = Object.values(grupos).map(g => ({ ...g, ativa: g.ultimaData >= limiteAtiva }));

  const filtradas = lista.filter(g => {
    if (filtro === 'ativas') return g.ativa;
    if (filtro === 'inativas') return !g.ativa;
    return true;
  });

  const buildSecao = (key: string, titulo: string, cor: string, itens: Fixa[]): Secao => {
    const ativas = itens.filter(g => g.ativa);
    return {
      key, titulo, cor, itens,
      totalMes: ativas.reduce((s, g) => s + g.valorAtual, 0),
      totalAnual: ativas.reduce((s, g) => s + g.valorAtual * 12, 0),
    };
  };

  const secoes: Secao[] = [];
  for (const c of cartoes.filter(c => filtradas.some(g => g.cartaoId === c.id))) {
    const itens = filtradas.filter(g => g.cartaoId === c.id);
    if (itens.length) secoes.push(buildSecao(String(c.id), c.nome, c.cor, itens));
  }
  const semCartao = filtradas.filter(g => !g.cartaoId);
  if (semCartao.length) secoes.push(buildSecao('sem_cartao', 'Pix / Dinheiro / Sem cartão', '#908fa0', semCartao));

  const totalMesGlobal = lista.filter(g => g.ativa).reduce((s, g) => s + g.valorAtual, 0);
  const totalAtivas = lista.filter(g => g.ativa).length;

  const toggleSecao = (key: string) => {
    setSecoesAbertas(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const abrirEditar = (g: Fixa) => {
    setEditando(g);
    setForm({
      descricao: g.descricao,
      valor: String(g.valorAtual),
      cartao_id: String(g.cartaoId || ''),
      categoria_id: String(g.categoriaId || ''),
      meio: g.meioP || (g.cartaoId ? 'cartao' : 'cartao'),
    });
    setShowModal(true);
  };

  const salvar = async () => {
    if (!editando) return;
    await fetch(`/api/transacoes/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descricao: form.descricao,
        valor: parseFloat(form.valor.replace(',', '.')),
        cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
        meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
      }),
    });
    setShowModal(false);
    load();
  };

  const filtroOpts: { key: Filtro; label: string }[] = [
    { key: 'ativas',   label: '⊙ Ativas' },
    { key: 'todas',    label: '◎ Todas' },
    { key: 'inativas', label: '◌ Inativas' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Fixas</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {totalAtivas} ativas · {fmt(totalMesGlobal)}/mês · {fmt(totalMesGlobal * 12)}/ano
          </div>
        </div>
        <div className="page-header-actions">
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
          Nenhuma conta fixa {filtro === 'ativas' ? 'ativa' : filtro === 'inativas' ? 'inativa' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {secoes.map(sec => {
            const isAberta = secoesAbertas.has(sec.key);
            return (
              <div key={sec.key}>
                <div
                  className="card"
                  style={{
                    padding: '18px 22px',
                    cursor: 'pointer',
                    borderLeft: `3px solid ${sec.cor}`,
                    borderRadius: isAberta ? '12px 12px 0 0' : '12px',
                    borderBottom: isAberta ? '1px solid transparent' : undefined,
                  }}
                  onClick={() => toggleSecao(sec.key)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sec.cor, flexShrink: 0, display: 'inline-block' }}></span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7' }}>{sec.titulo}</span>
                      <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {sec.itens.length} fixa{sec.itens.length !== 1 ? 's' : ''}
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {[
                      { label: 'TOTAL MÊS',  value: fmt(sec.totalMes),   color: 'var(--tertiary)' },
                      { label: 'TOTAL ANO',  value: fmt(sec.totalAnual), color: '#ffb783' },
                      { label: 'QTD ATIVAS', value: `${sec.itens.filter(g => g.ativa).length}`, color: 'var(--on-surface-muted)' },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

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
                    {sec.itens.map(g => (
                      <div
                        key={g.key}
                        className="card"
                        style={{ padding: '14px 18px', cursor: 'pointer', opacity: g.ativa ? 1 : 0.6 }}
                        onClick={e => { e.stopPropagation(); abrirEditar(g); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#dfe3e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {g.descricao}
                              </span>
                              {!g.ativa && (
                                <span style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '999px', flexShrink: 0 }}>
                                  INATIVA
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                              desde {new Date(g.primeiraData + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                              <span style={{ marginLeft: '6px' }}>· {g.mesesAtivos}x registrada</span>
                              {g.categoriaId && categorias.find(c => c.id === g.categoriaId) && (
                                <span style={{ marginLeft: '8px', color: 'var(--outline-variant)' }}>
                                  · {categorias.find(c => c.id === g.categoriaId)?.nome}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: g.ativa ? 'var(--tertiary)' : 'var(--outline)' }}>
                              {fmt(g.valorAtual)}
                              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmt(g.totalPago)} total
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
                { label: 'REGISTROS',  value: `${editando.mesesAtivos}x` },
                { label: 'TOTAL PAGO', value: fmt(editando.totalPago) },
                { label: 'ÚLTIMO MÊS', value: new Date(editando.ultimaData + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) },
              ].map(i => (
                <div key={i.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{i.label}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>{i.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>
              Edita apenas o registro mais recente desta conta
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
                <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR (R$)</label>
                <input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
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
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CATEGORIA</label>
                <select aria-label="Categoria" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={salvar} style={{ flex: 1, justifyContent: 'center' }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
