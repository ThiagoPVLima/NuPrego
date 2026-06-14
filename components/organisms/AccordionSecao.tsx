'use client';

interface StatItem {
  label: string;
  value: string;
  color: string;
}

interface Props {
  secaoKey: string;
  titulo: string;
  cor: string;
  count: number;
  countLabel: string;
  stats: StatItem[];
  aberta: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function AccordionSecao({
  titulo, cor, count, countLabel, stats, aberta, onToggle, children,
}: Props) {
  return (
    <div>
      <div
        style={{
          padding: '20px 24px',
          cursor: 'pointer',
          borderRadius: aberta ? '20px 20px 0 0' : '20px',
          background: `linear-gradient(135deg, ${cor}28 0%, ${cor}10 100%)`,
          border: `1.5px solid ${cor}40`,
          boxShadow: `0 8px 32px ${cor}20, 0 2px 8px rgba(0,0,0,0.08)`,
          transition: 'box-shadow 0.2s, border-radius 0.3s',
        }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cor, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)' }}>{titulo}</span>
            <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
              {count} {countLabel}
            </span>
          </div>
          <span style={{
            color: 'var(--outline)',
            fontSize: '18px',
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: aberta ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>›</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateRows: aberta ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            background: `${cor}08`,
            border: `1.5px solid ${cor}28`,
            borderTop: 'none',
            borderRadius: '0 0 20px 20px',
            padding: '12px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
