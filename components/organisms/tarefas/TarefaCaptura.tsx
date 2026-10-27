'use client';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import styles from './TarefaCaptura.module.css';

export default function TarefaCaptura({ onAdicionar }: { onAdicionar: (titulo: string) => Promise<void> }) {
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    try {
      await onAdicionar(titulo.trim());
      setTitulo('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={enviar}>
      <input
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        placeholder="Anota aqui e dá enter"
        aria-label="Nova tarefa"
        autoFocus
      />
      <Button type="submit" loading={enviando} disabled={!titulo.trim()}>Anotar</Button>
    </form>
  );
}
