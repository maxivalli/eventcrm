import { useState, useEffect } from 'react'
import { Sparkles, Wand2, Search, Plus, X, UtensilsCrossed } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../contexts/AuthContext'

const SECCIONES  = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']
const CATEGORIAS = ['Carnes', 'Fiambres', 'Lácteos', 'Verduras', 'Frutas', 'Almacén', 'Bebidas', 'Panificados', 'Otros']
const UNIDADES   = ['g', 'kg', 'ml', 'l', 'unidad', 'porción', 'rebanada', 'cucharada']

const SECCION_COLORS = {
  'Entrada':         { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)'  },
  'Plato principal': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
  'Guarnición':      { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)'  },
  'Bebidas':         { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.25)'  },
  'Postre':          { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)' },
  'Trasnoche':       { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)'  },
  'Otros':           { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)'  },
}

const SECCION_ICONS = {
  'Entrada': '🥗', 'Plato principal': '🍽', 'Guarnición': '🥦',
  'Bebidas': '🥂', 'Postre': '🍮', 'Trasnoche': '🌙', 'Otros': '◇',
}

const inputStyle = (err) => ({
  width: '100%', background: 'var(--bg-base)',
  border: `1px solid ${err ? 'rgba(239,68,68,0.6)' : 'var(--border)'}`,
  borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
})
const smallInput = {
  background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 7, padding: '7px 10px', color: 'var(--text-primary)',
  fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box',
}
const labelStyle = {
  fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase',
  letterSpacing: 1.2, marginBottom: 5, display: 'block', fontWeight: 700,
}

// ─── IngredientsEditor ────────────────────────────────────────────────────────
function IngredientsEditor({ ingredients, onChange }) {
  const add    = () => onChange([...ingredients, { _id: Date.now(), nombre: '', cantidad: '', unidad: 'g', categoria: 'Otros' }])
  const remove = (id) => onChange(ingredients.filter(i => i._id !== id))
  const update = (id, k, v) => onChange(ingredients.map(i => i._id === id ? { ...i, [k]: v } : i))

  return (
    <div>
      {ingredients.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 110px 28px', gap: 5, marginBottom: 6 }}>
          {['Ingrediente', 'Cant.', 'Unidad', 'Categoría', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>{h}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {ingredients.map(ing => (
          <div key={ing._id} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 110px 28px', gap: 5, alignItems: 'center' }}>
            <input style={smallInput} value={ing.nombre} placeholder="Nombre" onChange={e => update(ing._id, 'nombre', e.target.value)} />
            <input type="number" style={smallInput} value={ing.cantidad} placeholder="0" min={0} step="0.5" onChange={e => update(ing._id, 'cantidad', e.target.value)} />
            <select style={smallInput} value={ing.unidad} onChange={e => update(ing._id, 'unidad', e.target.value)}>
              {UNIDADES.map(u => <option key={u}>{u}</option>)}
            </select>
            <select style={smallInput} value={ing.categoria} onChange={e => update(ing._id, 'categoria', e.target.value)}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => remove(ing._id)} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-faint)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={add} style={{ marginTop: 8, padding: '8px 0', border: '1px dashed var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer', width: '100%' }}>
        + Agregar ingrediente
      </button>
    </div>
  )
}

// ─── DishForm ─────────────────────────────────────────────────────────────────
function DishForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial
    ? { name: initial.name, seccion: initial.seccion, descripcion: initial.descripcion || '', ingredients: (initial.ingredients || []).map(i => ({ ...i, _id: i.id })) }
    : { name: '', seccion: 'Entrada', descripcion: '', ingredients: [] }
  )
  const [errors, setErrors]               = useState({})
  const [aiLoading, setAiLoading]         = useState(false)
  const [aiError, setAiError]             = useState('')
  const [aiDescLoading, setAiDescLoading] = useState(false)
  const [aiDescError, setAiDescError]     = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleAISuggestDesc = async () => {
    if (!form.name.trim()) { setAiDescError('Ingresá el nombre primero'); return }
    if (!form.ingredients.length) { setAiDescError('Agregá ingredientes primero'); return }
    setAiDescLoading(true); setAiDescError('')
    try {
      const res = await api.post('/api/ai/suggest-dish-info', { name: form.name.trim(), ingredients: form.ingredients, seccion: form.seccion })
      if (res.data.descripcion) set('descripcion', res.data.descripcion)
    } catch { setAiDescError('No se pudo generar. Intentá de nuevo.') }
    finally { setAiDescLoading(false) }
  }

  const handleAISuggestIngredients = async () => {
    if (!form.name.trim()) { setAiError('Ingresá el nombre del plato primero'); return }
    setAiLoading(true); setAiError('')
    try {
      const res = await api.post('/api/ai/suggest-ingredients', { name: form.name.trim(), seccion: form.seccion, descripcion: form.descripcion.trim() || null })
      const suggested = res.data.ingredients
      if (!Array.isArray(suggested) || !suggested.length) throw new Error()
      set('ingredients', suggested.map(ing => ({
        _id: Date.now() + Math.random(),
        nombre: ing.nombre || '', cantidad: ing.cantidad || '',
        unidad: UNIDADES.includes(ing.unidad) ? ing.unidad : 'g',
        categoria: CATEGORIAS.includes(ing.categoria) ? ing.categoria : 'Otros',
      })))
    } catch { setAiError('No se pudo generar. Intentá de nuevo.') }
    finally { setAiLoading(false) }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (form.ingredients.some(i => !i.nombre.trim())) e.ingredients = 'Todos deben tener nombre'
    if (form.ingredients.some(i => !i.cantidad || Number(i.cantidad) <= 0)) e.ingredients = 'Todos deben tener cantidad > 0'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      name: form.name.trim(), seccion: form.seccion,
      descripcion: form.descripcion.trim() || null,
      ingredients: form.ingredients.map(({ nombre, cantidad, unidad, categoria }) => ({ nombre, cantidad: Number(cantidad), unidad, categoria })),
    })
  }

  const sc = SECCION_COLORS[form.seccion] || SECCION_COLORS['Otros']

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text-primary)' }}>
              {initial ? 'Editar plato' : 'Nuevo plato'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>
              {initial ? `Modificando "${initial.name}"` : 'Completá los datos del plato'}
            </div>
          </div>
          <button onClick={onCancel} style={{ width: 30, height: 30, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Nombre + Sección */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 12 }}>
          <div>
            <label style={labelStyle}>Nombre del plato *</label>
            <input style={inputStyle(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Tabla de fiambres" />
            {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.name}</div>}
          </div>
          <div>
            <label style={labelStyle}>Sección</label>
            <select style={inputStyle()} value={form.seccion} onChange={e => set('seccion', e.target.value)}>
              {SECCIONES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Badge sección */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 99, width: 'fit-content' }}>
          <span style={{ fontSize: 14 }}>{SECCION_ICONS[form.seccion]}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{form.seccion}</span>
        </div>

        {/* Descripción */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Descripción para el menú</label>
            <button onClick={handleAISuggestDesc} disabled={aiDescLoading || !form.ingredients.length}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: (aiDescLoading || !form.ingredients.length) ? 'not-allowed' : 'pointer',
                border: '1px solid rgba(201,168,76,0.35)',
                background: (aiDescLoading || !form.ingredients.length) ? 'transparent' : 'rgba(201,168,76,0.08)',
                color: (aiDescLoading || !form.ingredients.length) ? 'var(--text-faint)' : 'var(--gold)' }}>
              <Wand2 size={11} />
              {aiDescLoading ? 'Generando...' : 'IA'}
            </button>
          </div>
          <input style={inputStyle()} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción breve para el menú del cliente..." />
          {aiDescError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{aiDescError}</div>}
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Ingredientes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ ...labelStyle, marginBottom: 2, color: errors.ingredients ? '#ef4444' : 'var(--text-faint)' }}>
                Ingredientes por persona
              </div>
              {errors.ingredients && <div style={{ fontSize: 11, color: '#ef4444' }}>{errors.ingredients}</div>}
            </div>
            <button onClick={handleAISuggestIngredients} disabled={aiLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                border: '1px solid rgba(201,168,76,0.35)',
                background: aiLoading ? 'transparent' : 'rgba(201,168,76,0.08)',
                color: aiLoading ? 'var(--text-faint)' : 'var(--gold)' }}>
              <Sparkles size={13} />
              {aiLoading ? 'Generando...' : 'Sugerir con IA'}
            </button>
          </div>
          {aiError && (
            <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
              {aiError}
            </div>
          )}
          {aiLoading && (
            <div style={{ fontSize: 12, color: 'var(--gold)', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
              ✦ Calculando ingredientes y cantidades por persona...
            </div>
          )}
          <IngredientsEditor ingredients={form.ingredients} onChange={v => set('ingredients', v)} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleSave} style={{ flex: 2, padding: '10px 0', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {initial ? 'Guardar cambios' : 'Crear plato'}
        </button>
      </div>
    </div>
  )
}

// ─── DishCard (en la lista izquierda) ─────────────────────────────────────────
function DishCard({ dish, isSelected, onClick, onEdit, onDelete }) {
  const sc = SECCION_COLORS[dish.seccion] || SECCION_COLORS['Otros']
  return (
    <div onClick={onClick} style={{
      background: isSelected ? 'var(--bg-surface)' : 'transparent',
      border: `1px solid ${isSelected ? sc.border : 'transparent'}`,
      borderLeft: `3px solid ${isSelected ? sc.color : 'transparent'}`,
      borderRadius: 9, padding: '11px 13px', cursor: 'pointer', transition: 'all 0.12s',
    }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.borderLeftColor = sc.color }}}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' }}}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dish.name}
          </div>
          {dish.descripcion && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              {dish.descripcion}
            </div>
          )}
        </div>
        {isSelected && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); onEdit(dish) }}
              style={{ padding: '3px 9px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg-base)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
              Editar
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(dish) }}
              style={{ padding: '3px 8px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 5, background: 'transparent', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 99 }}>
          {SECCION_ICONS[dish.seccion]} {dish.seccion}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {dish.ingredients.length} ingr.
        </span>
      </div>
    </div>
  )
}

// ─── DishDetail (panel derecho vista) ────────────────────────────────────────
function DishDetail({ dish, onEdit, onDelete }) {
  const sc = SECCION_COLORS[dish.seccion] || SECCION_COLORS['Otros']

  // Agrupar ingredientes por categoría
  const catGroups = dish.ingredients.reduce((acc, ing) => {
    if (!acc[ing.categoria]) acc[ing.categoria] = []
    acc[ing.categoria].push(ing)
    return acc
  }, {})

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header del detalle */}
      <div style={{ padding: '26px 28px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 99, background: sc.bg, border: `1px solid ${sc.border}`, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>{SECCION_ICONS[dish.seccion]}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: sc.color, textTransform: 'uppercase', letterSpacing: 1.2 }}>{dish.seccion}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {dish.name}
            </div>
            {dish.descripcion && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.65, fontStyle: 'italic' }}>
                "{dish.descripcion}"
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
            <button onClick={() => onEdit(dish)} style={{ padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Editar
            </button>
            <button onClick={() => onDelete(dish)} style={{ padding: '7px 12px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Ingredientes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
        {dish.ingredients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🥄</div>
            <div style={{ fontSize: 13 }}>Sin ingredientes cargados.</div>
            <button onClick={() => onEdit(dish)} style={{ marginTop: 12, padding: '8px 18px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, background: 'rgba(201,168,76,0.06)', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Agregar ingredientes
            </button>
          </div>
        ) : (
          <div>
            {/* Stats rápidos */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
              {[
                { label: 'Total ingredientes', value: dish.ingredients.length },
                { label: 'Categorías', value: Object.keys(catGroups).length },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Lista agrupada por categoría */}
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
              Por persona
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Object.entries(catGroups).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.map(ing => (
                      <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 7, background: 'var(--bg-sunken)' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ing.nombre}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                          {ing.cantidad} {ing.unidad}/pers.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Recetario() {
  const toast = useToast()
  const { isReadonly } = useAuth()
  const [dishes, setDishes]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [formMode, setFormMode]           = useState(null)   // null | 'new' | 'edit'
  const [selected, setSelected]           = useState(null)
  const [editing, setEditing]             = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch]               = useState('')
  const [filterSec, setFilterSec]         = useState('Todos')

  useEffect(() => { fetchDishes() }, [])

  const fetchDishes = async () => {
    try {
      const res = await api.get('/api/dishes')
      setDishes(res.data)
    } catch { toast('Error al cargar recetario') }
    finally { setLoading(false) }
  }

  const handleSave = async (data) => {
    try {
      if (formMode === 'new') {
        const res = await api.post('/api/dishes', data)
        toast('Plato creado', 'success')
        await fetchDishes()
        // Seleccionar el plato recién creado
        setSelected(prev => {
          const all = dishes
          return res.data || null
        })
      } else {
        await api.put(`/api/dishes/${editing.id}`, data)
        toast('Plato actualizado', 'success')
        await fetchDishes()
        setSelected(editing)
      }
      setFormMode(null); setEditing(null)
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/dishes/${confirmDelete.id}`)
      toast('Plato eliminado', 'success')
      if (selected?.id === confirmDelete.id) setSelected(null)
      fetchDishes()
    } catch (e) { toast(e.response?.data?.error || 'Error al eliminar') }
    finally { setConfirmDelete(null) }
  }

  const openEdit  = (dish) => { setEditing(dish); setFormMode('edit') }
  const openNew   = () => { setEditing(null); setFormMode('new'); setSelected(null) }
  const closeForm = () => { setFormMode(null); setEditing(null) }

  const filtered = dishes.filter(d => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase()) ||
               (d.descripcion || '').toLowerCase().includes(search.toLowerCase())
    const mf = filterSec === 'Todos' || d.seccion === filterSec
    return ms && mf
  })

  const grouped = SECCIONES.reduce((acc, s) => {
    const items = filtered.filter(d => d.seccion === s)
    if (items.length) acc[s] = items
    return acc
  }, {})
  const unknownItems = filtered.filter(d => !SECCIONES.includes(d.seccion))
  if (unknownItems.length) grouped['Sin clasificar'] = unknownItems

  // Lo que se muestra en el panel derecho
  const showForm = formMode !== null
  const activeSelectedDish = selected ? dishes.find(d => d.id === selected.id) || selected : null

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header de página ── */}
      <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Recetario</div>
            <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>
              {dishes.length} plato{dishes.length !== 1 ? 's' : ''}
              {filtered.length !== dishes.length && ` · ${filtered.length} visible${filtered.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          {!isReadonly && <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#09090f', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Plus size={14} /> Nuevo plato</button>}
        </div>

        {/* Búsqueda y filtros */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o descripción..."
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px 9px 32px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 280 }} />
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['Todos', ...SECCIONES].map(s => {
              const active = filterSec === s
              const sc = SECCION_COLORS[s]
              return (
                <button key={s} onClick={() => setFilterSec(s)} style={{
                  padding: '6px 12px', borderRadius: 99, border: '1px solid', fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s',
                  borderColor: active ? (sc?.border || 'rgba(201,168,76,0.4)') : 'var(--border)',
                  background:  active ? (sc?.bg    || 'rgba(201,168,76,0.1)') : 'transparent',
                  color:       active ? (sc?.color || 'var(--gold)')           : 'var(--text-faint)',
                }}>
                  {s !== 'Todos' && SECCION_ICONS[s] + ' '}{s}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Split panel ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden', marginTop: 18, borderTop: '1px solid var(--border)' }}>

        {/* ── Lista izquierda ── */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '14px 12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 13 }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🍴</div>
              <div style={{ fontSize: 13 }}>{dishes.length === 0 ? 'No hay platos todavía.' : 'Ningún plato coincide.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(grouped).map(([seccion, items]) => {
                const sc = SECCION_COLORS[seccion] || SECCION_COLORS['Otros']
                return (
                  <div key={seccion}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, padding: '0 4px 6px', borderBottom: `1px solid ${sc.border}` }}>
                      <span style={{ fontSize: 13 }}>{SECCION_ICONS[seccion] || '◇'}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: sc.color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{seccion}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 'auto' }}>{items.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {items.map(dish => (
                        <DishCard
                          key={dish.id}
                          dish={dish}
                          isSelected={!showForm && selected?.id === dish.id}
                          onClick={() => { setSelected(dish); if (formMode === 'new') closeForm() }}
                          onEdit={openEdit}
                          onDelete={setConfirmDelete}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div style={{ overflow: 'hidden', background: 'var(--bg-base)' }}>
          {showForm ? (
            <DishForm
              initial={formMode === 'edit' ? editing : null}
              onSave={handleSave}
              onCancel={closeForm}
            />
          ) : activeSelectedDish ? (
            <DishDetail
              dish={activeSelectedDish}
              onEdit={openEdit}
              onDelete={setConfirmDelete}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', gap: 14 }}>
              <UtensilsCrossed size={40} strokeWidth={1} />
              <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Seleccioná un plato para ver el detalle</div>
              {!isReadonly && <button onClick={openNew} style={{ padding: '9px 20px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, background: 'rgba(201,168,76,0.06)', color: 'var(--gold)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Plus size={14} /> Nuevo plato
              </button>}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar plato?"
          message={`Esto eliminará "${confirmDelete.name}" del recetario permanentemente.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}