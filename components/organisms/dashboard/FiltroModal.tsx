import { fmt, tipoCor, fmtData } from '@/lib/format';
import ModalBase from '@/components/organisms/ModalBase';
import TransactionListItem from '@/components/molecules/TransactionListItem';
import styles from './Dashboard.module.css';

interface TxItem {
  id?: string | number;
  descricao: string;
  valor: number;
  tipo: string;
  data?: string;
  cartao_id?: number | null;
  meio_pagamento?: string;
  categoria_ids?: number[];
  categoria_id?: number;
}

interface Props {
  label: string;
  transactions: TxItem[];
  onClose: () => void;
  onClickItem: (tx: TxItem) => void;
}

export default function FiltroModal({ label, transactions, onClose, onClickItem }: Props) {
  const total = transactions.reduce((s, t) => s + Number(t.valor), 0);

  return (
    <ModalBase title={label} onClose={onClose} maxWidth={480} scrollable>
      <div className={styles.filtroCount}>
        {transactions.length} transaç{transactions.length === 1 ? 'ão' : 'ões'} · {fmt(total)}
      </div>
      {transactions.length === 0 ? (
        <div className={styles.empty}>Nenhuma transação</div>
      ) : (
        transactions.map((t, i) => {
          const sub = t.data
            ? `${t.data.substring(0, 10).split('-').reverse().join('/')} · ${t.tipo}`
            : t.tipo;
          return (
            <TransactionListItem
              key={t.id ?? i}
              descricao={t.descricao}
              valor={Number(t.valor)}
              color={tipoCor[t.tipo] || 'var(--on-surface)'}
              sub={sub}
              onClick={() => onClickItem(t)}
            />
          );
        })
      )}
    </ModalBase>
  );
}
