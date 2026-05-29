'use client';
import { useState, useEffect, useCallback } from 'react';
import NovaTransacaoModal from '@/components/NovaTransacaoModal';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const pct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

export default function Dashboard() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editRenda, setEditRenda] = useState(false);
  const [renda, setRenda] = useState('');
  const [showNova, setShowNova] = useState(false);
  const [showLista, setShowLista] = useState<'fixas' | 'parceladas' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/dashboard?ano=${ano}&mes=${mes}`);
    const d = await r.json();
    setData(d);
    setRenda(String(d.renda || ''));
    setLoading(false);
  }, [ano, mes]);

  useEffect(() => { load(); }, [load]);

  const navMes = (d: number) => {
    let m = mes + d, a = ano;
    if (m > 12) { m = 1; a++; }
    if (m < 1) { m = 12; a--; }
    setMes(m); setAno(a);
  };

  const salvarRenda = async () => {
    await fetch('/api/meses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano, mes, renda: parseFloat(renda) || 0 }),
    });
    setEditRenda(false);
    load();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
    </div>
  );

  const total = Number(data?.total || 0);
  const fixas = Number(data?.porTipo?.fixa || 0);
  const parceladas = Number(data?.porTipo?.parcelada || 0);
  const avulsas = Number(data?.porTipo?.avulsa || 0);
  const rendaVal = Number(data?.renda || 0);
  const saldo = rendaVal - total;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Dashboard</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>{data?.quantidade || 0} transações · {MESES[mes-1]} {ano}</div>
        </div>
        <div className="page-header-actions">
          <button className="btn-ghost" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</button>
          <div className="month-display">{MESES[mes-1]} {ano}</div>
          <button className="btn-ghost" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</button>
          <button type="button" className="btn-primary" onClick={() => setShowNova(true)}>+ Nova transação</button>
        </div>
      </div>

      {/* Hero: total gasto */}
      <div className="card" style={{ padding: '28px 32px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>
              Total gasto em {MESES[mes-1]}
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '40px', color: '#f87171', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {fmt(total)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {rendaVal > 0 ? (
              <>
                <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '6px' }}>RENDA</div>
                <div
                  style={{ fontSize: '22px', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: 'var(--secondary)', cursor: 'pointer' }}
                  onClick={() => setEditRenda(true)}
                >
                  {fmt(rendaVal)}
                </div>
                <div style={{ fontSize: '11px', color: saldo >= 0 ? 'var(--secondary)' : '#f87171', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {saldo >= 0 ? `sobram ${fmt(saldo)}` : `estouro de ${fmt(-saldo)}`}
                </div>
              </>
            ) : (
              <button type="button" className="btn-ghost" onClick={() => setEditRenda(true)} style={{ fontSize: '12px', color: 'var(--outline)' }}>
                + definir renda
              </button>
            )}
          </div>
        </div>

        {/* Breakdown por tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {([
            { label: 'Fixas', value: fixas, color: '#8083ff' },
            { label: 'Parceladas', value: parceladas, color: '#ffb783' },
            { label: 'Avulsas', value: avulsas, color: '#6edab4' },
          ] as const).map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: s.color }}>
                {fmt(s.value)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct(s.value, total)}%`, height: '100%', background: s.color, borderRadius: '2px' }}></div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>{pct(s.value, total)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gastos por cartão/meio + Por categoria */}
      <div className="two-col-grid">
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '20px' }}>POR CARTÃO / MEIO</div>
          {(data?.porCartao || []).filter((c: any) => c.total > 0).length === 0
            ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Nenhum gasto este mês</div>
            : (data?.porCartao || []).map((c: any) => {
              const v = Number(c.total || 0);
              if (v === 0) return null;
              const p = total > 0 ? (v / total) * 100 : 0;
              return (
                <div key={c.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--on-surface-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.cor, display: 'inline-block', flexShrink: 0 }}></span>
                      {c.nome}
                    </span>
                    <span style={{ color: 'var(--on-surface)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{fmt(v)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${p}%`, background: c.cor }}></div>
                  </div>
                </div>
              );
            })
          }
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '20px' }}>POR CATEGORIA</div>
          {(data?.porCategoria || []).length === 0
            ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sem dados</div>
            : (data?.porCategoria || []).map((c: any) => {
              const v = Number(c.total || 0);
              const p = total > 0 ? (v / total) * 100 : 0;
              return (
                <div key={c.nome} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--on-surface-muted)' }}>{c.nome}</span>
                    <span style={{ color: 'var(--on-surface)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{fmt(v)}</span>
                  </div>
                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill" style={{ width: `${p}%`, background: c.cor || 'var(--primary-dark)' }}></div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Fixas do mês + Parcelas do mês */}
      <div className="two-col-grid">
        {/* Fixas */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FIXAS DO MÊS</div>
            <button type="button" onClick={() => setShowLista('fixas')} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>ver todas →</button>
          </div>
          {(data?.fixasDoMes || []).length === 0
            ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Nenhuma fixa este mês</div>
            : (data?.fixasDoMes || []).slice(0, 8).map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-low)', borderRadius: '8px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '12px', color: f.pago ? '#6edab4' : 'var(--outline-variant)', flexShrink: 0 }}>{f.pago ? '✓' : '○'}</span>
                  <span style={{ fontSize: '13px', color: f.pago ? 'var(--outline)' : 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: f.pago ? 'line-through' : 'none' }}>
                    {f.descricao}
                  </span>
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: f.pago ? 'var(--outline)' : '#8083ff', flexShrink: 0, marginLeft: '12px' }}>{fmt(Number(f.valor))}</div>
              </div>
            ))
          }
        </div>

        {/* Parcelas */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>PARCELAS DO MÊS</div>
            <button type="button" onClick={() => setShowLista('parceladas')} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>ver todas →</button>
          </div>
          {(data?.parcelasAbertas || []).length === 0
            ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Nenhuma parcela este mês</div>
            : (data?.parcelasAbertas || []).slice(0, 5).map((p: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-low)', borderRadius: '8px', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--on-surface)' }}>{p.descricao}</div>
                  <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    {p.parcela_atual}/{p.total_parcelas} parcelas
                  </div>
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tertiary)', flexShrink: 0, marginLeft: '12px' }}>{fmt(Number(p.valor))}</div>
              </div>
            ))
          }
        </div>
      </div>

      {showNova && (
        <NovaTransacaoModal onClose={() => setShowNova(false)} onSaved={() => { setShowNova(false); load(); }} />
      )}

      {/* Modal lista fixas / parcelas */}
      {showLista && (
        <div className="modal-overlay" onClick={() => setShowLista(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#dfe3e7', margin: 0 }}>
                {showLista === 'fixas' ? `Fixas de ${MESES[mes-1]}` : `Parcelas de ${MESES[mes-1]}`}
              </h2>
              <button type="button" className="btn-ghost" onClick={() => setShowLista(null)} style={{ fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {showLista === 'fixas' && (
                (data?.fixasDoMes || []).length === 0
                  ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Nenhuma fixa este mês</div>
                  : (data?.fixasDoMes || []).map((f: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-low)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '12px', color: f.pago ? '#6edab4' : 'var(--outline-variant)', flexShrink: 0 }}>{f.pago ? '✓' : '○'}</span>
                        <span style={{ fontSize: '13px', color: f.pago ? 'var(--outline)' : 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: f.pago ? 'line-through' : 'none' }}>
                          {f.descricao}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: f.pago ? 'var(--outline)' : '#8083ff', flexShrink: 0, marginLeft: '12px' }}>{fmt(Number(f.valor))}</div>
                    </div>
                  ))
              )}

              {showLista === 'parceladas' && (
                (data?.parcelasAbertas || []).length === 0
                  ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Nenhuma parcela este mês</div>
                  : (data?.parcelasAbertas || []).map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-low)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--on-surface)' }}>{p.descricao}</div>
                        <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                          {p.parcela_atual}/{p.total_parcelas} parcelas
                        </div>
                      </div>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--tertiary)', flexShrink: 0, marginLeft: '12px' }}>{fmt(Number(p.valor))}</div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal renda */}
      {editRenda && (
        <div className="modal-overlay" onClick={() => setEditRenda(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '320px' }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '16px', color: '#dfe3e7' }}>Renda de {MESES[mes-1]}</div>
            <input type="number" step="0.01" value={renda} onChange={e => setRenda(e.target.value)} placeholder="0,00" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-secondary" onClick={() => setEditRenda(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={salvarRenda} style={{ flex: 1, justifyContent: 'center' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
