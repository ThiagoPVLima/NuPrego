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

const limiteAtiva = (() => {
  const d = new Date(); d.setMonth(d.getMonth() - 3); d.setDate(1);
  return d.toISOString().split('T')[0];
})();

type Filtro = 'ativas' | 'todas' | 'inativas';

type Fixa = {
  key: string; descricao: string; valorAtual: number; totalPago: number;
  mesesAtivos: number; primeiraData: string; ultimaData: string; ativa: boolean;
  cartaoId: number | null; categoriaId: number | null; categoriaIds: number[];
  meioP: string | null; id: number;
};

export default function DemoFixas() {
  const demo = useDemoContext();
  const [filtro, setFiltro] = useState<Filtro>('ativas');
  const [secoesAbertas, setSecoesAbertas] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fixa | null>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', cartao_id: '', categoria_ids: [] as number[], meio: 'cartao' });
  const [salvando, setSalvando] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [pedirConfirmacao, setPedirConfirmacao] = useState(false);

  const txs = useMemo(() => demo.getTransacoes({ tipo: 'fixa' }) as any[], [demo]);

  const grupos: Record<string, Fixa> = txs.reduce((acc: Record<string, Fixa>, t: any) => {
    const key = t.descricao;
    if (!acc[key]) {
      acc[key] = {
        key, descricao: t.descricao, valorAtual: Number(t.valor), totalPago: 0,
        mesesAtivos: 0, primeiraData: t.data, ultimaData: t.data, ativa: false,
        cartaoId: t.cartao_id, categoriaId: t.categoria_id,
        categoriaIds: Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
        meioP: t.meio_pagamento, id: t.id,
      };
    }
    const g = acc[key];
    g.totalPago += Number(t.valor); g.mesesAtivos++;
    if (t.data < g.primeiraData) g.primeiraData = t.data;
    if (t.data > g.ultimaData) { g.ultimaData = t.data; g.valorAtual = Number(t.valor); g.id = t.id; }
    return acc;
  }, {});

  const lista = Object.values(grupos).map(g => {
    const cfgAtiva = demo.fixasConfigs[g.descricao.toLowerCase()];
    const ativa = cfgAtiva !== undefined ? cfgAtiva : g.ultimaData >= limiteAtiva;
    return { ...g, ativa };
  });

  const filtradas = lista.filter(g =>
    filtro === 'ativas' ? g.ativa : filtro === 'inativas' ? !g.ativa : true
  );

  const secoes: { key: string; titulo: string; cor: string; itens: Fixa[]; totalMes: number; totalAnual: number }[] = [];
  for (const c of demo.cartoes.filter(c => filtradas.some(g => g.cartaoId === c.id))) {
    const itens = filtradas.filter(g => g.cartaoId === c.id);
    if (itens.length) {
      const ativas = itens.filter(g => g.ativa);
      secoes.push({ key: String(c.id), titulo: c.nome, cor: c.cor, itens, totalMes: ativas.reduce((s, g) => s + g.valorAtual, 0), totalAnual: ativas.reduce((s, g) => s + g.valorAtual * 12, 0) });
    }
  }
  const semCartao = filtradas.filter(g => !g.cartaoId);
  if (semCartao.length) {
    const ativas = semCartao.filter(g => g.ativa);
    secoes.push({ key: 'sem_cartao', titulo: 'Pix / Dinheiro / Sem cartão', cor: '#908fa0', itens: semCartao, totalMes: ativas.reduce((s, g) => s + g.valorAtual, 0), totalAnual: ativas.reduce((s, g) => s + g.valorAtual * 12, 0) });
  }

  const totalMesGlobal = lista.filter(g => g.ativa).reduce((s, g) => s + g.valorAtual, 0);
  const totalAtivas = lista.filter(g => g.ativa).length;

  const abrirEditar = (g: Fixa) => {
    setEditando(g);
    setForm({ descricao: g.descricao, valor: String(g.valorAtual), cartao_id: String(g.cartaoId || ''), categoria_ids: g.categoriaIds, meio: g.meioP || 'cartao' });
    setShowModal(true);
  };

  const salvar = () => {
    if (!editando) return;
    setSalvando(true);
    demo.updateTransacao(editando.id, {
      descricao: form.descricao,
      valor: parseFloat(form.valor.replace(',', '.')) || editando.valorAtual,
      cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
      categoria_id: form.categoria_ids[0] ?? null,
      categoria_ids: form.categoria_ids,
      meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
    });
    setSalvando(false);
    setShowModal(false);
  };

  const toggleAtiva = () => {
    if (!editando) return;
    demo.setFixaAtiva(editando.descricao, !editando.ativa);
    setShowModal(false);
  };

  const excluir = () => {
    if (!editando) return;
    // Delete all txs with same descricao and tipo=fixa
    const ids = txs.filter((t: any) => t.descricao === editando.descricao).map((t: any) => t.id);
    ids.forEach((id: number) => demo.deleteTransacao(id));
    setPedirConfirmacao(false);
    setShowModal(false);
  };

  const filtroOpts: { key: Filtro; label: string }[] = [
    { key: 'ativas', label: '⊙ Ativas' },
    { key: 'todas', label: '◎ Todas' },
    { key: 'inativas', label: '◌ Inativas' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fixas</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>
            {totalAtivas} ativas · {fmt(totalMesGlobal)}/mês · {fmt(totalMesGlobal * 12)}/ano
          </div>
        </div>
        <div className="page-header-actions">
          {filtroOpts.map(f => (
            <Button key={f.key} type="button" variant={filtro === f.key ? 'primary' : 'secondary'} onClick={() => setFiltro(f.key)}>
              {f.label}
            </Button>
          ))}
          <Button type="button" variant="primary" onClick={() => setShowNova(true)}>+ Nova fixa</Button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>
          Nenhuma conta fixa {filtro === 'ativas' ? 'ativa' : filtro === 'inativas' ? 'inativa' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {secoes.map(sec => (
            <AccordionSecao
              key={sec.key} secaoKey={sec.key} titulo={sec.titulo} cor={sec.cor}
              count={sec.itens.length} countLabel={`fixa${sec.itens.length !== 1 ? 's' : ''}`}
              stats={[
                { label: 'TOTAL MÊS', value: fmt(sec.totalMes), color: 'var(--tertiary)' },
                { label: 'TOTAL ANO', value: fmt(sec.totalAnual), color: '#ffb783' },
                { label: 'QTD ATIVAS', value: `${sec.itens.filter(g => g.ativa).length}`, color: 'var(--on-surface-muted)' },
              ]}
              aberta={secoesAbertas.has(sec.key)}
              onToggle={() => setSecoesAbertas(prev => { const next = new Set(prev); next.has(sec.key) ? next.delete(sec.key) : next.add(sec.key); return next; })}
            >
              {sec.itens.map(g => (
                <div key={g.key} className="card" style={{ padding: '14px 18px', cursor: 'pointer', opacity: g.ativa ? 1 : 0.6 }} onClick={e => { e.stopPropagation(); abrirEditar(g); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descricao}</span>
                        {!g.ativa && <span style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--clay-input-bg)', padding: '2px 7px', borderRadius: '999px', flexShrink: 0, border: '1px solid var(--clay-input-border)' }}>INATIVA</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                        desde {new Date(g.primeiraData + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        <span style={{ marginLeft: '6px' }}>· {g.mesesAtivos}x registrada</span>
                        {(() => { const cat = g.categoriaId ? demo.categorias.find(c => c.id === g.categoriaId) : null; return cat ? <span style={{ marginLeft: '8px', color: 'var(--outline-variant)' }}>· {cat.nome}</span> : null; })()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: g.ativa ? 'var(--tertiary)' : 'var(--outline)' }}>
                        {fmt(g.valorAtual)}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(g.totalPago)} total</div>
                    </div>
                  </div>
                </div>
              ))}
            </AccordionSecao>
          ))}
        </div>
      )}

      {pedirConfirmacao && editando && (
        <ConfirmarModal
          mensagem="Excluir esta conta fixa?"
          detalhe={`Todos os ${editando.mesesAtivos} registros de "${editando.descricao}" serão removidos.`}
          textoConfirmar="Excluir"
          confirmando={false}
          onConfirmar={excluir}
          onCancelar={() => setPedirConfirmacao(false)}
        />
      )}

      {showModal && editando && (
        <ModalBase title={editando.descricao} onClose={() => setShowModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', padding: '16px', background: 'var(--clay-input-bg)', border: '1px solid var(--clay-input-border)', borderRadius: '16px', boxShadow: 'var(--clay-input-shadow)' }}>
            {[
              { label: 'REGISTROS', value: `${editando.mesesAtivos}x` },
              { label: 'TOTAL PAGO', value: fmt(editando.totalPago) },
              { label: 'ÚLTIMO MÊS', value: new Date(editando.ultimaData + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) },
            ].map(i => (
              <div key={i.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{i.label}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>{i.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--clay-input-bg)', borderRadius: '14px', marginBottom: '20px', border: `1.5px solid ${editando.ativa ? 'var(--color-success-border)' : 'var(--clay-input-border)'}`, boxShadow: 'var(--clay-input-shadow)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '3px' }}>STATUS</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: editando.ativa ? 'var(--color-success)' : 'var(--outline)', fontFamily: 'Manrope, sans-serif' }}>
                {editando.ativa ? '⊙ Ativa' : '◌ Inativa'}
              </div>
            </div>
            <button type="button" onClick={toggleAtiva} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', background: editando.ativa ? 'rgba(239,68,68,0.12)' : 'var(--color-success-bg)', color: editando.ativa ? '#f87171' : 'var(--color-success)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {editando.ativa ? 'Desativar' : 'Ativar'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
              <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR (R$)</label>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="danger" onClick={() => { setShowModal(false); setPedirConfirmacao(true); }}>✕ Excluir</Button>
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="button" variant="primary" fullWidth onClick={salvar} loading={salvando}>Salvar</Button>
              </div>
            </div>
          </div>
        </ModalBase>
      )}

      {showNova && (
        <NovaTransacaoModal
          initialData={{ tipo: 'fixa' }}
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
