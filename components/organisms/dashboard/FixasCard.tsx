import { fmt } from '@/lib/format';
import Button from '@/components/atoms/Button';
import TransactionListItem from '@/components/molecules/TransactionListItem';
import styles from './Dashboard.module.css';

interface FixaItem {
  id?: string | number;
  descricao: string;
  valor: number;
  pago?: boolean;
}

interface Props {
  fixas: FixaItem[];
  onVerTodas: () => void;
  onClickItem: (fixa: FixaItem) => void;
}

export default function FixasCard({ fixas, onVerTodas, onClickItem }: Props) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className={styles.cardHeader}>
        <div className="label-caps">Fixas do Mês</div>
        <Button variant="link" size="sm" onClick={onVerTodas}>ver todas →</Button>
      </div>
      {fixas.length === 0 ? (
        <div className={styles.empty}>Nenhuma fixa este mês</div>
      ) : (
        fixas.slice(0, 8).map((f, i) => (
          <TransactionListItem
            key={f.id ?? i}
            descricao={f.descricao}
            valor={Number(f.valor)}
            color={f.pago ? 'var(--outline)' : '#8083ff'}
            pago={f.pago}
            onClick={() => onClickItem(f)}
          />
        ))
      )}
    </div>
  );
}
