import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const statusColors = {
  'Activo':    '#22c55e',
  'Inactivo':  '#94a3b8',
  'Prospecto': '#f59e0b',
}
const ESTADOS = ['Todos', 'Activo', 'Inactivo', 'Prospecto']

const formatDate = (str) => {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color }}>{label}</span>
  )
}

const emptyForm = { name: '', contact: '', email: '', phone: '', birthdate: '', status: 'Activo' }

function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial
    ? { ...initial, birthdate: initial.birthdate?.slice(0, 10) ?? '' }
    : emptyForm
  )
  const [errors, setErrors] = useState({})
  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Requerido'
    if (!form.contact.trim()) e.contact = 'Requerido'
    if (!form.email.trim())   e.email   = 'Requerido'
    if (!form.phone.trim())   e.phone   = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputStyle = (err) => ({
    width: '100%', background: '#0d0d18',
    border: `1px solid ${err ? '#ef4444' : '#1e1e30'}`,
    borderRadius: 8, padding: '10px 14px', color: '#e8e8f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  })
  const labelStyle = { fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
  const errStyle   = { fontSize: 11, color: '#ef4444', marginTop: 4 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 480, maxWidth: '90vw' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 24 }}>
          {initial ? 'Editar cliente' : 'Nuevo cliente'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nombre / Empresa *</label>
            <input style={inputStyle(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>
          <div>
            <label style={labelStyle}>Contacto *</label>
            <input style={inputStyle(errors.contact)} value={form.contact} onChange={e => set('contact', e.target.value)} />
            {errors.contact && <div style={errStyle}>{errors.contact}</div>}
          </div>
          <div>
            <label style={labelStyle}>Teléfono *</label>
            <input style={inputStyle(errors.phone)} value={form.phone} onChange={e => set('phone', e.target.value)} />
            {errors.phone && <div style={errStyle}>{errors.phone}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle(errors.email)} value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <div style={errStyle}>{errors.email}</div>}
          </div>
          <div>
            <label style={labelStyle}>Fecha de nac. / fundación</label>
            <input type='date' style={inputStyle()} value={form.birthdate} onChange={e => set('birthdate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Activo', 'Inactivo', 'Prospecto'].map(s => <option key={s}>{s}</option>)}
            </select>
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

function ClientDetail({ client, onClose, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 440, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#e8e8f0' }}>{client.name}</div>
            <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 4 }}>{client.contact}</div>
          </div>
          <Badge label={client.status} color={statusColors[client.status] || '#5a5a7a'} />
        </div>
        {[
          { label: 'Email',                    value: client.email },
          { label: 'Teléfono',                 value: client.phone },
          { label: 'Fecha nac. / fundación',   value: formatDate(client.birthdate) },
          { label: 'Eventos',                  value: `${client._count?.events ?? 0} eventos registrados` },
        ].map(row => (
          <div key={row.label} style={{ padding: '12px 0', borderBottom: '1px solid #1a1a28', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#4a4a6a' }}>{row.label}</span>
            <span style={{ fontSize: 13, color: '#e8e8f0' }}>{row.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8, background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(client)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

export default function Clients() {
  const toast = useToast()
  const [clients, setClients]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [modal, setModal]               = useState(null)
  const [selected, setSelected]         = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchClients = async () => {
    try {
      const res = await api.get('/api/clients')
      setClients(res.data)
    } catch (e) {
      toast('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.contact.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'Todos' || c.status === filterEstado
    return matchSearch && matchEstado
  })

  const handleSave = async (form) => {
    try {
      const payload = { ...form, birthdate: form.birthdate || null }
      if (modal === 'new') {
        await api.post('/api/clients', payload)
        toast('Cliente creado correctamente', 'success')
      } else {
        await api.put(`/api/clients/${selected.id}`, payload)
        toast('Cliente actualizado', 'success')
      }
      await fetchClients()
      setModal(null); setSelected(null)
    } catch (e) {
      toast(e.response?.data?.error || 'Error al guardar cliente')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/clients/${confirmDelete.id}`)
      toast('Cliente eliminado', 'success')
      await fetchClients()
    } catch (e) {
      toast(e.response?.data?.error || 'Error al eliminar cliente')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openDetail = (client) => { setSelected(client); setModal('detail') }
  const openEdit   = (client) => { setSelected(client); setModal('edit') }

  const filterBtnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 20, border: '1px solid',
    fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
    borderColor: active ? '#c9a84c' : '#1e1e30',
    background:  active ? 'rgba(201,168,76,0.12)' : 'transparent',
    color:       active ? '#c9a84c' : '#5a5a7a',
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>
      Cargando clientes...
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>Clientes</div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>{filtered.length} clientes encontrados</div>
        </div>
        <button onClick={() => setModal('new')} style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nuevo cliente</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o contacto..."
          style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 8, padding: '9px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', width: 280 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={filterBtnStyle(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr 1.2fr 1fr 130px', padding: '12px 20px', borderBottom: '1px solid #1e1e30', fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Nombre / Empresa</span><span>Contacto</span><span>Email</span><span>Teléfono</span><span>Nac. / Fundación</span><span>Estado</span><span></span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>No se encontraron clientes</div>
        ) : filtered.map((client, i) => (
          <div key={client.id} onClick={() => openDetail(client)}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 1.2fr 1.2fr 1fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a28' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#16162a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{client.name}</div>
              <div style={{ fontSize: 11, color: '#4a4a6a' }}>◆ {client._count?.events ?? 0} eventos</div>
            </div>
            <div style={{ fontSize: 13, color: '#c8c8d8' }}>{client.contact}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{client.email}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{client.phone}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{formatDate(client.birthdate)}</div>
            <Badge label={client.status} color={statusColors[client.status] || '#5a5a7a'} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); openEdit(client) }}
                style={{ padding: '5px 10px', border: '1px solid #1e1e30', borderRadius: 6, background: 'transparent', color: '#5a5a7a', fontSize: 12, cursor: 'pointer' }}>Editar</button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(client) }}
                style={{ padding: '5px 10px', border: '1px solid #2a1a1a', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {modal === 'new'    && <ClientForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <ClientForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <ClientDetail client={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={c => { setModal('edit'); setSelected(c) }} />}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar cliente?"
          message={`Esto eliminará a "${confirmDelete.name}" junto con todos sus eventos y cotizaciones. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
