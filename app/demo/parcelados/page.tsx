'use client';
import { useState, useMemo } from 'react';
import { fmt } from '@/lib/format';
import { useDemoContext } from '@/contexts/DemoContext';
import AccordionSecao from '@/components/organisms/AccordionSecao';
import CatMultiSelect from '@/components/molecules/CatMultiSelect';
import ConfirmarModal from '@/components/molecules/ConfirmarModal';
import CustomSelect from '@/components/molecules/CustomSelect';
import ModalBase from '@/components/organisms/ModalBase';
import NovaTransacaoModal from '@/components/organisms/NovaTransacaoModal';
import Button from '@/components/atoms/Button';

const hoje = new Date().toISOString().split('T')[0];
type Filtro = 'abertos' | 'todos' | 'finalizados';

type Grupo = {
  descricao: string; valorParcela: number; totalParcelas: number; pagas: number;
  cartaoId: number | null; categoriaId: number | null; categoriaIds: number[];
  meioP: string | null; grupo: string | null; id: number; dataInicio: string;
  parcelas: { id: number; data: string; parcela_atual: number; pago: boolean }[];
};

export default function DemoParcelados() {
  const demo = useDemoContext();
  const [filtro, setFiltro] = useState<Filtro>('abertos');
  const [secoesAbertas, setSecoesAbertas] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Grupo | null>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', cartao_id: '', categoria_ids: [] as number[], meio: 'cartao' });
  const [salvando, setSalvando] = useState(false);
  const [pedirConfirmacao, setPedirConfirmacao] = useState(false);
  const [showNova, setShowNova] = useState(false);

  const txs = useMemo(() => demo.getTransacoes({ tipo: 'parcelada' }) as any[], [demo]);

  const grupos: Record<string, Grupo> = txs.reduce((acc: Record<string, Grupo>, t: any) => {
    const baseDesc = t.descricao.replace(/ \d+\/\d+$/, '');
    const key = t.grupo_parcela || `${baseDesc}__${t.cartao_id ?? 'null'}__${t.total_parcelas}`;
    if (!acc[key]) {
      acc[key] = {
        descricao: baseDesc, valorParcela: Number(t.valor), totalParcelas: t.total_parcelas,
        pagas: 0, cartaoId: t.cartao_id, categoriaId: t.categoria_id,
        categoriaIds: Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
        meioP: t.meio_pagamento, grupo: t.grupo_parcela, id: t.id, dataInicio: t.data, parcelas: [],
      };
    }
    acc[key].parcelas.push({ id: t.id, data: t.data, parcela_atual: t.parcela_atual, pago: !!t.pago });
    const ehPix = !t.cartao_id && (t.meio_pagamento === 'pix' || t.meio_pagamento === 'dinheiro');
    if (ehPix ? t.pago : (t.data <= hoje || t.pago)) acc[key].pagas++;
    if (t.data < acc[key].dataInicio) acc[key].dataInicio = t.data;
    return acc;
  }, {});

  const lista = Object.values(grupos);
  const filtradas = lista.filter(g =>
    filtro === 'abertos' ? g.pagas < g.totalParcelas :
    filtro === 'finalizados' ? g.pagas >= g.totalParcelas : true
  );

  const secoes: { key: string; titulo: string; cor: string; itens: Grupo[]; totalMes: number; totalRestante: number; totalGeral: number }[] = [];
  for (const c of demo.cartoes.filter(c => filtradas.some(g => g.cartaoId === c.id))) {
    const itens = filtradas.filter(g => g.cartaoId === c.id);
    const abertas = itens.filter(g => g.pagas < g.totalParcelas);
    if (itens.length) secoes.push({ key: String(c.id), titulo: c.nome, cor: c.cor, itens, totalMes: abertas.reduce((s, g) => s + g.valorParcela, 0), totalRestante: itens.reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0), totalGeral: itens.reduce((s, g) => s + g.valorParcela * g.totalParcelas, 0) });
  }
  const semCartao = filtradas.filter(g => !g.cartaoId);
  if (semCartao.length) {
    const abertas = semCartao.filter(g => g.pagas < g.totalParcelas);
    secoes.push({ key: 'sem_cartao', titulo: 'Pix / Dinheiro / Sem cartão', cor: '#908fa0', itens: semCartao, totalMes: abertas.reduce((s, g) => s + g.valorParcela, 0), totalRestante: semCartao.reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0), totalGeral: semCartao.reduce((s, g) => s + g.valorParcela * g.totalParcelas, 0) });
  }

  const totalMesGlobal = lista.filter(g => g.pagas < g.totalParcelas).reduce((s, g) => s + g.valorParcela, 0);
  const totalRestanteGlobal = filtradas.reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0);

  const abrirEditar = (g: Grupo) => {
    setEditando(g);
    setForm({ descricao: g.descricao, valor: String(g.valorParcela), cartao_id: String(g.cartaoId || ''), categoria_ids: g.categoriaIds, meio: g.meioP || 'cartao' });
    setShowModal(true);
  };

  const salvar = () => {
    if (!editando) return;
    setSalvando(true);
    const payload = {
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')) || editando.valorParcela,
      cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
      categoria_id: form.categoria_ids[0] ?? null,
      categoria_ids: form.categoria_ids,
      meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
    };
    // Update all parcelas in the group
    const ids = editando.grupo
      ? txs.filter((t: any) => t.grupo_parcela === editando.grupo).map((t: any) => t.id)
      : [editando.id];
    demo.batchUpdateTransacoes(ids.map((id: number) => ({ id, payload })));
    setSalvando(false);
    setShowModal(false);
  };

  const excluir = () => {
    if (!editando) return;
    const ids = editando.grupo
      ? txs.filter((t: any) => t.grupo_parcela === editando.grupo).map((t: any) => t.id)
      : [editando.id];
    ids.forEach((id: number) => demo.deleteTransacao(id));
    setPedirConfirmacao(false);
    setShowModal(false);
  };

  const marcarTudoPago = () => {
    if (!editando) return;
    const ids = editando.parcelas.map(p => p.id);
    demo.batchUpdateTransacoes(ids.map(id => ({ id, payload: { pago: true } })));
    setShowModal(false);
  };

  const filtroOpts: { key: Filtro; label: string }[] = [
    { key: 'abertos', label: '⊙ Em aberto' },
    { key: 'todos', label: '◎ Todos' },
    { key: 'finalizados', label: '✓ Finalizados' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Parcelados</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {filtradas.length} compras · {fmt(totalMesGlobal)}/mês · {fmt(totalRestanteGlobal)} restantes
          </div>
        </div>
        <div className="page-header-actions">
          <Button type="button" variant="primary" onClick={() => setShowNova(true)}>+ Novo parcelado</Button>
          {filtroOpts.map(f => (
            <Button key={f.key} type="button" variant={filtro === f.key ? 'primary' : 'secondary'} onClick={() => setFiltro(f.key)}>{f.label}</Button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>
          Nenhum parcelado {filtro === 'abertos' ? 'em aberto' : filtro === 'finalizados' ? 'finalizado' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {secoes.map(sec => (
            <AccordionSecao
              key={sec.key} secaoKey={sec.key} titulo={sec.titulo} cor={sec.cor}
              count={sec.itens.length} countLabel={`compra${sec.itens.length !== 1 ? 's' : ''}`}
              stats={[
                { label: 'TOTAL MÊS', value: fmt(sec.totalMes), color: 'var(--tertiary)' },
                { label: 'RESTANTE', value: fmt(sec.totalRestante), color: '#ffb783' },
                { label: 'TOTAL GERAL', value: fmt(sec.totalGeral), color: 'var(--on-surface-muted)' },
              ]}
              aberta={secoesAbertas.has(sec.key)}
              onToggle={() => setSecoesAbertas(prev => { const next = new Set(prev); next.has(sec.key) ? next.delete(sec.key) : next.add(sec.key); return next; })}
            >
              {sec.itens.map(g => {
                const pct = g.totalParcelas > 0 ? (g.pagas / g.totalParcelas) * 100 : 0;
                const restantes = Math.max(0, g.totalParcelas - g.pagas);
                const finalizado = g.pagas >= g.totalParcelas;
                const fillColor = finalizado ? 'var(--color-success)' : pct >= 75 ? 'var(--color-success)' : pct >= 40 ? '#ffb783' : '#8083ff';
                return (
                  <div key={g.grupo || g.id} className="card" style={{ padding: '14px 18px', cursor: 'pointer', opacity: finalizado ? 0.6 : 1 }} onClick={e => { e.stopPropagation(); abrirEditar(g); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descricao}</span>
                          {finalizado && <span style={{ fontSize: '10px', color: 'var(--color-success)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--color-success-bg)', padding: '2px 7px', borderRadius: '999px', flexShrink: 0 }}>QUITADO</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                          desde {new Date(g.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: finalizado ? 'var(--outline)' : 'var(--tertiary)' }}>
                          {fmt(g.valorParcela)}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span>
                        </div>
                        {!finalizado && <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(g.valorParcela * restantes)} rest.</div>}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--outline)', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                        <span>{g.pagas}/{g.totalParcelas} pagas</span>
                        <span style={{ color: fillColor }}>{Math.round(pct)}%{!finalizado && ` · ${restantes} restante${restantes !== 1 ? 's' : ''}`}</span>
                      </div>
                      <div className="progress-track" style={{ height: '5px' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </AccordionSecao>
          ))}
        </div>
      )}

      {showModal && editando && (
        <ModalBase title={editando.descricao} onClose={() => setShowModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', padding: '16px', background: 'var(--clay-input-bg)', border: '1px solid var(--clay-input-border)', borderRadius: '16px', boxShadow: 'var(--clay-input-shadow)' }}>
            {[
              { label: 'PAGAS', value: `${editando.pagas}/${editando.totalParcelas}` },
              { label: 'TOTAL', value: fmt(editando.valorParcela * editando.totalParcelas) },
              { label: 'RESTANTE', value: fmt(editando.valorParcela * Math.max(0, editando.totalParcelas - editando.pagas)) },
            ].map(i => (
              <div key={i.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{i.label}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>{i.value}</div>
              </div>
            ))}
          </div>

          {editando.pagas < editando.totalParcelas && (
            <div style={{ padding: '12px 14px', background: 'var(--surface-low)', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '10px' }}>AÇÕES RÁPIDAS</div>
              <Button type="button" variant="secondary" size="sm" onClick={marcarTudoPago} style={{ color: 'var(--color-success)', borderColor: 'var(--color-success-border)' }}>
                ✓ Marcar tudo como pago
              </Button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
              <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR POR PARCELA (R$)</label>
              <input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FORMA DE PAGAMENTO</label>
              <CustomSelect value={form.meio} onChange={v => setForm({ ...form, meio: v, cartao_id: ['pix', 'dinheiro'].includes(v) ? '' : form.cartao_id })} options={[{ value: 'cartao', label: 'Cartão de crédito' }, { value: 'pix', label: 'Pix' }, { value: 'dinheiro', label: 'Dinheiro' }]} />
            </div>
            {form.meio === 'cartao' && (
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CARTÃO</label>
                <CustomSelect value={form.cartao_id} onChange={v => setForm({ ...form, cartao_id: v })} options={[{ value: '', label: 'Sem cartão' }, ...demo.cartoes.map(c => ({ value: String(c.id), label: c.nome }))]} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CATEGORIAS</label>
              <CatMultiSelect value={form.categoria_ids} onChange={ids => setForm({ ...form, categoria_ids: ids })} categorias={demo.categorias} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="danger" onClick={() => { setShowModal(false); setPedirConfirmacao(true); }}>✕ Excluir</Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="button" variant="primary" fullWidth onClick={salvar} loading={salvando}>Salvar</Button>
            </div>
          </div>
        </ModalBase>
      )}

      {pedirConfirmacao && editando && (
        <ConfirmarModal
          mensagem={`Excluir todas as ${editando.totalParcelas} parcelas de "${editando.descricao}"?`}
          detalhe="Esta ação não pode ser desfeita."
          textoConfirmar="Excluir"
          confirmando={false}
          onConfirmar={excluir}
          onCancelar={() => setPedirConfirmacao(false)}
        />
      )}

      {showNova && (
        <NovaTransacaoModal
          initialData={{ tipo: 'parcelada' }}
          cartoesList={demo.cartoes}
          categoriasList={demo.categorias}
          onClose={() => setShowNova(false)}
          onSaved={() => setShowNova(false)}
          onDemoSave={demo.addTransacao}
        />
      )}
    </div>
  );
}
