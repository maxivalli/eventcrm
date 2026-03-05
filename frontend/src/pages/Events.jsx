import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const statusColors = {
  'Confirmado':    '#22c55e',
  'En producción': '#3b82f6',
  'Propuesta':     '#f59e0b',
  'Finalizado':    '#8b5cf6',
}
const typeColors = {
  'Corporativo': '#3b82f6',
  'Cultural':    '#8b5cf6',
  'Social':      '#ec4899',
}
const ESTADOS = ['Todos', 'Confirmado', 'En producción', 'Propuesta', 'Finalizado']
const formatCurrency = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const formatDate     = (str) => new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

function Badge({ label, color }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>{label}</span>
}

const emptyForm = { name: '', clientId: '', date: '', venue: '', type: 'Corporativo', status: 'Propuesta', guests: '', budget: '' }

function EventForm({ initial, clients, onSave, onClose }) {
  const [form, setForm] = useState(initial
    ? { ...initial, clientId: String(initial.clientId), date: initial.date?.slice(0, 10) }
    : emptyForm
  )
  const [errors, setErrors] = useState({})
  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())      e.name     = 'Requerido'
    if (!form.clientId)         e.clientId = 'Seleccionar cliente'
    if (!form.date)             e.date     = 'Requerido'
    if (!form.venue.trim())     e.venue    = 'Requerido'
    if (!form.guests || Number(form.guests) <= 0)  e.guests = 'Debe ser mayor a 0'
    if (!form.budget || Number(form.budget) <= 0)  e.budget = 'Debe ser mayor a 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputStyle = (err) => ({ width: '100%', background: '#0d0d18', border: `1px solid ${err ? '#ef4444' : '#1e1e30'}`, borderRadius: 8, padding: '10px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
  const labelStyle = { fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
  const errStyle   = { fontSize: 11, color: '#ef4444', marginTop: 4 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 520, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 24 }}>
          {initial ? 'Editar evento' : 'Nuevo evento'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nombre del evento *</label>
            <input style={inputStyle(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Cliente *</label>
            <select style={inputStyle(errors.clientId)} value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value=''>— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <div style={errStyle}>{errors.clientId}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Venue / Lugar *</label>
            <input style={inputStyle(errors.venue)} value={form.venue} onChange={e => set('venue', e.target.value)} />
            {errors.venue && <div style={errStyle}>{errors.venue}</div>}
          </div>
          <div>
            <label style={labelStyle}>Fecha *</label>
            <input type='date' style={inputStyle(errors.date)} value={form.date} onChange={e => set('date', e.target.value)} />
            {errors.date && <div style={errStyle}>{errors.date}</div>}
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select style={inputStyle()} value={form.type} onChange={e => set('type', e.target.value)}>
              {['Corporativo', 'Cultural', 'Social'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Propuesta', 'Confirmado', 'En producción', 'Finalizado'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Invitados *</label>
            <input type='number' style={inputStyle(errors.guests)} value={form.guests} onChange={e => set('guests', e.target.value)} />
            {errors.guests && <div style={errStyle}>{errors.guests}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Presupuesto estimado (ARS) *</label>
            <input type='number' style={inputStyle(errors.budget)} value={form.budget} onChange={e => set('budget', e.target.value)} />
            {errors.budget && <div style={errStyle}>{errors.budget}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8, background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

function EventDetail({ event, onClose, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 460, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#e8e8f0' }}>{event.name}</div>
            <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 4 }}>{event.client?.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge label={event.type}   color={typeColors[event.type]     || '#5a5a7a'} />
            <Badge label={event.status} color={statusColors[event.status] || '#5a5a7a'} />
          </div>
        </div>
        {[
          { label: 'Fecha',       value: formatDate(event.date)       },
          { label: 'Venue',       value: event.venue                  },
          { label: 'Invitados',   value: `${event.guests} personas`   },
          { label: 'Pres. estimado', value: formatCurrency(event.budget) },
          { label: 'Cliente',     value: event.client?.name           },
        ].map(row => (
          <div key={row.label} style={{ padding: '12px 0', borderBottom: '1px solid #1a1a28', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#4a4a6a' }}>{row.label}</span>
            <span style={{ fontSize: 13, color: '#e8e8f0' }}>{row.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8, background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(event)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

export default function Events() {
  const toast = useToast()
  const [events, setEvents]         = useState([])
  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterEstado, setFilter]   = useState('Todos')
  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchData = async () => {
    try {
      const [evRes, clRes] = await Promise.all([api.get('/api/events'), api.get('/api/clients')])
      setEvents(evRes.data); setClients(clRes.data)
    } catch (e) {
      toast('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = events.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.client?.name.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'Todos' || e.status === filterEstado
    return matchSearch && matchEstado
  })

  const handleSave = async (form) => {
    try {
      const payload = { ...form, clientId: Number(form.clientId), guests: Number(form.guests), budget: Number(form.budget) }
      if (modal === 'new') {
        await api.post('/api/events', payload)
        toast('Evento creado correctamente', 'success')
      } else {
        await api.put(`/api/events/${selected.id}`, payload)
        toast('Evento actualizado', 'success')
      }
      await fetchData(); setModal(null); setSelected(null)
    } catch (e) {
      toast(e.response?.data?.error || 'Error al guardar evento')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/events/${confirmDelete.id}`)
      toast('Evento eliminado', 'success')
      await fetchData()
    } catch (e) {
      toast(e.response?.data?.error || 'Error al eliminar evento')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openDetail = (ev) => { setSelected(ev); setModal('detail') }
  const openEdit   = (ev) => { setSelected(ev); setModal('edit')   }
  const filterBtnStyle = (active) => ({ padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', borderColor: active ? '#c9a84c' : '#1e1e30', background: active ? 'rgba(201,168,76,0.12)' : 'transparent', color: active ? '#c9a84c' : '#5a5a7a' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>Cargando eventos...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>Eventos</div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>{filtered.length} eventos encontrados</div>
        </div>
        <button onClick={() => setModal('new')} style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nuevo evento</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por evento o cliente..."
          style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 8, padding: '9px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', width: 280 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilter(e)} style={filterBtnStyle(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr 130px', padding: '12px 20px', borderBottom: '1px solid #1e1e30', fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Evento</span><span>Cliente</span><span>Fecha</span><span>Venue</span><span>Pres. estimado</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>No se encontraron eventos</div>
        ) : filtered.map((ev, i) => (
          <div key={ev.id} onClick={() => openDetail(ev)}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a28' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#16162a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{ev.name}</div>
              <Badge label={ev.type} color={typeColors[ev.type] || '#5a5a7a'} />
            </div>
            <div style={{ fontSize: 13, color: '#c8c8d8' }}>{ev.client?.name}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{formatDate(ev.date)}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{ev.venue}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{formatCurrency(ev.budget)}</div>
            <Badge label={ev.status} color={statusColors[ev.status] || '#5a5a7a'} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); openEdit(ev) }}
                style={{ padding: '5px 10px', border: '1px solid #1e1e30', borderRadius: 6, background: 'transparent', color: '#5a5a7a', fontSize: 12, cursor: 'pointer' }}>Editar</button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(ev) }}
                style={{ padding: '5px 10px', border: '1px solid #2a1a1a', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {modal === 'new'    && <EventForm clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <EventForm initial={selected} clients={clients} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <EventDetail event={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={ev => { setModal('edit'); setSelected(ev) }} />}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar evento?"
          message={`Esto eliminará "${confirmDelete.name}" y todas sus cotizaciones. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
