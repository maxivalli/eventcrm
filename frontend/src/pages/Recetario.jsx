import { useState, useEffect } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const SECCIONES   = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']
const CATEGORIAS  = ['Carnes', 'Fiambres', 'Lácteos', 'Verduras', 'Frutas', 'Almacén', 'Bebidas', 'Panificados', 'Otros']
const UNIDADES    = ['g', 'kg', 'ml', 'l', 'unidad', 'porción', 'rebanada', 'cucharada']

const SECCION_COLORS = {
  'Entrada':    '#3b82f6',
  'Plato principal': '#8b5cf6',
  'Guarnición':      '#22c55e',
  'Bebidas':         '#06b6d4',
  'Postre':          '#ec4899',
  'Trasnoche':       '#f97316',
  'Otros':           '#6b7280',
}

const inp = (err) => ({
  width: '100%', background: 'var(--bg-sunken)',
  border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`,
  borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
})
const inpS = {
  background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '7px 10px', color: 'var(--text-primary)',
  fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box',
}
const lbl = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }

function IngredientsEditor({ ingredients, onChange }) {
  const add = () => onChange([...ingredients, { _id: Date.now(), nombre: '', cantidad: '', unidad: 'g', categoria: 'Otros' }])
  const remove = (id) => onChange(ingredients.filter(i => i._id !== id))
  const update = (id, k, v) => onChange(ingredients.map(i => i._id === id ? { ...i, [k]: v } : i))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 90px 120px 32px', gap: 6, marginBottom: 8, fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
        <span>Ingrediente</span><span>Cant./pers.</span><span>Unidad</span><span>Categoría</span><span></span>
      </div>
      {ingredients.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '8px 0' }}>Sin ingredientes. Agregá uno abajo.</div>
      )}
      {ingredients.map(ing => (
        <div key={ing._id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 90px 120px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input style={inpS} value={ing.nombre} placeholder="Ej: Fiambre" onChange={e => update(ing._id, 'nombre', e.target.value)} />
          <input type="number" style={inpS} value={ing.cantidad} placeholder="0" min={0} step="0.5" onChange={e => update(ing._id, 'cantidad', e.target.value)} />
          <select style={inpS} value={ing.unidad} onChange={e => update(ing._id, 'unidad', e.target.value)}>
            {UNIDADES.map(u => <option key={u}>{u}</option>)}
          </select>
          <select style={inpS} value={ing.categoria} onChange={e => update(ing._id, 'categoria', e.target.value)}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => remove(ing._id)} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      ))}
      <button onClick={add} style={{ marginTop: 6, padding: '7px 14px', border: '1px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-label)', fontSize: 12, cursor: 'pointer', width: '100%' }}>
        + Agregar ingrediente
      </button>
    </div>
  )
}

function DishForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial
    ? {
        name: initial.name,
        seccion: initial.seccion,
        descripcion: initial.descripcion || '',
        ingredients: (initial.ingredients || []).map(i => ({ ...i, _id: i.id })),
      }
    : { name: '', seccion: 'Entrada', descripcion: '', ingredients: [] }
  )
  const [errors, setErrors]         = useState({})
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiError, setAiError]       = useState('')
  const [aiNameLoading, setAiNameLoading] = useState(false)
  const [aiNameError, setAiNameError]     = useState('')
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleAISuggestName = async () => {
    if (!form.name.trim()) { setAiNameError('Ingresá el nombre del plato primero'); return }
    if (form.ingredients.length === 0) { setAiNameError('Agregá al menos un ingrediente primero'); return }
    setAiNameLoading(true); setAiNameError('')
    try {
      const res = await api.post('/api/ai/suggest-dish-info', {
        name: form.name.trim(),
        ingredients: form.ingredients,
        seccion: form.seccion,
      })
      if (res.data.descripcion) set('descripcion', res.data.descripcion)
    } catch {
      setAiNameError('No se pudo generar la descripción. Intentá de nuevo.')
    } finally {
      setAiNameLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (form.ingredients.some(i => !i.nombre.trim())) e.ingredients = 'Todos los ingredientes deben tener nombre'
    if (form.ingredients.some(i => !i.cantidad || Number(i.cantidad) <= 0)) e.ingredients = 'Todos los ingredientes deben tener cantidad mayor a 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      name: form.name.trim(),
      seccion: form.seccion,
      descripcion: form.descripcion.trim() || null,
      ingredients: form.ingredients.map(({ nombre, cantidad, unidad, categoria }) => ({ nombre, cantidad: Number(cantidad), unidad, categoria })),
    })
  }

  const handleAISuggest = async () => {
    if (!form.name.trim()) { setAiError('Ingresá el nombre del plato primero'); return }
    setAiLoading(true); setAiError('')
    try {
      const res = await api.post('/api/ai/suggest-ingredients', {
        name: form.name.trim(),
        seccion: form.seccion,
        descripcion: form.descripcion.trim() || null,
      })

      const suggested = res.data.ingredients
      if (!Array.isArray(suggested) || suggested.length === 0) throw new Error('Respuesta inválida')

      const newIngredients = suggested.map(ing => ({
        _id: Date.now() + Math.random(),
        nombre: ing.nombre || '',
        cantidad: ing.cantidad || '',
        unidad: UNIDADES.includes(ing.unidad) ? ing.unidad : 'g',
        categoria: CATEGORIAS.includes(ing.categoria) ? ing.categoria : 'Otros',
      }))

      set('ingredients', newIngredients)
    } catch {
      setAiError('No se pudo generar la sugerencia. Intentá de nuevo.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 16, padding: 28 }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--gold)', marginBottom: 20 }}>
        {initial ? 'Editar plato' : 'Nuevo plato'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={lbl}>Nombre del plato *</label>
          <input style={inp(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Tabla de fiambres con papas" />
          {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.name}</div>}
        </div>
        <div>
          <label style={lbl}>Sección</label>
          <select style={inp()} value={form.seccion} onChange={e => set('seccion', e.target.value)}>
            {SECCIONES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Descripción para el menú</label>
            <button
              onClick={handleAISuggestName}
              disabled={aiNameLoading || form.ingredients.length === 0}
              title={form.ingredients.length === 0 ? 'Agregá ingredientes primero' : 'Generar descripción a partir del nombre e ingredientes'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 6,
                cursor: (aiNameLoading || form.ingredients.length === 0) ? 'not-allowed' : 'pointer',
                border: '1px solid rgba(201,168,76,0.4)',
                background: (aiNameLoading || form.ingredients.length === 0) ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.1)',
                color: (aiNameLoading || form.ingredients.length === 0) ? 'var(--text-faint)' : 'var(--gold)',
                fontSize: 11, fontWeight: 600,
              }}
            >
              <Wand2 size={11} />
              {aiNameLoading ? 'Generando...' : 'Generar con IA'}
            </button>
          </div>
          <input style={inp()} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción libre del plato..." />
          {aiNameError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{aiNameError}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: errors.ingredients ? '#ef4444' : 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            Ingredientes por persona {errors.ingredients && `— ${errors.ingredients}`}
          </div>
          <button
            onClick={handleAISuggest}
            disabled={aiLoading}
            title="Generá la lista de ingredientes automáticamente con IA"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, cursor: aiLoading ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(201,168,76,0.4)',
              background: aiLoading ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.1)',
              color: aiLoading ? 'var(--text-faint)' : 'var(--gold)',
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
            }}
          >
            {aiLoading ? <Sparkles size={13} /> : <Sparkles size={13} />}
            {aiLoading ? 'Generando...' : 'Sugerir ingredientes con IA'}
          </button>
        </div>

        {aiError && (
          <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
            {aiError}
          </div>
        )}

        {aiLoading && (
          <div style={{ fontSize: 12, color: 'var(--gold)', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
            Analizando el plato y calculando cantidades por persona...
          </div>
        )}

        <IngredientsEditor ingredients={form.ingredients} onChange={v => set('ingredients', v)} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={handleSave} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          {initial ? 'Guardar cambios' : 'Crear plato'}
        </button>
      </div>
    </div>
  )
}

export default function Recetario() {
  const toast = useToast()
  const [dishes, setDishes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState('list') // 'list' | 'new' | 'edit'
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch]   = useState('')
  const [filterSec, setFilterSec] = useState('Todos')

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
      if (view === 'new') {
        await api.post('/api/dishes', data)
        toast('Plato creado', 'success')
      } else {
        await api.put(`/api/dishes/${selected.id}`, data)
        toast('Plato actualizado', 'success')
      }
      setView('list'); setSelected(null)
      fetchDishes()
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/dishes/${confirmDelete.id}`)
      toast('Plato eliminado', 'success')
      fetchDishes()
    } catch (e) { toast(e.response?.data?.error || 'Error al eliminar') }
    finally { setConfirmDelete(null) }
  }

  const filtered = dishes.filter(d => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase())
    const mf = filterSec === 'Todos' || d.seccion === filterSec
    return ms && mf
  })

  // Agrupar por sección — incluye secciones desconocidas (datos viejos en DB)
  const knownGrouped = SECCIONES.reduce((acc, s) => {
    const items = filtered.filter(d => d.seccion === s)
    if (items.length > 0) acc[s] = items
    return acc
  }, {})
  const unknownItems = filtered.filter(d => !SECCIONES.includes(d.seccion))
  const grouped = unknownItems.length > 0
    ? { ...knownGrouped, 'Sin clasificar': unknownItems }
    : knownGrouped

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-label)' }}>Cargando recetario...</div>

  if (view === 'new' || view === 'edit') {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Recetario</div>
        </div>
        <DishForm initial={view === 'edit' ? selected : null} onSave={handleSave} onCancel={() => { setView('list'); setSelected(null) }} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Recetario</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>{dishes.length} platos guardados</div>
        </div>
        <button onClick={() => setView('new')} style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Nuevo plato
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plato..."
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 240 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Todos', ...SECCIONES].map(s => (
            <button key={s} onClick={() => setFilterSec(s)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer',
              borderColor: filterSec === s ? (SECCION_COLORS[s] || 'var(--gold)') : 'var(--border)',
              background:  filterSec === s ? `${SECCION_COLORS[s] || 'var(--gold)'}18` : 'transparent',
              color:       filterSec === s ? (SECCION_COLORS[s] || 'var(--gold)') : 'var(--text-muted)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Sin platos */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)', fontSize: 14 }}>
          {dishes.length === 0 ? 'No hay platos en el recetario. Creá el primero.' : 'No hay platos que coincidan.'}
        </div>
      )}

      {/* Listado por sección */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(grouped).map(([seccion, items]) => (
          <div key={seccion}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: SECCION_COLORS[seccion] || '#6b7280' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>{seccion}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>({items.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {items.map(dish => (
                <div key={dish.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{dish.name}</div>
                      {dish.descripcion && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{dish.descripcion}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 10 }}>
                      <button onClick={() => { setSelected(dish); setView('edit') }} style={{ padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => setConfirmDelete(dish)} style={{ padding: '4px 10px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  {dish.ingredients.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dish.ingredients.map(ing => (
                        <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{ing.nombre}</span>
                          <span style={{ color: 'var(--text-faint)' }}>{ing.cantidad} {ing.unidad}/pers.</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dish.ingredients.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>Sin ingredientes cargados</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar plato?"
          message={`Esto eliminará "${confirmDelete.name}" del recetario.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}