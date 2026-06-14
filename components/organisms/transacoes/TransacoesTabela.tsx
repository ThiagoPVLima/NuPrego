import React from 'react';
import type { Aba } from './TransacoesTabs';
import styles from './TransacoesTabela.module.css';
import LoadingOverlay from '@/components/atoms/LoadingOverlay';

interface Props {
  aba: Aba;
  loading: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}

const cols: Record<Aba, string> = {
  avulsa: '1fr 130px 150px 90px',
  fixa: '1fr 130px 150px 90px',
  parcelada: '1fr 130px 150px 80px 90px',
  pix: '1fr 130px 150px 80px 90px',
};

const showParcela = (aba: Aba) => aba === 'parcelada' || aba === 'pix';

export default function TransacoesTabela({ aba, loading, emptyLabel, children }: Props) {
  const wide = showParcela(aba);
  return (
    <div className={styles.wrap}>
      <div className={wide ? styles.innerWide : styles.inner}>
        <div className={styles.header} style={{ gridTemplateColumns: cols[aba] }}>
          <span>DESCRIÇÃO</span>
          <span>VALOR</span>
          <span>PAGAMENTO</span>
          {wide && <span>PARCELA</span>}
          <span>DATA</span>
        </div>
        {loading ? (
          <LoadingOverlay />
        ) : React.Children.count(children) === 0 ? (
          <div className={styles.empty}>{emptyLabel}</div>
        ) : children}
      </div>
    </div>
  );
}
