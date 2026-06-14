'use client';
import Image from 'next/image';
import styles from './LoadingOverlay.module.css';

interface Props { label?: string; }

export default function LoadingOverlay({ label = 'CARREGANDO' }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.center}>
        <div className={styles.logoWrap}>
          <div className={styles.ring} />
          <div className={`${styles.ring} ${styles.ring2}`} />
          <div className={`${styles.ring} ${styles.ring3}`} />
          <Image src="/NuPrego-Logo.png" alt="NuPrego" width={72} height={72} className={styles.logo} priority />
        </div>
        <div className={styles.textWrap}>
          <div className={styles.appName}>NuPrego</div>
          <div className={styles.label}>{label}</div>
        </div>
        <div className={styles.dots}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>
    </div>
  );
}
