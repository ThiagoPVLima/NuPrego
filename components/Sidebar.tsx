'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';

const links = [
  { href: '/', label: 'Dashboard', icon: '◉' },
  { href: '/transacoes', label: 'Transações', icon: '↕' },
  { href: '/cartoes', label: 'Cartões', icon: '▣' },
  { href: '/parcelados', label: 'Parcelados', icon: '⊞' },
  { href: '/fixas', label: 'Fixas', icon: '↻' },
  { href: '/historico', label: 'Histórico', icon: '◎' },
  { href: '/configuracoes', label: 'Configurações', icon: '⚙' },
];

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const navContent = (
    <>
      <div style={{ padding: '0 8px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image
            src="/NuPrego-Logo.png"
            alt="NuPrego"
            width={36}
            height={36}
            style={{ borderRadius: '10px', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', letterSpacing: '-0.02em' }}>NuPrego</div>
            <div style={{ fontSize: '11px', color: '#464554', marginTop: '1px' }}>Controle de Gastos</div>
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${active ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 8px 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: '#464554', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#8b919a',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingBottom: '2px',
        }} title={userName}>
          {userName}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#464554',
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#464554';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          <span style={{ fontSize: '13px' }}>⎋</span>
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-header">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
            <rect width="20" height="2" rx="1" fill="currentColor" />
            <rect y="7" width="20" height="2" rx="1" fill="currentColor" />
            <rect y="14" width="20" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
        <Image
          src="/NuPrego-Logo.png"
          alt="NuPrego"
          width={28}
          height={28}
          className="mobile-header-logo"
        />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: '#dfe3e7', letterSpacing: '-0.02em' }}>
          NuPrego
        </span>
      </header>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-mobile-close">
          <button
            type="button"
            className="btn-ghost sidebar-close-icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );
}
