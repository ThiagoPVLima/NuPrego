'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fmt, tipoCor, tipoLabel, meioCor, meioLabel } from '@/lib/format';
import ModalBase from './ModalBase';
import Button from '@/components/atoms/Button';
import Label from '@/components/atoms/Label';
import ColorDot from '@/components/atoms/ColorDot';
import CustomSelect from '@/components/molecules/CustomSelect';
import CustomDateInput from '@/components/molecules/CustomDateInput';
import CatMultiSelect from '@/components/molecules/CatMultiSelect';
import styles from './NovaTransacaoModal.module.css';

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

interface InitialData {
  descricao?: string;
  valor?: string;
  tipo?: string;
  meio?: string;
  cartao_id?: string;
  categoria_ids?: number[];
}

export default function NovaTransacaoModal({
  onClose,
  onSaved,
  initialData,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialData?: InitialData;
}) {
  const now = new Date();
  const [form, setForm] = useState({
    descricao: initialData?.descricao ?? '',
    valor: initialData?.valor ?? '',
    data: now.toISOString().split('T')[0],
    tipo: initialData?.tipo ?? 'avulsa',
    meio: initialData?.meio ?? 'cartao',
    cartao_id: initialData?.cartao_id ?? '',
    categoria_ids: initialData?.categoria_ids ?? [] as number[],
    total_parcelas: '1',
    observacao: '',
  });
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [sugIdx, setSugIdx] = useState(-1);
  const descRef = useRef<HTMLInputElement>(null);
  const valorRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/cartoes').then(r => r.json()),
      fetch('/api/categorias').then(r => r.json()),
    ]).then(([c, cat]) => {
      setCartoes(Array.isArray(c) ? c : []);
      setCategorias(Array.isArray(cat) ? cat : []);
    });
    const t = setTimeout(() => descRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const fetchSugestoes = useCallback(async (q: string) => {
    if (q.length < 1) { setSugestoes([]); setShowSug(false); return; }
    try {
      const r = await fetch(`/api/transacoes/sugestoes?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      const list = Array.isArray(d) ? d : [];
      setSugestoes(list); setShowSug(list.length > 0);
    } catch { setSugestoes([]); }
  }, []);

  const handleDescChange = (val: string) => {
    setForm(f => ({ ...f, descricao: val }));
    setSugIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSugestoes(val), 180);
  };

  const aplicarSugestao = (s: any) => {
    const catIds = Array.isArray(s.categoria_ids) && s.categoria_ids.length
      ? s.categoria_ids : (s.categoria_id ? [s.categoria_id] : []);
    setForm(f => ({
      ...f,
      descricao: s.descricao,
      tipo: s.tipo || f.tipo,
      meio: s.meio_pagamento || (s.cartao_id ? 'cartao' : f.meio),
      cartao_id: s.cartao_id ? String(s.cartao_id) : f.cartao_id,
      categoria_ids: catIds.length ? catIds : f.categoria_ids,
    }));
    setSugestoes([]); setShowSug(false);
    setTimeout(() => valorRef.current?.focus(), 60);
  };

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSug || !sugestoes.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSugIdx(i => Math.min(i + 1, sugestoes.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSugIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && sugIdx >= 0) { e.preventDefault(); aplicarSugestao(sugestoes[sugIdx]); }
    else if (e.key === 'Escape' || e.key === 'Tab') setShowSug(false);
  };

  const salvar = async () => {
    if (!form.descricao.trim()) { setErro('Descrição obrigatória'); return; }
    const v = parseFloat(form.valor.replace(',', '.'));
    if (!form.valor || isNaN(v)) { setErro('Valor inválido'); return; }
    setSalvando(true); setErro(null);
    try {
      const r = await fetch('/api/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: form.descricao.trim(), valor: v, data: form.data, tipo: form.tipo,
          cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
          categoria_ids: form.categoria_ids,
          total_parcelas: parseInt(form.total_parcelas) || 1,
          meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
          observacao: form.observacao.trim() || null,
        }),
      });
      const json = await r.json();
      if (!r.ok) { setErro(json.error || 'Erro ao salvar'); return; }
      onSaved();
    } catch { setErro('Erro de conexão'); }
    finally { setSalvando(false); }
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <ModalBase title="Nova transação" onClose={onClose}>
      <div className={styles.form}>
        {/* Descrição com autocomplete */}
        <div>
          <Label htmlFor="nova-desc">Descrição</Label>
          <div className={styles.autocompleteWrap}>
            <input
              id="nova-desc"
              ref={descRef}
              value={form.descricao}
              onChange={e => handleDescChange(e.target.value)}
              onKeyDown={handleDescKeyDown}
              onBlur={() => setTimeout(() => setShowSug(false), 150)}
              placeholder="Ex: Netflix, Supermercado..."
              autoComplete="off"
            />
            {showSug && sugestoes.length > 0 && (
              <div className={styles.autocomplete}>
                {sugestoes.map((s, i) => (
                  <button
                    key={`${s.descricao}-${i}`}
                    type="button"
                    onMouseDown={() => aplicarSugestao(s)}
                    onMouseEnter={() => setSugIdx(i)}
                    className={cx(styles.sugItem, sugIdx === i && styles.active)}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.sugDesc}>{s.descricao}</div>
                      <div className={styles.sugMeta}>
                        {fmt(Number(s.valor))}
                        {s.tipo && (
                          <span className={styles.sugTipoCor} style={{ color: tipoCor[s.tipo] || 'var(--outline)' }}>
                            · {tipoLabel[s.tipo] || s.tipo}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={styles.sugEnter}>↵</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.gridHalf}>
          <div>
            <Label htmlFor="nova-valor">Valor (R$)</Label>
            <input ref={valorRef} id="nova-valor" type="number" step="0.01" aria-label="Valor" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label>Data</Label>
            <CustomDateInput value={form.data} onChange={v => set('data', v)} />
          </div>
        </div>

        <div className={styles.gridDynamic} style={{ gridTemplateColumns: form.tipo === 'parcelada' ? '1fr 1fr' : '1fr' }}>
          <div>
            <Label>Tipo</Label>
            <CustomSelect
              value={form.tipo}
              onChange={v => set('tipo', v)}
              options={[{ value: 'avulsa', label: 'Avulsa' }, { value: 'fixa', label: 'Fixa' }, { value: 'parcelada', label: 'Parcelada' }]}
            />
          </div>
          {form.tipo === 'parcelada' && (
            <div>
              <Label htmlFor="nova-parcelas">Nº Parcelas</Label>
              <input id="nova-parcelas" type="number" min="2" max="60" value={form.total_parcelas} onChange={e => set('total_parcelas', e.target.value)} />
            </div>
          )}
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

        {(form.meio === 'pix' || form.meio === 'dinheiro') && (
          <div
            className={styles.infoBox}
            style={{
              '--info-bg': `${meioCor[form.meio]}15`,
              '--info-border': `${meioCor[form.meio]}30`,
            } as React.CSSProperties}
          >
            <ColorDot color={meioCor[form.meio]} size={8} />
            <span>
              Pagamento via <strong style={{ color: meioCor[form.meio] }}>{meioLabel[form.meio]}</strong>
            </span>
          </div>
        )}

        <div>
          <Label htmlFor="nova-obs">Observação (opcional)</Label>
          <textarea
            id="nova-obs"
            value={form.observacao}
            onChange={e => set('observacao', e.target.value)}
            placeholder="Alguma nota sobre esta transação..."
            rows={2}
            style={{ resize: 'vertical', minHeight: '60px' }}
          />
        </div>

        {erro && <div className={styles.errorBox}>{erro}</div>}

        <div className={styles.actions}>
          <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button variant="primary" fullWidth loading={salvando} onClick={salvar}>Adicionar</Button>
        </div>
      </div>
    </ModalBase>
  );
}
