'use client';
import { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import BottomSheet from './BottomSheet';
import Button from '@/components/atoms/Button';
import styles from './CustomDateInput.module.css';

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

const CAL_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Calendar({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  const selected = parseDate(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? now.getMonth());

  const navMonth = (d: number) => {
    let m = viewMonth + d, y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m); setViewYear(y);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isoPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const selectedDay = value?.substring(0, 7) === isoPrefix ? parseInt(value.split('-')[2]) : null;

  return (
    <div className={styles.calendar}>
      <div className={styles.calNav}>
        <Button variant="ghost" size="lg" onClick={() => navMonth(-1)}>‹</Button>
        <span className={styles.calTitle}>{CAL_MESES[viewMonth]} {viewYear}</span>
        <Button variant="ghost" size="lg" onClick={() => navMonth(1)}>›</Button>
      </div>
      <div className={styles.dayHeaders}>
        {DIAS_SEMANA.map((d, i) => <div key={i} className={styles.dayHeader}>{d}</div>)}
      </div>
      <div className={styles.dayGrid}>
        {cells.map((day, i) => (
          <button
            key={i}
            type="button"
            disabled={day === null}
            onClick={() => { if (day) onSelect(toISO(new Date(viewYear, viewMonth, day))); }}
            className={cx(styles.dayBtn, day === selectedDay && styles.daySelected)}
          >
            {day ?? ''}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function CustomDateInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const displayValue = value ? value.split('-').reverse().join('/') : '';

  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile]);

  const handleSelect = (v: string) => { onChange(v); setOpen(false); };

  const triggerCls = cx(styles.trigger, open && styles.open, !value && styles.placeholder);

  if (isMobile) {
    return (
      <>
        <div className={triggerCls} onClick={() => setOpen(true)}>
          {displayValue || 'dd/mm/aaaa'}
        </div>
        {open && (
          <BottomSheet onClose={() => setOpen(false)}>
            <Calendar value={value} onSelect={handleSelect} />
          </BottomSheet>
        )}
      </>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={triggerCls} onClick={() => setOpen(v => !v)}>
        {displayValue || 'dd/mm/aaaa'}
      </div>
      {open && (
        <div className={styles.popover}>
          <Calendar value={value} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
