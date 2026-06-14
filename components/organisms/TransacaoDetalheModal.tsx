'use client';
import { useState } from 'react';
import { fmt, fmtData, tipoCor, tipoLabel } from '@/lib/format';
import ModalBase from './ModalBase';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Chip from '@/components/atoms/Chip';
import Label from '@/components/atoms/Label';
import CustomSelect from '@/components/molecules/CustomSelect';
import CustomDateInput from '@/components/molecules/CustomDateInput';
import CatMultiSelect from '@/components/molecules/CatMultiSelect';
import styles from './TransacaoDetalheModal.module.css';

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

interface DemoHandlers {
  onUpdate: (id: number, data: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}

interface Props {
  transacao: any;
  cartoes: any[];
  categorias: any[];
  onClose: () => void;
  onSaved: () => void;
  demoHandlers?: DemoHandlers;
}

export default function TransacaoDetalheModal({ transacao: tx, cartoes, categorias, onClose, onSaved, demoHandlers }: Props) {
  const isProjetada = !tx.id;
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [form, setForm] = useState({
    descricao: tx.descricao || '',
    valor: String(tx.valor || ''),
    data: tx.data || new Date().toISOString().split('T')[0],
    tipo: tx.tipo || 'avulsa',
    meio: tx.meio_pagamento || (tx.cartao_id ? 'cartao' : 'cartao'),
    cartao_id: String(tx.cartao_id || ''),
    categoria_ids: Array.isArray(tx.categoria_ids) && tx.categoria_ids.length
      ? tx.categoria_ids : (tx.categoria_id ? [tx.categoria_id] : []) as number[],
    total_parcelas: String(tx.total_parcelas || 1),
    observacao: tx.observacao || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [escopoDelete, setEscopoDelete] = useState<'este' | 'desde' | 'todos'>('este');

  const catInfo = (() => {
    const ids: number[] = Array.isArray(tx.categoria_ids) && tx.categoria_ids.length
      ? tx.categoria_ids : (tx.categoria_id ? [tx.categoria_id] : []);
    return ids.map((id: number) => categorias.find((c: any) => c.id === id)).filter(Boolean);
  })();
  const cartaoInfo = tx.cartoes || cartoes.find((c: any) => c.id === tx.cartao_id);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const salvar = async () => {
    setSalvando(true); setErro(null);
    const payload = {
      descricao: form.descricao.trim(), valor: parseFloat(form.valor.replace(',', '.')),
      data: form.data, tipo: form.tipo,
      cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
      categoria_ids: form.categoria_ids,
      total_parcelas: parseInt(form.total_parcelas) || 1,
      meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
      observacao: form.observacao.trim() || null,
    };
    if (demoHandlers && !isProjetada) {
      demoHandlers.onUpdate(tx.id, payload as Record<string, unknown>);
      setSalvando(false); onSaved(); return;
    }
    try {
      const url = isProjetada ? '/api/transacoes'
        : form.tipo === 'fixa' ? `/api/transacoes/${tx.id}?fixas_todos=1`
        : tx.grupo_parcela ? `/api/transacoes/${tx.id}?grupo=${tx.grupo_parcela}`
        : `/api/transacoes/${tx.id}`;
      const r = await fetch(url, {
        method: isProjetada ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await r.json();
      if (!r.ok) { setErro(json.error || 'Erro ao salvar'); return; }
      onSaved();
    } catch { setErro('Erro de conexão'); }
    finally { setSalvando(false); }
  };

  const desativarFixa = async () => {
    await fetch('/api/fixas-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: tx.descricao, ativa: false }),
    });
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      if (isProjetada) { await desativarFixa(); onSaved(); return; }
      const url = tx.tipo === 'fixa'
        ? escopoDelete === 'todos' ? `/api/transacoes/${tx.id}?fixas_todos=1`
          : escopoDelete === 'desde' ? `/api/transacoes/${tx.id}?fixas_desde=${tx.data}`
          : `/api/transacoes/${tx.id}`
        : tx.tipo === 'parcelada' && tx.grupo_parcela
          ? `/api/transacoes/${tx.id}?grupo=${tx.grupo_parcela}`
          : `/api/transacoes/${tx.id}`;
      await fetch(url, { method: 'DELETE' });
      onSaved();
    } finally { setExcluindo(false); }
  };

  return (
    <ModalBase onClose={onClose} maxWidth={460}>
      {/* Badge de tipo */}
      <div style={{ marginBottom: '20px' }}>
        <Badge color={tipoCor[tx.tipo] || '#888'}>{tipoLabel[tx.tipo] || tx.tipo}</Badge>
      </div>

      {/* VIEW */}
      {mode === 'view' && (
        <>
          <div className={styles.viewSection}>
            <div className={styles.txTitle}>{tx.descricao}</div>
            <div className={styles.txValor}>{fmt(Number(tx.valor))}</div>
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <Label>Data</Label>
              <span className={styles.detailVal}>{fmtData(tx.data)}</span>
            </div>
            {tx.tipo === 'parcelada' && tx.parcela_atual && (
              <div className={styles.detailRow}>
                <Label>Parcela</Label>
                <span className={styles.detailVal}>{tx.parcela_atual}/{tx.total_parcelas}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <Label>Pagamento</Label>
              <span className={styles.detailValText}>
                {tx.meio_pagamento === 'pix' ? 'Pix'
                  : tx.meio_pagamento === 'dinheiro' ? 'Dinheiro'
                  : cartaoInfo?.nome || '—'}
              </span>
            </div>
            {catInfo.length > 0 && (
              <div className={styles.detailRow}>
                <Label>Categorias</Label>
                <div className={styles.chips}>
                  {catInfo.map((c: any) => (
                    <Chip key={c.id} label={c.nome} icon={c.icone} color={c.cor || '#8083ff'} />
                  ))}
                </div>
              </div>
            )}
            {tx.pago !== undefined && (
              <div className={styles.detailRow} style={{ borderBottom: tx.observacao ? undefined : 'none' }}>
                <Label>Status</Label>
                <span style={{ fontSize: '13px', color: tx.pago ? '#6edab4' : 'var(--outline)' }}>
                  {tx.pago ? '✓ Pago' : '○ Em aberto'}
                </span>
              </div>
            )}
            {tx.observacao && (
              <div className={styles.obs}>
                <Label>Observação</Label>
                <p className={styles.obsText}>{tx.observacao}</p>
              </div>
            )}
          </div>
          <div className={styles.viewActions}>
            <Button variant="danger" onClick={() => setMode('delete')}>✕ Excluir</Button>
            <Button variant="secondary" fullWidth onClick={() => setMode('edit')}>✎ Editar</Button>
          </div>
        </>
      )}

      {/* EDIT */}
      {mode === 'edit' && (
        <>
          <h2 className={styles.editTitle}>Editar transação</h2>
          <div className={styles.form}>
            <div>
              <Label htmlFor="det-desc">Descrição</Label>
              <input id="det-desc" value={form.descricao} onChange={e => set('descricao', e.target.value)} />
            </div>
            <div className={styles.gridHalf}>
              <div>
                <Label htmlFor="det-valor">Valor (R$)</Label>
                <input id="det-valor" type="number" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} />
              </div>
              <div>
                <Label>Data</Label>
                <CustomDateInput value={form.data} onChange={v => set('data', v)} />
              </div>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <CustomSelect
                value={form.meio}
                onChange={v => set('meio', v as string)}
                options={[{ value: 'cartao', label: 'Cartão de crédito' }, { value: 'pix', label: 'Pix' }, { value: 'dinheiro', label: 'Dinheiro' }]}
              />
            </div>
            {form.meio === 'cartao' && (
              <div>
                <Label>Cartão</Label>
                <CustomSelect
                  value={form.cartao_id}
                  onChange={v => set('cartao_id', v)}
                  options={[{ value: '', label: 'Sem cartão específico' }, ...cartoes.map((c: any) => ({ value: String(c.id), label: c.nome }))]}
                />
              </div>
            )}
            <div>
              <Label>Categorias</Label>
              <CatMultiSelect value={form.categoria_ids} onChange={ids => set('categoria_ids', ids)} categorias={categorias} />
            </div>
            <div>
              <Label htmlFor="det-obs">Observação (opcional)</Label>
              <textarea id="det-obs" value={form.observacao} onChange={e => set('observacao', e.target.value)} rows={2} style={{ resize: 'vertical', minHeight: '60px' }} />
            </div>
            {erro && <div className={styles.errorBox}>{erro}</div>}
            {tx.tipo === 'fixa' && (
              <div className={styles.fixaNotice}>A edição será aplicada em todas as ocorrências desta fixa.</div>
            )}
            <div className={styles.editActions}>
              <Button variant="secondary" fullWidth onClick={() => setMode('view')}>Voltar</Button>
              <Button variant="primary" fullWidth loading={salvando} onClick={salvar}>Salvar</Button>
            </div>
          </div>
        </>
      )}

      {/* DELETE */}
      {mode === 'delete' && (
        <>
          <h2 className={styles.deleteTitle}>{isProjetada ? 'Desativar fixa' : 'Excluir transação'}</h2>
          <p className={styles.deleteDesc}>
            <strong style={{ color: 'var(--on-surface)' }}>{tx.descricao}</strong> — {fmt(Number(tx.valor))}
          </p>
          {isProjetada && (
            <p className={styles.deleteNotice}>
              Esta fixa não tem registro neste mês. Ao desativar, ela para de aparecer nos próximos meses.
            </p>
          )}
          {!isProjetada && tx.tipo === 'fixa' && (
            <div className={styles.scopeList}>
              {([
                { key: 'este', label: 'Apenas este mês' },
                { key: 'desde', label: 'Este mês em diante' },
                { key: 'todos', label: 'Todos os meses' },
              ] as const).map(opt => (
                <label key={opt.key} className={cx(styles.scopeOption, escopoDelete === opt.key && styles.scopeSelected)}>
                  <input type="radio" name="escopo" value={opt.key} checked={escopoDelete === opt.key} onChange={() => setEscopoDelete(opt.key)} style={{ width: 'auto' }} />
                  <span className={styles.scopeLabel}>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
          {!isProjetada && tx.tipo === 'parcelada' && tx.grupo_parcela && (
            <p className={styles.groupNotice}>Todas as parcelas do grupo serão excluídas.</p>
          )}
          <div className={styles.deleteActions}>
            <Button variant="secondary" fullWidth onClick={() => setMode('view')}>Cancelar</Button>
            <Button variant="danger" fullWidth loading={excluindo} onClick={excluir}>
              {isProjetada ? 'Desativar' : 'Confirmar exclusão'}
            </Button>
          </div>
        </>
      )}
    </ModalBase>
  );
}
