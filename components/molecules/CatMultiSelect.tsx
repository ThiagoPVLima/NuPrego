'use client';
import styles from './CatMultiSelect.module.css';

type Cat = { id: number; nome: string; icone?: string | null; cor?: string | null };

interface Props {
  value: number[];
  onChange: (ids: number[]) => void;
  categorias: Cat[];
}

export default function CatMultiSelect({ value, onChange, categorias }: Props) {
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);

  if (categorias.length === 0) {
    return <span className={styles.empty}>Nenhuma categoria cadastrada</span>;
  }

  return (
    <div className={styles.container}>
      {categorias.map(c => {
        const sel = value.includes(c.id);
        const cor = c.cor || '#8083ff';
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            className={`${styles.chip}${sel ? ` ${styles.selected}` : ''}`}
            style={sel ? { '--cat-color': cor, '--cat-bg': `${cor}22` } as React.CSSProperties : undefined}
          >
            {c.icone && <span className={styles.icon}>{c.icone}</span>}
            {c.nome}
            {sel && <span className={styles.check}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}
