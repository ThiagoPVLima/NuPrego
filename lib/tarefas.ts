export type EstadoTarefa = 'inbox' | 'agora' | 'em_breve' | 'algum_dia' | 'feito';

export type Tarefa = {
  id: number;
  titulo: string;
  estado: EstadoTarefa;
  contexto: string | null;
  data_limite: string | null;
  ordem: number;
  criado_em: string;
  concluido_em: string | null;
};

export const LIMITE_AGORA = 5;

export const ESTADOS: { id: EstadoTarefa; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'agora', label: 'Agora' },
  { id: 'em_breve', label: 'Em breve' },
  { id: 'algum_dia', label: 'Algum dia' },
  { id: 'feito', label: 'Feito' },
];

export const CONTEXTOS = ['rua', 'casa', 'ligar', 'filho', 'trabalho'];

export function diasAteLimite(data: string | null, hoje = new Date()): number | null {
  if (!data) return null;
  const [a, m, d] = data.split('-').map(Number);
  const alvo = new Date(a, m - 1, d).getTime();
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  return Math.round((alvo - base) / 86400000);
}

export function ordenarTarefas(lista: Tarefa[]): Tarefa[] {
  return [...lista].sort((a, b) => {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    if (a.data_limite !== b.data_limite) {
      if (!a.data_limite) return 1;
      if (!b.data_limite) return -1;
      return a.data_limite.localeCompare(b.data_limite);
    }
    return b.criado_em.localeCompare(a.criado_em);
  });
}
