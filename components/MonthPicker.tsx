'use client';
import { useState, useRef, useEffect } from 'react';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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

  useEffect(() => {
    if (open) setPickerAno(ano);
  }, [open, ano]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (m: number) => {
    onChange(pickerAno, m);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="month-display"
        onClick={() => setOpen(v => !v)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {MESES_FULL[mes - 1]} {ano}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          background: 'var(--surface-card)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          minWidth: '240px',
        }}>
          {/* Year navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button type="button" className="btn-ghost" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={() => setPickerAno(y => y - 1)}>‹</button>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: 'var(--on-surface)' }}>{pickerAno}</span>
            <button type="button" className="btn-ghost" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={() => setPickerAno(y => y + 1)}>›</button>
          </div>

          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {MESES_ABREV.map((label, i) => {
              const m = i + 1;
              const isSelected = m === mes && pickerAno === ano;
              const isFuture = pickerAno > now.getFullYear() || (pickerAno === now.getFullYear() && m > now.getMonth() + 1);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => select(m)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'var(--primary-dark)' : 'transparent',
                    color: isSelected ? '#fff' : isFuture ? 'var(--outline-variant)' : 'var(--on-surface-muted)',
                    fontSize: '13px',
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: 'pointer',
                    transition: 'background 0.12s, color 0.12s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-high)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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
