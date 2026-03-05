import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const statusColors = { 'Aprobado': '#22c55e', 'En revisión': '#3b82f6', 'Pendiente': '#f59e0b', 'Rechazado': '#ef4444' }
const kindColors   = { 'General': '#8b5cf6', 'Catering': '#f97316' }
const ESTADOS = ['Todos', 'Aprobado', 'En revisión', 'Pendiente', 'Rechazado']
const KINDS   = ['Todos', 'General', 'Catering']

const formatCurrency = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const formatDate     = (str) => new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const calcTotal = (quote) => {
  const itemsTotal = (quote.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const cateringBase = quote.kind === 'Catering' ? (quote.covers || 0) * (quote.pricePerCover || 0) : 0
  return cateringBase + itemsTotal
}

function Badge({ label, color }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>{label}</span>
}

// ── Items editor (usado tanto en General como para extras de Catering) ──────
function ItemsEditor({ items, onChange, label = 'Ítems' }) {
  const addItem    = () => onChange([...items, { id: `new-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (id) => onChange(items.filter(i => i.id !== id))
  const updateItem = (id, key, val) => onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i))
  const inputStyle = { background: '#0d0d18', border: '1px solid #1e1e30', borderRadius: 6, padding: '8px 10px', color: '#e8e8f0', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 80px 120px 100px 32px', gap: 8, marginBottom: 8, fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>
        <span>{label}</span><span>Cant.</span><span>Precio unit.</span><span>Subtotal</span><span></span>
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 120px 100px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input style={inputStyle} value={item.description} placeholder="Descripción" onChange={e => updateItem(item.id, 'description', e.target.value)} />
          <input type='number' style={inputStyle} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
          <input type='number' style={inputStyle} value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} />
          <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(item.quantity * item.unitPrice)}</div>
          <button onClick={() => removeItem(item.id)} style={{ width: 28, height: 28, border: '1px solid #2a2a40', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      ))}
      <button onClick={addItem} style={{ marginTop: 8, padding: '7px 14px', border: '1px dashed #2a2a40', borderRadius: 8, background: 'transparent', color: '#4a4a6a', fontSize: 12, cursor: 'pointer', width: '100%' }}>+ Agregar</button>
    </div>
  )
}

// ── Formulario ───────────────────────────────────────────────────────────────
const emptyGeneral  = { clientId: '', eventId: '', kind: 'General',  date: '', status: 'Pendiente', items: [] }
const emptyCatering = { clientId: '', eventId: '', kind: 'Catering', date: '', status: 'Pendiente', menu: '', covers: '', pricePerCover: '', items: [] }

function QuoteForm({ initial, events, clients, onSave, onClose }) {
  const initialClientId = initial
    ? String(events.find(ev => ev.id === initial.eventId)?.client?.id ?? '')
    : ''

  const [form, setForm] = useState(initial
    ? { ...initial, clientId: initialClientId, eventId: String(initial.eventId), date: initial.date?.slice(0, 10), items: initial.items || [] }
    : emptyGeneral
  )
  const [errors, setErrors] = useState({})

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })) }

  const setKind = (kind) => setForm(f => ({
    ...(kind === 'Catering' ? emptyCatering : emptyGeneral),
    clientId: f.clientId,
    eventId:  f.eventId,
    date:     f.date,
    status:   f.status,
    kind,
  }))

  const setClient = (clientId) => {
    setForm(f => ({ ...f, clientId, eventId: '' }))
    setErrors(e => ({ ...e, clientId: '', eventId: '' }))
  }

  const clientEvents = form.clientId
    ? events.filter(ev => String(ev.client?.id) === form.clientId)
    : []

  const itemsTotal    = (form.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const cateringBase  = form.kind === 'Catering' ? (Number(form.covers) || 0) * (Number(form.pricePerCover) || 0) : 0
  const total         = cateringBase + itemsTotal

  const validate = () => {
    const e = {}
    if (!form.clientId) e.clientId = 'Seleccionar cliente'
    if (!form.eventId)  e.eventId  = 'Seleccionar evento'
    if (form.kind === 'General') {
      if (!form.items || form.items.length === 0) e.items = 'Debe agregar al menos un ítem'
      else if (form.items.some(i => !i.description.trim())) e.items = 'Todos los ítems deben tener descripción'
    }
    if (form.kind === 'Catering') {
      if (!form.covers || Number(form.covers) <= 0)         e.covers        = 'Requerido'
      if (!form.pricePerCover || Number(form.pricePerCover) <= 0) e.pricePerCover = 'Requerido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputStyle = (err) => ({ width: '100%', background: '#0d0d18', border: `1px solid ${err ? '#ef4444' : '#1e1e30'}`, borderRadius: 8, padding: '10px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
  const labelStyle = { fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
  const errStyle   = { fontSize: 11, color: '#ef4444', marginTop: 4 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 640, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 24 }}>
          {initial ? 'Editar cotización' : 'Nueva cotización'}
        </div>

        {/* Tipo de cotización */}
        {!initial && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['General', 'Catering'].map(k => (
              <button key={k} onClick={() => setKind(k)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                border: `1px solid ${form.kind === k ? kindColors[k] : '#1e1e30'}`,
                background: form.kind === k ? `${kindColors[k]}18` : 'transparent',
                color: form.kind === k ? kindColors[k] : '#5a5a7a',
              }}>{k}</button>
            ))}
          </div>
        )}

        {/* Cliente + Evento */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Cliente *</label>
            <select style={inputStyle(errors.clientId)} value={form.clientId} onChange={e => setClient(e.target.value)}>
              <option value=''>— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <div style={errStyle}>{errors.clientId}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ ...labelStyle, color: !form.clientId ? '#2a2a40' : '#4a4a6a' }}>Evento *</label>
            <select
              disabled={!form.clientId}
              style={{ ...inputStyle(errors.eventId), opacity: !form.clientId ? 0.4 : 1, cursor: !form.clientId ? 'not-allowed' : 'pointer' }}
              value={form.eventId} onChange={e => set('eventId', e.target.value)}
            >
              <option value=''>
                {!form.clientId ? '— Primero seleccioná un cliente —' : clientEvents.length === 0 ? '— Este cliente no tiene eventos —' : '— Seleccionar evento —'}
              </option>
              {clientEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            {errors.eventId && <div style={errStyle}>{errors.eventId}</div>}
          </div>
          <div>
            <label style={labelStyle}>Fecha</label>
            <input type='date' style={inputStyle()} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Pendiente', 'En revisión', 'Aprobado', 'Rechazado'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Sección General ── */}
        {form.kind === 'General' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: errors.items ? '#ef4444' : '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Ítems {errors.items && `— ${errors.items}`}
            </div>
            <ItemsEditor items={form.items} onChange={val => set('items', val)} label='Descripción' />
          </div>
        )}

        {/* ── Sección Catering ── */}
        {form.kind === 'Catering' && (
          <div style={{ marginBottom: 20 }}>

            {/* Menú */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Menú / descripción de platos</label>
              <textarea
                rows={3}
                value={form.menu}
                onChange={e => set('menu', e.target.value)}
                placeholder="Ej: Entrada fría, plato principal con guarnición, postre..."
                style={{ width: '100%', background: '#0d0d18', border: '1px solid #1e1e30', borderRadius: 8, padding: '10px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Cubiertos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Cantidad de cubiertos *</label>
                <input type='number' style={inputStyle(errors.covers)} value={form.covers} onChange={e => set('covers', e.target.value)} />
                {errors.covers && <div style={errStyle}>{errors.covers}</div>}
              </div>
              <div>
                <label style={labelStyle}>Precio por cubierto (ARS) *</label>
                <input type='number' style={inputStyle(errors.pricePerCover)} value={form.pricePerCover} onChange={e => set('pricePerCover', e.target.value)} />
                {errors.pricePerCover && <div style={errStyle}>{errors.pricePerCover}</div>}
              </div>
            </div>

            {/* Subtotal cubiertos */}
            {cateringBase > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0d0d18', borderRadius: 8, marginBottom: 20, border: '1px solid #1e1e30' }}>
                <span style={{ fontSize: 12, color: '#4a4a6a' }}>{form.covers} cubiertos × {formatCurrency(form.pricePerCover)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>{formatCurrency(cateringBase)}</span>
              </div>
            )}

            {/* Extras */}
            <div style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Extras (barra, torta, mesa dulce, etc.)
            </div>
            <ItemsEditor items={form.items} onChange={val => set('items', val)} label='Descripción del extra' />
          </div>
        )}

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #1e1e30', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', fontFamily: "'Playfair Display', serif" }}>{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8, background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ── Detalle ──────────────────────────────────────────────────────────────────
function QuoteDetail({ quote, onClose, onEdit }) {
  const total = calcTotal(quote)
  const cateringBase = quote.kind === 'Catering' ? (quote.covers || 0) * (quote.pricePerCover || 0) : 0
  const color = statusColors[quote.status] || '#5a5a7a'
  const kindColor = kindColors[quote.kind] || '#5a5a7a'

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 560, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#4a4a6a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>COT-{String(quote.id).padStart(4, '0')}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#e8e8f0' }}>{quote.event?.name}</div>
            <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 4 }}>{quote.event?.client?.name} · {formatDate(quote.date)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
            <Badge label={quote.kind}   color={kindColor} />
            <Badge label={quote.status} color={color} />
          </div>
        </div>

        {/* Catering: menú y cubiertos */}
        {quote.kind === 'Catering' && (
          <div style={{ marginBottom: 20 }}>
            {quote.menu && (
              <div style={{ background: '#0d0d18', border: '1px solid #1e1e30', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Menú</div>
                <div style={{ fontSize: 13, color: '#c8c8d8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{quote.menu}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#0d0d18', borderRadius: 10, border: '1px solid #1e1e30', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Cubiertos</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{quote.covers}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Precio por cubierto</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{formatCurrency(quote.pricePerCover)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Subtotal cubiertos</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{formatCurrency(cateringBase)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Ítems (generales o extras de catering) */}
        {quote.items.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {quote.kind === 'Catering' ? 'Extras' : 'Ítems'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 60px 120px 110px', padding: '8px 0', borderBottom: '1px solid #1e1e30', marginBottom: 4, fontSize: 10, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>
              <span>Descripción</span><span style={{ textAlign: 'center' }}>Cant.</span><span style={{ textAlign: 'right' }}>Precio unit.</span><span style={{ textAlign: 'right' }}>Subtotal</span>
            </div>
            {quote.items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 60px 120px 110px', padding: '10px 0', borderBottom: '1px solid #1a1a28', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#c8c8d8' }}>{item.description}</span>
                <span style={{ fontSize: 12, color: '#5a5a7a', textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ fontSize: 12, color: '#5a5a7a', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', textAlign: 'right' }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', fontFamily: "'Playfair Display', serif" }}>{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8, background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(quote)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Quotes() {
  const toast = useToast()
  const [quotes, setQuotes]       = useState([])
  const [events, setEvents]       = useState([])
  const [clients, setClients]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterKind,   setFilterKind]   = useState('Todos')
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchData = async () => {
    try {
      const [qRes, evRes, clRes] = await Promise.all([api.get('/api/quotes'), api.get('/api/events'), api.get('/api/clients')])
      setQuotes(qRes.data); setEvents(evRes.data); setClients(clRes.data)
    } catch (e) {
      toast('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = quotes.filter(q => {
    const matchSearch  = q.event?.name.toLowerCase().includes(search.toLowerCase()) ||
                         q.event?.client?.name.toLowerCase().includes(search.toLowerCase())
    const matchEstado  = filterEstado === 'Todos' || q.status === filterEstado
    const matchKind    = filterKind   === 'Todos' || q.kind   === filterKind
    return matchSearch && matchEstado && matchKind
  })

  const handleSave = async (form) => {
    try {
      const payload = {
        kind:     form.kind,
        eventId:  Number(form.eventId),
        date:     form.date || undefined,
        status:   form.status,
        menu:          form.kind === 'Catering' ? (form.menu || null)                  : null,
        covers:        form.kind === 'Catering' ? Number(form.covers)                  : null,
        pricePerCover: form.kind === 'Catering' ? Number(form.pricePerCover)           : null,
        items: (form.items || []).map(({ description, quantity, unitPrice }) => ({
          description, quantity: Number(quantity), unitPrice: Number(unitPrice)
        }))
      }
      if (modal === 'new') {
        await api.post('/api/quotes', payload)
        toast('Cotización creada correctamente', 'success')
      } else {
        await api.put(`/api/quotes/${selected.id}`, payload)
        toast('Cotización actualizada', 'success')
      }
      await fetchData(); setModal(null); setSelected(null)
    } catch (e) {
      toast(e.response?.data?.error || 'Error al guardar cotización')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/quotes/${confirmDelete.id}`)
      toast('Cotización eliminada', 'success')
      await fetchData()
    } catch (e) {
      toast(e.response?.data?.error || 'Error al eliminar cotización')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openDetail = (q) => { setSelected(q); setModal('detail') }
  const openEdit   = (q) => { setSelected(q); setModal('edit')   }
  const filterBtnStyle = (active, color) => ({
    padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
    borderColor: active ? (color || '#c9a84c') : '#1e1e30',
    background:  active ? `${color || '#c9a84c'}18` : 'transparent',
    color:       active ? (color || '#c9a84c') : '#5a5a7a',
  })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>Cargando cotizaciones...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>Cotizaciones</div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>{filtered.length} cotizaciones encontradas</div>
        </div>
        <button onClick={() => setModal('new')} style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nueva cotización</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por evento o cliente..."
          style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 8, padding: '9px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', width: 260 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {KINDS.map(k => <button key={k} onClick={() => setFilterKind(k)} style={filterBtnStyle(filterKind === k, k === 'General' ? '#8b5cf6' : k === 'Catering' ? '#f97316' : null)}>{k}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={filterBtnStyle(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1.5fr 1.5fr 1fr 1.2fr 1fr 130px', padding: '12px 20px', borderBottom: '1px solid #1e1e30', fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>#</span><span>Tipo</span><span>Evento</span><span>Cliente</span><span>Fecha</span><span>Total</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>No se encontraron cotizaciones</div>
        ) : filtered.map((q, i) => (
          <div key={q.id} onClick={() => openDetail(q)}
            style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1.5fr 1.5fr 1fr 1.2fr 1fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a28' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#16162a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontSize: 11, color: '#4a4a6a', fontWeight: 600 }}>{String(q.id).padStart(4, '0')}</div>
            <Badge label={q.kind} color={kindColors[q.kind] || '#5a5a7a'} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{q.event?.name}</div>
            <div style={{ fontSize: 13, color: '#c8c8d8' }}>{q.event?.client?.name}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{formatDate(q.date)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{formatCurrency(calcTotal(q))}</div>
            <Badge label={q.status} color={statusColors[q.status] || '#5a5a7a'} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); openEdit(q) }}
                style={{ padding: '5px 10px', border: '1px solid #1e1e30', borderRadius: 6, background: 'transparent', color: '#5a5a7a', fontSize: 12, cursor: 'pointer' }}>Editar</button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(q) }}
                style={{ padding: '5px 10px', border: '1px solid #2a1a1a', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {modal === 'new'    && <QuoteForm events={events} clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <QuoteForm initial={selected} events={events} clients={clients} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <QuoteDetail quote={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={q => { setModal('edit'); setSelected(q) }} />}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar cotización?"
          message={`Esto eliminará la cotización COT-${String(confirmDelete.id).padStart(4,'0')} del evento "${confirmDelete.event?.name}". Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
