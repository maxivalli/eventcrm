import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, UtensilsCrossed, Search, X } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']

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

const inputStyle = {
  background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
}
const labelStyle = {
  fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase',
  letterSpacing: 1.2, marginBottom: 5, display: 'block', fontWeight: 700,
}

// ─── MenuCard (lista izquierda) ───────────────────────────────────────────────
function MenuCard({ menu, isSelected, onClick, onDelete }) {
  const totalPlatos = (menu.sections || []).reduce((a, s) => a + (s.items || []).length, 0)
  const sectionCount = (menu.sections || []).length

  return (
    <div onClick={onClick} style={{
      padding: '12px 13px', borderRadius: 9, cursor: 'pointer', transition: 'all 0.12s',
      background: isSelected ? 'var(--bg-surface)' : 'transparent',
      border: `1px solid ${isSelected ? 'rgba(201,168,76,0.35)' : 'transparent'}`,
      borderLeft: `3px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,
    }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.borderLeftColor = 'var(--gold)' }}}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' }}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--gold)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {menu.name}
          </div>
          {menu.description && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              {menu.description}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 5 }}>
            {sectionCount} sección{sectionCount !== 1 ? 'es' : ''} · {totalPlatos} plato{totalPlatos !== 1 ? 's' : ''}
          </div>
        </div>
        {isSelected && (
          <button onClick={e => { e.stopPropagation(); onDelete(menu) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── DishPicker (dropdown inline) ────────────────────────────────────────────
function DishPicker({ dishes, usedIds, onPick, onClose }) {
  const [search, setSearch]     = useState('')
  const [filterSec, setFilterSec] = useState('Todos')

  const available = dishes.filter(d => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase())
    const mf = filterSec === 'Todos' || d.seccion === filterSec
    return ms && mf && !usedIds.has(d.id)
  })

  const secOptions = ['Todos', ...SECCION_ORDER.filter(s => dishes.some(d => d.seccion === s))]

  return (
    <div style={{ margin: '0 -1px', background: 'var(--bg-base)', borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plato..."
            style={{ ...inputStyle, paddingLeft: 30 }} autoFocus />
        </div>
        <select value={filterSec} onChange={e => setFilterSec(e.target.value)}
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}>
          {secOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={onClose} style={{ padding: '8px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <X size={13} />
        </button>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {available.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '10px 4px', fontStyle: 'italic' }}>
            {dishes.length === 0 ? 'No hay platos en el recetario.' : 'No hay platos disponibles.'}
          </div>
        ) : available.map(dish => {
          const sc = SECCION_COLORS[dish.seccion] || SECCION_COLORS['Otros']
          return (
            <div key={dish.id} onClick={() => onPick(dish.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'all 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = sc.border; e.currentTarget.style.background = sc.bg }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dish.name}</div>
                {dish.descripcion && <div style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic' }}>{dish.descripcion}</div>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>{dish.seccion}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── MenuDetail (panel derecho) ───────────────────────────────────────────────
function MenuDetail({ menu, dishes, onUpdate, onAddSection, onDeleteSection, onAddDish, onRemoveDish }) {
  const [editing, setEditing]         = useState(false)
  const [editName, setEditName]       = useState(menu.name)
  const [editDesc, setEditDesc]       = useState(menu.description || '')
  const [saving, setSaving]           = useState(false)
  const [expanded, setExpanded]       = useState({})
  const [addingSection, setAddingSection] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const [addingDishTo, setAddingDishTo] = useState(null)

  // Reset edit state when menu changes
  useEffect(() => {
    setEditing(false)
    setEditName(menu.name)
    setEditDesc(menu.description || '')
    setAddingDishTo(null)
    setAddingSection(false)
  }, [menu.id])

  const handleSave = async () => {
    if (!editName.trim()) return
    setSaving(true)
    await onUpdate(editName.trim(), editDesc.trim() || null)
    setSaving(false)
    setEditing(false)
  }

  const handleAddSection = async () => {
    if (!sectionName) return
    setSaving(true)
    const newSec = await onAddSection(sectionName)
    setSaving(false)
    setSectionName('')
    setAddingSection(false)
    if (newSec) setExpanded(prev => ({ ...prev, [newSec.id]: true }))
  }

  const toggleSection = (id) => setExpanded(prev => ({ ...prev, [id]: prev[id] === false ? true : false }))

  const availableSections = SECCION_ORDER.filter(s => !(menu.sections || []).some(sec => sec.nombre === s))
  const totalPlatos = (menu.sections || []).reduce((a, s) => a + (s.items || []).length, 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header del menú */}
      <div style={{ padding: '26px 28px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={labelStyle}>Nombre del menú</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Descripción (opcional)</label>
              <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={inputStyle} placeholder="Descripción breve..." />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSave} disabled={saving || !editName.trim()} style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, color: '#09090f', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => { setEditing(false); setEditName(menu.name); setEditDesc(menu.description || '') }}
                style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {menu.name}
              </div>
              {menu.description && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                  "{menu.description}"
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {(menu.sections || []).length} sección{(menu.sections || []).length !== 1 ? 'es' : ''}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {totalPlatos} plato{totalPlatos !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button onClick={() => setEditing(true)}
              style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
              Editar
            </button>
          </div>
        )}
      </div>

      {/* Secciones */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {(menu.sections || []).length === 0 && !addingSection && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🍴</div>
            <div style={{ fontSize: 13 }}>Este menú no tiene secciones todavía.</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Agregá una sección para empezar a organizar los platos.</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(menu.sections || []).map(section => {
            const isExp = expanded[section.id] !== false
            const sc = SECCION_COLORS[section.nombre] || SECCION_COLORS['Otros']
            const usedIds = new Set((section.items || []).map(i => i.dishId))

            return (
              <div key={section.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${sc.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Header sección */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: sc.bg, borderBottom: isExp ? `1px solid ${sc.border}` : 'none' }}
                  onClick={() => toggleSection(section.id)}>
                  <span style={{ fontSize: 14, marginRight: 8 }}>{SECCION_ICONS[section.nombre] || '◇'}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: sc.color, textTransform: 'uppercase', letterSpacing: 1.2, flex: 1 }}>{section.nombre}</span>
                  <span style={{ fontSize: 10, color: sc.color, opacity: 0.7, marginRight: 10 }}>
                    {(section.items || []).length} plato{(section.items || []).length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={e => { e.stopPropagation(); setAddingDishTo(addingDishTo === section.id ? null : section.id) }}
                    style={{ background: 'none', border: 'none', color: sc.color, cursor: 'pointer', marginRight: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }}>
                    <Plus size={12} /> Agregar
                  </button>
                  <button onClick={e => { e.stopPropagation(); onDeleteSection(section.id, section.nombre) }}
                    style={{ background: 'none', border: 'none', color: sc.color, opacity: 0.5, cursor: 'pointer', display: 'flex', padding: 3, marginRight: 4 }}>
                    <Trash2 size={12} />
                  </button>
                  {isExp
                    ? <ChevronDown size={14} color={sc.color} style={{ opacity: 0.7 }} />
                    : <ChevronRight size={14} color={sc.color} style={{ opacity: 0.7 }} />}
                </div>

                {/* Contenido expandido */}
                {isExp && (
                  <div>
                    {(section.items || []).length === 0 && addingDishTo !== section.id && (
                      <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>
                        Sin platos. Usá "Agregar" para sumar platos del recetario.
                      </div>
                    )}
                    {(section.items || []).map((item, i, arr) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.dish?.name}</div>
                          {item.dish?.descripcion && (
                            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2, fontStyle: 'italic' }}>{item.dish.descripcion}</div>
                          )}
                        </div>
                        <button onClick={() => onRemoveDish(section.id, item.id, item.dish?.name)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, borderRadius: 5, transition: 'color 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {/* Picker de platos */}
                    {addingDishTo === section.id && (
                      <DishPicker
                        dishes={dishes}
                        usedIds={usedIds}
                        onPick={(dishId) => { onAddDish(section.id, dishId); setAddingDishTo(null) }}
                        onClose={() => setAddingDishTo(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Agregar sección */}
          {addingSection ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <select value={sectionName} onChange={e => setSectionName(e.target.value)} autoFocus
                style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                <option value="">— Elegir sección —</option>
                {availableSections.map(s => (
                  <option key={s} value={s}>{SECCION_ICONS[s]} {s}</option>
                ))}
              </select>
              <button onClick={handleAddSection} disabled={saving || !sectionName}
                style={{ padding: '9px 16px', background: !sectionName ? 'var(--bg-sunken)' : 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, color: !sectionName ? 'var(--text-faint)' : '#09090f', fontSize: 13, fontWeight: 700, cursor: sectionName ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                Agregar
              </button>
              <button onClick={() => { setAddingSection(false); setSectionName('') }}
                style={{ padding: '9px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={13} />
              </button>
            </div>
          ) : availableSections.length > 0 ? (
            <button onClick={() => setAddingSection(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-faint)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
              <Plus size={15} /> Agregar sección
            </button>
          ) : (menu.sections || []).length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
              Ya están todas las secciones disponibles.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Menus() {
  const toast = useToast()
  const [menus, setMenus]     = useState([])
  const [dishes, setDishes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    Promise.all([api.get('/api/menus'), api.get('/api/dishes')])
      .then(([mRes, dRes]) => { setMenus(mRes.data); setDishes(dRes.data) })
      .catch(() => toast('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const selectedMenu = menus.find(m => m.id === selected)

  const handleCreateMenu = async () => {
    if (!newName.trim()) return toast('El nombre es requerido')
    setSaving(true)
    try {
      const res = await api.post('/api/menus', { name: newName.trim(), description: newDesc.trim() || null })
      setMenus(prev => [res.data, ...prev])
      setSelected(res.data.id)
      setNewName(''); setNewDesc(''); setShowNewMenu(false)
      toast('Menú creado', 'success')
    } catch { toast('Error al crear menú') }
    finally { setSaving(false) }
  }

  const handleUpdateMenu = async (name, description) => {
    try {
      const res = await api.put(`/api/menus/${selected}`, { name, description })
      setMenus(prev => prev.map(m => m.id === selected ? { ...res.data, sections: m.sections } : m))
      toast('Menú actualizado', 'success')
    } catch { toast('Error al actualizar') }
  }

  const handleDeleteMenu = async (menu) => {
    try {
      await api.delete(`/api/menus/${menu.id}`)
      setMenus(prev => prev.filter(m => m.id !== menu.id))
      if (selected === menu.id) setSelected(null)
      toast('Menú eliminado', 'success')
    } catch { toast('Error al eliminar') }
  }

  const handleAddSection = async (nombre) => {
    try {
      const res = await api.post(`/api/menus/${selected}/sections`, { nombre })
      setMenus(prev => prev.map(m => m.id === selected
        ? { ...m, sections: [...(m.sections || []), res.data] }
        : m
      ))
      toast('Sección agregada', 'success')
      return res.data
    } catch { toast('Error al agregar sección'); return null }
  }

  const handleDeleteSection = async (sectionId, nombre) => {
    setConfirm({
      title: 'Eliminar sección',
      msg: `¿Eliminar la sección "${nombre}"? También se quitarán todos sus platos.`,
      onOk: async () => {
        try {
          await api.delete(`/api/menus/sections/${sectionId}`)
          setMenus(prev => prev.map(m => m.id === selected
            ? { ...m, sections: m.sections.filter(s => s.id !== sectionId) }
            : m
          ))
          toast('Sección eliminada', 'success')
        } catch { toast('Error al eliminar sección') }
      }
    })
  }

  const handleAddDish = async (sectionId, dishId) => {
    try {
      const res = await api.post(`/api/menus/sections/${sectionId}/items`, { dishId })
      setMenus(prev => prev.map(m => m.id === selected ? {
        ...m,
        sections: m.sections.map(s => s.id === sectionId
          ? { ...s, items: [...(s.items || []), res.data] }
          : s
        )
      } : m))
      toast('Plato agregado', 'success')
    } catch { toast('Error al agregar plato') }
  }

  const handleRemoveDish = (sectionId, itemId, dishName) => {
    setConfirm({
      title: 'Quitar plato',
      msg: `¿Quitar "${dishName}" de esta sección?`,
      onOk: async () => {
        try {
          await api.delete(`/api/menus/items/${itemId}`)
          setMenus(prev => prev.map(m => m.id === selected ? {
            ...m,
            sections: m.sections.map(s => s.id === sectionId
              ? { ...s, items: s.items.filter(i => i.id !== itemId) }
              : s
            )
          } : m))
          toast('Plato quitado', 'success')
        } catch { toast('Error al eliminar plato') }
      }
    })
  }

  const filteredMenus = menus.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header de página ── */}
      <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Menús</div>
            <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>
              {menus.length} menú{menus.length !== 1 ? 's'  : ''} guardado{menus.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={() => { setShowNewMenu(true); setSelected(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#09090f', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> Nuevo menú
          </button>
        </div>

        {/* Búsqueda */}
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar menú..."
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px 9px 32px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* ── Split panel ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', overflow: 'hidden', marginTop: 18, borderTop: '1px solid var(--border)' }}>

        {/* ── Lista izquierda ── */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Form nuevo menú inline */}
          {showNewMenu && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 11, padding: '14px 14px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Nuevo menú</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre del menú *" style={inputStyle} autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreateMenu()} />
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción (opcional)" style={inputStyle} />
                <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
                  <button onClick={handleCreateMenu} disabled={saving || !newName.trim()}
                    style={{ flex: 2, padding: '8px 0', background: newName.trim() ? 'linear-gradient(135deg,#c9a84c,#e8c97a)' : 'var(--bg-sunken)', border: 'none', borderRadius: 8, color: newName.trim() ? '#09090f' : 'var(--text-faint)', fontSize: 13, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                    {saving ? 'Creando...' : 'Crear'}
                  </button>
                  <button onClick={() => { setShowNewMenu(false); setNewName(''); setNewDesc('') }}
                    style={{ flex: 1, padding: '8px 0', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 13 }}>Cargando...</div>
          ) : filteredMenus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🍽</div>
              <div style={{ fontSize: 13 }}>{menus.length === 0 ? 'No hay menús todavía.' : 'Ningún menú coincide.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredMenus.map(m => (
                <MenuCard
                  key={m.id}
                  menu={m}
                  isSelected={selected === m.id}
                  onClick={() => { setSelected(m.id); setShowNewMenu(false) }}
                  onDelete={(menu) => setConfirm({ title: 'Eliminar menú', msg: `¿Eliminar "${menu.name}"? Esta acción no se puede deshacer.`, onOk: () => handleDeleteMenu(menu) })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div style={{ overflow: 'hidden', background: 'var(--bg-base)' }}>
          {!selectedMenu ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', gap: 14 }}>
              <UtensilsCrossed size={40} strokeWidth={1} />
              <div style={{ fontSize: 13 }}>Seleccioná un menú para editarlo</div>
              <button onClick={() => setShowNewMenu(true)}
                style={{ padding: '9px 20px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, background: 'rgba(201,168,76,0.06)', color: 'var(--gold)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Plus size={14} /> Nuevo menú
              </button>
            </div>
          ) : (
            <MenuDetail
              key={selectedMenu.id}
              menu={selectedMenu}
              dishes={dishes}
              onUpdate={handleUpdateMenu}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
              onAddDish={handleAddDish}
              onRemoveDish={handleRemoveDish}
            />
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.msg}
          onConfirm={() => { confirm.onOk(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}