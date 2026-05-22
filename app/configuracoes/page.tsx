'use client';
import { useState, useRef } from 'react';

export default function Configuracoes() {
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [migrando, setMigrando] = useState(false);
  const [resultadoMig, setResultadoMig] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const migrarGrupos = async () => {
    if (!confirm('Agrupar parcelas importadas sem grupo? Essa operação é segura e pode ser desfeita manualmente.')) return;
    setMigrando(true);
    setResultadoMig(null);
    try {
      const r = await fetch('/api/migrar-grupos', { method: 'POST' });
      setResultadoMig(await r.json());
    } catch { setResultadoMig({ error: 'Erro ao migrar' }); }
    finally { setMigrando(false); }
  };

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportando(true); setResultado(null);
    const form = new FormData(); form.append('file', file);
    try {
      const r = await fetch('/api/importar', { method: 'POST', body: form });
      setResultado(await r.json());
    } catch { setResultado({ error: 'Erro ao importar' }); }
    finally { setImportando(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Configurações</h1>
        <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>Importação de dados e informações do sistema</div>
      </div>

      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', marginBottom: '6px' }}>Importar planilha Excel</div>
        <div style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '24px', lineHeight: 1.6 }}>
          Importe seu arquivo <code style={{ background: 'var(--surface-high)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>Contas.xlsx</code> original. O sistema detecta automaticamente meses, cartões, fixas e parcelados.
        </div>

        <div onClick={() => fileRef.current?.click()} style={{ border: '1px dashed var(--outline-variant)', borderRadius: '10px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-dark)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '14px', color: 'var(--on-surface-muted)', marginBottom: '4px' }}>
            {importando ? 'Importando...' : 'Clique ou arraste o arquivo .xlsx'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>suporte: .xlsx .xls</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={importar} />
        </div>

        {resultado && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: resultado.error ? 'rgba(239,68,68,0.08)' : 'rgba(110,218,180,0.08)', border: `1px solid ${resultado.error ? 'rgba(239,68,68,0.2)' : 'rgba(110,218,180,0.2)'}` }}>
            {resultado.error
              ? <div style={{ color: '#f87171', fontSize: '14px' }}>❌ {resultado.error}</div>
              : <div style={{ color: 'var(--secondary)', fontSize: '14px' }}>✓ {resultado.importadas} transações importadas com sucesso!</div>
            }
          </div>
        )}
      </div>

      {/* Migração de grupos */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', marginBottom: '6px' }}>Agrupar parcelados importados</div>
        <div style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '20px', lineHeight: 1.6 }}>
          Transações parceladas importadas sem vínculo de grupo aparecem como cards separados na tela de Parcelados.
          Execute essa operação <strong style={{ color: 'var(--on-surface-muted)' }}>uma vez</strong> para agrupá-las corretamente.
        </div>
        <button type="button" className="btn-primary" onClick={migrarGrupos} disabled={migrando} style={{ opacity: migrando ? 0.6 : 1 }}>
          {migrando ? 'Agrupando...' : '⊞ Agrupar parcelados'}
        </button>
        {resultadoMig && (
          <div style={{ marginTop: '14px', padding: '14px', borderRadius: '8px', background: resultadoMig.error ? 'rgba(239,68,68,0.08)' : 'rgba(110,218,180,0.08)', border: `1px solid ${resultadoMig.error ? 'rgba(239,68,68,0.2)' : 'rgba(110,218,180,0.2)'}` }}>
            {resultadoMig.error
              ? <div style={{ color: '#f87171', fontSize: '14px' }}>❌ {resultadoMig.error}</div>
              : <div style={{ color: 'var(--secondary)', fontSize: '14px' }}>✓ {resultadoMig.mensagem}</div>
            }
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', marginBottom: '20px' }}>Sobre o NuPrego</div>
        {[
          ['Banco de dados', 'Supabase (PostgreSQL)'],
          ['Frontend', 'Next.js 15 + Tailwind CSS'],
          ['Hospedagem', 'Vercel'],
          ['Cartões', 'Itaú, Mercado Livre, Monique, Padrinho'],
          ['Histórico', 'Importação desde 2021'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px' }}>
            <span style={{ color: 'var(--outline)' }}>{k}</span>
            <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
