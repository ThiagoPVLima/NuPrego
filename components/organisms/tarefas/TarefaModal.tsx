'use client';
import { useState } from 'react';
import ModalBase from '@/components/organisms/ModalBase';
import Button from '@/components/atoms/Button';
import FormField from '@/components/molecules/FormField';
import CustomSelect from '@/components/molecules/CustomSelect';
import CustomDateInput from '@/components/molecules/CustomDateInput';
import { CONTEXTOS, ESTADOS, type EstadoTarefa, type Tarefa } from '@/lib/tarefas';
import styles from './TarefaModal.module.css';

export type DadosTarefa = {
  titulo: string;
  estado: EstadoTarefa;
  contexto: string | null;
  data_limite: string | null;
};

interface Props {
  tarefa?: Tarefa;
  estadoInicial: EstadoTarefa;
  onSalvar: (dados: DadosTarefa) => Promise<string | null>;
  onFechar: () => void;
}

const OPCOES_CONTEXTO = [
  { value: '', label: 'Sem contexto' },
  ...CONTEXTOS.map(c => ({ value: c, label: `@${c}` })),
];

export default function TarefaModal({ tarefa, estadoInicial, onSalvar, onFechar }: Props) {
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? '');
  const [estado, setEstado] = useState<string>(tarefa?.estado ?? estadoInicial);
  const [contexto, setContexto] = useState(tarefa?.contexto ?? '');
  const [dataLimite, setDataLimite] = useState(tarefa?.data_limite ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const opcoesEstado = ESTADOS
    .filter(e => tarefa || e.id !== 'feito')
    .map(e => ({ value: e.id, label: e.label }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const msg = await onSalvar({
        titulo: titulo.trim(),
        estado: estado as EstadoTarefa,
        contexto: contexto || null,
        data_limite: dataLimite || null,
      });
      if (msg) setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalBase title={tarefa ? 'Editar tarefa' : 'Nova tarefa'} onClose={onFechar} maxWidth={420}>
      <form onSubmit={salvar}>
        <div className={styles.corpo}>
          <FormField label="Tarefa" htmlFor="tarefa-titulo">
            <input id="tarefa-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus />
          </FormField>
          <FormField label="Estado">
            <CustomSelect value={estado} onChange={setEstado} options={opcoesEstado} label="Estado" />
          </FormField>
          <FormField label="Contexto">
            <CustomSelect value={contexto} onChange={setContexto} options={OPCOES_CONTEXTO} label="Contexto" />
          </FormField>
          <FormField label="Data limite">
            <div className={styles.data}>
              <CustomDateInput value={dataLimite} onChange={setDataLimite} />
              {dataLimite && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDataLimite('')}>Limpar</Button>
              )}
            </div>
          </FormField>
          {erro && <div className={styles.erro} role="alert">{erro}</div>}
        </div>
        <div className={styles.acoes}>
          <Button type="button" variant="secondary" fullWidth onClick={onFechar}>Cancelar</Button>
          <Button type="submit" fullWidth loading={salvando}>Salvar</Button>
        </div>
      </form>
    </ModalBase>
  );
}
