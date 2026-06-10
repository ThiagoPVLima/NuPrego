'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import ModalBase from '@/components/organisms/ModalBase';
import Button from '@/components/atoms/Button';

const EMOJIS = [
  '🍔','🍕','🍜','🍣','🥗','🥩','🍱','☕','🍺','🍷',
  '🛒','🧺','🛍️','🏠','🔧','🧹','💡','🛋️',
  '🚗','🚇','⛽','✈️','🚲','🚕',
  '💊','🏥','💪','🧘','🏋️','🩺',
  '🎮','🎬','🎵','📺','🎨','🎭','🎲',
  '📱','💻','🖥️','📷',
  '👕','👟','💄','💇','🕶️',
  '📚','🎓','📝','✏️',
  '💰','💳','💵','📈',
  '🐶','🐱','🌿','🌱','🌸',
  '🏖️','🏕️','🌍','⛺',
  '⚽','🎾','🏊','🏆',
  '🎁','❤️','⭐','🔑','🎉',
];


type Categoria = { id: number; nome: string; icone: string | null; cor: string };
type Cartao = { id: number; nome: string; cor: string; fechamento: number | null };

const CORES_PRESET = [
  '#8083ff','#6edab4','#ffb783','#f87171','#00b8d4',
  '#a78bfa','#34d399','#fbbf24','#f472b6','#908fa0',
];

const formVazio = { nome: '', icone: '', cor: '#8083ff' };

export default function Configuracoes() {
  // ── import ──
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── categorias ──
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erroCat, setErroCat] = useState<string | null>(null);
  const [deletando, setDeletando] = useState<number | null>(null);
  const [confirmandoDelete, setConfirmandoDelete] = useState<number | null>(null);
  const [erroDelete, setErroDelete] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ── cartões (fechamento) ──
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loadingCartoes, setLoadingCartoes] = useState(true);
  const [fechamentos, setFechamentos] = useState<Record<number, string>>({});
  const [salvandoCartao, setSalvandoCartao] = useState<number | null>(null);
  const [erroCartao, setErroCartao] = useState<Record<number, string>>({});

  const loadCats = useCallback(async () => {
    setLoadingCats(true);
    const r = await fetch('/api/categorias');
    const d = await r.json();
    setCats(Array.isArray(d) ? d : []);
    setLoadingCats(false);
  }, []);

  const loadCartoes = useCallback(async () => {
    setLoadingCartoes(true);
    const r = await fetch('/api/cartoes');
    const d = await r.json();
    const lista: Cartao[] = Array.isArray(d) ? d : [];
    setCartoes(lista);
    const map: Record<number, string> = {};
    for (const c of lista) map[c.id] = c.fechamento ? String(c.fechamento) : '';
    setFechamentos(map);
    setLoadingCartoes(false);
  }, []);

  useEffect(() => { loadCats(); loadCartoes(); }, [loadCats, loadCartoes]);

  const salvarFechamento = async (id: number) => {
    const val = fechamentos[id]?.trim();
    const num = val ? parseInt(val) : null;
    if (val && (isNaN(num!) || num! < 1 || num! > 28)) {
      setErroCartao(e => ({ ...e, [id]: 'Dia inválido (1–28)' }));
      return;
    }
    setSalvandoCartao(id);
    setErroCartao(e => ({ ...e, [id]: '' }));
    const r = await fetch(`/api/cartoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fechamento: num }),
    });
    if (!r.ok) {
      const json = await r.json();
      setErroCartao(e => ({ ...e, [id]: json.error || 'Erro ao salvar' }));
    }
    setSalvandoCartao(null);
  };

  const abrirNova = () => {
    setEditando(null);
    setForm(formVazio);
    setErroCat(null);
    setShowEmojiPicker(false);
    setShowModal(true);
  };

  const abrirEditar = (c: Categoria) => {
    setEditando(c);
    setForm({ nome: c.nome, icone: c.icone || '', cor: c.cor || '#8083ff' });
    setErroCat(null);
    setShowEmojiPicker(false);
    setShowModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setErroCat('Nome obrigatório'); return; }
    setSalvando(true);
    setErroCat(null);
    try {
      const url = editando ? `/api/categorias/${editando.id}` : '/api/categorias';
      const method = editando ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome.trim(), icone: form.icone.trim() || null, cor: form.cor }),
      });
      const json = await r.json();
      if (!r.ok) { setErroCat(json.error || 'Erro ao salvar'); return; }
      setShowModal(false);
      loadCats();
    } catch {
      setErroCat('Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id: number) => {
    setErroDelete(null);
    setDeletando(id);
    setConfirmandoDelete(null);
    try {
      const r = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const json = await r.json();
        setErroDelete(json.error || 'Erro ao excluir');
      } else {
        loadCats();
      }
    } finally {
      setDeletando(null);
    }
  };

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportando(true); setResultado(null);
    const form = new FormData(); form.append('file', file);
    try {
      const r = await fetch('/api/importar', { method: 'POST', body: form });
      setResultado(await r.json());
    } catch { setResultado({ error: 'Erro ao importar' }); }
    finally { setImportando(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: 'var(--on-surface)', letterSpacing: '-0.02em', margin: 0 }}>Configurações</h1>
        <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>Categorias, cartões, importação e informações do sistema</div>
      </div>

      {/* ── Cartões — dia de fechamento ── */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)', marginBottom: '6px' }}>Dia de fechamento dos cartões</div>
        <div style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '20px', lineHeight: 1.6 }}>
          Compras feitas antes do dia de fechamento entram na fatura do mês anterior. Deixe em branco para usar o mês calendário.
        </div>
        {loadingCartoes ? (
          <div style={{ color: 'var(--outline)', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>carregando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cartoes.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px', background: 'var(--surface-low)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.cor || '#8083ff', flexShrink: 0, display: 'inline-block' }}></span>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--on-surface)' }}>{c.nome}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>Fecha dia</span>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={fechamentos[c.id] ?? ''}
                    onChange={e => setFechamentos(f => ({ ...f, [c.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && salvarFechamento(c.id)}
                    placeholder="—"
                    style={{ width: '60px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => salvarFechamento(c.id)}
                    loading={salvandoCartao === c.id}
                  >
                    Salvar
                  </Button>
                </div>
                {erroCartao[c.id] && (
                  <span style={{ fontSize: '12px', color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>{erroCartao[c.id]}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Categorias ── */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)' }}>Categorias</div>
            <div style={{ fontSize: '13px', color: 'var(--outline)', marginTop: '3px' }}>{cats.length} categorias cadastradas</div>
          </div>
          <Button type="button" variant="primary" onClick={abrirNova}>+ Nova categoria</Button>
        </div>

        {erroDelete && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            ❌ {erroDelete}
            <Button type="button" variant="ghost" size="sm" onClick={() => setErroDelete(null)}>✕</Button>
          </div>
        )}
        {loadingCats ? (
          <div style={{ color: 'var(--outline)', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', padding: '16px 0' }}>carregando...</div>
        ) : cats.length === 0 ? (
          <div style={{ color: 'var(--outline)', fontSize: '13px', textAlign: 'center', padding: '32px' }}>Nenhuma categoria. Crie a primeira!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {cats.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--surface-low)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.cor || '#8083ff', flexShrink: 0, display: 'inline-block' }}></span>
                {c.icone && <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{c.icone}</span>}
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--on-surface)' }}>{c.nome}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--outline)' }}>{c.cor}</span>
                {confirmandoDelete === c.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>Confirmar?</span>
                    <Button type="button" variant="danger" size="sm" onClick={() => deletar(c.id)} loading={deletando === c.id}>Sim</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmandoDelete(null)}>Não</Button>
                  </div>
                ) : (
                  <>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setErroDelete(null); abrirEditar(c); }} title="Editar">✎</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmandoDelete(c.id)} style={{ color: '#f87171' }} title="Excluir">✕</Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Importar Excel ── */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)', marginBottom: '6px' }}>Importar planilha Excel</div>
        <div style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '24px', lineHeight: 1.6 }}>
          Importe seu arquivo <code style={{ background: 'var(--surface-high)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>Contas.xlsx</code> original. O sistema detecta automaticamente meses, cartões, fixas e parcelados.
        </div>
        <div onClick={() => fileRef.current?.click()} style={{ border: '1px dashed var(--outline-variant)', borderRadius: '10px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-dark)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--outline-variant)')}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '14px', color: 'var(--on-surface-muted)', marginBottom: '4px' }}>
            {importando ? 'Importando...' : 'Clique ou arraste o arquivo .xlsx'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>suporte: .xlsx .xls</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={importar} />
        </div>
        {resultado && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: resultado.error ? 'rgba(239,68,68,0.08)' : 'rgba(110,218,180,0.08)', border: `1px solid ${resultado.error ? 'rgba(239,68,68,0.2)' : 'rgba(110,218,180,0.2)'}` }}>
            {resultado.error
              ? <div style={{ color: '#f87171', fontSize: '14px' }}>❌ {resultado.error}</div>
              : <div style={{ color: 'var(--secondary)', fontSize: '14px' }}>✓ {resultado.importadas} transações importadas com sucesso!</div>
            }
          </div>
        )}
      </div>

      {/* ── Sobre ── */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--on-surface)', marginBottom: '20px' }}>Sobre o NuPrego</div>
        {[
          ['Versão', 'NuPrego 2.0'],
          ['Banco de dados', 'Supabase (PostgreSQL)'],
          ['Frontend', 'Next.js 16 + Tailwind CSS'],
          ['Hospedagem', 'Vercel'],
          ['Histórico', 'Importação desde 2021'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px' }}>
            <span style={{ color: 'var(--outline)' }}>{k}</span>
            <span style={{ color: 'var(--on-surface-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* ── Modal criar/editar categoria ── */}
      {showModal && (
        <ModalBase
          title={editando ? 'Editar categoria' : 'Nova categoria'}
          onClose={() => setShowModal(false)}
          maxWidth={380}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>NOME *</label>
              <input
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Alimentação"
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>ÍCONE (emoji opcional)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  value={form.icone}
                  onChange={e => setForm({ ...form, icone: e.target.value })}
                  placeholder="Ex: 🍔"
                  style={{ maxWidth: '90px', fontSize: '20px', textAlign: 'center' }}
                />
                <Button type="button" variant="secondary" onClick={() => setShowEmojiPicker(v => !v)}>
                  {showEmojiPicker ? 'Fechar' : '😊 Escolher'}
                </Button>
                {form.icone && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, icone: '' })}>✕</Button>
                )}
              </div>
              {showEmojiPicker && (
                <div style={{ marginTop: '8px', padding: '12px', background: 'var(--surface-low)', border: '1px solid var(--outline-variant)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, icone: e })); setShowEmojiPicker(false); }}
                        style={{ fontSize: '22px', lineHeight: 1, padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-high)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>COR</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {CORES_PRESET.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setForm({ ...form, cor })}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: cor, border: 'none',
                      cursor: 'pointer', outline: form.cor === cor ? `3px solid ${cor}` : 'none',
                      outlineOffset: '2px', transition: 'outline 0.1s',
                    }}
                    title={cor}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  aria-label="Cor personalizada"
                  value={form.cor}
                  onChange={e => setForm({ ...form, cor: e.target.value })}
                  style={{ width: '40px', height: '32px', padding: '2px', borderRadius: '6px', border: '1px solid var(--outline-variant)', background: 'var(--surface-high)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>{form.cor}</span>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: form.cor, display: 'inline-block', flexShrink: 0 }}></span>
              </div>
            </div>

            {erroCat && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '13px' }}>
                ❌ {erroCat}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="button" variant="primary" fullWidth onClick={salvar} loading={salvando}>
                {editando ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </ModalBase>
      )}
    </div>
  );
}
