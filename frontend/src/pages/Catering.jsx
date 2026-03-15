import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from '../contexts/AuthContext'

const SECCIONES_SUGERIDAS = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']

const CATEGORIA_COLORS = {
  'Carnes':      '#ef4444',
  'Fiambres':    '#f97316',
  'Lácteos':     '#3b82f6',
  'Verduras':    '#22c55e',
  'Frutas':      '#ec4899',
  'Almacén':     '#f59e0b',
  'Bebidas':     '#06b6d4',
  'Panificados': '#8b5cf6',
  'Otros':       '#6b7280',
}

const SECCION_COLORS = {
  'Entrada':    '#3b82f6',
  'Plato principal': '#8b5cf6',
  'Guarnición':      '#22c55e',
  'Bebidas':         '#06b6d4',
  'Postre':          '#ec4899',
  'Trasnoche':       '#f97316',
  'Otros':           '#6b7280',
}

const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']
const sortSections = (sections) =>
  [...sections].sort((a, b) => {
    const ia = SECCION_ORDER.indexOf(a.nombre)
    const ib = SECCION_ORDER.indexOf(b.nombre)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

const fmtDate = (str) => new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const inp = (err) => ({
  width: '100%', background: 'var(--bg-sunken)',
  border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`,
  borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
})
const lbl = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }

function DishPicker({ dishes, onSelect, onCancel }) {
  const [search, setSearch] = useState('')
  const filtered = dishes.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Elegir plato del recetario</div>
      <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar plato..." style={{ ...inp(), marginBottom: 10 }} />
      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '8px 0' }}>No hay platos. Creá uno en el Recetario.</div>}
        {filtered.map(dish => (
          <div key={dish.id} onClick={() => onSelect(dish)}
            style={{ padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{dish.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{dish.seccion} · {dish.ingredients.length} ingrediente{dish.ingredients.length !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
      <button onClick={onCancel} style={{ marginTop: 10, width: '100%', padding: 8, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
    </div>
  )
}


function ShoppingList({ eventId, guests, eventName, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    api.get(`/api/event-menu/shopping/${eventId}`)
      .then(r => setData(r.data))
      .catch(() => toast('Error al cargar la lista de compras'))
      .finally(() => setLoading(false))
  }, [eventId])

  const handleDownload = async () => {
    // Load jsPDF from CDN if not already loaded
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const categorias = Object.keys(data.lista).sort()

    const CAT_COLORS = {
      'Carnes':      [239, 68,  68],
      'Fiambres':    [249, 115, 22],
      'Lácteos':     [59,  130, 246],
      'Verduras':    [34,  197, 94],
      'Frutas':      [236, 72,  153],
      'Almacén':     [245, 158, 11],
      'Bebidas':     [6,   182, 212],
      'Panificados': [139, 92,  246],
      'Otros':       [107, 114, 128],
    }

    const W = 210, margin = 16
    let y = 0

    // Header background
    doc.setFillColor(9, 9, 15)
    doc.rect(0, 0, W, 38, 'F')

    // Gold accent bar
    doc.setFillColor(201, 168, 76)
    doc.rect(0, 0, 4, 38, 'F')

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(232, 201, 122)
    doc.text('Lista de Compras', margin + 4, 16)

    // Event name
    doc.setFontSize(10)
    doc.setTextColor(180, 180, 180)
    doc.setFont('helvetica', 'normal')
    doc.text((eventName || 'Evento').toUpperCase(), margin + 4, 25)
    doc.text(`${guests} invitados · ${new Date().toLocaleDateString('es-AR')}`, margin + 4, 32)

    y = 46

    categorias.forEach(cat => {
      const items = data.lista[cat]
      const rowH = 8
      const blockH = 10 + items.length * rowH + 4

      // Page break
      if (y + blockH > 280) { doc.addPage(); y = 16 }

      // Category header
      const [r, g, b] = CAT_COLORS[cat] || [107, 114, 128]
      doc.setFillColor(r, g, b, 0.12)
      doc.setFillColor(Math.min(255, r + 180), Math.min(255, g + 180), Math.min(255, b + 180))
      doc.roundedRect(margin, y, W - margin * 2, 9, 2, 2, 'F')

      // Dot
      doc.setFillColor(r, g, b)
      doc.circle(margin + 5, y + 4.5, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(r, g, b)
      doc.text(cat.toUpperCase(), margin + 10, y + 6)
      y += 11

      // Items
      items.forEach((item, i) => {
        if (y > 280) { doc.addPage(); y = 16 }

        // Alternating row bg
        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245)
          doc.rect(margin, y, W - margin * 2, rowH, 'F')
        }

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(40, 40, 40)
        doc.text(item.nombre, margin + 4, y + 5.5)

        // Amount (right-aligned)
        const cantidad = item.cantidadTotal % 1 === 0 ? String(item.cantidadTotal) : item.cantidadTotal.toFixed(1)
        const amountText = `${cantidad} ${item.unidad}`
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(r, g, b)
        doc.text(amountText, W - margin - 30, y + 5.5, { align: 'right' })

        // Per person
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(140, 140, 140)
        doc.text(`${item.cantidadPorPersona} ${item.unidad}/pers.`, W - margin - 2, y + 5.5, { align: 'right' })

        y += rowH
      })

      y += 6
    })

    // Footer
    doc.setFillColor(9, 9, 15)
    doc.rect(0, 290, W, 10, 'F')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text('Haus-CRM · Producción', margin, 296)

    doc.save(`lista-compras-${(eventName || 'evento').toLowerCase().replace(/\s+/g, '-')}.pdf`)
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--text-faint)', fontSize: 13 }}>Calculando lista...</div>

  if (!data || Object.keys(data.lista).length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>No hay ingredientes en el menú todavía.</div>
        <button onClick={onClose} style={{ marginTop: 12, padding: '7px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cerrar</button>
      </div>
    )
  }

  const categorias = Object.keys(data.lista).sort()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--text-primary)' }}>Lista de compras</div>
          <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 2 }}>{guests} invitados</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleDownload} style={{ padding: '6px 14px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>⬇ Descargar</button>
          <button onClick={onClose} style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>← Volver al menú</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categorias.map(cat => (
            <div key={cat} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: `${CATEGORIA_COLORS[cat] || '#6b7280'}12`, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORIA_COLORS[cat] || '#6b7280' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: CATEGORIA_COLORS[cat] || 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</span>
              </div>
              <div>
                {data.lista[cat].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < data.lista[cat].length - 1 ? '1px solid var(--border-row)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.nombre}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: CATEGORIA_COLORS[cat] || 'var(--text-primary)' }}>
                        {item.cantidadTotal % 1 === 0 ? item.cantidadTotal : item.cantidadTotal.toFixed(1)} {item.unidad}
                      </span>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{item.cantidadPorPersona} {item.unidad}/pers.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function CateringPage() {
  const toast = useToast()
  const { isReadonly } = useAuth()
  const [clients, setClients] = useState([])
  const [events, setEvents]   = useState([])
  const [dishes, setDishes]   = useState([])
  const [clientId, setClientId] = useState('')
  const [eventId, setEventId]   = useState('')
  const [sections, setSections] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [addingSection, setAddingSection]   = useState(false)
  const [pickerForSection, setPickerForSection] = useState(null)
  const [confirmDeleteSection, setConfirmDeleteSection] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem]       = useState(null)
  const [showShopping, setShowShopping] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/api/clients'), api.get('/api/events'), api.get('/api/dishes')])
      .then(([c, e, d]) => {
        setClients(c.data.filter(x => x.status === 'Activo'))
        setEvents(e.data)
        setDishes(d.data)
      })
      .catch(() => toast('Error al cargar datos'))
  }, [])

  const clientEvents  = events.filter(e => !clientId || String(e.clientId) === clientId)
  const selectedEvent = events.find(e => String(e.id) === eventId)

  const handleClientChange = (val) => { setClientId(val); setEventId(''); setSections([]); setShowShopping(false) }

  const handleEventChange = async (val) => {
    setEventId(val); setShowShopping(false)
    if (!val) { setSections([]); return }
    setLoadingMenu(true)
    try { const res = await api.get(`/api/menu/event/${val}`); setSections(res.data) }
    catch { toast('Error al cargar menú') }
    finally { setLoadingMenu(false) }
  }

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return
    try {
      const res = await api.post('/api/menu/sections', { eventId: Number(eventId), nombre: newSectionName.trim() })
      setSections(prev => [...prev, res.data])
      setNewSectionName(''); setAddingSection(false)
    } catch (e) { toast(e.response?.data?.error || 'Error al crear sección') }
  }

  const handleDeleteSection = async () => {
    try {
      await api.delete(`/api/menu/sections/${confirmDeleteSection.id}`)
      setSections(prev => prev.filter(s => s.id !== confirmDeleteSection.id))
      toast('Sección eliminada', 'success')
    } catch { toast('Error al eliminar sección') }
    finally { setConfirmDeleteSection(null) }
  }

  const handleAddDish = async (sectionId, dish) => {
    try {
      const res = await api.post('/api/menu/items', { sectionId, dishId: dish.id })
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: [...s.items, res.data] } : s))
      setPickerForSection(null)
      toast('Plato agregado', 'success')
    } catch (e) { toast(e.response?.data?.error || 'Error al agregar plato') }
  }

  const handleDeleteItem = async () => {
    try {
      await api.delete(`/api/menu/items/${confirmDeleteItem.id}`)
      setSections(prev => prev.map(s => ({ ...s, items: s.items.filter(i => i.id !== confirmDeleteItem.id) })))
      toast('Plato quitado', 'success')
    } catch { toast('Error al quitar plato') }
    finally { setConfirmDeleteItem(null) }
  }

  const totalDishes = sections.reduce((s, sec) => s + sec.items.length, 0)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Catering</div>
        <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>Armado de menú y lista de compras por evento</div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={lbl}>Cliente</label>
          <select style={inp()} value={clientId} onChange={e => handleClientChange(e.target.value)}>
            <option value="">— Seleccionar cliente —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Evento</label>
          <select style={inp()} value={eventId} onChange={e => handleEventChange(e.target.value)} disabled={!clientId}>
            <option value="">— Seleccionar evento —</option>
            {clientEvents.map(e => <option key={e.id} value={e.id}>{e.name} · {fmtDate(e.date)}</option>)}
          </select>
        </div>
      </div>

      {!eventId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)', fontSize: 14 }}>
          Seleccioná un cliente y un evento para armar el menú
        </div>
      )}

      {eventId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          <div>
            {showShopping ? (
              <ShoppingList eventId={Number(eventId)} guests={selectedEvent?.guests || 0} eventName={selectedEvent?.name} onClose={() => setShowShopping(false)} />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>Menú del evento</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!addingSection && !isReadonly && (
                      <button onClick={() => setAddingSection(true)} style={{ padding: '6px 16px', border: '1px solid var(--gold)', borderRadius: 20, background: 'transparent', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ Sección</button>
                    )}
                    {totalDishes > 0 && (
                      <button onClick={() => setShowShopping(true)} style={{ padding: '6px 16px', border: 'none', borderRadius: 20, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Ver lista de compras →</button>
                    )}
                  </div>
                </div>

                {addingSection && (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <label style={lbl}>Nombre de la sección</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {SECCIONES_SUGERIDAS.map(s => (
                        <button key={s} onClick={() => setNewSectionName(s)} style={{ padding: '4px 10px', border: `1px solid ${SECCION_COLORS[s] || 'var(--border)'}`, borderRadius: 20, background: newSectionName === s ? `${SECCION_COLORS[s]}20` : 'transparent', color: SECCION_COLORS[s] || 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>{s}</button>
                      ))}
                    </div>
                    <input style={inp()} value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="O escribí un nombre libre..." />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => { setAddingSection(false); setNewSectionName('') }} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                      <button onClick={handleAddSection} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Crear sección</button>
                    </div>
                  </div>
                )}

                {loadingMenu && <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '20px 0' }}>Cargando menú...</div>}

                {!loadingMenu && sections.length === 0 && !addingSection && (
                  <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '20px 0' }}>El menú está vacío. Creá una sección para empezar (ej: "Entrada", "Plato principal").</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sortSections(sections).map(section => (
                    <div key={section.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '11px 16px', background: `${SECCION_COLORS[section.nombre] || '#6b7280'}10`, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: SECCION_COLORS[section.nombre] || '#6b7280' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{section.nombre}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>({section.items.length} plato{section.items.length !== 1 ? 's' : ''})</span>
                        </div>
                        {!isReadonly && <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setPickerForSection(section.id)} style={{ padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 20, background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>+ Plato</button>
                          <button onClick={() => setConfirmDeleteSection(section)} style={{ padding: '4px 8px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </div>}
                      </div>

                      {pickerForSection === section.id && (
                        <div style={{ padding: '10px 16px' }}>
                          <DishPicker dishes={dishes} onSelect={(dish) => handleAddDish(section.id, dish)} onCancel={() => setPickerForSection(null)} />
                        </div>
                      )}

                      <div style={{ padding: section.items.length > 0 ? '0 16px 12px' : 0 }}>
                        {section.items.length === 0 && pickerForSection !== section.id && (
                          <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-faint)' }}>Sin platos. Hacé click en "+ Plato" para agregar.</div>
                        )}
                        {section.items.map(item => (
                          <div key={item.id} style={{ paddingTop: 12, borderBottom: '1px solid var(--border-row)', paddingBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.dish.name}</div>
                                {item.dish.descripcion && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.dish.descripcion}</div>}
                                <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                  {item.dish.ingredients.map(ing => (
                                    <span key={ing.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${CATEGORIA_COLORS[ing.categoria] || '#6b7280'}15`, color: CATEGORIA_COLORS[ing.categoria] || 'var(--text-muted)' }}>
                                      {ing.nombre} · {ing.cantidad}{ing.unidad}/pers.
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {!isReadonly && <button onClick={() => setConfirmDeleteItem(item)} style={{ padding: '4px 8px', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 11, cursor: 'pointer', flexShrink: 0, marginLeft: 10 }}>✕</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {selectedEvent && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 }}>Evento</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{selectedEvent.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>📅 {fmtDate(selectedEvent.date)}{selectedEvent.time ? ` · ${selectedEvent.time}` : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>📍 {selectedEvent.venue}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginTop: 8 }}>👥 {selectedEvent.guests} invitados</div>
                {(() => {
                  const raw = (() => { try { return typeof selectedEvent.dietaryOptions === 'string' ? JSON.parse(selectedEvent.dietaryOptions) : (selectedEvent.dietaryOptions || []) } catch { return [] } })()
                  const opts = Array.isArray(raw) ? raw : [];
                  if (!opts.length) return null;
                  const ICONS = { celiac: '🌾', vegan: '🌱', vegetarian: '🥦', diabetic: '🩺', kosher: '✡️', lactose: '🥛' }
                  return (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⚠️ Menús especiales</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {opts.map(o => (
                          <div key={o.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span>{ICONS[o.key]}</span>{o.label}
                            </span>
                            {o.cantidad && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{o.cantidad} pers.</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
            {sections.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 }}>Resumen del menú</div>
                {sortSections(sections).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: SECCION_COLORS[s.nombre] || '#6b7280' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.nombre}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.items.length} plato{s.items.length !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {totalDishes > 0 && (
                  <button onClick={() => setShowShopping(true)} style={{ marginTop: 12, width: '100%', padding: '9px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    Generar lista de compras
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDeleteSection && <ConfirmDialog title="¿Eliminar sección?" message={`Esto eliminará "${confirmDeleteSection.nombre}" y todos sus platos del menú.`} onConfirm={handleDeleteSection} onCancel={() => setConfirmDeleteSection(null)} />}
      {confirmDeleteItem && <ConfirmDialog title="¿Quitar plato?" message={`Esto quitará "${confirmDeleteItem.dish?.name}" del menú.`} onConfirm={handleDeleteItem} onCancel={() => setConfirmDeleteItem(null)} />}
    </div>
  )
}