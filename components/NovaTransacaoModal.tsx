'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CatMultiSelect from './CatMultiSelect';
import CustomSelect from './CustomSelect';
import CustomDateInput from './CustomDateInput';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const tipoCor: Record<string, string> = { fixa: '#8083ff', parcelada: '#ffb783', avulsa: '#6edab4' };
const tipoLabel: Record<string, string> = { fixa: 'Fixa', parcelada: 'Parcelada', avulsa: 'Avulsa' };
const LBL = { fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' } as React.CSSProperties;

interface InitialData {
  descricao?: string;
  valor?: string;
  tipo?: string;
  meio?: string;
  cartao_id?: string;
  categoria_ids?: number[];
}

export default function NovaTransacaoModal({ onClose, onSaved, initialData }: { onClose: () => void; onSaved: () => void; initialData?: InitialData }) {
  const now = new Date();
  const [form, setForm] = useState({
    descricao: initialData?.descricao ?? '',
    valor: initialData?.valor ?? '',
    data: now.toISOString().split('T')[0],
    tipo: initialData?.tipo ?? 'avulsa',
    meio: initialData?.meio ?? 'cartao',
    cartao_id: initialData?.cartao_id ?? '',
    categoria_ids: initialData?.categoria_ids ?? [] as number[],
    total_parcelas: '1',
    observacao: '',
  });
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [sugIdx, setSugIdx] = useState(-1);
  const descRef = useRef<HTMLInputElement>(null);
  const valorRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]).then(([c, cat]) => {
      setCartoes(Array.isArray(c) ? c : []);
      setCategorias(Array.isArray(cat) ? cat : []);
    });
    const t = setTimeout(() => descRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const fetchSugestoes = useCallback(async (q: string) => {
    if (q.length < 1) { setSugestoes([]); setShowSug(false); return; }
    try {
      const r = await fetch(`/api/transacoes/sugestoes?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : [];
      setSugestoes(list);
      setShowSug(list.length > 0);
    } catch { setSugestoes([]); }
  }, []);

  const handleDescChange = (val: string) => {
    setForm(f => ({ ...f, descricao: val }));
    setSugIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSugestoes(val), 180);
  };

  const aplicarSugestao = (s: any) => {
    const catIds = Array.isArray(s.categoria_ids) && s.categoria_ids.length
      ? s.categoria_ids : (s.categoria_id ? [s.categoria_id] : []);
    setForm(f => ({
      ...f,
      descricao: s.descricao,
      tipo: s.tipo || f.tipo,
      meio: s.meio_pagamento || (s.cartao_id ? 'cartao' : f.meio),
      cartao_id: s.cartao_id ? String(s.cartao_id) : f.cartao_id,
      categoria_ids: catIds.length ? catIds : f.categoria_ids,
    }));
    setSugestoes([]); setShowSug(false);
    setTimeout(() => valorRef.current?.focus(), 60);
  };

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSug || !sugestoes.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSugIdx(i => Math.min(i + 1, sugestoes.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSugIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && sugIdx >= 0) { e.preventDefault(); aplicarSugestao(sugestoes[sugIdx]); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setShowSug(false); }
  };

  const salvar = async () => {
    if (!form.descricao.trim()) { setErro('Descrição obrigatória'); return; }
    const v = parseFloat(form.valor.replace(',', '.'));
    if (!form.valor || isNaN(v)) { setErro('Valor inválido'); return; }
    setSalvando(true); setErro(null);
    try {
      const r = await fetch('/api/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: form.descricao.trim(), valor: v, data: form.data, tipo: form.tipo,
          cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
          categoria_ids: form.categoria_ids,
          total_parcelas: parseInt(form.total_parcelas) || 1,
          meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
          observacao: form.observacao.trim() || null,
        }),
      });
      const json = await r.json();
      if (!r.ok) { setErro(json.error || 'Erro ao salvar'); return; }
      onSaved();
    } catch { setErro('Erro de conexão'); }
    finally { setSalvando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#dfe3e7', margin: 0 }}>Nova transação</h2>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Descrição com autocomplete */}
          <div>
            <label style={LBL}>DESCRIÇÃO</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={descRef}
                value={form.descricao}
                onChange={e => handleDescChange(e.target.value)}
                onKeyDown={handleDescKeyDown}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="Ex: Netflix, Supermercado..."
                autoComplete="off"
              />
              {showSug && sugestoes.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
                  background: 'var(--surface)', border: '1px solid var(--outline-variant)',
                  borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
                }}>
                  {sugestoes.map((s, i) => (
                    <button
                      key={`${s.descricao}-${i}`}
                      type="button"
                      onMouseDown={() => aplicarSugestao(s)}
                      onMouseEnter={() => setSugIdx(i)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        background: sugIdx === i ? 'var(--surface-high)' : 'transparent',
                        border: 'none', borderBottom: i < sugestoes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'var(--on-surface)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.descricao}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                          {fmt(Number(s.valor))}
                          {s.tipo && <span style={{ marginLeft: '8px', color: tipoCor[s.tipo] || 'var(--outline)' }}>· {tipoLabel[s.tipo] || s.tipo}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--outline-variant)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>↵</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LBL}>VALOR (R$)</label>
              <input ref={valorRef} type="number" step="0.01" aria-label="Valor" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <label style={LBL}>DATA</label>
              <CustomDateInput value={form.data} onChange={v => setForm(f => ({ ...f, data: v }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: form.tipo === 'parcelada' ? '1fr 1fr' : '1fr', gap: '12px' }}>
            <div>
              <label style={LBL}>TIPO</label>
              <CustomSelect
                value={form.tipo}
                onChange={v => setForm(f => ({ ...f, tipo: v }))}
                options={[{ value: 'avulsa', label: 'Avulsa' }, { value: 'fixa', label: 'Fixa' }, { value: 'parcelada', label: 'Parcelada' }]}
              />
            </div>
            {form.tipo === 'parcelada' && (
              <div>
                <label style={LBL}>Nº PARCELAS</label>
                <input type="number" min="2" max="60" aria-label="Número de parcelas" value={form.total_parcelas} onChange={e => setForm(f => ({ ...f, total_parcelas: e.target.value }))} />
              </div>
            )}
          </div>

          <div>
            <label style={LBL}>FORMA DE PAGAMENTO</label>
            <CustomSelect
              value={form.meio}
              onChange={v => setForm(f => ({ ...f, meio: v, cartao_id: ['pix', 'dinheiro'].includes(v) ? '' : f.cartao_id }))}
              options={[{ value: 'cartao', label: 'Cartão de crédito' }, { value: 'pix', label: 'Pix' }, { value: 'dinheiro', label: 'Dinheiro' }]}
            />
          </div>

          {form.meio === 'cartao' && (
            <div>
              <label style={LBL}>CARTÃO</label>
              <CustomSelect
                value={form.cartao_id}
                onChange={v => setForm(f => ({ ...f, cartao_id: v }))}
                options={[{ value: '', label: 'Sem cartão específico' }, ...cartoes.map((c: any) => ({ value: String(c.id), label: c.nome }))]}
              />
            </div>
          )}

          <div>
            <label style={LBL}>CATEGORIAS</label>
            <CatMultiSelect value={form.categoria_ids} onChange={ids => setForm(f => ({ ...f, categoria_ids: ids }))} categorias={categorias} />
          </div>

          <div>
            <label style={LBL}>OBSERVAÇÃO (opcional)</label>
            <textarea
              value={form.observacao}
              onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
              placeholder="Alguma nota sobre esta transação..."
              rows={2}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>

          {erro && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={salvar} disabled={salvando} style={{ flex: 1, justifyContent: 'center', opacity: salvando ? 0.6 : 1 }}>
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
