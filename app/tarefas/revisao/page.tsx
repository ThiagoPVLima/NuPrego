'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Button from '@/components/atoms/Button';
import { LIMITE_AGORA, type EstadoTarefa, type Tarefa } from '@/lib/tarefas';
import styles from './revisao.module.css';

export default function RevisaoInbox() {
  const [inbox, setInbox] = useState<Tarefa[]>([]);
  const [agora, setAgora] = useState(0);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/tarefas');
    if (r.ok) {
      const todas: Tarefa[] = await r.json();
      setInbox(todas.filter(t => t.estado === 'inbox'));
      setAgora(todas.filter(t => t.estado === 'agora').length);
    }
    setCarregado(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const atual = inbox[0];

  const decidir = async (estado: EstadoTarefa | 'apagar') => {
    setErro('');
    const r = estado === 'apagar'
      ? await fetch(`/api/tarefas/${atual.id}`, { method: 'DELETE' })
      : await fetch(`/api/tarefas/${atual.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) });
    if (!r.ok) { setErro((await r.json()).error ?? 'Erro'); return; }
    load();
  };

  if (!carregado) return null;

  return (
    <div className={styles.pagina}>
      <div className="page-header">
        <h1 className="page-title">Revisar inbox</h1>
        <Link href="/tarefas" className="btn-ghost">Voltar</Link>
      </div>

      {!atual ? (
        <div className={`card ${styles.cartao}`}>
          <p className={styles.titulo}>Inbox vazio.</p>
          <Link href="/tarefas" className="btn-primary">Ver tarefas</Link>
        </div>
      ) : (
        <div className={`card ${styles.cartao}`}>
          <div className={styles.restam}>{inbox.length} no inbox</div>
          <p className={styles.titulo}>{atual.titulo}</p>
          {erro && <div className={styles.erro} role="alert">{erro}</div>}
          <div className={styles.botoes}>
            <Button onClick={() => decidir('agora')} disabled={agora >= LIMITE_AGORA}>
              Agora ({agora}/{LIMITE_AGORA})
            </Button>
            <Button variant="secondary" onClick={() => decidir('em_breve')}>Em breve</Button>
            <Button variant="secondary" onClick={() => decidir('algum_dia')}>Algum dia</Button>
            <Button variant="danger" onClick={() => decidir('apagar')}>Apagar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
