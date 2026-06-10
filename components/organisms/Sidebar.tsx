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

const bottomLinks = [
  { href: '/', label: 'Início', icon: '◉' },
  { href: '/transacoes', label: 'Transações', icon: '↕' },
  { href: '/parcelados', label: 'Parcelados', icon: '⊞' },
  { href: '/fixas', label: 'Fixas', icon: '↻' },
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

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const menuActive = !bottomLinks.some(l => isActive(l.href));

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.logoInner}>
            <Image src="/NuPrego-Logo.png" alt="NuPrego" width={36} height={36} style={{ borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <div className={styles.appName}>NuPrego</div>
              <div className={styles.appTagline}>Controle de Gastos</div>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(styles.navLink, isActive(l.href) && styles.active)}
            >
              <span className={styles.navIcon}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
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

      {/* ── Mobile: slide-in panel (Menu) ── */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <div className={cx(styles.mobilePanel, mobileOpen && styles.mobilePanelOpen)}>
        <div className={styles.mobilePanelHeader}>
          <div className={styles.logoInner}>
            <Image src="/NuPrego-Logo.png" alt="NuPrego" width={30} height={30} style={{ borderRadius: '8px', objectFit: 'cover' }} />
            <div className={styles.appName}>NuPrego</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={() => setMobileOpen(false)} aria-label="Fechar menu">✕</button>
        </div>

        <nav className={styles.mobilePanelNav}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cx(styles.navLink, isActive(l.href) && styles.active)}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.navIcon}>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.mobilePanelFooter}>
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
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className={styles.bottomNav} aria-label="Navegação principal">
        {bottomLinks.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={cx(styles.bottomItem, isActive(l.href) && styles.bottomItemActive)}
          >
            <span className={styles.bottomIcon}>{l.icon}</span>
            <span className={styles.bottomLabel}>{l.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={cx(styles.bottomItem, (mobileOpen || menuActive) && styles.bottomItemActive)}
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Menu"
        >
          <span className={styles.bottomIcon}>☰</span>
          <span className={styles.bottomLabel}>Menu</span>
        </button>
      </nav>
    </>
  );
}
