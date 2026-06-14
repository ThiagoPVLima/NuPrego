'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import styles from './login.module.css';

type Phase = 'splash' | 'fade' | 'login';

/* ── Mockup cards ── */
function MockupDashboard() {
  return (
    <div className={styles.mockup}>
      <div className={styles.mockupHeader}>
        <span className={styles.mockupMonth}>Junho 2026</span>
        <span className={styles.mockupBadge}>●</span>
      </div>
      <div className={styles.mockupTotal}>R$ 3.240,00</div>
      <div className={styles.mockupLabel}>gasto no mês</div>
      <div className={styles.mockupBars}>
        {[
          { label: 'Alimentação', w: '72%', color: '#a78bfa' },
          { label: 'Lazer',        w: '48%', color: '#f9a8d4' },
          { label: 'Transporte',   w: '32%', color: '#6ee7b7' },
        ].map(b => (
          <div key={b.label} className={styles.mockupBarRow}>
            <span className={styles.mockupBarLabel}>{b.label}</span>
            <div className={styles.mockupBarTrack}>
              <div className={styles.mockupBarFill} style={{ width: b.w, background: b.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupTransacoes() {
  const items = [
    { desc: 'Supermercado Extra', val: '-R$ 234,00', color: '#a78bfa' },
    { desc: 'Netflix',            val: '-R$ 55,90',  color: '#f9a8d4' },
    { desc: 'Uber',               val: '-R$ 28,50',  color: '#6ee7b7' },
    { desc: 'iFood',              val: '-R$ 67,80',  color: '#fbbf24' },
  ];
  return (
    <div className={styles.mockup}>
      <div className={styles.mockupHeader}>
        <span className={styles.mockupMonth}>Transações</span>
      </div>
      <div className={styles.mockupList}>
        {items.map(it => (
          <div key={it.desc} className={styles.mockupListItem}>
            <div className={styles.mockupDot} style={{ background: it.color }} />
            <span className={styles.mockupItemDesc}>{it.desc}</span>
            <span className={styles.mockupItemVal}>{it.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupParcelas() {
  const items = [
    { desc: 'MacBook Pro',   prog: 3,  total: 12 },
    { desc: 'iPhone 15',     prog: 8,  total: 24 },
    { desc: 'Sony WH-1000',  prog: 12, total: 12 },
  ];
  return (
    <div className={styles.mockup}>
      <div className={styles.mockupHeader}>
        <span className={styles.mockupMonth}>Parcelas</span>
      </div>
      <div className={styles.mockupList}>
        {items.map(it => (
          <div key={it.desc} className={styles.mockupParcelaItem}>
            <div className={styles.mockupParcelaTop}>
              <span className={styles.mockupItemDesc}>{it.desc}</span>
              <span className={styles.mockupItemVal}>{it.prog}/{it.total}</span>
            </div>
            <div className={styles.mockupBarTrack}>
              <div
                className={styles.mockupBarFill}
                style={{ width: `${(it.prog / it.total) * 100}%`, background: '#a78bfa' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupCartoes() {
  return (
    <div className={styles.mockup}>
      <div className={styles.mockupHeader}>
        <span className={styles.mockupMonth}>Cartões</span>
      </div>
      <div className={styles.mockupCards}>
        {[
          { name: 'Nubank',  used: 1240, limit: 5000, color: '#a78bfa' },
          { name: 'Inter',   used: 890,  limit: 3000, color: '#fb923c' },
          { name: 'C6 Bank', used: 430,  limit: 2000, color: '#6ee7b7' },
        ].map(c => (
          <div key={c.name} className={styles.mockupCardItem}>
            <div className={styles.mockupCardDot} style={{ background: c.color }} />
            <div className={styles.mockupCardInfo}>
              <span className={styles.mockupItemDesc}>{c.name}</span>
              <div className={styles.mockupBarTrack}>
                <div
                  className={styles.mockupBarFill}
                  style={{ width: `${(c.used / c.limit) * 100}%`, background: c.color }}
                />
              </div>
            </div>
            <span className={styles.mockupItemVal}>R$ {c.used.toLocaleString('pt-BR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDES = [
  { title: 'Controle total dos seus gastos', sub: 'Tudo que você gasta em um só lugar', Mockup: MockupDashboard },
  { title: 'Registre cada transação',        sub: 'Histórico completo e pesquisável',   Mockup: MockupTransacoes },
  { title: 'Acompanhe suas parcelas',        sub: 'Nunca mais perca uma conta',         Mockup: MockupParcelas },
  { title: 'Gerencie seus cartões',          sub: 'Limite e uso de cada cartão',        Mockup: MockupCartoes },
];

function EyeIcon({ open }: { open: boolean }) {
  if (open) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('splash');
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1400);
    const t2 = setTimeout(() => setPhase('login'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase !== 'login') return;
    const timer = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 3500);
    return () => clearInterval(timer);
  }, [phase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className={styles.root}>
      {/* ── Splash ── */}
      <div className={`${styles.splash}${phase !== 'splash' ? ` ${styles.splashOut}` : ''}`}>
        <div className={styles.splashInner}>
          <Image src="/NuPrego-Logo.png" alt="NuPrego" width={104} height={104} className={styles.splashLogo} />
          <div className={styles.splashName}>NuPrego</div>
          <div className={styles.splashTag}>Controle de Gastos</div>
        </div>
      </div>

      {/* ── Login ── */}
      <div className={`${styles.page}${phase === 'login' ? ` ${styles.pageVisible}` : ''}`}>

        {/* Hero / carousel */}
        <div className={styles.hero}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />

          <div className={styles.heroTop}>
            <div className={styles.heroLogoRow}>
              <Image src="/NuPrego-Logo.png" alt="NuPrego" width={32} height={32} className={styles.heroLogo} />
              <span className={styles.heroAppName}>NuPrego</span>
            </div>
            <div className={styles.heroLines}>
              {[0,1].map(i => <div key={i} className={styles.heroLine} />)}
            </div>
          </div>

          <div className={styles.slideArea}>
            {SLIDES.map((s, i) => {
              const { Mockup } = s;
              return (
                <div key={i} className={`${styles.slide}${i === slide ? ` ${styles.slideActive}` : ''}`}>
                  <Mockup />
                </div>
              );
            })}
          </div>

          <div className={styles.heroText}>
            {SLIDES.map((s, i) => (
              <div key={i} className={`${styles.heroTextItem}${i === slide ? ` ${styles.heroTextActive}` : ''}`}>
                <div className={styles.heroTitle}>{s.title}</div>
                <div className={styles.heroSub}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className={styles.dots}>
            {SLIDES.map((_, i) => (
              <button key={i} className={`${styles.dot}${i === slide ? ` ${styles.dotActive}` : ''}`} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>

        {/* Form section */}
        <div className={styles.formSection}>
          <div className={styles.formLogoRow}>
            <Image src="/NuPrego-Logo.png" alt="NuPrego" width={36} height={36} className={styles.formLogo} />
            <span className={styles.formAppName}>NuPrego</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>E-mail</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Senha</label>
                <a href="/forgot-password" className={styles.forgotLink}>Esqueci minha senha</a>
              </div>
              <div className={styles.pwdWrap}>
                <input
                  className={`${styles.input} ${styles.inputPwd}`}
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(v => !v)} tabIndex={-1} aria-label={showPwd ? 'Ocultar' : 'Mostrar'}>
                  <EyeIcon open={showPwd} />
                </button>
              </div>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className={styles.divider}><span>ou</span></div>

          <button onClick={() => router.push('/demo')} className={styles.btnDemo}>
            ✦ Criar conta
          </button>
          <p className={styles.demoNote}>Você entrará em uma conta de demonstração</p>
        </div>
      </div>
    </div>
  );
}
