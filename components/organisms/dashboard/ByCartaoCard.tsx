import { fmt } from '@/lib/format';
import ColorDot from '@/components/atoms/ColorDot';
import ProgressBar from '@/components/atoms/ProgressBar';
import styles from './Dashboard.module.css';

interface CartaoItem {
  id: string | number;
  nome: string;
  cor?: string;
  total: number;
}

interface Props {
  items: CartaoItem[];
  total: number;
  onClickItem: (key: string, label: string) => void;
}

export default function ByCartaoCard({ items, total, onClickItem }: Props) {
  const filtered = items.filter(c => Number(c.total) > 0);

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className={styles.cardHeader}>
        <div className="label-caps">Por Cartão / Meio</div>
      </div>
      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum gasto este mês</div>
      ) : (
        filtered.map(c => {
          const v = Number(c.total);
          const p = total > 0 ? (v / total) * 100 : 0;
          return (
            <div key={c.id} className={styles.chartRow} onClick={() => onClickItem(String(c.id), c.nome)}>
              <div className={styles.chartRowTop}>
                <span className={styles.chartRowLabel}>
                  <ColorDot color={c.cor || 'var(--outline)'} />
                  {c.nome}
                </span>
                <span className={styles.chartRowValue}>{fmt(v)}</span>
              </div>
              <ProgressBar value={p} color={c.cor || 'var(--primary-dark)'} height={4} />
            </div>
          );
        })
      )}
    </div>
  );
}
