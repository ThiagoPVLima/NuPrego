'use client';
import ModalBase from '@/components/organisms/ModalBase';
import Button from '@/components/atoms/Button';
import styles from './ConfirmarModal.module.css';

interface Props {
  mensagem: string;
  detalhe?: string;
  textoConfirmar?: string;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmarModal({
  mensagem, detalhe, textoConfirmar = 'Confirmar', confirmando, onConfirmar, onCancelar,
}: Props) {
  return (
    <ModalBase onClose={onCancelar} maxWidth={360}>
      <div className={styles.body}>
        <h2 className={styles.title}>{mensagem}</h2>
        {detalhe && <p className={styles.detalhe}>{detalhe}</p>}
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" fullWidth onClick={onCancelar}>Cancelar</Button>
        <Button variant="danger" fullWidth loading={confirmando} onClick={onConfirmar}>
          {textoConfirmar}
        </Button>
      </div>
    </ModalBase>
  );
}
