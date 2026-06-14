import { useState } from 'react';
import { MESES } from '@/lib/format';
import ModalBase from '@/components/organisms/ModalBase';
import Button from '@/components/atoms/Button';
import styles from './Dashboard.module.css';

interface Props {
  mes: number;
  ano: number;
  renda: number;
  onClose: () => void;
  onSaved: () => void;
  onDemoSave?: (renda: number) => void;
}

export default function RendaModal({ mes, ano, renda: initialRenda, onClose, onSaved, onDemoSave }: Props) {
  const [renda, setRenda] = useState(String(initialRenda || ''));
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    if (onDemoSave) {
      onDemoSave(parseFloat(renda) || 0);
      setSalvando(false);
      onSaved();
      return;
    }
    await fetch('/api/meses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano, mes, renda: parseFloat(renda) || 0 }),
    });
    setSalvando(false);
    onSaved();
  };

  return (
    <ModalBase title={`Renda de ${MESES[mes - 1]}`} onClose={onClose} maxWidth={320}>
      <input
        type="number"
        step="0.01"
        value={renda}
        onChange={e => setRenda(e.target.value)}
        placeholder="0,00"
        style={{ marginBottom: '16px' }}
        autoFocus
      />
      <div className={styles.rendaModalActions}>
        <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button variant="primary" fullWidth loading={salvando} onClick={salvar}>Salvar</Button>
      </div>
    </ModalBase>
  );
}
