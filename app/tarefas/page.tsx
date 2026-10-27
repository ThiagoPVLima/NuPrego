'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TarefaItem, LembreteToggle } from '@/components/molecules';
import Button from '@/components/atoms/Button';
import { TarefaModal, type DadosTarefa } from '@/components/organisms/tarefas';
import { ESTADOS, LIMITE_AGORA, ordenarTarefas, type EstadoTarefa, type Tarefa } from '@/lib/tarefas';
import styles from './tarefas.module.css';

type Aba = EstadoTarefa | 'todas';

const ORDEM_ABERTAS: EstadoTarefa[] = ['agora', 'inbox', 'em_breve', 'algum_dia'];

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [aba, setAba] = useState<Aba>('agora');
  const [erro, setErro] = useState('');
  const [filtroContexto, setFiltroContexto] = useState('');
  const [modal, setModal] = useState<{ tarefa?: Tarefa } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/tarefas');
    if (r.ok) setTarefas(await r.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const salvar = async (dados: DadosTarefa): Promise<string | null> => {
    const tarefa = modal?.tarefa;
    const corpo = tarefa && dados.estado === tarefa.estado ? { ...dados, estado: undefined } : dados;
    const r = await fetch(tarefa ? `/api/tarefas/${tarefa.id}` : '/api/tarefas', {
      method: tarefa ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    if (!r.ok) return (await r.json()).error ?? 'Erro ao salvar';
    if (!tarefa) setAba(dados.estado);
    setModal(null);
    load();
    return null;
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

  const reordenar = async (ids: number[]) => {
    setTarefas(atual => atual.map(t => (ids.includes(t.id) ? { ...t, ordem: ids.indexOf(t.id) + 1 } : t)));
    const r = await fetch('/api/tarefas/ordem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    if (!r.ok) load();
  };

  const contar = (e: EstadoTarefa) => tarefas.filter(t => t.estado === e).length;
  const porContexto = (t: Tarefa) => !filtroContexto || t.contexto === filtroContexto;
  const abertas = ORDEM_ABERTAS.flatMap(e => ordenarTarefas(tarefas.filter(t => t.estado === e)));
  const contextos = Array.from(new Set(abertas.map(t => t.contexto).filter((c): c is string => !!c))).sort();
  const base = aba === 'todas' ? abertas : ordenarTarefas(tarefas.filter(t => t.estado === aba));
  const lista = base.filter(porContexto);
  const podeReordenar = aba === 'agora' && !filtroContexto && lista.length > 1;
  const inbox = contar('inbox');

  const mexer = (i: number, delta: number) => {
    const ids = lista.map(t => t.id);
    [ids[i], ids[i + delta]] = [ids[i + delta], ids[i]];
    reordenar(ids);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tarefas</h1>
          <div className={styles.sub}>Agora: {contar('agora')}/{LIMITE_AGORA}</div>
        </div>
        <div className={styles.acoes}>
          {inbox > 0 && <Link href="/tarefas/revisao" className="btn-secondary">Revisar inbox ({inbox})</Link>}
          <Button onClick={() => setModal({})}>+ Nova tarefa</Button>
        </div>
      </div>

      <LembreteToggle />

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

      {contextos.length > 0 && (
        <div className={styles.contextos}>
          {['', ...contextos].map(c => (
            <button
              key={c || 'todos'}
              type="button"
              aria-pressed={filtroContexto === c}
              className={filtroContexto === c ? styles.ctxAtivo : styles.ctx}
              onClick={() => setFiltroContexto(c)}
            >
              {c ? `@${c}` : 'Todos'}
            </button>
          ))}
        </div>
      )}

      {erro && <div className={styles.erro} role="alert">{erro}</div>}

      <ul className={`card ${styles.lista}`}>
        {lista.length === 0 && <li className={styles.vazio}>Nada aqui.</li>}
        {lista.map((t, i) => (
          <TarefaItem
            key={t.id}
            tarefa={t}
            onSubir={podeReordenar && i > 0 ? () => mexer(i, -1) : undefined}
            onDescer={podeReordenar && i < lista.length - 1 ? () => mexer(i, 1) : undefined} onMover={estado => mover(t.id, estado)}
            onEditar={() => setModal({ tarefa: t })}
            onApagar={() => apagar(t.id)}
          />
        ))}
      </ul>

      <button type="button" className={styles.fab} aria-label="Nova tarefa" onClick={() => setModal({})}>+</button>

      {modal && (
        <TarefaModal
          tarefa={modal.tarefa}
          estadoInicial={aba === 'todas' || aba === 'feito' ? 'inbox' : aba}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}
