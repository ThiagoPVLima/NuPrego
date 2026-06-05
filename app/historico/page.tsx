'use client';
import { useState, useEffect, useCallback } from 'react';

const MESES_NOME = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtBar = (v: number) => {
  if (v >= 10000) return `R$${Math.round(v / 1000)}k`;
  if (v >= 1000)  return `R$${(v / 1000).toFixed(1).replace('.', ',')}k`;
  return `R$${Math.round(v)}`;
};

export default function Historico() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anos, setAnos] = useState<number[]>([]);
  const [anoSel, setAnoSel] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [txsRes, cfgRes] = await Promise.all([
      fetch('/api/transacoes').then(r => r.json()),
      fetch('/api/fixas-config').then(r => r.json()).catch(() => []),
    ]);

    const txs: any[] = Array.isArray(txsRes) ? txsRes : [];

    // fixas_config: saber quais estão ativas
    const norm = (s: string) => (s || '').toLowerCase().trim();
    const cfgMap: Record<string, { ativa: boolean; data_inicio: string | null }> = {};
    for (const c of (Array.isArray(cfgRes) ? cfgRes : [])) {
      cfgMap[norm(c.descricao)] = { ativa: !!c.ativa, data_inicio: c.data_inicio };
    }

    const txKey = (t: any): string =>
      t.fatura_ano && t.fatura_mes
        ? `${t.fatura_ano}-${String(t.fatura_mes).padStart(2, '0')}`
        : (t.data?.substring(0, 7) ?? '');

    const por: Record<string, any> = {};
    const addTo = (k: string, t: any) => {
      if (!k) return;
      if (!por[k]) por[k] = { total: 0, qtd: 0, fixas: 0, parceladas: 0, avulsas: 0 };
      por[k].total += Number(t.valor); por[k].qtd++;
      if (t.tipo === 'fixa') por[k].fixas += Number(t.valor);
      else if (t.tipo === 'parcelada') por[k].parceladas += Number(t.valor);
      else por[k].avulsas += Number(t.valor);
    };

    for (const t of txs) addTo(txKey(t), t);

    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Horizonte das parceladas: último mês com parcela no banco
    const horizonteParceladas = txs
      .filter(t => t.tipo === 'parcelada')
      .reduce((max, t) => { const k = txKey(t); return k > max ? k : max; }, currentYM);

    // Horizonte das fixas: independente — projeta 24 meses a partir de hoje
    // (aparecem até o usuário desativar, não param quando acabam as parceladas)
    const d24 = new Date(now.getFullYear(), now.getMonth() + 24, 1);
    const horizonteFixas = `${d24.getFullYear()}-${String(d24.getMonth() + 1).padStart(2, '0')}`;
    const horizonteGeral = horizonteFixas > horizonteParceladas ? horizonteFixas : horizonteParceladas;

    const msBetween = (a: string, b: string) => {
      const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number);
      return (by - ay) * 12 + (bm - am);
    };

    // Rastreia: primeira e última entrada, e quais meses já têm dado explícito por fixa
    const fixaMeses: Record<string, Set<string>> = {};
    const primeiraEntrada: Record<string, string> = {};
    const ultimaEntrada: Record<string, { valor: number; mes: string }> = {};
    for (const t of txs.filter((t: any) => t.tipo === 'fixa')) {
      const desc = norm(t.descricao);
      const k = txKey(t);
      if (!fixaMeses[desc]) fixaMeses[desc] = new Set();
      fixaMeses[desc].add(k);
      if (!primeiraEntrada[desc] || k < primeiraEntrada[desc]) primeiraEntrada[desc] = k;
      if (!ultimaEntrada[desc] || k > ultimaEntrada[desc].mes)
        ultimaEntrada[desc] = { valor: Number(t.valor), mes: k };
    }

    // Preenche TODOS os meses de cada fixa ativa — passados e futuros:
    //  Passado : preenche buracos entre entradas (fixa deve aparecer em todos os meses)
    //  Futuro  : cfg.ativa===true → 24 meses; sem config recente → 3 meses; inativa → para
    for (const [desc, { valor, mes: ultima }] of Object.entries(ultimaEntrada)) {
      const cfg = cfgMap[desc];
      if (cfg && cfg.ativa === false) continue;

      const dataInicio = cfg?.data_inicio?.substring(0, 7) ?? null;
      const projetarFuturo = cfg?.ativa === true || msBetween(ultima, currentYM) <= 3;
      const horizonteFuturo = cfg?.ativa === true ? horizonteGeral : (() => {
        const d = new Date(now.getFullYear(), now.getMonth() + 3, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })();

      // Começa do primeiro mês com dado (backfill) ou data_inicio (o que for mais recente)
      const startMes = primeiraEntrada[desc] ?? ultima;
      const [sy, sm] = startMes.split('-').map(Number);
      let cursor = new Date(sy, sm - 1, 1); // sm-1: JS Date usa meses 0-indexed

      while (true) {
        const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const isFuturo = ym > currentYM;

        // Para se passou do horizonte futuro ou se não deve projetar futuro
        if (isFuturo && !projetarFuturo) break;
        if (ym > horizonteFuturo) break;

        // Preenche só se não tem entrada explícita e respeita data_inicio
        if (!fixaMeses[desc]?.has(ym) && (!dataInicio || ym >= dataInicio)) {
          addTo(ym, { tipo: 'fixa', valor });
        }

        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '176px', overflowX: 'auto', paddingTop: '22px', paddingBottom: '8px' }}>
              {[...filtrados].reverse().map((d) => {
                const h = Math.max(6, (d.total / maxTotal) * 100);
                const [y, m] = d.periodo.split('-');
                return (
                  <div key={d.periodo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '56px', flexShrink: 0 }}>
                    <div style={{ fontSize: '9px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                      {fmtBar(d.total)}
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
            <div className="table-header-hide-mobile" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 120px 60px', padding: '12px 20px', background: 'var(--surface-low)', fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', gap: '8px' }}>
              <span>PERÍODO</span><span>BARRA</span><span>TOTAL</span><span>FIXAS</span><span>PARCELADAS</span><span>QTD</span>
            </div>
            {filtrados.map((d) => {
              const [y, m] = d.periodo.split('-');
              const pct = (d.total / maxTotal) * 100;
              return (
                <div key={d.periodo} className="table-row-2col" style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 110px 120px 60px', padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, color: 'var(--on-surface-muted)' }}>{MESES_NOME[parseInt(m)-1]} {y}</span>
                    {/* Barra e detalhes visíveis só no mobile */}
                    <div className="row-meta-mobile" style={{ flexDirection: 'column', gap: '4px', marginTop: '6px', width: '100%' }}>
                      <div className="progress-track" style={{ height: '4px', width: '100%' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary-dark)' }}></div>
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
                      <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary-dark)' }}></div>
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
        </>
      )}
    </div>
  );
}
