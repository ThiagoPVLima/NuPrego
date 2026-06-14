'use client';
import { useState } from 'react';
import { useDemoContext } from '@/contexts/DemoContext';
import ModalBase from '@/components/organisms/ModalBase';
import ConfirmarModal from '@/components/molecules/ConfirmarModal';
import Button from '@/components/atoms/Button';

const EMOJIS = ['🍔','🍕','🍜','🍣','🥗','🛒','🧺','🛍️','🏠','🔧','🚗','🚇','⛽','✈️','💊','🏥','💪','🧘','🎮','🎬','🎵','📺','📱','💻','👕','📚','🎓','💰','💳','💵','📈','🐶','🌿','🏖️','⚽','🎁','❤️','⭐'];
const CORES = ['#8083ff','#6edab4','#ffb783','#f87171','#00b8d4','#a78bfa','#34d399','#fbbf24','#f472b6','#908fa0'];

export default function DemoConfiguracoes() {
  const demo = useDemoContext();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', icone: '⭐', cor: '#8083ff' });
  const [confirmandoDelete, setConfirmandoDelete] = useState<number | null>(null);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ nome: '', icone: '⭐', cor: '#8083ff' });
    setShowModal(true);
  };

  const abrirEditar = (c: any) => {
    setEditando(c);
    setForm({ nome: c.nome, icone: c.icone || '⭐', cor: c.cor || '#8083ff' });
    setShowModal(true);
  };

  const salvar = () => {
    if (editando) demo.updateCategoria(editando.id, { nome: form.nome, icone: form.icone, cor: form.cor });
    else demo.addCategoria({ nome: form.nome, icone: form.icone, cor: form.cor });
    setShowModal(false);
  };

  const excluir = (id: number) => {
    demo.deleteCategoria(id);
    setConfirmandoDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <div style={{ color: 'var(--outline)', fontSize: '13px', marginTop: '4px' }}>Categorias · Modo Demo</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: 'var(--on-surface)' }}>Categorias</div>
            <div style={{ fontSize: '12px', color: 'var(--outline)', marginTop: '2px' }}>{demo.categorias.length} categorias</div>
          </div>
          <Button variant="primary" onClick={abrirNovo}>+ Nova categoria</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {demo.categorias.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--clay-input-bg)', border: '1px solid var(--clay-input-border)', borderRadius: '12px', boxShadow: 'var(--clay-input-shadow)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${c.cor}22`, border: `1.5px solid ${c.cor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {c.icone}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>{c.nome}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'JetBrains Mono, monospace' }}>{c.cor}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => abrirEditar(c)} style={{ background: 'var(--surface-high)', border: '1px solid var(--clay-input-border)', color: 'var(--outline)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>✎ Editar</button>
                <button onClick={() => setConfirmandoDelete(c.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmandoDelete !== null && (
        <ConfirmarModal
          mensagem="Excluir categoria?"
          detalhe="As transações vinculadas não serão afetadas."
          textoConfirmar="Excluir"
          confirmando={false}
          onConfirmar={() => excluir(confirmandoDelete)}
          onCancelar={() => setConfirmandoDelete(null)}
        />
      )}

      {showModal && (
        <ModalBase title={editando ? 'Editar categoria' : 'Nova categoria'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>NOME</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Alimentação" />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>ÍCONE</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setForm({ ...form, icone: e })} style={{ width: '36px', height: '36px', fontSize: '18px', background: form.icone === e ? 'var(--primary-dark)' : 'var(--surface-high)', border: `1.5px solid ${form.icone === e ? 'var(--primary)' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--outline)', display: 'block', marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>COR</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CORES.map(cor => (
                  <button key={cor} onClick={() => setForm({ ...form, cor })} style={{ width: '30px', height: '30px', background: cor, borderRadius: '50%', border: form.cor === cor ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button variant="secondary" fullWidth onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" fullWidth onClick={salvar}>{editando ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </ModalBase>
      )}
    </div>
  );
}
