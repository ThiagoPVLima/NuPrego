'use client';
import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button';
import styles from './LembreteToggle.module.css';

type Estado = 'carregando' | 'sem-suporte' | 'bloqueado' | 'desligado' | 'ligado';

function chaveParaBytes(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bruto, c => c.charCodeAt(0));
}

export default function LembreteToggle() {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        setEstado('sem-suporte');
        return;
      }
      if (Notification.permission === 'denied') { setEstado('bloqueado'); return; }
      const reg = await navigator.serviceWorker.ready;
      setEstado((await reg.pushManager.getSubscription()) ? 'ligado' : 'desligado');
    })();
  }, []);

  async function ligar() {
    setOcupado(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') { setEstado('bloqueado'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const r = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!r.ok) { await sub.unsubscribe(); return; }
      setEstado('ligado');
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado('desligado');
    } finally {
      setOcupado(false);
    }
  }

  if (estado === 'carregando') return null;
  if (estado === 'sem-suporte') {
    return <p className={styles.aviso}>Lembretes indisponíveis aqui. No iPhone, instale o app na tela inicial primeiro.</p>;
  }
  if (estado === 'bloqueado') {
    return <p className={styles.aviso}>Notificações bloqueadas no navegador. Libere nas configurações do site para ativar os lembretes.</p>;
  }

  return (
    <div className={styles.linha}>
      <span className={styles.texto}>
        {estado === 'ligado' ? 'Lembretes ligados: prazos e revisão de domingo.' : 'Quer um aviso quando um prazo chegar?'}
      </span>
      <Button variant="secondary" size="sm" loading={ocupado} onClick={estado === 'ligado' ? desligar : ligar}>
        {estado === 'ligado' ? 'Desligar' : 'Ligar lembretes'}
      </Button>
    </div>
  );
}
