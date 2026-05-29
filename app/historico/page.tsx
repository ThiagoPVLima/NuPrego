'use client';
import { useState, useEffect, useCallback } from 'react';

const MESES_NOME = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Historico() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anos, setAnos] = useState<number[]>([]);
  const [anoSel, setAnoSel] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/transacoes');
    const txs = await r.json();
    const por: Record<string, any> = {};
    for (const t of (Array.isArray(txs) ? txs : [])) {
      const k = t.data?.substring(0, 7); if (!k) continue;
      if (!por[k]) por[k] = { total: 0, qtd: 0, fixas: 0, parceladas: 0, avulsas: 0 };
      por[k].total += Number(t.valor); por[k].qtd++;
      if (t.tipo === 'fixa') por[k].fixas += Number(t.valor);
      else if (t.tipo === 'parcelada') por[k].parceladas += Number(t.valor);
      else por[k].avulsas += Number(t.valor);
    }
    const lista = Object.entries(por).map(([periodo, v]) => ({ periodo, ...v })).sort((a, b) => b.periodo.localeCompare(a.periodo));
    setDados(lista);
    const anosArr = Array.from(new Set(lista.map(l => parseInt(l.periodo.split('-')[0])))).sort((a, b) => b - a) as number[];
    setAnos(anosArr);
    if (anosArr.length) setAnoSel(anosArr[0]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = anoSel ? dados.filter(d => d.periodo.startsWith(String(anoSel))) : dados;
  const maxTotal = Math.max(...filtrados.map(d => d.total), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>Histórico</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>Evolução de gastos ao longo do tempo</div>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setAnoSel(null)} className={!anoSel ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 14px', fontSize: '13px' }}>Todos</button>
          {anos.map(a => (
            <button key={a} onClick={() => setAnoSel(a)} className={anoSel === a ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 14px', fontSize: '13px' }}>{a}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
      ) : (
        <>
          <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '20px' }}>GASTOS MENSAIS</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '130px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...filtrados].reverse().map((d) => {
                const h = Math.max(8, (d.total / maxTotal) * 110);
                const [y, m] = d.periodo.split('-');
                return (
                  <div key={d.periodo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '48px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                      {fmt(d.total).replace('R$\u00A0', 'R$')}
                    </div>
                    <div style={{ width: '38px', height: `${h}px`, background: 'var(--primary-dark)', borderRadius: '4px 4px 0 0', opacity: 0.85 }}></div>
                    <div style={{ fontSize: '10px', color: 'var(--outline)', textAlign: 'center', lineHeight: 1.3 }}>
                      {MESES_NOME[parseInt(m)-1]}<br /><span style={{ fontSize: '9px', opacity: 0.6 }}>{y}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 120px 60px', padding: '12px 20px', background: 'var(--surface-low)', fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', gap: '8px' }}>
              <span>PERÍODO</span><span>BARRA</span><span>TOTAL</span><span>FIXAS</span><span>PARCELADAS</span><span>QTD</span>
            </div>
            {filtrados.map((d) => {
              const [y, m] = d.periodo.split('-');
              const pct = (d.total / maxTotal) * 100;
              return (
                <div key={d.periodo} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 120px 60px', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, color: 'var(--on-surface-muted)' }}>{MESES_NOME[parseInt(m)-1]} {y}</span>
                  <div className="progress-track" style={{ height: '5px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary-dark)' }}></div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--on-surface)', fontWeight: 500 }}>{fmt(d.total)}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{fmt(d.fixas)}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--tertiary)' }}>{fmt(d.parceladas)}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--outline)' }}>{d.qtd}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
