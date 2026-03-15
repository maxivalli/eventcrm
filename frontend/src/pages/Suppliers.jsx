import { useState, useEffect } from 'react'
import { Volume2, UtensilsCrossed, Flower2, Shield, Clapperboard, Truck, Package, Plus, Search } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const statusColors = { 'Activo': '#22c55e', 'Inactivo': '#94a3b8' }

const CATEGORY_META = {
  'Técnica':     { icon: Volume2,       color: '#3b82f6' },
  'Catering':    { icon: UtensilsCrossed,color: '#a78bfa' },
  'Decoración':  { icon: Flower2,       color: '#f472b6' },
  'Seguridad':   { icon: Shield,        color: '#f59e0b' },
  'Audiovisual': { icon: Clapperboard,  color: '#22d3ee' },
  'Logística':   { icon: Truck,         color: '#4ade80' },
}
const CATEGORIAS = ['Todas', ...Object.keys(CATEGORY_META)]
const ESTADOS    = ['Todos', 'Activo', 'Inactivo']

const estadoColor = { 'Activo': '#22c55e', 'Inactivo': '#94a3b8', 'Todos': 'var(--gold)' }

function CategoryIcon({ category, size = 16, style = {} }) {
  const meta = CATEGORY_META[category]
  if (!meta) return <Package size={size} style={style} />
  const Icon = meta.icon
  return <Icon size={size} style={style} />
}

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}40`, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
      {label}
    </span>
  )
}

function Stars({ rating, size = 13 }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: size, color: i < rating ? 'var(--gold)' : 'var(--border-strong)', lineHeight: 1 }}>★</span>
      ))}
    </div>
  )
}

const inp  = (err) => ({ width: '100%', background: 'var(--bg-sunken)', border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const lbl  = { fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5, display: 'block', fontWeight: 700 }
const err_ = { fontSize: 11, color: '#ef4444', marginTop: 4 }
const emptyForm = { name: '', category: 'Técnica', contact: '', phone: '', email: '', alias: '', rating: 3, status: 'Activo' }

// ── Modal Formulario ────────────────────────────────────────────────────────
function SupplierForm({ initial, onSave, onClose }) {
  const [form, setForm]   = useState(initial || emptyForm)
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

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
          {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Nombre *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
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
            <label style={lbl}>Alias de transferencia</label>
            <input style={inp()} value={form.alias || ''} onChange={e => set('alias', e.target.value)} placeholder="ej: proveedor.empresa" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Calificación</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => set('rating', n)}
                  style={{ fontSize: 26, background: 'none', border: 'none', cursor: 'pointer',
                    color: n <= form.rating ? 'var(--gold)' : 'var(--border-strong)', transition: 'color 0.1s', lineHeight: 1, padding: '2px 4px' }}>★</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Detalle ───────────────────────────────────────────────────────────
function SupplierDetail({ supplier, onClose, onEdit }) {
  const [copied, setCopied] = useState(false)

  const openWhatsApp = () => {
    let p = (supplier.phone || '').replace(/[\s\-().+]/g, '')
    if (p.startsWith('0')) p = p.slice(1)
    if (!p.startsWith('54')) p = '54' + p
    window.open(`https://wa.me/${p}`, '_blank')
  }

  const copyAlias = () => {
    navigator.clipboard.writeText(supplier.alias).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const catMeta = CATEGORY_META[supplier.category]
  const catColor = catMeta?.color || '#94a3b8'

  const row = (label, content) => (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>{label}</span>
      {content}
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 460, maxWidth: '90vw' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${catColor}15`, border: `1px solid ${catColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon category={supplier.category} size={22} style={{ color: catColor }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text-primary)' }}>{supplier.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{supplier.category}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <Badge label={supplier.status} color={statusColors[supplier.status] || '#5a5a7a'} />
            <Stars rating={supplier.rating} />
          </div>
        </div>

        {/* Filas */}
        {row('Contacto', <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{supplier.contact}</span>)}

        {row('Teléfono',
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{supplier.phone}</span>
            <button onClick={openWhatsApp} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25d366', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
              </svg>
              WhatsApp
            </button>
          </div>
        )}

        {row('Email',
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{supplier.email}</span>
            <button onClick={() => window.open(`mailto:${supplier.email}`, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Correo
            </button>
          </div>
        )}

        {supplier.alias && row('Alias transferencia',
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{supplier.alias}</span>
            <button onClick={copyAlias} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
              background: copied ? 'rgba(34,197,94,0.08)' : 'var(--bg-sunken)',
              color: copied ? '#22c55e' : 'var(--text-muted)' }}>
              {copied
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              }
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(supplier)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function Suppliers() {
  const toast = useToast()
  const [suppliers, setSuppliers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterCat, setFilterCat]       = useState('Todas')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [modal, setModal]               = useState(null)
  const [selected, setSelected]         = useState(null)
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
      if (modal === 'new') { await api.post('/api/suppliers', payload); toast('Proveedor creado', 'success') }
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

  // Filtro por categoría — color semántico de la categoría
  const catBtn = (cat, active) => {
    const c = cat === 'Todas' ? 'var(--gold)' : (CATEGORY_META[cat]?.color || 'var(--gold)')
    const border = active ? `${c}55` : 'var(--border)'
    const bg     = active ? `${c}15` : 'transparent'
    const color  = active ? c : 'var(--text-faint)'
    return { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 99, border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }
  }

  // Filtro por estado — color semántico del estado
  const estadoBtn = (estado, active) => {
    const c = estadoColor[estado] || 'var(--gold)'
    return { padding: '6px 14px', borderRadius: 99, border: `1px solid ${active ? `${c}55` : 'var(--border)'}`, background: active ? `${c}15` : 'transparent', color: active ? c : 'var(--text-faint)', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-faint)', fontSize: 13 }}>Cargando proveedores...</div>

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Proveedores</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>
            {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}{filtered.length !== suppliers.length ? ` de ${suppliers.length}` : ''}
          </div>
        </div>
        <button onClick={() => setModal('new')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#09090f', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Nuevo proveedor
        </button>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor..."
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px 9px 32px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 230 }} />
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

        {/* Categorías */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CATEGORIAS.map(cat => {
            const meta = CATEGORY_META[cat]
            const Icon = meta?.icon
            return (
              <button key={cat} onClick={() => setFilterCat(cat)} style={catBtn(cat, filterCat === cat)}>
                {Icon && <Icon size={12} />}
                {cat}
              </button>
            )
          })}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

        {/* Estados */}
        <div style={{ display: 'flex', gap: 5 }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFilterEstado(e)} style={estadoBtn(e, filterEstado === e)}>{e}</button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 110px', columnGap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
          {['Proveedor', 'Categoría', 'Contacto', 'Email', 'Calificación', 'Estado', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
            No se encontraron proveedores
          </div>
        ) : filtered.map((s, i) => {
          const meta  = CATEGORY_META[s.category]
          const Icon  = meta?.icon || Package
          const color = meta?.color || '#94a3b8'
          return (
            <div key={s.id} onClick={() => openDetail(s)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1fr 1fr 110px', columnGap: 12, padding: '13px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

              {/* Nombre con ícono */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.category}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.contact}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
              <Stars rating={s.rating} size={12} />
              <Badge label={s.status} color={statusColors[s.status] || '#5a5a7a'} />

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(s)}
                  style={{ padding: '5px 11px', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  Editar
                </button>
                <button onClick={() => setConfirmDelete(s)}
                  style={{ padding: '5px 9px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modal === 'new'    && <SupplierForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <SupplierForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <SupplierDetail supplier={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={s => { setModal('edit'); setSelected(s) }} />}
      {confirmDelete && <ConfirmDialog title="¿Eliminar proveedor?" message={`Esto eliminará a "${confirmDelete.name}" de tu lista de proveedores. Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  )
}