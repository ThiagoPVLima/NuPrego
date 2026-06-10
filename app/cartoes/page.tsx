'use client';
import { useState, useEffect, useCallback } from 'react';
import ModalBase from '@/components/organisms/ModalBase';
import Button from '@/components/atoms/Button';

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
        <Button variant="primary" onClick={abrirNovo}>+ Novo cartão</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {cartoes.map((c: any) => (
          <div key={c.id} style={{
            background: `linear-gradient(135deg, ${c.cor}f0 0%, ${c.cor}b0 60%, ${c.cor}88 100%)`,
            borderRadius: '20px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 12px 40px ${c.cor}55, 0 4px 12px rgba(0,0,0,0.25)`,
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            {/* decorative circles */}
            <div style={{ position: 'absolute', right: '-24px', top: '-24px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '28px', top: '-44px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>{c.nome}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.72)', marginTop: '5px', fontFamily: 'JetBrains Mono, monospace', display: 'flex', gap: '8px' }}>
                  <span>fecha {c.fechamento}</span>
                  <span>·</span>
                  <span>vence {c.vencimento}</span>
                </div>
              </div>
              <div style={{ width: '36px', height: '28px', background: 'rgba(255,255,255,0.22)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.32)' }} />
            </div>

            {Number(c.limite) > 0 && (
              <div style={{ margin: '16px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.72)', marginBottom: '6px' }}>
                  <span>Limite</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{fmt(Number(c.limite))}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.22)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '99px', width: '0%', background: 'rgba(255,255,255,0.80)' }}></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => abrirEditar(c)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.30)', color: '#fff', borderRadius: '10px', padding: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.28)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'}
              >✎ Editar</button>
              <button
                onClick={() => excluir(c.id)}
                style={{ background: 'rgba(239,68,68,0.22)', border: '1px solid rgba(239,68,68,0.35)', color: 'rgba(255,200,200,0.95)', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.35)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.22)'}
              >✕</button>
            </div>
          </div>
        ))}

        <button onClick={abrirNovo} style={{ border: '2px dashed var(--clay-input-border)', background: 'var(--clay-input-bg)', borderRadius: '24px', padding: '24px', cursor: 'pointer', color: 'var(--outline)', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '160px', transition: 'all 0.2s', boxShadow: 'var(--clay-input-shadow)', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-dark)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clay-input-border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--outline)'; }}>
          <span style={{ fontSize: '28px', opacity: 0.5 }}>＋</span>
          Adicionar cartão
        </button>
      </div>

      {showModal && (
        <ModalBase title={editando ? 'Editar cartão' : 'Novo cartão'} onClose={() => setShowModal(false)}>
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
                <Button variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button variant="primary" fullWidth onClick={salvar}>{editando ? 'Salvar' : 'Criar cartão'}</Button>
              </div>
            </div>
        </ModalBase>
      )}
    </div>
  );
}
