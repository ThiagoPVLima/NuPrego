'use client';
import { useEffect } from 'react';
import Button from '@/components/atoms/Button';
import styles from './ModalBase.module.css';

interface Props {
  title?: string;
  subheader?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  scrollable?: boolean;
}

export default function ModalBase({ title, subheader, onClose, children, maxWidth = 480, scrollable }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.container}${scrollable ? ` ${styles.scrollable}` : ''}`}
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          {title !== undefined ? <h2 className={styles.title}>{title}</h2> : <span />}
          <Button variant="ghost" size="lg" onClick={onClose}>✕</Button>
        </div>
        {subheader && <div className={styles.subheader}>{subheader}</div>}
        {scrollable ? <div className={styles.scrollBody}>{children}</div> : children}
      </div>
    </div>
  );
}
