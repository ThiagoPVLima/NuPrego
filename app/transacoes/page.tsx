'use client';
import { useState, useEffect, useCallback } from 'react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const tipoCor: Record<string, string> = { fixa: '#8083ff', parcelada: '#ffb783', avulsa: '#6edab4' };
const tipoLabel: Record<string, string> = { fixa: 'Fixa', parcelada: 'Parcelada', avulsa: 'Avulsa' };
const meioCor: Record<string, string> = { pix: '#00b8d4', dinheiro: '#6edab4' };
const meioLabel: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro' };

export default function Transacoes() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [busca, setBusca] = useState('');
  const [filtroCartao, setFiltroCartao] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [form, setForm] = useState({
    descricao: '', valor: '', data: now.toISOString().split('T')[0],
    tipo: 'avulsa', meio: 'cartao', cartao_id: '', categoria_id: '', total_parcelas: '1',
  });

  const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ mes: mesStr });
    if (filtroCartao) p.set('cartao_id', filtroCartao);
    if (filtroTipo) p.set('tipo', filtroTipo);
    if (busca) p.set('busca', busca);
    const [t, c, cat] = await Promise.all([
      fetch(`/api/transacoes?${p}`).then(r => r.json()),
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]);
    setTxs(Array.isArray(t) ? t : []);
    setCartoes(Array.isArray(c) ? c : []);
    setCategorias(Array.isArray(cat) ? cat : []);
    setLoading(false);
  }, [mesStr, filtroCartao, filtroTipo, busca]);

  useEffect(() => { load(); }, [load]);

  const navMes = (d: number) => {
    let m = mes + d, a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m); setAno(a);
  };

  const abrirNova = () => {
    setEditando(null);
    setForm({ descricao: '', valor: '', data: now.toISOString().split('T')[0], tipo: 'avulsa', meio: 'cartao', cartao_id: '', categoria_id: '', total_parcelas: '1' });
    setShowModal(true);
  };

  const abrirEditar = (t: any) => {
    setEditando(t);
    const meio = t.meio_pagamento || 'cartao';
    setForm({
      descricao: t.descricao,
      valor: String(t.valor),
      data: t.data,
      tipo: t.tipo,
      meio,
      cartao_id: String(t.cartao_id || ''),
      categoria_id: String(t.categoria_id || ''),
      total_parcelas: String(t.total_parcelas || 1),
    });
    setShowModal(true);
  };

  const salvar = async () => {
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')),
      data: form.data,
      tipo: form.tipo,
      cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      total_parcelas: parseInt(form.total_parcelas),
      meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
    };
    if (editando) {
      await fetch(`/api/transacoes/${editando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/transacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setShowModal(false);
    load();
  };

  const excluir = async (t: any) => {
    const msg = t.tipo === 'parcelada' && t.grupo_parcela ? 'Excluir todas as parcelas?' : 'Confirmar exclusão?';
    if (!confirm(msg)) return;
    const url = t.tipo === 'parcelada' && t.grupo_parcela
      ? `/api/transacoes/${t.id}?grupo=${t.grupo_parcela}`
      : `/api/transacoes/${t.id}`;
    await fetch(url, { method: 'DELETE' });
    load();
  };

  const total = txs.reduce((s, t) => s + Number(t.valor), 0);

  const meioPagamento = (t: any) => {
    if (t.meio_pagamento === 'pix') return { label: 'Pix', cor: meioCor.pix };
    if (t.meio_pagamento === 'dinheiro') return { label: 'Dinheiro', cor: meioCor.dinheiro };
    if (t.cartoes) return { label: t.cartoes.nome.replace('Cartão ', ''), cor: t.cartoes.cor };
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Transações</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>{txs.length} itens · {fmt(total)}</div>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn-ghost" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</button>
          <div className="month-display">{MESES[mes-1]} {ano}</div>
          <button type="button" className="btn-ghost" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</button>
          <button type="button" className="btn-primary" onClick={abrirNova}>+ Nova transação</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-row">
        <input placeholder="Buscar transação..." value={busca} onChange={e => setBusca(e.target.value)} style={{ maxWidth: '220px' }} />
        <select aria-label="Filtrar por cartão" value={filtroCartao} onChange={e => setFiltroCartao(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="">Todos os cartões</option>
          {cartoes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ maxWidth: '150px' }}>
          <option value="">Todos os tipos</option>
          <option value="fixa">Fixa</option>
          <option value="parcelada">Parcelada</option>
          <option value="avulsa">Avulsa</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-row" style={{ gridTemplateColumns: '1fr 130px 150px 110px 90px', background: 'var(--surface-low)', fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          <span>DESCRIÇÃO</span><span>VALOR</span><span>PAGAMENTO</span><span>TIPO</span><span>DATA</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
        ) : txs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>Nenhuma transação encontrada</div>
        ) : txs.map((t: any) => {
          const mp = meioPagamento(t);
          return (
            <div key={t.id} className="table-row" style={{ gridTemplateColumns: '1fr 130px 150px 110px 90px', cursor: 'pointer' }} onClick={() => abrirEditar(t)}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--on-surface)' }}>{t.descricao}</div>
                {t.categorias && <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px' }}>{t.categorias.nome}</div>}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 500, color: 'var(--on-surface)' }}>{fmt(Number(t.valor))}</div>
              <div>
                {mp ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--on-surface-muted)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: mp.cor, display: 'inline-block', flexShrink: 0 }}></span>
                    {mp.label}
                  </span>
                ) : <span style={{ color: 'var(--outline-variant)' }}>—</span>}
              </div>
              <div>
                <span className="badge" style={{ background: `${tipoCor[t.tipo]}20`, color: tipoCor[t.tipo] }}>
                  {tipoLabel[t.tipo]}{t.tipo === 'parcelada' ? ` ${t.parcela_atual}/${t.total_parcelas}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
                <button type="button" className="btn-ghost" onClick={e => { e.stopPropagation(); excluir(t); }} style={{ fontSize: '13px', padding: '4px 6px' }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#dfe3e7', margin: 0 }}>
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

              {/* Forma de pagamento */}
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
                    <option value="">Sem cartão específico</option>
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

              {/* Pix/Dinheiro badge */}
              {(form.meio === 'pix' || form.meio === 'dinheiro') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: `${meioCor[form.meio]}15`, border: `1px solid ${meioCor[form.meio]}30`, borderRadius: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meioCor[form.meio], display: 'inline-block' }}></span>
                  <span style={{ fontSize: '13px', color: 'var(--on-surface-muted)' }}>
                    Pagamento via <strong style={{ color: meioCor[form.meio] }}>{meioLabel[form.meio]}</strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={salvar} style={{ flex: 1, justifyContent: 'center' }}>{editando ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
