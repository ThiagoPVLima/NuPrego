'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import styles from './login.module.css';

type Phase = 'splash' | 'fade' | 'login';

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1400);
    const t2 = setTimeout(() => setPhase('login'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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

  async function handleDemo() {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
    const demoPwd = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
    if (!demoEmail || !demoPwd) {
      setError('Conta demo não configurada.');
      return;
    }
    setDemoLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPwd });
    if (err) {
      setError('Não foi possível acessar a conta demo.');
      setDemoLoading(false);
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
        <div className={styles.card}>
          {/* Logo row */}
          <div className={styles.logoRow}>
            <Image src="/NuPrego-Logo.png" alt="NuPrego" width={52} height={52} className={styles.cardLogo} />
            <div>
              <div className={styles.cardName}>NuPrego</div>
              <div className={styles.cardTag}>Controle de Gastos</div>
            </div>
          </div>

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
                >
                  {showPwd ? 'ocultar' : 'mostrar'}
                </button>
              </div>
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button type="submit" disabled={loading} className={styles.btnPrimary}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className={styles.divider}><span>ou</span></div>

          <button onClick={handleDemo} disabled={demoLoading} className={styles.btnDemo}>
            {demoLoading ? 'Acessando...' : '✦ Criar conta'}
          </button>
          <p className={styles.demoNote}>Você entrará em uma conta de demonstração</p>
        </div>
      </div>
    </div>
  );
}
