'use client';
import { useState, useRef, useEffect } from 'react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
}

function Calendar({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const selected = parseDate(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? now.getMonth());

  const navMonth = (d: number) => {
    let m = viewMonth + d;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewMonth(m); setViewYear(y);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const select = (day: number) => {
    onChange(toISO(new Date(viewYear, viewMonth, day)));
    onClose();
  };

  const isoPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const selectedPrefix = value?.substring(0, 7);
  const selectedDay = value && selectedPrefix === isoPrefix ? parseInt(value.split('-')[2]) : null;

  return (
    <div style={{ padding: '16px', minWidth: '260px' }}>
      {/* Month/year nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button type="button" className="btn-ghost" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={() => navMonth(-1)}>‹</button>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>
          {MESES[viewMonth]} {viewYear}
        </span>
        <button type="button" className="btn-ghost" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={() => navMonth(1)}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', padding: '4px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, i) => (
          <button
            key={i}
            type="button"
            disabled={day === null}
            onClick={() => day && select(day)}
            style={{
              padding: '7px 0',
              borderRadius: '6px',
              border: 'none',
              background: day === selectedDay ? 'var(--primary-dark)' : 'transparent',
              color: day === null ? 'transparent' : day === selectedDay ? '#fff' : 'var(--on-surface-muted)',
              fontSize: '13px',
              cursor: day ? 'pointer' : 'default',
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (day && day !== selectedDay) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-high)'; }}
            onMouseLeave={e => { if (day !== selectedDay) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {day ?? ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomDateInput({ value, onChange, style }: Props) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);

  const displayValue = (() => {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  })();

  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isMobile]);

  if (isMobile) {
    return (
      <>
        <div
          onClick={() => setOpen(true)}
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--outline-variant)',
            color: value ? 'var(--on-surface)' : 'var(--outline)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            userSelect: 'none',
            ...style,
          }}
        >
          {displayValue || 'dd/mm/aaaa'}
        </div>

        {open && (
          <>
            <div
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 400 }}
            />
            <div style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 401,
              background: 'var(--surface-card)',
              borderRadius: '20px 20px 0 0',
              padding: '12px 0 max(16px, env(safe-area-inset-bottom)) 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
            }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)', margin: '0 auto 8px' }} />
              <Calendar value={value} onChange={onChange} onClose={() => setOpen(false)} />
            </div>
          </>
        )}
      </>
    );
  }

  // Desktop: popover
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${open ? 'var(--primary-dark)' : 'var(--outline-variant)'}`,
          boxShadow: open ? '0 0 0 3px rgba(73,75,214,0.2)' : 'none',
          color: value ? 'var(--on-surface)' : 'var(--outline)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style,
        }}
      >
        {displayValue || 'dd/mm/aaaa'}
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 200,
          background: 'var(--surface-card)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
        }}>
          <Calendar value={value} onChange={onChange} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
