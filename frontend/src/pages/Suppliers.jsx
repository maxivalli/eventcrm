import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const statusColors = { 'Activo': '#22c55e', 'Inactivo': '#94a3b8' }
const categoryIcons = { 'Técnica': '🔊', 'Catering': '🍽️', 'Decoración': '💐', 'Seguridad': '🛡️', 'Audiovisual': '🎬', 'Logística': '🚛' }
const CATEGORIAS = ['Todas', 'Técnica', 'Catering', 'Decoración', 'Seguridad', 'Audiovisual', 'Logística']
const ESTADOS    = ['Todos', 'Activo', 'Inactivo']

function Badge({ label, color }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>{label}</span>
}

function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: 13, color: i < rating ? '#c9a84c' : '#2a2a40' }}>★</span>
      ))}
    </div>
  )
}

const emptyForm = { name: '', category: 'Técnica', contact: '', phone: '', email: '', rating: 3, status: 'Activo' }

function SupplierForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm)
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

  const inputStyle = (err) => ({ width: '100%', background: '#0d0d18', border: `1px solid ${err ? '#ef4444' : '#1e1e30'}`, borderRadius: 8, padding: '10px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
  const labelStyle = { fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
  const errStyle   = { fontSize: 11, color: '#ef4444', marginTop: 4 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 480, maxWidth: '90vw' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 24 }}>
          {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nombre *</label>
            <input style={inputStyle(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>
          <div>
            <label style={labelStyle}>Categoría</label>
            <select style={inputStyle()} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select style={inputStyle()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Activo', 'Inactivo'].map(s => <option key={s}>{s}</option>)}
            </select>
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
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Calificación</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => set('rating', n)} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: n <= form.rating ? '#c9a84c' : '#2a2a40', transition: 'color 0.15s' }}>★</button>
              ))}
            </div>
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

function SupplierDetail({ supplier, onClose, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#12121e', border: '1px solid #2a2a40', borderRadius: 18, padding: 32, width: 440, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0d0d18', border: '1px solid #1e1e30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{categoryIcons[supplier.category] || '📦'}</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#e8e8f0' }}>{supplier.name}</div>
              <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 2 }}>{supplier.category}</div>
            </div>
          </div>
          <Badge label={supplier.status} color={statusColors[supplier.status] || '#5a5a7a'} />
        </div>
        <div style={{ marginBottom: 16 }}><Stars rating={supplier.rating} /></div>
        {[
          { label: 'Contacto', value: supplier.contact },
          { label: 'Teléfono', value: supplier.phone   },
          { label: 'Email',    value: supplier.email   },
        ].map(row => (
          <div key={row.label} style={{ padding: '12px 0', borderBottom: '1px solid #1a1a28', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#4a4a6a' }}>{row.label}</span>
            <span style={{ fontSize: 13, color: '#e8e8f0' }}>{row.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8, background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(supplier)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const toast = useToast()
  const [suppliers, setSuppliers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('Todas')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers')
      setSuppliers(res.data)
    } catch (e) {
      toast('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, [])

  const filtered = suppliers.filter(s => {
    const matchSearch  = s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase())
    const matchCat     = filterCat    === 'Todas' || s.category === filterCat
    const matchEstado  = filterEstado === 'Todos' || s.status   === filterEstado
    return matchSearch && matchCat && matchEstado
  })

  const handleSave = async (form) => {
    try {
      const payload = { ...form, rating: Number(form.rating) }
      if (modal === 'new') {
        await api.post('/api/suppliers', payload)
        toast('Proveedor creado correctamente', 'success')
      } else {
        await api.put(`/api/suppliers/${selected.id}`, payload)
        toast('Proveedor actualizado', 'success')
      }
      await fetchSuppliers(); setModal(null); setSelected(null)
    } catch (e) {
      toast(e.response?.data?.error || 'Error al guardar proveedor')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/suppliers/${confirmDelete.id}`)
      toast('Proveedor eliminado', 'success')
      await fetchSuppliers()
    } catch (e) {
      toast(e.response?.data?.error || 'Error al eliminar proveedor')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openDetail = (s) => { setSelected(s); setModal('detail') }
  const openEdit   = (s) => { setSelected(s); setModal('edit')   }
  const filterBtnStyle = (active) => ({ padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', borderColor: active ? '#c9a84c' : '#1e1e30', background: active ? 'rgba(201,168,76,0.12)' : 'transparent', color: active ? '#c9a84c' : '#5a5a7a' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>Cargando proveedores...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>Proveedores</div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>{filtered.length} proveedores encontrados</div>
        </div>
        <button onClick={() => setModal('new')} style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nuevo proveedor</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o contacto..."
          style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 8, padding: '9px 14px', color: '#e8e8f0', fontSize: 13, outline: 'none', width: 280 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIAS.map(c => <button key={c} onClick={() => setFilterCat(c)} style={filterBtnStyle(filterCat === c)}>{categoryIcons[c] || ''} {c}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={filterBtnStyle(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 130px', padding: '12px 20px', borderBottom: '1px solid #1e1e30', fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Proveedor</span><span>Categoría</span><span>Contacto</span><span>Email</span><span>Calificación</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>No se encontraron proveedores</div>
        ) : filtered.map((s, i) => (
          <div key={s.id} onClick={() => openDetail(s)}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a28' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#16162a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{categoryIcons[s.category] || '📦'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{s.name}</span>
            </div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{s.category}</div>
            <div style={{ fontSize: 13, color: '#c8c8d8' }}>{s.contact}</div>
            <div style={{ fontSize: 12, color: '#5a5a7a' }}>{s.email}</div>
            <Stars rating={s.rating} />
            <Badge label={s.status} color={statusColors[s.status] || '#5a5a7a'} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); openEdit(s) }}
                style={{ padding: '5px 10px', border: '1px solid #1e1e30', borderRadius: 6, background: 'transparent', color: '#5a5a7a', fontSize: 12, cursor: 'pointer' }}>Editar</button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(s) }}
                style={{ padding: '5px 10px', border: '1px solid #2a1a1a', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {modal === 'new'    && <SupplierForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <SupplierForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <SupplierDetail supplier={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={s => { setModal('edit'); setSelected(s) }} />}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar proveedor?"
          message={`Esto eliminará a "${confirmDelete.name}" de tu lista de proveedores. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
