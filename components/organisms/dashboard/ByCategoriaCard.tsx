import { fmt } from '@/lib/format';
import ProgressBar from '@/components/atoms/ProgressBar';
import styles from './Dashboard.module.css';

interface CategoriaItem {
  id: string | number;
  nome: string;
  cor?: string;
  total: number;
}

interface Props {
  items: CategoriaItem[];
  total: number;
  onClickItem: (key: string, label: string) => void;
}

export default function ByCategoriaCard({ items, total, onClickItem }: Props) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className={styles.cardHeader}>
        <div className="label-caps">Por Categoria</div>
      </div>
      {items.length === 0 ? (
        <div className={styles.empty}>Sem dados</div>
      ) : (
        items.map(c => {
          const v = Number(c.total);
          const p = total > 0 ? (v / total) * 100 : 0;
          return (
            <div key={c.nome} className={styles.chartRow} onClick={() => onClickItem(String(c.id), c.nome)}>
              <div className={styles.chartRowTop}>
                <span className={styles.chartRowLabel}>{c.nome}</span>
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
