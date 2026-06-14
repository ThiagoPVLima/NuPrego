'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import styles from './login.module.css';

type Phase = 'splash' | 'fade' | 'login';

const SLIDES = [
  { emoji: '📊', heading: 'Visão completa', body: 'Todos os gastos do mês em um só lugar' },
  { emoji: '🔄', heading: 'Fixas e Parcelas', body: 'Nunca mais perca uma conta ou parcela' },
  { emoji: '💳', heading: 'Por Cartão', body: 'Acompanhe o uso de cada cartão separado' },
  { emoji: '🗂️', heading: 'Por Categoria', body: 'Entenda seus padrões de consumo' },
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
    const timer = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 3000);
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
      <div className={`${styles.loginWrap}${phase === 'login' ? ` ${styles.loginVisible}` : ''}`}>
        {/* Background orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />

        <div className={styles.inner}>
          {/* Carousel */}
          <div className={styles.carousel}>
            <div className={styles.carouselLogoRow}>
              <Image src="/NuPrego-Logo.png" alt="NuPrego" width={36} height={36} className={styles.carouselLogo} />
              <span className={styles.carouselAppName}>NuPrego</span>
            </div>
            <div className={styles.slideWrap}>
              {SLIDES.map((s, i) => (
                <div
                  key={i}
                  className={`${styles.slide}${i === slide ? ` ${styles.slideActive}` : ''}`}
                >
                  <div className={styles.slideEmoji}>{s.emoji}</div>
                  <div className={styles.slideHeading}>{s.heading}</div>
                  <div className={styles.slideBody}>{s.body}</div>
                </div>
              ))}
            </div>
            <div className={styles.dots}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot}${i === slide ? ` ${styles.dotActive}` : ''}`}
                  onClick={() => setSlide(i)}
                />
              ))}
            </div>
          </div>

          {/* Card */}
          <div className={styles.card}>
            <h1 className={styles.heading}>Bem-vindo de volta</h1>

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
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPwd(v => !v)}
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                  >
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
    </div>
  );
}
