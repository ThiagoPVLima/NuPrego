'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

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

  // ── migração grupos ──
  const [migrando, setMigrando] = useState(false);
  const [resultadoMig, setResultadoMig] = useState<any>(null);

  // ── categorias ──
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erroCat, setErroCat] = useState<string | null>(null);
  const [deletando, setDeletando] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const loadCats = useCallback(async () => {
    setLoadingCats(true);
    const r = await fetch('/api/categorias');
    const d = await r.json();
    setCats(Array.isArray(d) ? d : []);
    setLoadingCats(false);
  }, []);

  useEffect(() => { loadCats(); }, [loadCats]);

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
    if (!confirm('Excluir esta categoria? As transações vinculadas ficarão sem categoria.')) return;
    setDeletando(id);
    try {
      const r = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const json = await r.json();
        alert(json.error || 'Erro ao excluir');
      } else {
        loadCats();
      }
    } finally {
      setDeletando(null);
    }
  };

  // ── import excel ──
  const migrarGrupos = async () => {
    if (!confirm('Agrupar parcelas importadas sem grupo? Essa operação é segura e pode ser desfeita manualmente.')) return;
    setMigrando(true);
    setResultadoMig(null);
    try {
      const r = await fetch('/api/migrar-grupos', { method: 'POST' });
      setResultadoMig(await r.json());
    } catch { setResultadoMig({ error: 'Erro ao migrar' }); }
    finally { setMigrando(false); }
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
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '28px', color: '#dfe3e7', letterSpacing: '-0.02em', margin: 0 }}>Configurações</h1>
        <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>Categorias, importação e informações do sistema</div>
      </div>

      {/* ── Categorias ── */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7' }}>Categorias</div>
            <div style={{ fontSize: '13px', color: 'var(--outline)', marginTop: '3px' }}>{cats.length} categorias cadastradas</div>
          </div>
          <button type="button" className="btn-primary" onClick={abrirNova} style={{ fontSize: '13px', padding: '8px 16px' }}>
            + Nova categoria
          </button>
        </div>

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
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => abrirEditar(c)}
                  style={{ fontSize: '13px', padding: '4px 10px', color: 'var(--outline)' }}
                  title="Editar"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => deletar(c.id)}
                  disabled={deletando === c.id}
                  style={{ fontSize: '13px', padding: '4px 10px', color: deletando === c.id ? 'var(--outline)' : '#f87171' }}
                  title="Excluir"
                >
                  {deletando === c.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Importar Excel ── */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', marginBottom: '6px' }}>Importar planilha Excel</div>
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

      {/* ── Migração grupos ── */}
      <div className="card" style={{ padding: '28px', marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', marginBottom: '6px' }}>Agrupar parcelados importados</div>
        <div style={{ fontSize: '13px', color: 'var(--outline)', marginBottom: '20px', lineHeight: 1.6 }}>
          Transações parceladas importadas sem vínculo de grupo aparecem como cards separados na tela de Parcelados.
          Execute essa operação <strong style={{ color: 'var(--on-surface-muted)' }}>uma vez</strong> para agrupá-las corretamente.
        </div>
        <button type="button" className="btn-primary" onClick={migrarGrupos} disabled={migrando} style={{ opacity: migrando ? 0.6 : 1 }}>
          {migrando ? 'Agrupando...' : '⊞ Agrupar parcelados'}
        </button>
        {resultadoMig && (
          <div style={{ marginTop: '14px', padding: '14px', borderRadius: '8px', background: resultadoMig.error ? 'rgba(239,68,68,0.08)' : 'rgba(110,218,180,0.08)', border: `1px solid ${resultadoMig.error ? 'rgba(239,68,68,0.2)' : 'rgba(110,218,180,0.2)'}` }}>
            {resultadoMig.error
              ? <div style={{ color: '#f87171', fontSize: '14px' }}>❌ {resultadoMig.error}</div>
              : <div style={{ color: 'var(--secondary)', fontSize: '14px' }}>✓ {resultadoMig.mensagem}</div>
            }
          </div>
        )}
      </div>

      {/* ── Sobre ── */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#dfe3e7', marginBottom: '20px' }}>Sobre o NuPrego</div>
        {[
          ['Banco de dados', 'Supabase (PostgreSQL)'],
          ['Frontend', 'Next.js 15 + Tailwind CSS'],
          ['Hospedagem', 'Vercel'],
          ['Cartões', 'Itaú, Mercado Livre, Monique, Padrinho'],
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#dfe3e7', margin: 0 }}>
                {editando ? 'Editar categoria' : 'Nova categoria'}
              </h2>
              <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} style={{ fontSize: '18px' }}>✕</button>
            </div>

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
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEmojiPicker(v => !v)}
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    {showEmojiPicker ? 'Fechar' : '😊 Escolher'}
                  </button>
                  {form.icone && (
                    <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, icone: '' })} style={{ color: 'var(--outline)', fontSize: '13px' }}>✕</button>
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
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="button" className="btn-primary" onClick={salvar} disabled={salvando} style={{ flex: 1, justifyContent: 'center', opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
