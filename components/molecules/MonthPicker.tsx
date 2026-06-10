'use client';
import { useState, useRef, useEffect } from 'react';
import { MESES, MESES_ABREV } from '@/lib/format';
import Button from '@/components/atoms/Button';
import styles from './MonthPicker.module.css';

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

interface Props {
  ano: number;
  mes: number;
  onChange: (ano: number, mes: number) => void;
}

export default function MonthPicker({ ano, mes, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pickerAno, setPickerAno] = useState(ano);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => { if (open) setPickerAno(ano); }, [open, ano]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (m: number) => { onChange(pickerAno, m); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={cx('month-display', styles.trigger)}
        onClick={() => setOpen(v => !v)}
      >
        {MESES[mes - 1]} {ano}
      </button>

      {open && (
        <div className={styles.popover}>
          <div className={styles.yearNav}>
            <Button variant="ghost" size="lg" onClick={() => setPickerAno(y => y - 1)}>‹</Button>
            <span className={styles.yearLabel}>{pickerAno}</span>
            <Button variant="ghost" size="lg" onClick={() => setPickerAno(y => y + 1)}>›</Button>
          </div>
          <div className={styles.monthGrid}>
            {MESES_ABREV.map((label, i) => {
              const m = i + 1;
              const isSelected = m === mes && pickerAno === ano;
              const isFuture = pickerAno > now.getFullYear() ||
                (pickerAno === now.getFullYear() && m > now.getMonth() + 1);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => select(m)}
                  className={cx(
                    styles.monthBtn,
                    isSelected && styles.selected,
                    !isSelected && isFuture && styles.future,
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
