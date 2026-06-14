'use client';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import styles from './forgot.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError('Erro ao enviar e-mail. Verifique o endereço e tente novamente.');
      return;
    }
    setSent(true);
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <a href="/login" className={styles.back}>← Voltar ao login</a>

        <div className={styles.icon}>🔑</div>
        <h1 className={styles.heading}>Esqueci minha senha</h1>
        <p className={styles.sub}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        {sent ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <div>
              <strong>E-mail enviado!</strong>
              <p>Verifique sua caixa de entrada e clique no link para redefinir sua senha. O link expira em 1 hora.</p>
            </div>
          </div>
        ) : (
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
                autoFocus
              />
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}
            <button type="submit" disabled={loading} className={styles.btn}>
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
