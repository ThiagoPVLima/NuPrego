'use client';

interface Props {
  mensagem: string;
  detalhe?: string;
  textoConfirmar?: string;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function ConfirmarModal({ mensagem, detalhe, textoConfirmar = 'Confirmar', confirmando, onConfirmar, onCancelar }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '17px', color: '#dfe3e7', margin: '0 0 8px' }}>
            {mensagem}
          </h2>
          {detalhe && (
            <p style={{ fontSize: '13px', color: 'var(--outline)', margin: 0, lineHeight: 1.5 }}>{detalhe}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onCancelar} style={{ flex: 1, justifyContent: 'center' }}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirmar}
            disabled={confirmando}
            style={{ flex: 1, justifyContent: 'center', opacity: confirmando ? 0.6 : 1 }}
          >
            {confirmando ? 'Aguarde...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
