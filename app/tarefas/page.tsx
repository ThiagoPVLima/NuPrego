'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TarefaItem } from '@/components/molecules';
import { TarefaCaptura } from '@/components/organisms/tarefas';
import { ESTADOS, LIMITE_AGORA, type EstadoTarefa, type Tarefa } from '@/lib/tarefas';
import styles from './tarefas.module.css';

type Aba = EstadoTarefa | 'todas';

const ORDEM_ABERTAS: EstadoTarefa[] = ['agora', 'inbox', 'em_breve', 'algum_dia'];

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [aba, setAba] = useState<Aba>('agora');
  const [erro, setErro] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/tarefas');
    if (r.ok) setTarefas(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const adicionar = async (titulo: string) => {
    await fetch('/api/tarefas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo }) });
    setAba('inbox');
    load();
  };

  const mover = async (id: number, estado: EstadoTarefa) => {
    setErro('');
    const r = await fetch(`/api/tarefas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) });
    if (!r.ok) setErro((await r.json()).error ?? 'Erro ao mover');
    load();
  };

  const apagar = async (id: number) => {
    await fetch(`/api/tarefas/${id}`, { method: 'DELETE' });
    load();
  };

  const contar = (e: EstadoTarefa) => tarefas.filter(t => t.estado === e).length;
  const abertas = ORDEM_ABERTAS.flatMap(e => tarefas.filter(t => t.estado === e));
  const lista = aba === 'todas' ? abertas : tarefas.filter(t => t.estado === aba);
  const inbox = contar('inbox');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tarefas</h1>
          <div className={styles.sub}>Agora: {contar('agora')}/{LIMITE_AGORA}</div>
        </div>
        {inbox > 0 && <Link href="/tarefas/revisao" className="btn-secondary">Revisar inbox ({inbox})</Link>}
      </div>

      <TarefaCaptura onAdicionar={adicionar} />

      <div className={styles.abas} role="tablist">
        {[{ id: 'todas' as const, label: 'Todas', total: abertas.length }, ...ESTADOS.map(e => ({ ...e, total: contar(e.id) }))].map(e => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={aba === e.id}
            className={aba === e.id ? styles.abaAtiva : styles.aba}
            onClick={() => setAba(e.id)}
          >
            {e.label} <span className={styles.contagem}>{e.total}</span>
          </button>
        ))}
      </div>

      {erro && <div className={styles.erro} role="alert">{erro}</div>}

      <ul className={`card ${styles.lista}`}>
        {lista.length === 0 && <li className={styles.vazio}>Nada aqui.</li>}
        {lista.map(t => (
          <TarefaItem key={t.id} tarefa={t} onMover={estado => mover(t.id, estado)} onApagar={() => apagar(t.id)} />
        ))}
      </ul>
    </div>
  );
}
