import styles from './TransacaoRow.module.css';
import { fmt } from '@/lib/format';
import type { Aba } from './TransacoesTabs';

interface CatItem { id: number; nome: string; cor?: string; icone?: string; }
interface MeioInfo { label: string; cor: string; }

interface Transacao {
  id?: string | number;
  descricao: string;
  valor: number | string;
  data?: string;
  tipo: string;
  pago?: boolean;
  projetado?: boolean;
  cartao_id?: number | null;
  meio_pagamento?: string;
  parcela_atual?: number;
  total_parcelas?: number;
  grupo_parcela?: string;
  categoria_ids?: number[];
  categoria_id?: number;
  cartoes?: { nome: string; cor?: string };
}

interface Props {
  transacao: Transacao;
  aba: Aba;
  nextMesLabel: string;
  categorias: CatItem[];
  getMeio: (t: Transacao) => MeioInfo | null;
  onClick: () => void;
  onTogglePago: (e: React.MouseEvent) => void;
  onExcluir: (e: React.MouseEvent) => void;
  onMarcarProjetadaPaga: (e: React.MouseEvent) => void;
}

const cols: Record<Aba, string> = {
  avulsa: '1fr 130px 150px 90px',
  fixa: '1fr 130px 150px 90px',
  parcelada: '1fr 130px 150px 80px 90px',
  pix: '1fr 130px 150px 80px 90px',
};

export default function TransacaoRow({
  transacao: t, aba, nextMesLabel, categorias, getMeio, onClick, onTogglePago, onExcluir, onMarcarProjetadaPaga,
}: Props) {
  const mp = getMeio(t);
  const projetado = !!t.projetado;
  const catIds: number[] = Array.isArray(t.categoria_ids) && t.categoria_ids.length
    ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []);
  const cats = catIds.map(id => categorias.find(c => c.id === id)).filter(Boolean) as CatItem[];
  const showParcela = aba === 'parcelada' || aba === 'pix';

  return (
    <div
      className={styles.row}
      style={{ gridTemplateColumns: cols[aba] }}
      onClick={onClick}
    >
      {/* Descrição */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className={styles.descricao}>{t.descricao}</span>
          {projetado && <span className={styles.badge}>recorrente</span>}
        </div>
        {cats.length > 0 && (
          <div className={styles.cats}>
            {cats.map(c => (
              <span
                key={c.id}
                className={styles.cat}
                style={{ color: c.cor || '#8083ff', background: `${c.cor || '#8083ff'}18` }}
              >
                {c.icone ? `${c.icone} ` : ''}{c.nome}
              </span>
            ))}
          </div>
        )}
        <div className={`${styles.metaMobile} hideOnDesktop`}>
          {mp && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span className={styles.meioDot} style={{ background: mp.cor }} />{mp.label}
            </span>
          )}
          {showParcela && t.parcela_atual && t.total_parcelas && (
            <span>{t.parcela_atual}/{t.total_parcelas}</span>
          )}
        </div>
      </div>

      {/* Valor */}
      <div className={styles.valor}>{fmt(Number(t.valor))}</div>

      {/* Pagamento */}
      <div className={`${styles.hideOnMobile}`}>
        {mp ? (
          <span className={styles.meioCell}>
            <span className={styles.meioDot} style={{ background: mp.cor }} />
            {mp.label}
          </span>
        ) : <span style={{ color: 'var(--outline-variant)' }}>—</span>}
      </div>

      {/* Parcela */}
      {showParcela && (
        <div className={`${styles.hideOnMobile}`}>
          {t.parcela_atual && t.total_parcelas ? (
            <span className={styles.parcela}>
              {t.parcela_atual}<span className={styles.parcelaDivisor}>/{t.total_parcelas}</span>
            </span>
          ) : <span style={{ color: 'var(--outline-variant)', fontSize: '12px' }}>—</span>}
        </div>
      )}

      {/* Data + ações */}
      <div className={styles.actions}>
        <span className={styles.data}>
          {projetado ? '—' : new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>
        {projetado ? (
          !t.cartao_id && (
            <button type="button" title="Marcar como paga" className={styles.btnPago}
              style={{ color: '#6edab4' }} onClick={onMarcarProjetadaPaga}>✓</button>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {(t.tipo === 'parcelada' && (t.meio_pagamento === 'pix' || t.meio_pagamento === 'dinheiro')) && (
              <button type="button" title={t.pago ? 'Marcar como não pago' : 'Marcar como pago'}
                className={styles.btnPago}
                style={{ color: t.pago ? '#6edab4' : 'var(--outline-variant)' }}
                onClick={onTogglePago}>
                {t.pago ? '✓' : '○'}
              </button>
            )}
            <button type="button" className={styles.btnExcluir} onClick={onExcluir}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
