'use client';
import { useState, useRef, useEffect } from 'react';

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
  style?: React.CSSProperties;
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

export default function CustomSelect({ value, onChange, options, placeholder, label, style }: Props) {
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

  const optionList = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => select(opt.value)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '13px 16px',
            background: opt.value === value ? 'rgba(73,75,214,0.12)' : 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--outline-variant)',
            color: opt.value === value ? 'var(--primary)' : 'var(--on-surface)',
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-high)'; }}
          onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          {opt.label}
          {opt.value === value && <span style={{ fontSize: '12px', color: 'var(--primary)' }}>✓</span>}
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div
          onClick={() => setOpen(true)}
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--outline-variant)',
            color: 'var(--on-surface)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
            ...style,
          }}
        >
          <span>{selectedLabel}</span>
          <span style={{ fontSize: '10px', color: 'var(--outline)' }}>▼</span>
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
              maxHeight: '60dvh',
              overflowY: 'auto',
            }}>
              {label && (
                <div style={{ padding: '0 16px 12px', fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                  {label}
                </div>
              )}
              {/* drag handle */}
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--outline-variant)', margin: '0 auto 12px' }} />
              {optionList}
            </div>
          </>
        )}
      </>
    );
  }

  // Desktop: dropdown
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${open ? 'var(--primary-dark)' : 'var(--outline-variant)'}`,
          boxShadow: open ? '0 0 0 3px rgba(73,75,214,0.2)' : 'none',
          color: 'var(--on-surface)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style,
        }}
      >
        <span>{selectedLabel}</span>
        <span style={{ fontSize: '10px', color: 'var(--outline)', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          zIndex: 200,
          background: 'var(--surface-card)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
        }}>
          {optionList}
        </div>
      )}
    </div>
  );
}
