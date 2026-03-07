import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function Checklist({ eventId }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding]     = useState(false)

  const fetchItems = async () => {
    try { const res = await api.get(`/api/checklist/event/${eventId}`); setItems(res.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchItems() }, [eventId])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    try {
      await api.post('/api/checklist', { title: newTitle.trim(), eventId })
      setNewTitle(''); setAdding(false); await fetchItems()
    } catch (e) { console.error(e) }
  }

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/api/checklist/${id}/toggle`)
      setItems(prev => prev.map(i => i.id === id ? res.data : i))
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/checklist/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) { console.error(e) }
  }

  const done  = items.filter(i => i.done).length
  const total = items.length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  if (loading) return <div style={{ fontSize: 13, color: 'var(--text-label)', padding: '12px 0' }}>Cargando checklist...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--gold)' }}>
          Checklist de producción
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-label)' }}>{done}/{total} completadas</div>
      </div>

      {total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: 'var(--border-row)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s ease',
              background: pct === 100 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, var(--gold), var(--gold-light))',
            }} />
          </div>
          <div style={{ fontSize: 11, color: pct === 100 ? '#22c55e' : 'var(--text-label)', marginTop: 4, textAlign: 'right' }}>
            {pct}%{pct === 100 ? ' ✓ Todo listo' : ''}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {items.length === 0 && !adding && (
          <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>No hay tareas todavía</div>
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

      {adding ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
            placeholder='Nombre de la tarea...'
            style={{ flex: 1, background: 'var(--bg-sunken)', border: '1px solid var(--gold)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
          />
          <button onClick={handleAdd} style={{ padding: '9px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Agregar</button>
          <button onClick={() => { setAdding(false); setNewTitle('') }} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: '9px', border: '1px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-label)', fontSize: 13, cursor: 'pointer' }}>
          + Agregar tarea
        </button>
      )}
    </div>
  )
}