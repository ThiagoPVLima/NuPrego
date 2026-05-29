'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const CORES = ['#494bd6','#e91e8c','#ff6b35','#00b4d8','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#84cc16'];

export default function Cartoes() {
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', cor: '#494bd6', limite: '', fechamento: '5', vencimento: '10' });

  const load = useCallback(async () => {
    const r = await fetch('/api/cartoes');
    setCartoes(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const abrirNovo = () => { setEditando(null); setForm({ nome: '', cor: '#494bd6', limite: '', fechamento: '5', vencimento: '10' }); setShowModal(true); };
  const abrirEditar = (c: any) => { setEditando(c); setForm({ nome: c.nome, cor: c.cor, limite: String(c.limite||''), fechamento: String(c.fechamento), vencimento: String(c.vencimento) }); setShowModal(true); };

  const salvar = async () => {
    const payload = { ...form, limite: parseFloat(form.limite)||0, fechamento: parseInt(form.fechamento), vencimento: parseInt(form.vencimento) };
    if (editando) await fetch(`/api/cartoes/${editando.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    else await fetch('/api/cartoes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    setShowModal(false); load();
  };

  const excluir = async (id: number) => {
    if (!confirm('Excluir cartão?')) return;
    await fetch(`/api/cartoes/${id}`, { method: 'DELETE' }); load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>Cartões</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>{cartoes.length} cartões ativos</div>
        </div>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo cartão</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {cartoes.map((c: any) => (
          <div key={c.id} className="card" style={{ padding: '24px', borderTop: `3px solid ${c.cor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)' }}>{c.nome}</div>
                <div style={{ fontSize: '12px', color: 'var(--outline)', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace', display: 'flex', gap: '12px' }}>
                  <span>fecha dia {c.fechamento}</span>
                  <span>vence dia {c.vencimento}</span>
                </div>
              </div>
              <div style={{ width: '40px', height: '26px', background: c.cor, borderRadius: '5px', opacity: 0.85 }}></div>
            </div>
            {Number(c.limite) > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--outline)', marginBottom: '6px' }}>
                  <span>Limite</span><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(Number(c.limite))}</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: '0%', background: c.cor }}></div></div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => abrirEditar(c)} style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}>Editar</button>
              <button className="btn-danger" onClick={() => excluir(c.id)}>Excluir</button>
            </div>
          </div>
        ))}

        <button onClick={abrirNovo} style={{ border: '1px dashed var(--outline-variant)', background: 'transparent', borderRadius: '12px', padding: '24px', cursor: 'pointer', color: 'var(--outline)', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-dark)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}>
          + Adicionar cartão
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--on-surface)', margin: 0 }}>{editando ? 'Editar cartão' : 'Novo cartão'}</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>NOME</label>
                <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Ex: Cartão Nubank" /></div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>COR</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CORES.map(cor => (
                    <button key={cor} onClick={() => setForm({...form, cor})} style={{ width: '30px', height: '30px', background: cor, borderRadius: '50%', border: form.cor === cor ? '3px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s' }} />
                  ))}
                </div>
              </div>
              <div><label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>LIMITE (R$) — OPCIONAL</label>
                <input type="number" step="100" value={form.limite} onChange={e => setForm({...form, limite: e.target.value})} placeholder="0" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FECHA DIA</label>
                  <input type="number" min="1" max="31" value={form.fechamento} onChange={e => setForm({...form, fechamento: e.target.value})} /></div>
                <div><label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VENCE DIA</label>
                  <input type="number" min="1" max="31" value={form.vencimento} onChange={e => setForm({...form, vencimento: e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button className="btn-primary" onClick={salvar} style={{ flex: 1, justifyContent: 'center' }}>{editando ? 'Salvar' : 'Criar cartão'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
