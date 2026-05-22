'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/transacoes', label: 'Transações', icon: '↕' },
  { href: '/cartoes', label: 'Cartões', icon: '▣' },
  { href: '/parcelados', label: 'Parcelados', icon: '⊞' },
  { href: '/historico', label: 'Histórico', icon: '◎' },
  { href: '/configuracoes', label: 'Configurações', icon: '⚙' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#0a0f12',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: '24px 12px',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 8px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #494bd6, #8083ff)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 800, color: 'white',
            fontFamily: 'Manrope, sans-serif',
          }}>N</div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', letterSpacing: '-0.02em' }}>NuPrego</div>
            <div style={{ fontSize: '11px', color: '#464554', marginTop: '1px' }}>Controle de Gastos</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} className={`nav-link ${active ? 'active' : ''}`}>
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '11px', color: '#464554', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
      </div>
    </aside>
  );
}
