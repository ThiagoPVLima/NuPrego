'use client';
import { useState, useMemo } from 'react';
import { fmt } from '@/lib/format';
import { useDemoContext } from '@/contexts/DemoContext';
import Button from '@/components/atoms/Button';

const MESES_NOME = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmtBar = (v: number) => {
  if (v >= 10000) return `R$${Math.round(v / 1000)}k`;
  if (v >= 1000)  return `R$${(v / 1000).toFixed(1).replace('.', ',')}k`;
  return `R$${Math.round(v)}`;
};

export default function DemoHistorico() {
  const demo = useDemoContext();
  const [anoSel, setAnoSel] = useState<number | null>(null);

  const { dados, anos } = useMemo(() => {
    const txs = demo.getTransacoes({}) as any[];
    const por: Record<string, any> = {};
    for (const t of txs) {
      const k = t.fatura_ano && t.fatura_mes
        ? `${t.fatura_ano}-${String(t.fatura_mes).padStart(2, '0')}`
        : t.data?.substring(0, 7) ?? '';
      if (!k) continue;
      if (!por[k]) por[k] = { total: 0, qtd: 0, fixas: 0, parceladas: 0, avulsas: 0 };
      por[k].total += Number(t.valor); por[k].qtd++;
      if (t.tipo === 'fixa') por[k].fixas += Number(t.valor);
      else if (t.tipo === 'parcelada') por[k].parceladas += Number(t.valor);
      else por[k].avulsas += Number(t.valor);
    }
    const lista = Object.entries(por).map(([periodo, v]) => ({ periodo, ...v })).sort((a, b) => b.periodo.localeCompare(a.periodo));
    const anosArr = Array.from(new Set(lista.map(l => parseInt(l.periodo.split('-')[0])))).sort((a, b) => b - a) as number[];
    return { dados: lista, anos: anosArr };
  }, [demo]);

  const filtrados = anoSel ? dados.filter(d => d.periodo.startsWith(String(anoSel))) : dados;
  const maxTotal = Math.max(...filtrados.map((d: any) => d.total), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>Evolução de gastos ao longo do tempo</div>
        </div>
        <div className="page-header-actions">
          <Button variant={!anoSel ? 'primary' : 'secondary'} onClick={() => setAnoSel(null)}>Todos</Button>
          {anos.map((a: number) => (
            <Button key={a} variant={anoSel === a ? 'primary' : 'secondary'} onClick={() => setAnoSel(a)}>{a}</Button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '20px' }}>GASTOS MENSAIS</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '176px', overflowX: 'auto', paddingTop: '22px', paddingBottom: '8px' }}>
          {[...filtrados].reverse().map((d: any) => {
            const h = Math.max(6, (d.total / maxTotal) * 100);
            const [y, m] = d.periodo.split('-');
            return (
              <div key={d.periodo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '56px', flexShrink: 0 }}>
                <div style={{ fontSize: '9px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{fmtBar(d.total)}</div>
                <div style={{ width: '38px', height: `${h}px`, background: 'var(--primary-dark)', borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
                <div style={{ fontSize: '10px', color: 'var(--outline)', textAlign: 'center', lineHeight: 1.3 }}>
                  {MESES_NOME[parseInt(m)-1]}<br /><span style={{ fontSize: '9px', opacity: 0.6 }}>{y}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-header-hide-mobile" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 120px 60px', padding: '12px 20px', background: 'var(--surface-low)', fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', gap: '8px' }}>
          <span>PERÍODO</span><span>BARRA</span><span>TOTAL</span><span>FIXAS</span><span>PARCELADAS</span><span>QTD</span>
        </div>
        {filtrados.map((d: any) => {
          const [y, m] = d.periodo.split('-');
          const pct = (d.total / maxTotal) * 100;
          return (
            <div key={d.periodo} className="table-row-2col" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 120px 60px', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', gap: '8px', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, color: 'var(--on-surface-muted)' }}>{MESES_NOME[parseInt(m)-1]} {y}</span>
                <div className="row-meta-mobile" style={{ flexDirection: 'column', gap: '4px', marginTop: '6px', width: '100%' }}>
                  <div className="progress-track" style={{ height: '4px', width: '100%' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary-dark)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ color: 'var(--primary)' }}>F {fmt(d.fixas)}</span>
                    <span style={{ color: 'var(--tertiary)' }}>P {fmt(d.parceladas)}</span>
                    <span>{d.qtd} tx</span>
                  </div>
                </div>
              </div>
              <div className="table-col-hide-mobile" style={{ display: 'contents' }}>
                <div className="progress-track" style={{ height: '5px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary-dark)' }} />
                </div>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--on-surface)', fontWeight: 500 }}>{fmt(d.total)}</span>
              <span className="table-col-hide-mobile" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{fmt(d.fixas)}</span>
              <span className="table-col-hide-mobile" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--tertiary)' }}>{fmt(d.parceladas)}</span>
              <span className="table-col-hide-mobile" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--outline)' }}>{d.qtd}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
