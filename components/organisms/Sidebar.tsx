'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';
import styles from './Sidebar.module.css';

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

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
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <header className={styles.mobileHeader}>
        <button type="button" className={styles.hamburgerBtn} onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
            <rect width="20" height="2" rx="1" fill="currentColor" />
            <rect y="7" width="20" height="2" rx="1" fill="currentColor" />
            <rect y="14" width="20" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
        <Image src="/NuPrego-Logo.png" alt="NuPrego" width={28} height={28} style={{ borderRadius: '8px', objectFit: 'cover' }} />
        <span className={styles.mobileTitle}>NuPrego</span>
      </header>

      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside className={cx(styles.sidebar, mobileOpen && styles.mobileOpen)}>
        <div className={styles.logoSection}>
          <div className={styles.logoInner}>
            <Image src="/NuPrego-Logo.png" alt="NuPrego" width={36} height={36} style={{ borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div className={styles.appName}>NuPrego</div>
              <div className={styles.appTagline}>Controle de Gastos</div>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
            ✕
          </button>
        </div>

        <nav className={styles.nav}>
          {links.map(l => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cx(styles.navLink, active && styles.active)}
                onClick={() => setMobileOpen(false)}
              >
                <span className={styles.navIcon}>{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.footerDate}>
            {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
          </div>
          <div className={styles.footerUser} title={userName}>{userName}</div>
          <button type="button" className={styles.footerBtn} onClick={toggle}>
            <span className={styles.footerIcon}>{theme === 'dark' ? '☀' : '☽'}</span>
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
          {installPrompt && (
            <button type="button" className={styles.footerBtn} onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}>
              <span className={styles.footerIcon}>⬇</span>
              Instalar app
            </button>
          )}
          <button type="button" className={cx(styles.footerBtn, styles.footerBtnDanger)} onClick={handleLogout}>
            <span className={styles.footerIcon}>⎋</span>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
