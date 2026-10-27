'use client';
import { useState } from 'react';
import ModalBase from '@/components/organisms/ModalBase';
import Button from '@/components/atoms/Button';
import FormField from '@/components/molecules/FormField';
import CustomSelect from '@/components/molecules/CustomSelect';
import CustomDateInput from '@/components/molecules/CustomDateInput';
import { CONTEXTOS, type Tarefa } from '@/lib/tarefas';
import styles from './TarefaEditarModal.module.css';

interface Props {
  tarefa: Tarefa;
  onSalvar: (dados: Pick<Tarefa, 'titulo' | 'contexto' | 'data_limite'>) => Promise<void>;
  onFechar: () => void;
}

const SEM_CONTEXTO = '';

export default function TarefaEditarModal({ tarefa, onSalvar, onFechar }: Props) {
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [contexto, setContexto] = useState(tarefa.contexto ?? SEM_CONTEXTO);
  const [dataLimite, setDataLimite] = useState(tarefa.data_limite ?? '');
  const [salvando, setSalvando] = useState(false);

  const opcoes = [
    { value: SEM_CONTEXTO, label: 'Sem contexto' },
    ...CONTEXTOS.map(c => ({ value: c, label: `@${c}` })),
  ];

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar({
        titulo: titulo.trim(),
        contexto: contexto || null,
        data_limite: dataLimite || null,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalBase title="Editar tarefa" onClose={onFechar} maxWidth={420}>
      <div className={styles.corpo}>
        <FormField label="Tarefa" htmlFor="tarefa-titulo">
          <input id="tarefa-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} />
        </FormField>
        <FormField label="Contexto">
          <CustomSelect value={contexto} onChange={setContexto} options={opcoes} label="Contexto" />
        </FormField>
        <FormField label="Data limite">
          <div className={styles.data}>
            <CustomDateInput value={dataLimite} onChange={setDataLimite} />
            {dataLimite && (
              <Button variant="ghost" size="sm" onClick={() => setDataLimite('')}>Limpar</Button>
            )}
          </div>
        </FormField>
      </div>
      <div className={styles.acoes}>
        <Button variant="secondary" fullWidth onClick={onFechar}>Cancelar</Button>
        <Button fullWidth loading={salvando} disabled={!titulo.trim()} onClick={salvar}>Salvar</Button>
      </div>
    </ModalBase>
  );
}
