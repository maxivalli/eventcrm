import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const statusColors = { 'Activo': '#22c55e', 'Inactivo': '#94a3b8', 'Prospecto': '#f59e0b' }
const ESTADOS = ['Todos', 'Activo', 'Inactivo', 'Prospecto']

const formatDate = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Badge({ label, color }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color }}>{label}</span>
}

const inp  = (err) => ({ width: '100%', background: 'var(--bg-sunken)', border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const lbl  = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
const err_ = { fontSize: 11, color: '#ef4444', marginTop: 4 }

const emptyForm = { name: '', contact: '', email: '', phone: '', birthdate: '', status: 'Activo' }

function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, birthdate: initial.birthdate?.slice(0, 10) ?? '' } : emptyForm)
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Requerido'
    if (!form.contact.trim()) e.contact = 'Requerido'
    if (!form.email.trim())   e.email   = 'Requerido'
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
          <div>
            <label style={lbl}>Contacto *</label>
            <input style={inp(errors.contact)} value={form.contact} onChange={e => set('contact', e.target.value)} />
            {errors.contact && <div style={err_}>{errors.contact}</div>}
          </div>
          <div>
            <label style={lbl}>Teléfono *</label>
            <input style={inp(errors.phone)} value={form.phone} onChange={e => set('phone', e.target.value)} />
            {errors.phone && <div style={err_}>{errors.phone}</div>}
          </div>
          <div style={{ gridColumn: '1/-1' }}>
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
              {['Activo', 'Inactivo', 'Prospecto'].map(s => <option key={s}>{s}</option>)}
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

function ClientDetail({ client, onClose, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 440, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--text-primary)' }}>{client.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 4 }}>{client.contact}</div>
          </div>
          <Badge label={client.status} color={statusColors[client.status] || '#5a5a7a'} />
        </div>
        {[
          { label: 'Email',                  value: client.email },
          { label: 'Teléfono',               value: client.phone },
          { label: 'Fecha nac. / fundación', value: formatDate(client.birthdate) },
          { label: 'Eventos',                value: `${client._count?.events ?? 0} eventos registrados` },
        ].map(row => (
          <div key={row.label} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-label)' }}>{row.label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.value}</span>
          </div>
        ))}
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
  const fbtn = (active) => ({ padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', borderColor: active ? 'var(--gold)' : 'var(--border)', background: active ? 'var(--gold-bg)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-label)', fontSize: 14 }}>Cargando clientes...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Clientes</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>{filtered.length} clientes encontrados</div>
        </div>
        <button onClick={() => setModal('new')} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nuevo cliente</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o contacto..."
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 280 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={fbtn(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr 1.2fr 1fr 130px', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Nombre / Empresa</span><span>Contacto</span><span>Email</span><span>Teléfono</span><span>Nac. / Fundación</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No se encontraron clientes</div>
          : filtered.map((client, i) => (
            <div key={client.id} onClick={() => openDetail(client)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr 1.2fr 1fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-row)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
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
              <Badge label={client.status} color={statusColors[client.status] || '#5a5a7a'} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(client) }} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(client) }} style={{ padding: '5px 10px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
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