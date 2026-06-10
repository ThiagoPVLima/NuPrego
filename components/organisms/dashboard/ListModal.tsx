import { fmt, MESES } from '@/lib/format';
import ModalBase from '@/components/organisms/ModalBase';
import TransactionListItem from '@/components/molecules/TransactionListItem';
import styles from './Dashboard.module.css';

interface FixaItem {
  id?: string | number;
  descricao: string;
  valor: number;
  pago?: boolean;
}

interface ParcelaItem {
  id?: string | number;
  descricao: string;
  valor: number;
  parcela_atual?: number;
  total_parcelas?: number;
  cartao_id?: number | null;
}

interface Props {
  tipo: 'fixas' | 'parceladas';
  fixas: FixaItem[];
  parcelas: ParcelaItem[];
  pixParcelados: number;
  mes: number;
  onClose: () => void;
  onClickItem: (item: FixaItem | ParcelaItem) => void;
}

export default function ListModal({ tipo, fixas, parcelas, pixParcelados, mes, onClose, onClickItem }: Props) {
  const mesLabel = MESES[mes - 1];
  const nextMes = MESES[mes === 12 ? 0 : mes];
  const title = tipo === 'fixas' ? `Fixas de ${mesLabel}` : `Parcelas de ${mesLabel}`;

  return (
    <ModalBase title={title} onClose={onClose} maxWidth={480} scrollable>
      {tipo === 'fixas' && (
        fixas.length === 0
          ? <div className={styles.empty}>Nenhuma fixa este mês</div>
          : fixas.map((f, i) => (
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

      {tipo === 'parceladas' && (
        parcelas.length === 0
          ? <div className={styles.empty}>Nenhuma parcela este mês</div>
          : <>
            {pixParcelados > 0 && (
              <div className={styles.pixBanner} style={{ marginBottom: '6px' }}>
                <span className={styles.pixBannerLabel}>PIX parcelados de {nextMes}</span>
                <span className={styles.pixBannerValue}>{fmt(pixParcelados)}</span>
              </div>
            )}
            {parcelas.map((p, i) => {
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
            })}
          </>
      )}
    </ModalBase>
  );
}
