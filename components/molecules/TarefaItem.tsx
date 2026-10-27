import { diasAteLimite, ESTADOS, type Tarefa, type EstadoTarefa } from '@/lib/tarefas';
import styles from './TarefaItem.module.css';

interface Props {
  tarefa: Tarefa;
  onMover: (estado: EstadoTarefa) => void;
  onEditar: () => void;
  onApagar: () => void;
  onSubir?: () => void;
  onDescer?: () => void;
}

function textoPrazo(dias: number) {
  if (dias < 0) return `atrasada ${-dias}d`;
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return `em ${dias}d`;
}

export default function TarefaItem({ tarefa, onMover, onEditar, onApagar, onSubir, onDescer }: Props) {
  const dias = diasAteLimite(tarefa.data_limite);
  const feita = tarefa.estado === 'feito';

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.check}
        aria-label={feita ? 'Reabrir tarefa' : 'Concluir tarefa'}
        onClick={() => onMover(feita ? 'inbox' : 'feito')}
      >
        {feita ? '✓' : ''}
      </button>

      <div className={styles.corpo} onClick={onEditar} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onEditar(); }}>
        <span className={feita ? styles.tituloFeito : styles.titulo}>{tarefa.titulo}</span>
        {(tarefa.contexto || dias !== null) && (
          <span className={styles.meta}>
            {tarefa.contexto && <span className={styles.tag}>@{tarefa.contexto}</span>}
            {dias !== null && (
              <span className={dias <= 1 ? styles.prazoUrgente : styles.prazo}>{textoPrazo(dias)}</span>
            )}
          </span>
        )}
      </div>

      {(onSubir || onDescer) && (
        <div className={styles.ordem}>
          <button type="button" aria-label="Subir" disabled={!onSubir} onClick={onSubir}>▲</button>
          <button type="button" aria-label="Descer" disabled={!onDescer} onClick={onDescer}>▼</button>
        </div>
      )}
      <select
        className={styles.mover}
        value={tarefa.estado}
        aria-label="Mover para"
        onChange={e => onMover(e.target.value as EstadoTarefa)}
      >
        {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
      </select>
      <button type="button" className={styles.apagar} aria-label="Apagar tarefa" onClick={onApagar}>✕</button>
    </li>
  );
}
