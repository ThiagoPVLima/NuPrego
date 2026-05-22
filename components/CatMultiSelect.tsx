'use client';

type Cat = { id: number; nome: string; icone?: string | null; cor?: string | null };

type Props = {
  value: number[];
  onChange: (ids: number[]) => void;
  categorias: Cat[];
};

export default function CatMultiSelect({ value, onChange, categorias }: Props) {
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

  if (categorias.length === 0)
    return <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>Nenhuma categoria cadastrada</span>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {categorias.map(c => {
        const sel = value.includes(c.id);
        const cor = c.cor || '#8083ff';
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 11px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${sel ? cor : 'var(--outline-variant)'}`,
              background: sel ? `${cor}22` : 'transparent',
              color: sel ? cor : 'var(--on-surface-muted)',
              fontFamily: 'Manrope, sans-serif', fontWeight: sel ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {c.icone && <span style={{ fontSize: '13px', lineHeight: 1 }}>{c.icone}</span>}
            {c.nome}
            {sel && <span style={{ fontSize: '10px', opacity: 0.8 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}
