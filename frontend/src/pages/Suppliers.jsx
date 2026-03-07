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
        <span key={i} style={{ fontSize: 13, color: i < rating ? 'var(--gold)' : 'var(--border-strong)' }}>★</span>
      ))}
    </div>
  )
}

const emptyForm = { name: '', category: 'Técnica', contact: '', phone: '', email: '', rating: 3, status: 'Activo' }

const inp  = (err) => ({ width: '100%', background: 'var(--bg-sunken)', border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const lbl  = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
const err_ = { fontSize: 11, color: '#ef4444', marginTop: 4 }

function SupplierForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm)
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
          {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Nombre *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <div style={err_}>{errors.name}</div>}
          </div>
          <div>
            <label style={lbl}>Categoría</label>
            <select style={inp()} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Activo', 'Inactivo'].map(s => <option key={s}>{s}</option>)}
            </select>
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
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Calificación</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => set('rating', n)} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: n <= form.rating ? 'var(--gold)' : 'var(--border-strong)', transition: 'color 0.15s' }}>★</button>
              ))}
            </div>
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

function SupplierDetail({ supplier, onClose, onEdit }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 440, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{categoryIcons[supplier.category] || '📦'}</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text-primary)' }}>{supplier.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 2 }}>{supplier.category}</div>
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
          <div key={row.label} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-label)' }}>{row.label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(supplier)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

export default function Suppliers() {
  const toast = useToast()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchSuppliers = async () => {
    try { const res = await api.get('/api/suppliers'); setSuppliers(res.data) }
    catch { toast('Error al cargar proveedores') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchSuppliers() }, [])

  const filtered = suppliers.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase())
    const mc = filterCat    === 'Todas' || s.category === filterCat
    const mf = filterEstado === 'Todos' || s.status   === filterEstado
    return ms && mc && mf
  })

  const handleSave = async (form) => {
    try {
      const payload = { ...form, rating: Number(form.rating) }
      if (modal === 'new') { await api.post('/api/suppliers', payload); toast('Proveedor creado correctamente', 'success') }
      else { await api.put(`/api/suppliers/${selected.id}`, payload); toast('Proveedor actualizado', 'success') }
      await fetchSuppliers(); setModal(null); setSelected(null)
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar proveedor') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/api/suppliers/${confirmDelete.id}`); toast('Proveedor eliminado', 'success'); await fetchSuppliers() }
    catch (e) { toast(e.response?.data?.error || 'Error al eliminar proveedor') }
    finally { setConfirmDelete(null) }
  }

  const openDetail = s => { setSelected(s); setModal('detail') }
  const openEdit   = s => { setSelected(s); setModal('edit') }
  const fbtn = (active) => ({ padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', borderColor: active ? 'var(--gold)' : 'var(--border)', background: active ? 'var(--gold-bg)' : 'transparent', color: active ? 'var(--gold)' : 'var(--text-muted)' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-label)', fontSize: 14 }}>Cargando proveedores...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Proveedores</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>{filtered.length} proveedores encontrados</div>
        </div>
        <button onClick={() => setModal('new')} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nuevo proveedor</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o contacto..."
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 280 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIAS.map(c => <button key={c} onClick={() => setFilterCat(c)} style={fbtn(filterCat === c)}>{categoryIcons[c] || ''} {c}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={fbtn(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 130px', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>Proveedor</span><span>Categoría</span><span>Contacto</span><span>Email</span><span>Calificación</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No se encontraron proveedores</div>
          : filtered.map((s, i) => (
            <div key={s.id} onClick={() => openDetail(s)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 130px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-row)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{categoryIcons[s.category] || '📦'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.category}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.contact}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
              <Stars rating={s.rating} />
              <Badge label={s.status} color={statusColors[s.status] || '#5a5a7a'} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(s) }} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(s) }} style={{ padding: '5px 10px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal === 'new'    && <SupplierForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <SupplierForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <SupplierDetail supplier={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={s => { setModal('edit'); setSelected(s) }} />}
      {confirmDelete && <ConfirmDialog title="¿Eliminar proveedor?" message={`Esto eliminará a "${confirmDelete.name}" de tu lista de proveedores. Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  )
}