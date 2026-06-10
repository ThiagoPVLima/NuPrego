import { fmt } from '@/lib/format';
import styles from './TransactionListItem.module.css';

interface Props {
  descricao: string;
  valor: number;
  color?: string;
  pago?: boolean;
  sub?: React.ReactNode;
  onClick?: () => void;
}

export default function TransactionListItem({ descricao, valor, color, pago, sub, onClick }: Props) {
  return (
    <div className={styles.item} onClick={onClick}>
      <div className={styles.left}>
        {pago !== undefined && (
          <span className={styles.status} style={{ color: pago ? '#6edab4' : 'var(--outline-variant)' }}>
            {pago ? '✓' : '○'}
          </span>
        )}
        <div className={styles.content}>
          <div className={`${styles.desc}${pago ? ` ${styles.muted}` : ''}`}>{descricao}</div>
          {sub && <div className={styles.sub}>{sub}</div>}
        </div>
      </div>
      <div className={styles.value} style={{ color: color ?? 'var(--on-surface)' }}>
        {fmt(valor)}
      </div>
    </div>
  );
}
