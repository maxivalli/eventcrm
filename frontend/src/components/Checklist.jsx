import { useState, useEffect } from 'react'
import api from '../api/axios'

const GROUP_COLORS = {
  'Coordinación': '#c9a84c',
  'Catering':     '#a78bfa',
  'Logística':    '#38bdf8',
  'Decoración':   '#f472b6',
  'Proveedores':  '#fb923c',
  'Cliente':      '#34d399',
  'Cierre':       '#94a3b8',
}

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"/>
  </svg>
)

export default function Checklist({ eventId, event }) {
  const [items, setItems]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [newTitle, setNewTitle]       = useState('')
  const [adding, setAdding]           = useState(false)
  const [error, setError]             = useState('')
  const [aiLoading, setAiLoading]     = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPreview, setAiPreview]     = useState([])
  const [selected, setSelected]       = useState(new Set())
  const [aiSuccess, setAiSuccess]     = useState(false)

  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 3500) }

  const fetchItems = async () => {
    try { const res = await api.get(`/api/checklist/event/${eventId}`); setItems(res.data) }
    catch { showError('No se pudo cargar el checklist') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [eventId])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    try {
      await api.post('/api/checklist', { title: newTitle.trim(), eventId })
      setNewTitle(''); setAdding(false); await fetchItems()
    } catch { showError('No se pudo agregar la tarea') }
  }

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/api/checklist/${id}/toggle`)
      setItems(prev => prev.map(i => i.id === id ? res.data : i))
    } catch { showError('No se pudo actualizar la tarea') }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/checklist/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch { showError('No se pudo eliminar la tarea') }
  }

  const handleGenerateAI = async () => {
    setAiLoading(true)
    setAiPreview([])
    setSelected(new Set())
    try {
      const res = await api.post('/api/ai/generate-checklist', {
        type:   event?.type,
        guests: event?.guests,
        venue:  event?.venue,
        date:   event?.date,
        name:   event?.name,
      })
      setAiPreview(res.data.tasks || [])
      setSelected(new Set(res.data.tasks.map((_, i) => i)))
      setShowAiModal(true)
    } catch {
      showError('No se pudo generar el checklist con IA')
    } finally {
      setAiLoading(false)
    }
  }

  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleImport = async () => {
    const toImport = aiPreview.filter((_, i) => selected.has(i))
    if (toImport.length === 0) return
    try {
      await Promise.all(toImport.map(task =>
        api.post('/api/checklist', { title: task.title, eventId })
      ))
      setShowAiModal(false)
      setAiPreview([])
      setSelected(new Set())
      setAiSuccess(true)
      setTimeout(() => setAiSuccess(false), 3000)
      await fetchItems()
    } catch {
      showError('No se pudieron importar las tareas')
    }
  }

  const done  = items.filter(i => i.done).length
  const total = items.length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: 'var(--text-label)', padding: '12px 0' }}>
        Cargando checklist...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--gold)' }}>
          Checklist de producción
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-label)' }}>{done}/{total} completadas</div>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            title="Generar checklist con IA"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', border: '1px solid var(--gold-border)',
              borderRadius: 7, background: aiLoading ? 'var(--gold-bg)' : 'transparent',
              color: 'var(--gold)', fontSize: 12, fontWeight: 600,
              cursor: aiLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            }}
          >
            {aiLoading
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>✦</span> Generando...</>
              : <><SparkIcon /> Generar con IA</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Éxito import */}
      {aiSuccess && (
        <div style={{ fontSize: 12, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          ✓ Tareas importadas correctamente
        </div>
      )}

      {/* Barra de progreso */}
      {total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: 'var(--border-row)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s ease',
              background: pct === 100
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : 'linear-gradient(90deg, var(--gold), var(--gold-light))',
            }} />
          </div>
          <div style={{ fontSize: 11, color: pct === 100 ? '#22c55e' : 'var(--text-label)', marginTop: 4, textAlign: 'right' }}>
            {pct}%{pct === 100 ? ' ✓ Todo listo' : ''}
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {items.length === 0 && !adding && (
          <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>✦</div>
            <div>No hay tareas todavía</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              Generá un checklist con IA o agregá tareas manualmente
            </div>
          </div>
        )}
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
            background: item.done ? 'rgba(34,197,94,0.04)' : 'var(--bg-sunken)',
            border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
            transition: 'all 0.2s',
          }}>
            <button onClick={() => handleToggle(item.id)} style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${item.done ? '#22c55e' : 'var(--border-strong)'}`,
              background: item.done ? '#22c55e' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>
              {item.done && <span style={{ color: '#09090f', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </button>
            <span style={{
              flex: 1, fontSize: 13,
              color: item.done ? 'var(--text-faint)' : 'var(--text-secondary)',
              textDecoration: item.done ? 'line-through' : 'none', transition: 'all 0.2s',
            }}>{item.title}</span>
            <button onClick={() => handleDelete(item.id)} style={{
              width: 26, height: 26, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
              background: 'rgba(239,68,68,0.06)', color: '#ef4444',
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>×</button>
          </div>
        ))}
      </div>

      {/* Agregar manual */}
      {adding ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
            }}
            placeholder='Nombre de la tarea...'
            style={{ flex: 1, background: 'var(--bg-sunken)', border: '1px solid var(--gold)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
          <button onClick={handleAdd} style={{ padding: '9px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Agregar
          </button>
          <button onClick={() => { setAdding(false); setNewTitle('') }} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '9px', border: '1px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-label)', fontSize: 13, cursor: 'pointer' }}>
          + Agregar tarea
        </button>
      )}

      {/* Modal preview IA */}
      {showAiModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 16, padding: 28, width: '100%', maxWidth: 560,
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ color: 'var(--gold)', fontSize: 16 }}>✦</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: 'var(--text-primary)' }}>
                    Checklist generado por IA
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Seleccioná las tareas que querés importar al evento
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} style={{
                width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 8,
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setSelected(new Set(aiPreview.map((_, i) => i)))}
                style={{ fontSize: 11, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >Seleccionar todo</button>
              <button
                onClick={() => setSelected(new Set())}
                style={{ fontSize: 11, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >Deseleccionar todo</button>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-label)', alignSelf: 'center' }}>
                {selected.size} de {aiPreview.length} seleccionadas
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 4 }}>
              {(() => {
                const grouped = {}
                aiPreview.forEach((task, i) => {
                  const g = task.group || 'General'
                  if (!grouped[g]) grouped[g] = []
                  grouped[g].push({ ...task, idx: i })
                })
                return Object.entries(grouped).map(([group, tasks]) => (
                  <div key={group} style={{ marginBottom: 6 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: GROUP_COLORS[group] || 'var(--text-label)',
                      padding: '4px 0', marginBottom: 4,
                    }}>{group}</div>
                    {tasks.map(({ title, idx }) => (
                      <div
                        key={idx}
                        onClick={() => toggleSelect(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                          background: selected.has(idx) ? 'var(--gold-bg)' : 'var(--bg-sunken)',
                          border: `1px solid ${selected.has(idx) ? 'var(--gold-border)' : 'var(--border)'}`,
                          marginBottom: 4, transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: `2px solid ${selected.has(idx) ? 'var(--gold)' : 'var(--border-strong)'}`,
                          background: selected.has(idx) ? 'var(--gold)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                        }}>
                          {selected.has(idx) && <span style={{ color: '#09090f', fontSize: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: selected.has(idx) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {title}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              })()}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                style={{
                  padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 9,
                  background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >↺ Regenerar</button>
              <button
                onClick={() => setShowAiModal(false)}
                style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 9, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
              >Cancelar</button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                style={{
                  marginLeft: 'auto', padding: '10px 22px', border: 'none', borderRadius: 9,
                  background: selected.size === 0
                    ? 'var(--border)'
                    : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  color: selected.size === 0 ? 'var(--text-faint)' : '#09090f',
                  fontWeight: 700, fontSize: 13,
                  cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >Importar {selected.size > 0 ? `(${selected.size})` : ''}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}