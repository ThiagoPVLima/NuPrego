'use client';
import { useState, useEffect, useCallback } from 'react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Dashboard() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editRenda, setEditRenda] = useState(false);
  const [renda, setRenda] = useState('');

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
    await fetch('/api/meses', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano, mes, renda: parseFloat(renda) || 0 }) });
    setEditRenda(false); load();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
    </div>
  );

  const total = Number(data?.total || 0);
  const rendaVal = Number(data?.renda || 0);
  const saldo = rendaVal - total;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Dashboard</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>{data?.quantidade || 0} transações registradas</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-ghost" onClick={() => navMes(-1)} style={{ fontSize: '18px' }}>‹</button>
          <div style={{ background: 'var(--surface-high)', border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', color: 'var(--on-surface-muted)', minWidth: '150px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
            {MESES[mes-1]} {ano}
          </div>
          <button className="btn-ghost" onClick={() => navMes(1)} style={{ fontSize: '18px' }}>›</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total gasto', value: fmt(total), color: '#f87171', sub: 'no mês' },
          { label: 'Renda', value: fmt(rendaVal), color: 'var(--secondary)', sub: 'clique para editar', onClick: () => setEditRenda(true) },
          { label: 'Saldo', value: fmt(saldo), color: saldo >= 0 ? 'var(--secondary)' : '#f87171', sub: saldo >= 0 ? 'positivo' : 'negativo' },
          { label: 'Transações', value: String(data?.quantidade || 0), color: 'var(--primary)', sub: 'lançamentos' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '20px', cursor: s.onClick ? 'pointer' : 'default' }} onClick={s.onClick}>
            <div style={{ fontSize: '12px', color: 'var(--outline)', marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>{s.label.toUpperCase()}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '24px', color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--outline-variant)', marginTop: '4px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Renda modal */}
      {editRenda && (
        <div className="modal-overlay" onClick={() => setEditRenda(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '320px' }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', marginBottom: '16px', color: '#dfe3e7' }}>Renda de {MESES[mes-1]}</div>
            <input type="number" step="0.01" value={renda} onChange={e => setRenda(e.target.value)} placeholder="0,00" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" onClick={() => setEditRenda(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button className="btn-primary" onClick={salvarRenda} style={{ flex: 1, justifyContent: 'center' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Por cartão */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '20px' }}>GASTOS POR CARTÃO</div>
          {(data?.porCartao || []).filter((c: any) => c.total > 0).length === 0
            ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Nenhum gasto este mês</div>
            : (data?.porCartao || []).map((c: any) => {
              const v = Number(c.total || 0);
              if (v === 0) return null;
              const pct = total > 0 ? (v / total) * 100 : 0;
              return (
                <div key={c.id} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--on-surface-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.cor, display: 'inline-block', flexShrink: 0 }}></span>
                      {c.nome}
                    </span>
                    <span style={{ color: 'var(--on-surface)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(v)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: c.cor }}></div>
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Por categoria */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '20px' }}>POR CATEGORIA</div>
          {(data?.porCategoria || []).length === 0
            ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Sem dados</div>
            : (data?.porCategoria || []).map((c: any) => {
              const v = Number(c.total || 0);
              const pct = total > 0 ? (v / total) * 100 : 0;
              return (
                <div key={c.nome} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--on-surface-muted)' }}>{c.nome}</span>
                    <span style={{ color: 'var(--on-surface)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{fmt(v)}</span>
                  </div>
                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: c.cor || 'var(--primary-dark)' }}></div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Parcelas */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>PARCELAS DO MÊS</div>
          <a href="/parcelados" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>ver todas →</a>
        </div>
        {(data?.parcelasAbertas || []).length === 0
          ? <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Nenhuma parcela este mês</div>
          : (data?.parcelasAbertas || []).slice(0, 5).map((p: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-low)', borderRadius: '8px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--on-surface)' }}>{p.descricao}</div>
                <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {p.parcela_atual}/{p.total_parcelas} parcelas
                </div>
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--tertiary)' }}>{fmt(Number(p.valor))}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
