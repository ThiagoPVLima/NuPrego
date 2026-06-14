'use client';
import { useState, useEffect, useCallback } from 'react';
import { fmt } from '@/lib/format';
import AccordionSecao from '@/components/organisms/AccordionSecao';
import CatMultiSelect from '@/components/molecules/CatMultiSelect';
import ConfirmarModal from '@/components/molecules/ConfirmarModal';
import CustomSelect from '@/components/molecules/CustomSelect';
import CustomDateInput from '@/components/molecules/CustomDateInput';
import ModalBase from '@/components/organisms/ModalBase';
import NovaTransacaoModal from '@/components/organisms/NovaTransacaoModal';
import Button from '@/components/atoms/Button';
const hoje = new Date().toISOString().split('T')[0];

type Filtro = 'abertos' | 'todos' | 'finalizados';

type Grupo = {
  descricao: string;
  valorParcela: number;
  totalParcelas: number;
  pagas: number;
  cartaoId: number | null;
  categoriaId: number | null;
  categoriaIds: number[];
  meioP: string | null;
  grupo: string | null;
  id: number;
  dataInicio: string;
  parcelas: { id: number; data: string; parcela_atual: number; pago: boolean }[];
};

type Secao = {
  key: string;
  titulo: string;
  cor: string;
  itens: Grupo[];
  totalMes: number;
  totalRestante: number;
  totalGeral: number;
};

export default function Parcelados() {
  const [txs, setTxs] = useState<any[]>([]);
  const [cartoes, setCartoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroLoad, setErroLoad] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('abertos');
  const [secoesAbertas, setSecoesAbertas] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Grupo | null>(null);
  const [form, setForm] = useState({ descricao: '', valor: '', cartao_id: '', categoria_ids: [] as number[], meio: 'cartao', dataInicio: '' });
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [pedirConfirmacao, setPedirConfirmacao] = useState(false);
  const [adiantando, setAdiantando] = useState<{ key: string; qual: 'proxima' | 'ultima' } | null>(null);
  const [marcandoPago, setMarcandoPago] = useState<string | null>(null);
  const [showNova, setShowNova] = useState(false);
  const novaInit = { tipo: 'parcelada' };

  const load = useCallback(async () => {
    setLoading(true);
    setErroLoad(null);
    try {
      const [t, c, cat] = await Promise.all([
        fetch('/api/transacoes?tipo=parcelada').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/cartoes').then(r => r.json()),
        fetch('/api/categorias').then(r => r.json()),
      ]);
      setTxs(Array.isArray(t) ? t : []);
      setCartoes(Array.isArray(c) ? c : []);
      setCategorias(Array.isArray(cat) ? cat : []);
    } catch {
      setErroLoad('Erro ao carregar parcelados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grupos: Record<string, Grupo> = txs.reduce((acc, t) => {
    const baseDesc = t.descricao.replace(/ \d+\/\d+$/, '');
    const key = t.grupo_parcela || `${baseDesc}__${t.cartao_id ?? 'null'}__${t.total_parcelas}`;
    if (!acc[key]) {
      acc[key] = {
        descricao: baseDesc,
        valorParcela: Number(t.valor),
        totalParcelas: t.total_parcelas,
        pagas: 0,
        cartaoId: t.cartao_id,
        categoriaId: t.categoria_id,
        categoriaIds: Array.isArray(t.categoria_ids) && t.categoria_ids.length ? t.categoria_ids : (t.categoria_id ? [t.categoria_id] : []),
        meioP: t.meio_pagamento,
        grupo: t.grupo_parcela,
        id: t.id,
        dataInicio: t.data,
        parcelas: [],
      };
    }
    acc[key].parcelas.push({ id: t.id, data: t.data, parcela_atual: t.parcela_atual, pago: !!t.pago });
    const ehPix = !t.cartao_id && (t.meio_pagamento === 'pix' || t.meio_pagamento === 'dinheiro');
    if (ehPix ? t.pago : (t.data <= hoje || t.pago)) acc[key].pagas++;
    if (t.data < acc[key].dataInicio) acc[key].dataInicio = t.data;
    return acc;
  }, {} as Record<string, Grupo>);

  const lista = Object.values(grupos);

  const filtradas = lista.filter(g => {
    if (filtro === 'abertos') return g.pagas < g.totalParcelas;
    if (filtro === 'finalizados') return g.pagas >= g.totalParcelas;
    return true;
  });

  const buildSecao = (key: string, titulo: string, cor: string, itens: Grupo[]): Secao => {
    const abertas = itens.filter(g => g.pagas < g.totalParcelas);
    return {
      key, titulo, cor, itens,
      totalMes:      abertas.reduce((s, g) => s + g.valorParcela, 0),
      totalRestante: itens.reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0),
      totalGeral:    itens.reduce((s, g) => s + g.valorParcela * g.totalParcelas, 0),
    };
  };

  const secoes: Secao[] = [];
  const cartoesComParcelas = cartoes.filter(c => filtradas.some(g => g.cartaoId === c.id));
  for (const c of cartoesComParcelas) {
    const itens = filtradas.filter(g => g.cartaoId === c.id);
    if (itens.length) secoes.push(buildSecao(String(c.id), c.nome, c.cor, itens));
  }
  const semCartaoItens = filtradas.filter(g => !g.cartaoId);
  if (semCartaoItens.length) {
    secoes.push(buildSecao('sem_cartao', 'Pix / Dinheiro / Sem cartão', '#908fa0', semCartaoItens));
  }

  const totalMesGlobal = lista
    .filter(g => g.pagas < g.totalParcelas)
    .reduce((s, g) => s + g.valorParcela, 0);
  const totalRestanteGlobal = filtradas
    .reduce((s, g) => s + g.valorParcela * Math.max(0, g.totalParcelas - g.pagas), 0);

  const toggleSecao = (key: string) => {
    setSecoesAbertas(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const abrirEditar = (g: Grupo) => {
    setEditando(g);
    setErroSalvar(null);
    setForm({
      descricao: g.descricao,
      valor: String(g.valorParcela),
      cartao_id: String(g.cartaoId || ''),
      categoria_ids: g.categoriaIds ?? (g.categoriaId ? [g.categoriaId] : []),
      meio: g.meioP || 'cartao',
      dataInicio: g.dataInicio,
    });
    setShowModal(true);
  };

  const salvar = async () => {
    if (!editando) return;
    setSalvando(true);
    setErroSalvar(null);
    const url = editando.grupo
      ? `/api/transacoes/${editando.id}?grupo=${editando.grupo}`
      : `/api/transacoes/${editando.id}`;
    try {
      const r = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: form.descricao,
          valor: parseFloat(form.valor.replace(',', '.')),
          cartao_id: form.meio === 'cartao' && form.cartao_id ? parseInt(form.cartao_id) : null,
          categoria_ids: form.categoria_ids,
          meio_pagamento: form.meio !== 'cartao' ? form.meio : null,
          data_inicio: form.dataInicio || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok) { setErroSalvar(json.error || 'Erro ao salvar'); return; }
      setShowModal(false);
      load();
    } catch {
      setErroSalvar('Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!editando) return;
    setExcluindo(true);
    setErroSalvar(null);
    try {
      const url = editando.grupo
        ? `/api/transacoes/${editando.id}?grupo=${editando.grupo}`
        : `/api/transacoes/${editando.id}`;
      const r = await fetch(url, { method: 'DELETE' });
      const json = await r.json();
      if (!r.ok) { setErroSalvar(json.error || 'Erro ao excluir'); return; }
      setPedirConfirmacao(false);
      setShowModal(false);
      load();
    } catch {
      setErroSalvar('Erro de conexão');
    } finally {
      setExcluindo(false);
    }
  };

  const filtroOpts: { key: Filtro; label: string }[] = [
    { key: 'abertos',     label: '⊙ Em aberto' },
    { key: 'todos',       label: '◎ Todos' },
    { key: 'finalizados', label: '✓ Finalizados' },
  ];

  const emptyMsg =
    filtro === 'abertos'     ? 'em aberto' :
    filtro === 'finalizados' ? 'finalizados' : '';

  return (
    <div>
      {/* Header */}
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
            <Button
              key={f.key}
              type="button"
              variant={filtro === f.key ? 'primary' : 'secondary'}
              onClick={() => setFiltro(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--outline)', padding: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>
          carregando...
        </div>
      ) : erroLoad ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--outline)' }}>{erroLoad}</div>
      ) : filtradas.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--outline)' }}>
          Nenhum parcelado {emptyMsg}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {secoes.map(sec => (
            <AccordionSecao
              key={sec.key}
              secaoKey={sec.key}
              titulo={sec.titulo}
              cor={sec.cor}
              count={sec.itens.length}
              countLabel={`compra${sec.itens.length !== 1 ? 's' : ''}`}
              stats={[
                { label: 'TOTAL MÊS',  value: fmt(sec.totalMes),      color: 'var(--tertiary)' },
                { label: 'RESTANTE',   value: fmt(sec.totalRestante),  color: '#ffb783' },
                { label: 'TOTAL GERAL', value: fmt(sec.totalGeral),   color: 'var(--on-surface-muted)' },
              ]}
              aberta={secoesAbertas.has(sec.key)}
              onToggle={() => toggleSecao(sec.key)}
            >
              {sec.itens.map(g => {
                const pct = g.totalParcelas > 0 ? (g.pagas / g.totalParcelas) * 100 : 0;
                const restantes = Math.max(0, g.totalParcelas - g.pagas);
                const finalizado = g.pagas >= g.totalParcelas;
                const fillColor = finalizado ? 'var(--color-success)' : pct >= 75 ? 'var(--color-success)' : pct >= 40 ? '#ffb783' : '#8083ff';
                return (
                  <div
                    key={g.grupo || g.id}
                    className="card"
                    style={{ padding: '14px 18px', cursor: 'pointer', opacity: finalizado ? 0.6 : 1 }}
                    onClick={e => { e.stopPropagation(); abrirEditar(g); }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.descricao}
                          </span>
                          {finalizado && (
                            <span style={{ fontSize: '10px', color: 'var(--color-success)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--color-success-bg)', padding: '2px 7px', borderRadius: '999px', flexShrink: 0 }}>
                              QUITADO
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>
                          desde {new Date(g.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          {(() => { const cat = g.categoriaId ? categorias.find(c => c.id === g.categoriaId) : null; return cat ? <span style={{ marginLeft: '8px', color: 'var(--outline-variant)' }}>· {cat.nome}</span> : null; })()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: finalizado ? 'var(--outline)' : 'var(--tertiary)' }}>
                          {fmt(g.valorParcela)}
                          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--outline)', marginLeft: '3px' }}>/mês</span>
                        </div>
                        {!finalizado && (
                          <div style={{ fontSize: '11px', color: 'var(--outline)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fmt(g.valorParcela * restantes)} rest.
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--outline)', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                        <span>{g.pagas}/{g.totalParcelas} pagas</span>
                        <span style={{ color: fillColor }}>
                          {Math.round(pct)}%{!finalizado && ` · ${restantes} restante${restantes !== 1 ? 's' : ''}`}
                        </span>
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

      {/* Modal edição */}
      {showModal && editando && (
        <ModalBase title={editando.descricao} onClose={() => setShowModal(false)}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px', padding: '16px', background: 'var(--clay-input-bg)', border: '1px solid var(--clay-input-border)', borderRadius: '16px', boxShadow: 'var(--clay-input-shadow)' }}>
              {[
                { label: 'PAGAS',    value: `${editando.pagas}/${editando.totalParcelas}` },
                { label: 'TOTAL',    value: fmt(editando.valorParcela * editando.totalParcelas) },
                { label: 'RESTANTE', value: fmt(editando.valorParcela * Math.max(0, editando.totalParcelas - editando.pagas)) },
              ].map(i => (
                <div key={i.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '4px' }}>{i.label}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>{i.value}</div>
                </div>
              ))}
            </div>

            {/* Adiantar parcela + Tudo pago */}
            {editando.pagas < editando.totalParcelas && (() => {
              // Inclui parcelas virtuais (não existem no banco ainda)
              type PT = { id: number | null; data: string; parcela_atual: number; pago: boolean };
              const existingMap = new Map(editando.parcelas.map(p => [p.parcela_atual, p as PT]));
              const ref = [...editando.parcelas].sort((a, b) => a.parcela_atual - b.parcela_atual)[0];
              const allParcelas: PT[] = [];
              if (ref) {
                const rd = new Date(ref.data + 'T12:00:00');
                const bYear = rd.getFullYear(), bMonth = rd.getMonth() - (ref.parcela_atual - 1), bDay = rd.getDate();
                for (let i = 1; i <= editando.totalParcelas; i++) {
                  const ex = existingMap.get(i);
                  if (ex) { allParcelas.push(ex); continue; }
                  const tm = bMonth + (i - 1);
                  const ty = bYear + Math.floor(tm / 12), nm = ((tm % 12) + 12) % 12;
                  const dataStr = new Date(ty, nm, Math.min(bDay, new Date(ty, nm + 1, 0).getDate()), 12).toISOString().split('T')[0];
                  allParcelas.push({ id: null, data: dataStr, parcela_atual: i, pago: false });
                }
              }
              const ehPix = !editando.cartaoId && (editando.meioP === 'pix' || editando.meioP === 'dinheiro');
              const futuras = allParcelas
                .filter(p => !p.pago && (ehPix || p.data > hoje))
                .sort((a, b) => a.data.localeCompare(b.data));
              const proxima = futuras[0];
              const ultima = futuras[futuras.length - 1];
              const gKey = editando.grupo || String(editando.id);
              const isLoading = !!adiantando || !!marcandoPago;

              const adiantar = async (parcela: PT, qual: 'proxima' | 'ultima') => {
                setAdiantando({ key: gKey, qual });
                try {
                  if (parcela.id !== null) {
                    await fetch(`/api/transacoes/${parcela.id}?adiantar=1`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
                    });
                  } else {
                    // Parcela virtual: cria no banco com hoje como data e pago=true
                    const hojeStr = new Date().toISOString().split('T')[0];
                    await fetch('/api/transacoes', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        descricao: `${editando.descricao} ${parcela.parcela_atual}/${editando.totalParcelas}`,
                        valor: editando.valorParcela, data: hojeStr, tipo: 'parcelada',
                        cartao_id: editando.cartaoId || null, categoria_ids: editando.categoriaIds,
                        meio_pagamento: editando.meioP, total_parcelas: editando.totalParcelas,
                        parcela_atual: parcela.parcela_atual, grupo_parcela: editando.grupo || null,
                        single_parcela: true, pago: true,
                      }),
                    });
                  }
                  setShowModal(false); load();
                } finally { setAdiantando(null); }
              };

              const marcarPago = async () => {
                setMarcandoPago(gKey);
                try {
                  if (editando.grupo) {
                    await fetch(`/api/transacoes/${editando.id}?pago_grupo=1`, {
                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ grupo_parcela: editando.grupo }),
                    });
                  } else {
                    // Marca as existentes
                    await Promise.all(editando.parcelas.map(p =>
                      fetch(`/api/transacoes/${p.id}?pago_only=1`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pago: true }),
                      })
                    ));
                    // Cria parcelas faltantes (dado legado sem grupo_parcela)
                    if (editando.parcelas.length < editando.totalParcelas) {
                      const sorted = [...editando.parcelas].sort((a, b) => a.parcela_atual - b.parcela_atual);
                      const ref = sorted[0];
                      const refDate = new Date(ref.data + 'T12:00:00');
                      const baseMonth = refDate.getMonth() - (ref.parcela_atual - 1);
                      const baseYear = refDate.getFullYear();
                      const baseDay = refDate.getDate();
                      const existentes = new Set(editando.parcelas.map(p => p.parcela_atual));
                      const inserts = [];
                      for (let i = 1; i <= editando.totalParcelas; i++) {
                        if (existentes.has(i)) continue;
                        const tm = baseMonth + (i - 1);
                        const ty = baseYear + Math.floor(tm / 12);
                        const nm = ((tm % 12) + 12) % 12;
                        const lastDay = new Date(ty, nm + 1, 0).getDate();
                        const day = Math.min(baseDay, lastDay);
                        const dataStr = new Date(ty, nm, day, 12).toISOString().split('T')[0];
                        inserts.push({
                          descricao: `${editando.descricao} ${i}/${editando.totalParcelas}`,
                          valor: editando.valorParcela,
                          data: dataStr,
                          tipo: 'parcelada',
                          cartao_id: editando.cartaoId,
                          categoria_ids: editando.categoriaIds,
                          meio_pagamento: editando.meioP,
                          total_parcelas: editando.totalParcelas,
                          pago: true,
                        });
                      }
                      if (inserts.length) {
                        await Promise.all(inserts.map(inst =>
                          fetch('/api/transacoes', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(inst),
                          })
                        ));
                      }
                    }
                  }
                  setShowModal(false); load();
                } finally { setMarcandoPago(null); }
              };

              return (
                <div style={{ padding: '12px 14px', background: 'var(--surface-low)', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', marginBottom: '10px' }}>ADIANTAR / QUITAR</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {proxima && (
                      <Button type="button" variant="secondary" size="sm" disabled={isLoading}
                        loading={adiantando?.qual === 'proxima' && adiantando.key === gKey}
                        onClick={() => adiantar(proxima, 'proxima')}>
                        ⤴ próxima ({proxima.parcela_atual}/{editando.totalParcelas})
                      </Button>
                    )}
                    {ultima && ultima.id !== proxima?.id && (
                      <Button type="button" variant="secondary" size="sm" disabled={isLoading}
                        loading={adiantando?.qual === 'ultima' && adiantando.key === gKey}
                        onClick={() => adiantar(ultima, 'ultima')}>
                        ⤴ última ({ultima.parcela_atual}/{editando.totalParcelas})
                      </Button>
                    )}
                    <Button type="button" variant="secondary" size="sm" disabled={isLoading}
                      loading={marcandoPago === gKey}
                      onClick={marcarPago}
                      style={{ color: 'var(--color-success)', borderColor: 'var(--color-success-border)' }}>
                      ✓ Tudo pago
                    </Button>
                  </div>
                </div>
              );
            })()}

            <div style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '16px' }}>
              Alterações aplicadas a todas as {editando.totalParcelas} parcelas
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DESCRIÇÃO</label>
                <input aria-label="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>VALOR POR PARCELA (R$)</label>
                  <input type="number" step="0.01" aria-label="Valor por parcela" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>DATA DA 1ª PARCELA</label>
                  <CustomDateInput value={form.dataInicio} onChange={v => setForm({ ...form, dataInicio: v })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>FORMA DE PAGAMENTO</label>
                <CustomSelect
                  label="FORMA DE PAGAMENTO"
                  value={form.meio}
                  onChange={v => setForm({ ...form, meio: v, cartao_id: ['pix', 'dinheiro'].includes(v) ? '' : form.cartao_id })}
                  options={[
                    { value: 'cartao', label: 'Cartão de crédito' },
                    { value: 'pix', label: 'Pix' },
                    { value: 'dinheiro', label: 'Dinheiro' },
                  ]}
                />
              </div>
              {form.meio === 'cartao' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CARTÃO</label>
                  <CustomSelect
                    label="CARTÃO"
                    value={form.cartao_id}
                    onChange={v => setForm({ ...form, cartao_id: v })}
                    options={[
                      { value: '', label: 'Sem cartão' },
                      ...cartoes.map((c: any) => ({ value: String(c.id), label: c.nome })),
                    ]}
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>CATEGORIAS</label>
                <CatMultiSelect value={form.categoria_ids} onChange={ids => setForm({ ...form, categoria_ids: ids })} categorias={categorias} />
              </div>
              {erroSalvar && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px' }}>
                  ❌ {erroSalvar}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Button type="button" variant="danger" onClick={() => { setShowModal(false); setPedirConfirmacao(true); }} disabled={salvando}>✕ Excluir</Button>
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="button" variant="primary" fullWidth onClick={salvar} loading={salvando}>Salvar</Button>
              </div>
            </div>
        </ModalBase>
      )}

      {pedirConfirmacao && editando && (
        <ConfirmarModal
          mensagem={editando.grupo
            ? `Excluir todas as ${editando.totalParcelas} parcelas de "${editando.descricao}"?`
            : `Excluir "${editando.descricao}"?`}
          detalhe={editando.grupo ? 'Esta ação não pode ser desfeita.' : undefined}
          textoConfirmar="Excluir"
          confirmando={excluindo}
          onConfirmar={excluir}
          onCancelar={() => setPedirConfirmacao(false)}
        />
      )}

      {/* Modal nova transação */}
      {showNova && (
        <NovaTransacaoModal
          onClose={() => setShowNova(false)}
          onSaved={() => { setShowNova(false); load(); }}
          initialData={novaInit}
        />
      )}
    </div>
  );
}
