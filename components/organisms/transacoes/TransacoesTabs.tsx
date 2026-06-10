import { fmt } from '@/lib/format';
import styles from './TransacoesTabs.module.css';

export type Aba = 'avulsa' | 'parcelada' | 'fixa' | 'pix';

interface AbaConfig {
  key: Aba;
  label: string;
  total: number;
  cor: string;
}

interface Props {
  abas: AbaConfig[];
  aba: Aba;
  onChange: (aba: Aba) => void;
}

export default function TransacoesTabs({ abas, aba, onChange }: Props) {
  return (
    <div className={styles.tabs}>
      {abas.map(a => (
        <button
          key={a.key}
          type="button"
          className={`${styles.tab}${aba === a.key ? ` ${styles.active}` : ''}`}
          style={{
            borderBottomColor: aba === a.key ? a.cor : 'transparent',
            color: aba === a.key ? a.cor : 'var(--outline)',
          }}
          onClick={() => onChange(a.key)}
        >
          {a.label}
          <span className={styles.tabTotal}>{fmt(a.total)}</span>
        </button>
      ))}
    </div>
  );
}
