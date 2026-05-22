'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const hoje = new Date().toISOString().split('T')[0];

type Grupo = {
  descricao: string;
  valorParcela: number;
  totalParcelas: number;
  pagas: number;
  cartaoId: number | null;
  categoriaId: number | null;
  meioP: string | null;
  grupo: string | null;
  id: number;
  dataInicio: string;
};

export default function Parcelados() {
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apenasAbertos, setApenasAbertos] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Grupo | null>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', cartao_id: '', categoria_id: '', meio: 'cartao' });

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

  // Agrupa por grupo_parcela, computando "pagas" pela data ≤ hoje
  const grupos: Record<string, Grupo> = txs.reduce((acc, t) => {
    const key = t.grupo_parcela || String(t.id);
    if (!acc[key]) {
      acc[key] = {
        descricao: t.descricao.replace(/ \d+\/\d+$/, ''),
        valorParcela: Number(t.valor),
        totalParcelas: t.total_parcelas,
        pagas: 0,
        cartaoId: t.cartao_id,
        categoriaId: t.categoria_id,
        meioP: t.meio_pagamento,
        grupo: t.grupo_parcela,
        id: t.id,
        dataInicio: t.data,
      };
    }
    if (t.data <= hoje) acc[key].pagas++;
    if (t.data < acc[key].dataInicio) acc[key].dataInicio = t.data;
    return acc;
  }, {} as Record<string, Grupo>);

  const lista = Object.values(grupos);
  const filtradas = apenasAbertos ? lista.filter(g => g.pagas < g.totalParcelas) : lista;

  // Seções: um array por cartão + sem cartão
  const secoes: { titulo: string; cor: string; itens: Grupo[] }[] = [];
  const cartoesComParcelas = cartoes.filter(c => filtradas.some(g => g.cartaoId === c.id));
  for (const c of cartoesComParcelas) {
    const itens = filtradas.filter(g => g.cartaoId === c.id);
    if (itens.length) secoes.push({ titulo: c.nome, cor: c.cor, itens });
  }
  const semCartao = filtradas.filter(g => !g.cartaoId);
  if (semCartao.length) {
    secoes.push({ titulo: 'Pix / Dinheiro / Sem cartão', cor: '#908fa0', itens: semCartao });
  }

  const totalRestante = filtradas.reduce((s, g) => s + g.valorParcela * (g.totalParcelas - g.pagas), 0);

  const abrirEditar = (g: Grupo) => {
    setEditando(g);
    const meio = g.meioP || (g.cartaoId ? 'cartao' : 'sem');
    setForm({
      descricao: g.descricao,
      valor: String(g.valorParcela),
      cartao_id: String(g.cartaoId || ''),
      categoria_id: String(g.categoriaId || ''),
      meio: g.meioP || 'cartao',
    });
    setShowModal(true);
  };

  const salvar = async () => {
    if (!editando) return;
    const url = editando.grupo
      ? `/api/transacoes/${editando.id}?grupo=${editando.grupo}`
      : `/api/transacoes/${editando.id}`;
    await fetch(url, {
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Parcelados</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {filtradas.length} compras · {fmt(totalRestante)} restantes
          </div>
        </div>
        <button type="button" onClick={() => setApenasAbertos(!apenasAbertos)} className={apenasAbertos ? 'btn-primary' : 'btn-secondary'}>
          {apenasAbertos ? '⊙ Em aberto' : '◎ Todos'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>
          Nenhum parcelado {apenasAbertos ? 'em aberto' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {secoes.map(sec => (
            <div key={sec.titulo}>
              {/* Cabeçalho da seção */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sec.cor, display: 'inline-block', flexShrink: 0 }}></span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: '#dfe3e7' }}>{sec.titulo}</span>
                <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {sec.itens.length} compra{sec.itens.length !== 1 ? 's' : ''} · {fmt(sec.itens.reduce((s, g) => s + g.valorParcela * (g.totalParcelas - g.pagas), 0))} restantes
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sec.itens.map(g => {
                  const pct = g.totalParcelas > 0 ? (g.pagas / g.totalParcelas) * 100 : 0;
                  const restantes = g.totalParcelas - g.pagas;
                  const fillColor = pct >= 75 ? '#6edab4' : pct >= 40 ? '#ffb783' : '#8083ff';
                  return (
                    <div
                      key={g.grupo || g.id}
                      className="card"
                      style={{ padding: '18px 22px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onClick={() => abrirEditar(g)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '15px', color: '#dfe3e7', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.descricao}
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
                          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '17px', color: 'var(--tertiary)' }}>
                            {fmt(g.valorParcela)}
                            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmt(g.valorParcela * restantes)} restantes
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--outline)', marginBottom: '5px', fontFamily: 'JetBrains Mono, monospace' }}>
                          <span>{g.pagas} de {g.totalParcelas} pagas</span>
                          <span style={{ color: fillColor }}>{Math.round(pct)}% · {restantes} restante{restantes !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="progress-track" style={{ height: '6px' }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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

            {/* Info resumida */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', padding: '14px', background: 'var(--surface-low)', borderRadius: '10px' }}>
              {[
                { label: 'PAGAS', value: `${editando.pagas}/${editando.totalParcelas}` },
                { label: 'TOTAL', value: fmt(editando.valorParcela * editando.totalParcelas) },
                { label: 'RESTANTE', value: fmt(editando.valorParcela * (editando.totalParcelas - editando.pagas)) },
              ].map(i => (
                <div key={i.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{i.label}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>{i.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>
              Alterações aplicadas a todas as {editando.totalParcelas} parcelas
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
                <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR POR PARCELA (R$)</label>
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
                <button type="button" className="btn-primary" onClick={salvar} style={{ flex: 1, justifyContent: 'center' }}>Salvar alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
