'use client';
import { useState, useEffect } from 'react';
import CatMultiSelect from './CatMultiSelect';
import CustomSelect from './CustomSelect';
import CustomDateInput from './CustomDateInput';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const LBL = { fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' } as React.CSSProperties;
const fmtData = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};
const tipoLabel: Record<string, string> = { fixa: 'Fixa', parcelada: 'Parcelada', avulsa: 'Avulsa' };
const tipoCor: Record<string, string> = { fixa: '#8083ff', parcelada: '#ffb783', avulsa: '#6edab4' };

interface Props {
  transacao: any;
  cartoes: any[];
  categorias: any[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TransacaoDetalheModal({ transacao: tx, cartoes, categorias, onClose, onSaved }: Props) {
  const isProjetada = !tx.id;
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [form, setForm] = useState({
    descricao: tx.descricao || '',
    valor: String(tx.valor || ''),
    data: tx.data || new Date().toISOString().split('T')[0],
    tipo: tx.tipo || 'avulsa',
    meio: tx.meio_pagamento || (tx.cartao_id ? 'cartao' : 'cartao'),
    cartao_id: String(tx.cartao_id || ''),
    categoria_ids: Array.isArray(tx.categoria_ids) && tx.categoria_ids.length
      ? tx.categoria_ids : (tx.categoria_id ? [tx.categoria_id] : []) as number[],
    total_parcelas: String(tx.total_parcelas || 1),
    observacao: tx.observacao || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [escopoDelete, setEscopoDelete] = useState<'este' | 'desde' | 'todos'>('este');
  const [registrandoPago, setRegistrandoPago] = useState(false);

  const catInfo = (() => {
    const ids: number[] = Array.isArray(tx.categoria_ids) && tx.categoria_ids.length
      ? tx.categoria_ids : (tx.categoria_id ? [tx.categoria_id] : []);
    return ids.map((id: number) => categorias.find((c: any) => c.id === id)).filter(Boolean);
  })();
  const cartaoInfo = tx.cartoes || cartoes.find((c: any) => c.id === tx.cartao_id);

  const salvar = async () => {
    setSalvando(true); setErro(null);
    const payload = {
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor.replace(',', '.')),
      data: form.data, tipo: form.tipo,
      cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
      categoria_ids: form.categoria_ids,
      total_parcelas: parseInt(form.total_parcelas) || 1,
      meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
      observacao: form.observacao.trim() || null,
    };
    try {
      let url: string;
      let method: string;
      if (isProjetada) {
        url = '/api/transacoes';
        method = 'POST';
      } else if (form.tipo === 'fixa') {
        url = `/api/transacoes/${tx.id}?fixas_todos=1`;
        method = 'PUT';
      } else if (tx.grupo_parcela) {
        url = `/api/transacoes/${tx.id}?grupo=${tx.grupo_parcela}`;
        method = 'PUT';
      } else {
        url = `/api/transacoes/${tx.id}`;
        method = 'PUT';
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      if (!r.ok) { setErro(json.error || 'Erro ao salvar'); return; }
      onSaved();
    } catch { setErro('Erro de conexão'); }
    finally { setSalvando(false); }
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      if (isProjetada) {
        await desativarFixa();
        return;
      }
      let url: string;
      if (tx.tipo === 'fixa') {
        if (escopoDelete === 'todos') url = `/api/transacoes/${tx.id}?fixas_todos=1`;
        else if (escopoDelete === 'desde') url = `/api/transacoes/${tx.id}?fixas_desde=${tx.data}`;
        else url = `/api/transacoes/${tx.id}`;
      } else if (tx.tipo === 'parcelada' && tx.grupo_parcela) {
        url = `/api/transacoes/${tx.id}?grupo=${tx.grupo_parcela}`;
      } else {
        url = `/api/transacoes/${tx.id}`;
      }
      await fetch(url, { method: 'DELETE' });
      onSaved();
    } finally { setExcluindo(false); }
  };

  const registrarPago = async () => {
    setRegistrandoPago(true);
    try {
      const payload = {
        descricao: tx.descricao, valor: tx.valor, data: tx.data, tipo: tx.tipo,
        cartao_id: tx.cartao_id || null,
        categoria_ids: Array.isArray(tx.categoria_ids) && tx.categoria_ids.length
          ? tx.categoria_ids : (tx.categoria_id ? [tx.categoria_id] : []),
        meio_pagamento: tx.meio_pagamento || null, pago: true,
      };
      await fetch('/api/transacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      onSaved();
    } finally { setRegistrandoPago(false); }
  };

  const desativarFixa = async () => {
    await fetch('/api/fixas-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: tx.descricao, ativa: false }),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${tipoCor[tx.tipo] || '#888'}22`, color: tipoCor[tx.tipo] || '#888', fontFamily: 'JetBrains Mono, monospace' }}>
            {tipoLabel[tx.tipo] || tx.tipo}
          </span>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ fontSize: '18px' }}>✕</button>
        </div>

        {/* Modo view */}
        {mode === 'view' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--on-surface)', marginBottom: '4px' }}>
                {tx.descricao}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '28px', color: '#f87171' }}>
                {fmt(Number(tx.valor))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--outline-variant)' }}>
                <span style={LBL as React.CSSProperties}>DATA</span>
                <span style={{ fontSize: '13px', color: 'var(--on-surface-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtData(tx.data)}</span>
              </div>
              {tx.tipo === 'parcelada' && tx.parcela_atual && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span style={LBL as React.CSSProperties}>PARCELA</span>
                  <span style={{ fontSize: '13px', color: 'var(--on-surface-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{tx.parcela_atual}/{tx.total_parcelas}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--outline-variant)' }}>
                <span style={LBL as React.CSSProperties}>PAGAMENTO</span>
                <span style={{ fontSize: '13px', color: 'var(--on-surface-muted)' }}>
                  {tx.meio_pagamento === 'pix' ? 'Pix' : tx.meio_pagamento === 'dinheiro' ? 'Dinheiro' : cartaoInfo?.nome || '—'}
                </span>
              </div>
              {catInfo.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span style={LBL as React.CSSProperties}>CATEGORIAS</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {catInfo.map((c: any) => (
                      <span key={c.id} style={{ fontSize: '11px', color: c.cor, background: `${c.cor}22`, padding: '2px 8px', borderRadius: '999px' }}>
                        {c.icone ? `${c.icone} ` : ''}{c.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {tx.pago !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: tx.observacao ? '1px solid var(--outline-variant)' : 'none' }}>
                  <span style={LBL as React.CSSProperties}>STATUS</span>
                  <span style={{ fontSize: '13px', color: tx.pago ? '#6edab4' : 'var(--outline)' }}>{tx.pago ? '✓ Pago' : '○ Em aberto'}</span>
                </div>
              )}
              {tx.observacao && (
                <div style={{ padding: '10px 0' }}>
                  <span style={{ ...LBL, marginBottom: '8px' } as React.CSSProperties}>OBSERVAÇÃO</span>
                  <p style={{ fontSize: '13px', color: 'var(--on-surface-muted)', margin: 0, lineHeight: 1.6 }}>{tx.observacao}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-danger" onClick={() => setMode('delete')}>✕ Excluir</button>
              <button type="button" className="btn-secondary" onClick={() => setMode('edit')} style={{ flex: 1, justifyContent: 'center' }}>✎ Editar</button>
            </div>
          </>
        )}

        {/* Modo edição */}
        {mode === 'edit' && (
          <>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--on-surface)', margin: '0 0 20px' }}>Editar transação</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={LBL}>DESCRIÇÃO</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LBL}>VALOR (R$)</label>
                  <input type="number" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                </div>
                <div>
                  <label style={LBL}>DATA</label>
                  <CustomDateInput value={form.data} onChange={v => setForm(f => ({ ...f, data: v }))} />
                </div>
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
              {tx.tipo === 'fixa' && (
                <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', padding: '8px 12px', background: 'var(--surface-low)', borderRadius: '8px' }}>
                  A edição será aplicada em todas as ocorrências desta fixa.
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setMode('view')} style={{ flex: 1, justifyContent: 'center' }}>Voltar</button>
                <button type="button" className="btn-primary" onClick={salvar} disabled={salvando} style={{ flex: 1, justifyContent: 'center', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modo exclusão */}
        {mode === 'delete' && (
          <>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#f87171', margin: '0 0 12px' }}>
              {isProjetada ? 'Desativar fixa' : 'Excluir transação'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '20px' }}>
              <strong style={{ color: 'var(--on-surface)' }}>{tx.descricao}</strong> — {fmt(Number(tx.valor))}
            </p>

            {isProjetada && (
              <p style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '20px', lineHeight: 1.6 }}>
                Esta fixa não tem registro neste mês. Ao desativar, ela para de aparecer nos próximos meses.
              </p>
            )}

            {!isProjetada && tx.tipo === 'fixa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {([
                  { key: 'este', label: 'Apenas este mês' },
                  { key: 'desde', label: 'Este mês em diante' },
                  { key: 'todos', label: 'Todos os meses' },
                ] as const).map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: escopoDelete === opt.key ? 'rgba(239,68,68,0.08)' : 'var(--surface-low)', cursor: 'pointer', border: `1px solid ${escopoDelete === opt.key ? 'rgba(239,68,68,0.3)' : 'transparent'}` }}>
                    <input type="radio" name="escopo" value={opt.key} checked={escopoDelete === opt.key} onChange={() => setEscopoDelete(opt.key)} style={{ width: 'auto' }} />
                    <span style={{ fontSize: '13px', color: 'var(--on-surface)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {!isProjetada && tx.tipo === 'parcelada' && tx.grupo_parcela && (
              <p style={{ fontSize: '12px', color: 'var(--outline)', marginBottom: '16px', fontFamily: 'JetBrains Mono, monospace' }}>
                Todas as parcelas do grupo serão excluídas.
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={() => setMode('view')} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button type="button" className="btn-danger" onClick={excluir} disabled={excluindo} style={{ flex: 1, opacity: excluindo ? 0.6 : 1 }}>
                {excluindo ? '...' : isProjetada ? 'Desativar' : 'Confirmar exclusão'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
