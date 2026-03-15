import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, Plus, Search } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import SkeletonTable from '../components/SkeletonTable'
import { useAuth } from '../contexts/AuthContext'

const statusColors = { 'Activo': '#22c55e', 'Inactivo': '#94a3b8' }
const ESTADOS = ['Todos', 'Activo', 'Inactivo']

const formatDate = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Badge({ label, color, style = {} }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}40`, whiteSpace: 'nowrap', letterSpacing: 0.3, ...style }}>{label}</span>
}

const inp  = (err) => ({ width: '100%', background: 'var(--bg-sunken)', border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const lbl  = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
const err_ = { fontSize: 11, color: '#ef4444', marginTop: 4 }

const emptyForm = { name: '', contact: '', email: '', phone: '', birthdate: '', status: 'Inactivo' }

function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, birthdate: initial.birthdate?.slice(0, 10) ?? '' } : emptyForm)
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  // ── Picker de contactos ──
  const [contacts,     setContacts]     = useState([])
  const [contactQuery, setContactQuery] = useState(initial?.contact || '')
  const [suggestions,  setSuggestions]  = useState([])
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const pickerRef = useRef()

  useEffect(() => {
    api.get('/api/contacts').then(r => setContacts(r.data)).catch(() => {})
  }, [])

  // Sincronizar query cuando se abre en modo edición
  useEffect(() => { setContactQuery(form.contact) }, [])

  const handleContactInput = (val) => {
    setContactQuery(val)
    set('contact', val)
    if (val.trim().length < 1) { setSuggestions([]); setPickerOpen(false); return }
    const q = val.toLowerCase()
    const matches = contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    ).slice(0, 6)
    setSuggestions(matches)
    setPickerOpen(matches.length > 0)
  }

  const applyContact = (c) => {
    setContactQuery(c.name)
    set('contact', c.name)
    if (c.phone && !form.phone) set('phone', c.phone)
    if (c.email && !form.email) set('email', c.email)
    setSuggestions([])
    setPickerOpen(false)
  }

  // Cerrar al click afuera
  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Requerido'
    if (!form.contact.trim()) e.contact = 'Requerido'
    if (!form.email.trim())   e.email   = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    if (!form.phone.trim())   e.phone   = 'Requerido'
    setErrors(e); return Object.keys(e).length === 0
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 480, maxWidth: '90vw' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--gold)', marginBottom: 24 }}>
          {initial ? 'Editar cliente' : 'Nuevo cliente'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Nombre / Empresa *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div style={err_}>{errors.name}</div>}
          </div>

          {/* Contacto con picker de agenda */}
          <div style={{ gridColumn: '1/-1', position: 'relative' }} ref={pickerRef}>
            <label style={lbl}>
              Contacto *
              {contacts.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  — escribí para buscar en agenda ({contacts.length} contactos)
                </span>
              )}
            </label>
            <input
              style={inp(errors.contact)}
              value={contactQuery}
              onChange={e => handleContactInput(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setPickerOpen(true) }}
              placeholder="Nombre de la persona de contacto"
              autoComplete="off"
            />
            {errors.contact && <div style={err_}>{errors.contact}</div>}

            {/* Dropdown de sugerencias */}
            {pickerOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 400,
                background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                borderRadius: 10, marginTop: 4, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                {suggestions.map(c => (
                  <div
                    key={c.id}
                    onMouseDown={() => applyContact(c)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-row)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                      {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{c.phone}</span>}
                      {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{c.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Teléfono *</label>
            <input style={inp(errors.phone)} value={form.phone} onChange={e => set('phone', e.target.value)} />
            {errors.phone && <div style={err_}>{errors.phone}</div>}
          </div>
          <div>
            <label style={lbl}>Email *</label>
            <input style={inp(errors.email)} value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <div style={err_}>{errors.email}</div>}
          </div>
          <div>
            <label style={lbl}>Fecha de nac. / fundación</label>
            <input type="date" style={inp()} value={form.birthdate} onChange={e => set('birthdate', e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Activo', 'Inactivo'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

const eventStatusColors = {
  'Confirmado':    '#22c55e',
  'Propuesta':     '#f59e0b',
  'Finalizado':    '#8b5cf6',
}

function ClientDetail({ client, onClose, onEdit }) {
  const navigate = useNavigate()
  const [events, setEvents]     = useState([])
  const [loadingEvs, setLoadingEvs] = useState(false)

  useEffect(() => {
    if ((client._count?.events ?? 0) === 0) return
    setLoadingEvs(true)
    api.get(`/api/clients/${client.id}`)
      .then(res => setEvents(res.data.events ?? []))
      .catch(() => toast('Error al cargar eventos del cliente'))
      .finally(() => setLoadingEvs(false))
  }, [client.id])

  const goToEvent = (ev) => {
    onClose()
    navigate('/events', { state: { openEventId: ev.id } })
  }

  const hasEvents = (client._count?.events ?? 0) > 0

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 500, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--text-primary)' }}>{client.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 4 }}>{client.contact}</div>
          </div>
        </div>

        {/* Info básica */}
        {/* Teléfono */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-label)', flexShrink: 0 }}>Teléfono</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{client.phone}</span>
            <button onClick={() => {
              let phone = (client.phone || '').replace(/[\s\-().+]/g, '')
              if (phone.startsWith('0')) phone = phone.slice(1)
              if (!phone.startsWith('54')) phone = '54' + phone
              window.open(`https://wa.me/${phone}`, '_blank')
            }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25d366', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Email */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-label)', flexShrink: 0 }}>Email</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{client.email}</span>
            <button onClick={() => window.open(`mailto:${client.email}`, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Fecha */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-label)' }}>Fecha nac. / fundación</span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{formatDate(client.birthdate)}</span>
        </div>
        {/* Estado */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-label)' }}>Estado</span>
          <Badge label={client.status} color={statusColors[client.status] || '#5a5a7a'} />
        </div>

        {/* Sección de eventos */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Eventos · {client._count?.events ?? 0}
          </div>

          {!hasEvents && (
            <div style={{ padding: '14px 0', fontSize: 13, color: 'var(--text-faint)', textAlign: 'center' }}>
              Sin eventos registrados
            </div>
          )}

          {hasEvents && loadingEvs && (
            <div style={{ padding: '14px 0', fontSize: 13, color: 'var(--text-faint)', textAlign: 'center' }}>
              Cargando eventos...
            </div>
          )}

          {hasEvents && !loadingEvs && events.map(ev => (
            <div
              key={ev.id}
              onClick={() => goToEvent(ev)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', borderRadius: 10, marginBottom: 6,
                background: 'var(--bg-sunken)', cursor: 'pointer',
                border: '1px solid var(--border)', transition: 'background 0.15s',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{ev.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatDate(ev.date)} · {ev.venue}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Badge label={ev.status} color={eventStatusColors[ev.status] || '#5a5a7a'} />
                <span style={{ fontSize: 18, color: 'var(--text-faint)', lineHeight: 1 }}>›</span>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(client)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

export default function Clients() {
  const toast = useToast()
  const { isReadonly } = useAuth()
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchClients = async () => {
    try { const res = await api.get('/api/clients'); setClients(res.data) }
    catch { toast('Error al cargar clientes') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchClients() }, [])

  const filtered = clients.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase())
    const mf = filterEstado === 'Todos' || c.status === filterEstado
    return ms && mf
  })

  const handleSave = async (form) => {
    try {
      const payload = { ...form, birthdate: form.birthdate || null }
      if (modal === 'new') { await api.post('/api/clients', payload); toast('Cliente creado correctamente', 'success') }
      else { await api.put(`/api/clients/${selected.id}`, payload); toast('Cliente actualizado', 'success') }
      await fetchClients(); setModal(null); setSelected(null)
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar cliente') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/api/clients/${confirmDelete.id}`); toast('Cliente eliminado', 'success'); await fetchClients() }
    catch (e) { toast(e.response?.data?.error || 'Error al eliminar cliente') }
    finally { setConfirmDelete(null) }
  }

  const openDetail = c => { setSelected(c); setModal('detail') }
  const openEdit   = c => { setSelected(c); setModal('edit') }
  const estadoColor = { 'Activo': '#22c55e', 'Inactivo': '#94a3b8', 'Todos': 'var(--gold)' }
  const fbtn = (active, estado) => {
    const c = estadoColor[estado] || 'var(--gold)'
    return { padding: '6px 14px', borderRadius: 99, border: '1px solid', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s',
      borderColor: active ? `${c}60` : 'var(--border)',
      background:  active ? `${c}15` : 'transparent',
      color:       active ? c : 'var(--text-faint)' }
  }

  if (loading) return <SkeletonTable cols={[
    { width: '2fr' }, { width: '1.5fr' }, { width: '2fr' },
    { width: '1.2fr' }, { width: '1.2fr' }, { width: '1.5fr' }, { width: '130px', skeletonWidth: '50%' },
  ]} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Clientes</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}{filtered.length !== clients.length ? ` de ${clients.length}` : ''}</div>
        </div>
        {!isReadonly && <button onClick={() => setModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Plus size={14} /> Nuevo cliente</button>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o contacto..."
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px 9px 32px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 280 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={fbtn(filterEstado === e, e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr 1.2fr 1.5fr 130px', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Nombre / Empresa</span><span>Contacto</span><span>Email</span><span>Teléfono</span><span>Nac. / Fundación</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No se encontraron clientes</div>
          : filtered.map((client, i) => (
            <div key={client.id} onClick={() => openDetail(client)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr 1.2fr 1.5fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-row)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-label)' }}>◆ {client._count?.events ?? 0} eventos</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{client.contact}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(client.birthdate)}</div>
              <Badge label={client.status} color={statusColors[client.status] || '#5a5a7a'} style={{ marginRight: 16 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(client) }} style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(client) }} style={{ padding: '5px 10px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal === 'new'    && <ClientForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <ClientForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <ClientDetail client={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={c => { setModal('edit'); setSelected(c) }} />}
      {confirmDelete && <ConfirmDialog title="¿Eliminar cliente?" message={`Esto eliminará a "${confirmDelete.name}" junto con todos sus eventos y cotizaciones. Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  )
}