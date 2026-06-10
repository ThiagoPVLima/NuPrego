'use client';
import { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import BottomSheet from './BottomSheet';
import styles from './CustomSelect.module.css';

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder, label }: Props) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder ?? '—';

  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile]);

  const select = (v: string) => { onChange(v); setOpen(false); };

  const optionList = options.map(opt => (
    <button
      key={opt.value}
      type="button"
      onClick={() => select(opt.value)}
      className={cx(styles.option, opt.value === value && styles.selected)}
    >
      {opt.label}
      {opt.value === value && <span className={styles.checkmark}>✓</span>}
    </button>
  ));

  if (isMobile) {
    return (
      <>
        <div className={styles.trigger} onClick={() => setOpen(true)}>
          <span>{selectedLabel}</span>
          <span className={styles.caret}>▼</span>
        </div>
        {open && (
          <BottomSheet onClose={() => setOpen(false)}>
            {label && <div className={styles.sheetLabel}>{label.toUpperCase()}</div>}
            {optionList}
          </BottomSheet>
        )}
      </>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className={cx(styles.trigger, open && styles.open)}
        onClick={() => setOpen(v => !v)}
      >
        <span>{selectedLabel}</span>
        <span className={cx(styles.caret, open && styles.rotated)}>▼</span>
      </div>
      {open && <div className={styles.popover}>{optionList}</div>}
    </div>
  );
}
