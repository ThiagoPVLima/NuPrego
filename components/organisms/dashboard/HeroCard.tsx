import { fmt, pct, MESES } from '@/lib/format';
import Button from '@/components/atoms/Button';
import ProgressBar from '@/components/atoms/ProgressBar';
import styles from './Dashboard.module.css';

interface Props {
  total: number;
  fixas: number;
  parceladas: number;
  avulsas: number;
  renda: number;
  mes: number;
  onEditRenda: () => void;
}

const TIPOS = [
  { label: 'Fixas', key: 'fixas' as const, color: '#8083ff' },
  { label: 'Parceladas', key: 'parceladas' as const, color: '#ffb783' },
  { label: 'Avulsas', key: 'avulsas' as const, color: '#6edab4' },
];

export default function HeroCard({ total, fixas, parceladas, avulsas, renda, mes, onEditRenda }: Props) {
  const saldo = renda - total;
  const values = { fixas, parceladas, avulsas };

  return (
    <div className={`card ${styles.heroCard}`}>
      <div className={styles.heroTop}>
        <div>
          <div className={styles.heroLabel}>Total gasto em {MESES[mes - 1]}</div>
          <div className={styles.heroTotal}>{fmt(total)}</div>
        </div>
        <div className={styles.heroRight}>
          {renda > 0 ? (
            <>
              <div className={styles.rendaLabel}>Renda</div>
              <button className={styles.rendaValue} type="button" onClick={onEditRenda}>
                {fmt(renda)}
              </button>
              <div className={styles.saldo} style={{ color: saldo >= 0 ? 'var(--secondary)' : '#f87171' }}>
                {saldo >= 0 ? `sobram ${fmt(saldo)}` : `estouro de ${fmt(-saldo)}`}
              </div>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={onEditRenda} style={{ color: 'var(--outline)', fontSize: '12px' }}>
              + definir renda
            </Button>
          )}
        </div>
      </div>

      <div className={styles.breakdown}>
        {TIPOS.map(t => {
          const v = values[t.key];
          return (
            <div key={t.key}>
              <div className={styles.breakdownLabel}>{t.label.toUpperCase()}</div>
              <div className={styles.breakdownValue} style={{ color: t.color }}>{fmt(v)}</div>
              <div className={styles.breakdownBar}>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={pct(v, total)} color={t.color} height={3} />
                </div>
                <span className={styles.breakdownPct}>{pct(v, total)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
