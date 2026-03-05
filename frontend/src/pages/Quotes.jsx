import { useState, useEffect } from 'react'
import api from '../api/axios'

// --- Helpers ---
const statusColors = {
  'Aprobado':    '#22c55e',
  'En revisión': '#3b82f6',
  'Pendiente':   '#f59e0b',
  'Rechazado':   '#ef4444',
}

const ESTADOS = ['Todos', 'Aprobado', 'En revisión', 'Pendiente', 'Rechazado']

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const calcTotal = (items) =>
  items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)

const formatDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
      background: `${color}20`, color, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

// --- Editor de ítems ---
function ItemsEditor({ items, onChange }) {
  const addItem = () =>
    onChange([...items, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }])

  const removeItem = (id) =>
    onChange(items.filter(i => i.id !== id))

  const updateItem = (id, key, val) =>
    onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i))

  const inputStyle = {
    background: '#0d0d18', border: '1px solid #1e1e30', borderRadius: 6,
    padding: '8px 10px', color: '#e8e8f0', fontSize: 12,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '3fr 80px 120px 100px 32px',
        gap: 8, marginBottom: 8,
        fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1,
      }}>
        <span>Descripción</span><span>Cant.</span><span>Precio unit.</span><span>Subtotal</span><span></span>
      </div>

      {items.map(item => (
        <div key={item.id} style={{
          display: 'grid', gridTemplateColumns: '3fr 80px 120px 100px 32px',
          gap: 8, marginBottom: 8, alignItems: 'center',
        }}>
          <input
            style={inputStyle} value={item.description}
            placeholder="Descripción del servicio"
            onChange={e => updateItem(item.id, 'description', e.target.value)}
          />
          <input
            type='number' style={inputStyle} value={item.quantity}
            onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
          />
          <input
            type='number' style={inputStyle} value={item.unitPrice}
            onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
          />
          <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 600, textAlign: 'right' }}>
            {formatCurrency(item.quantity * item.unitPrice)}
          </div>
          <button onClick={() => removeItem(item.id)} style={{
            width: 28, height: 28, border: '1px solid #2a2a40', borderRadius: 6,
            background: 'transparent', color: '#ef4444', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      ))}

      <button onClick={addItem} style={{
        marginTop: 8, padding: '7px 14px', border: '1px dashed #2a2a40',
        borderRadius: 8, background: 'transparent', color: '#4a4a6a',
        fontSize: 12, cursor: 'pointer', width: '100%',
      }}>+ Agregar ítem</button>

      <div style={{
        marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e1e30',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#22c55e', fontFamily: "'Playfair Display', serif" }}>
          {formatCurrency(calcTotal(items))}
        </span>
      </div>
    </div>
  )
}

// --- Formulario ---
const emptyForm = { eventId: '', date: '', status: 'Pendiente', items: [] }

function QuoteForm({ initial, events, onSave, onClose }) {
  const [form, setForm] = useState(initial
    ? { ...initial, eventId: String(initial.eventId), date: initial.date?.slice(0, 10) }
    : emptyForm
  )
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const inputStyle = {
    width: '100%', background: '#0d0d18', border: '1px solid #1e1e30',
    borderRadius: 8, padding: '10px 14px', color: '#e8e8f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 5, display: 'block',
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18,
        padding: 32, width: 620, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 24 }}>
          {initial ? 'Editar cotización' : 'Nueva cotización'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Evento</label>
            <select style={inputStyle} value={form.eventId} onChange={e => set('eventId', e.target.value)}>
              <option value=''>— Seleccionar evento —</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fecha</label>
            <input type='date' style={inputStyle} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Pendiente', 'En revisión', 'Aprobado', 'Rechazado'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Ítems
          </div>
          <ItemsEditor items={form.items} onChange={val => set('items', val)} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#5a5a7a', fontSize: 13,
          }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{
            flex: 1, padding: 11, border: 'none', borderRadius: 8,
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            color: '#09090f', fontWeight: 600, fontSize: 13,
          }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// --- Detalle ---
function QuoteDetail({ quote, onClose, onEdit }) {
  const total = calcTotal(quote.items)
  const color = statusColors[quote.status] || '#5a5a7a'

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18,
        padding: 32, width: 540, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#4a4a6a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              COT-{String(quote.id).padStart(4, '0')}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#e8e8f0' }}>{quote.event?.name}</div>
            <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 4 }}>
              {quote.event?.client?.name} · {formatDate(quote.date)}
            </div>
          </div>
          <Badge label={quote.status} color={color} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '3fr 60px 120px 110px',
            padding: '8px 0', borderBottom: '1px solid #1e1e30', marginBottom: 4,
            fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1,
          }}>
            <span>Descripción</span>
            <span style={{ textAlign: 'center' }}>Cant.</span>
            <span style={{ textAlign: 'right' }}>Precio unit.</span>
            <span style={{ textAlign: 'right' }}>Subtotal</span>
          </div>
          {quote.items.map(item => (
            <div key={item.id} style={{
              display: 'grid', gridTemplateColumns: '3fr 60px 120px 110px',
              padding: '10px 0', borderBottom: '1px solid #1a1a28', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: '#c8c8d8' }}>{item.description}</span>
              <span style={{ fontSize: 12, color: '#5a5a7a', textAlign: 'center' }}>{item.quantity}</span>
              <span style={{ fontSize: 12, color: '#5a5a7a', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', textAlign: 'right' }}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14,
          }}>
            <span style={{ fontSize: 13, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', fontFamily: "'Playfair Display', serif" }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#5a5a7a', fontSize: 13,
          }}>Cerrar</button>
          <button onClick={() => onEdit(quote)} style={{
            flex: 1, padding: 11, border: 'none', borderRadius: 8,
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            color: '#09090f', fontWeight: 600, fontSize: 13,
          }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

// --- Página principal ---
export default function Quotes() {
  const [quotes, setQuotes]       = useState([])
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterEstado, setFilter] = useState('Todos')
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)

  const fetchData = async () => {
    try {
      const [qRes, evRes] = await Promise.all([
        api.get('/api/quotes'),
        api.get('/api/events'),
      ])
      setQuotes(qRes.data)
      setEvents(evRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = quotes.filter(q => {
    const matchSearch = q.event?.name.toLowerCase().includes(search.toLowerCase()) ||
                        q.event?.client?.name.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'Todos' || q.status === filterEstado
    return matchSearch && matchEstado
  })

  const handleSave = async (form) => {
    try {
      const payload = {
        ...form,
        eventId: Number(form.eventId),
        items: form.items.map(({ description, quantity, unitPrice }) => ({
          description, quantity: Number(quantity), unitPrice: Number(unitPrice)
        }))
      }
      if (modal === 'new') {
        await api.post('/api/quotes', payload)
      } else {
        await api.put(`/api/quotes/${selected.id}`, payload)
      }
      await fetchData()
    } catch (e) {
      console.error(e)
    }
    setModal(null)
    setSelected(null)
  }

  const openDetail = (q) => { setSelected(q); setModal('detail') }
  const openEdit   = (q) => { setSelected(q); setModal('edit')   }

  const filterBtnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 20, border: '1px solid',
    fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
    borderColor: active ? '#c9a84c' : '#1e1e30',
    background:  active ? 'rgba(201,168,76,0.12)' : 'transparent',
    color:       active ? '#c9a84c' : '#5a5a7a',
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>
      Cargando cotizaciones...
    </div>
  )

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>Cotizaciones</div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>{filtered.length} cotizaciones encontradas</div>
        </div>
        <button onClick={() => setModal('new')} style={{
          background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', border: 'none',
          borderRadius: 8, padding: '10px 20px', color: '#09090f',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ Nueva cotización</button>
      </div>

      {/* Buscador y filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por evento o cliente..."
          style={{
            background: '#12121e', border: '1px solid #1e1e30', borderRadius: 8,
            padding: '9px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', width: 280,
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFilter(e)} style={filterBtnStyle(filterEstado === e)}>{e}</button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 2fr 1.5fr 1fr 1.2fr 1fr 80px',
          padding: '12px 20px', borderBottom: '1px solid #1e1e30',
          fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1,
        }}>
          <span>#</span><span>Evento</span><span>Cliente</span>
          <span>Fecha</span><span>Total</span><span>Estado</span><span></span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>
            No se encontraron cotizaciones
          </div>
        ) : filtered.map((q, i) => (
          <div key={q.id}
            onClick={() => openDetail(q)}
            style={{
              display: 'grid', gridTemplateColumns: '60px 2fr 1.5fr 1fr 1.2fr 1fr 80px',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: i < filtered.length - 1 ? '1px solid #1a1a28' : 'none',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#16162a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontSize: 11, color: '#4a4a6a', fontWeight: 600 }}>
              {String(q.id).padStart(4, '0')}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{q.event?.name}</div>
            <div style={{ fontSize: 13, color: '#c8c8d8' }}>{q.event?.client?.name}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{formatDate(q.date)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{formatCurrency(calcTotal(q.items))}</div>
            <Badge label={q.status} color={statusColors[q.status] || '#5a5a7a'} />
            <button
              onClick={e => { e.stopPropagation(); openEdit(q) }}
              style={{
                padding: '6px 12px', border: '1px solid #1e1e30', borderRadius: 6,
                background: 'transparent', color: '#5a5a7a', fontSize: 12, cursor: 'pointer',
              }}
            >Editar</button>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal === 'new' && (
        <QuoteForm events={events} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal === 'edit' && selected && (
        <QuoteForm initial={selected} events={events} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />
      )}
      {modal === 'detail' && selected && (
        <QuoteDetail
          quote={selected}
          onClose={() => { setModal(null); setSelected(null) }}
          onEdit={(q) => { setModal('edit'); setSelected(q) }}
        />
      )}
    </div>
  )
}