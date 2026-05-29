'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('E-mail ou senha inválidos.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060a0d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#0a0f12',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Image
            src="/NuPrego-Logo.png"
            alt="NuPrego"
            width={72}
            height={72}
            style={{ borderRadius: '16px' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: '24px',
              color: 'var(--on-surface)',
              letterSpacing: '-0.03em',
            }}>NuPrego</div>
            <div style={{ fontSize: '13px', color: '#464554', marginTop: '4px' }}>
              Controle de Gastos
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#8b919a', fontWeight: 500 }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                background: '#111820',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: 'var(--on-surface)',
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#8b919a', fontWeight: 500 }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: '#111820',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: 'var(--on-surface)',
                fontSize: '14px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#f87171',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              background: loading ? '#2d2f8a' : 'linear-gradient(135deg, #494bd6, #8083ff)',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Manrope, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
