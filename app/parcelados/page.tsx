'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export default function Parcelados() {
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apenasAbertos, setApenasAbertos] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, c] = await Promise.all([
      fetch('/api/transacoes?tipo=parcelada').then(r => r.json()),
      fetch('/api/cartoes').then(r => r.json()),
    ]);
    setTxs(Array.isArray(t) ? t : []); setCartoes(Array.isArray(c) ? c : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grupos = txs.reduce((acc: any, t: any) => {
    const key = t.grupo_parcela || String(t.id);
    if (!acc[key]) acc[key] = { descricao: t.descricao.replace(/ \d+\/\d+$/, ''), valorParcela: Number(t.valor), totalParcelas: t.total_parcelas, parcelaAtual: t.parcela_atual, cartaoId: t.cartao_id, grupo: t.grupo_parcela, id: t.id };
    return acc;
  }, {});

  const lista = Object.values(grupos) as any[];
  const filtradas = apenasAbertos ? lista.filter((g: any) => g.parcelaAtual < g.totalParcelas) : lista;
  const totalRestante = filtradas.reduce((s: number, g: any) => s + g.valorParcela * (g.totalParcelas - g.parcelaAtual + 1), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Parcelados</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>{filtradas.length} itens · {fmt(totalRestante)} restantes</div>
        </div>
        <button onClick={() => setApenasAbertos(!apenasAbertos)} className={apenasAbertos ? 'btn-primary' : 'btn-secondary'}>
          {apenasAbertos ? '⊙ Em aberto' : '◎ Todos'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>Nenhum parcelado {apenasAbertos ? 'em aberto' : ''}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtradas.map((g: any) => {
            const pago = g.parcelaAtual - 1;
            const restantes = g.totalParcelas - g.parcelaAtual + 1;
            const pct = (pago / g.totalParcelas) * 100;
            const cartao = cartoes.find((c: any) => c.id === g.cartaoId);
            const fillColor = pct >= 75 ? '#6edab4' : pct >= 40 ? '#ffb783' : '#8083ff';
            return (
              <div key={g.grupo || g.id} className="card" style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '15px', color: '#dfe3e7', marginBottom: '6px' }}>{g.descricao}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--outline)' }}>
                      {cartao && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cartao.cor, display: 'inline-block' }}></span>{cartao.nome}</span>}
                      <span>total: {fmt(g.valorParcela * g.totalParcelas)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '18px', color: 'var(--tertiary)' }}>{fmt(g.valorParcela)}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span></div>
                    <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(g.valorParcela * restantes)} restantes</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--outline)', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span>{pago} de {g.totalParcelas} pagas</span>
                    <span>{Math.round(pct)}% · {restantes} restantes</span>
                  </div>
                  <div className="progress-track" style={{ height: '8px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
