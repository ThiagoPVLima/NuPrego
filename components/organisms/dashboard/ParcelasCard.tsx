import { fmt, MESES } from '@/lib/format';
import Button from '@/components/atoms/Button';
import TransactionListItem from '@/components/molecules/TransactionListItem';
import styles from './Dashboard.module.css';

interface ParcelaItem {
  id?: string | number;
  descricao: string;
  valor: number;
  parcela_atual?: number;
  total_parcelas?: number;
  cartao_id?: number | null;
}

interface Props {
  parcelas: ParcelaItem[];
  pixParcelados: number;
  mes: number;
  onVerTodas: () => void;
  onClickItem: (parcela: ParcelaItem) => void;
}

export default function ParcelasCard({ parcelas, pixParcelados, mes, onVerTodas, onClickItem }: Props) {
  const nextMes = MESES[mes === 12 ? 0 : mes];

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className={styles.cardHeader}>
        <div className="label-caps">Parcelas do Mês</div>
        <Button variant="link" size="sm" onClick={onVerTodas}>ver todas →</Button>
      </div>

      {pixParcelados > 0 && (
        <div className={styles.pixBanner}>
          <span className={styles.pixBannerLabel}>PIX parcelados de {nextMes}</span>
          <span className={styles.pixBannerValue}>{fmt(pixParcelados)}</span>
        </div>
      )}

      {parcelas.length === 0 ? (
        <div className={styles.empty}>Nenhuma parcela este mês</div>
      ) : (
        parcelas.slice(0, 5).map((p, i) => {
          const sub = p.parcela_atual && p.total_parcelas
            ? `${p.parcela_atual}/${p.total_parcelas} parcelas${!p.cartao_id ? ` · ${nextMes}` : ''}`
            : undefined;
          return (
            <TransactionListItem
              key={p.id ?? i}
              descricao={p.descricao}
              valor={Number(p.valor)}
              color={p.cartao_id ? 'var(--tertiary)' : '#00b8d4'}
              sub={sub}
              onClick={() => onClickItem(p)}
            />
          );
        })
      )}
    </div>
  );
}
