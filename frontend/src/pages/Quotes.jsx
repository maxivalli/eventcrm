import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import SkeletonTable from '../components/SkeletonTable'

const statusColors = { 'Aprobado': '#22c55e', 'Pendiente': '#f59e0b', 'Rechazado': '#ef4444' }
const kindColors   = { 'General': '#8b5cf6', 'Catering': '#f97316' }
const ESTADOS = ['Todos', 'Aprobado', 'Pendiente', 'Rechazado']
const KINDS   = ['Todos', 'General', 'Catering']

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

const formatCurrency = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const formatDate     = (str) => new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const calcTotal = (quote) => {
  const itemsTotal   = (quote.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const cateringBase = quote.kind === 'Catering' ? (quote.covers || 0) * (quote.pricePerCover || 0) : 0
  return cateringBase + itemsTotal
}

function Badge({ label, color }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>{label}</span>
}

const inp  = (err) => ({ width: '100%', background: 'var(--bg-sunken)', border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const inpS = { background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }
const lbl  = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
const err_ = { fontSize: 11, color: '#ef4444', marginTop: 4 }

function ItemsEditor({ items, onChange, label = 'Ítems' }) {
  const addItem    = () => onChange([...items, { id: `new-${Date.now()}`, description: '', quantity: '', unitPrice: '' }])
  const removeItem = (id) => onChange(items.filter(i => i.id !== id))
  const updateItem = (id, key, val) => onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i))

  const numVal = (v) => v === '' || v === undefined ? 0 : Number(v)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 80px 120px 100px 32px', gap: 8, marginBottom: 8, fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
        <span>{label}</span><span>Cant.</span><span>Precio unit.</span><span>Subtotal</span><span></span>
      </div>
      {items.map(item => (
        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 80px 120px 100px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input style={inpS} value={item.description} placeholder="Descripción" onChange={e => updateItem(item.id, 'description', e.target.value)} />
          <input type="number" style={inpS} value={item.quantity}
            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="1" />
          <input type="number" style={inpS} value={item.unitPrice}
            onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="0" />
          <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(numVal(item.quantity) * numVal(item.unitPrice))}</div>
          <button onClick={() => removeItem(item.id)} style={{ width: 28, height: 28, border: '1px solid var(--border-strong)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      ))}
      <button onClick={addItem} style={{ marginTop: 8, padding: '7px 14px', border: '1px dashed var(--border-strong)', borderRadius: 8, background: 'transparent', color: 'var(--text-label)', fontSize: 12, cursor: 'pointer', width: '100%' }}>+ Agregar</button>
    </div>
  )
}

// Selector de platos del recetario agrupado por sección

const emptyGeneral  = { clientId: '', eventId: '', kind: 'General',  date: '', status: 'Pendiente', items: [] }
const emptyCatering = { clientId: '', eventId: '', kind: 'Catering', date: '', status: 'Pendiente', covers: '', pricePerCover: '', items: [], menuId: null }

function QuoteForm({ initial, events, clients, onSave, onClose }) {
  const initialClientId  = initial ? String(events.find(ev => ev.id === initial.eventId)?.client?.id ?? '') : ''
  const initialEventDate = initial ? (events.find(ev => ev.id === initial.eventId)?.date?.slice(0, 10) ?? initial.date?.slice(0, 10)) : ''

  const [form, setForm] = useState(initial
    ? { ...initial, clientId: initialClientId, eventId: String(initial.eventId), date: initialEventDate, items: initial.items || [] }
    : emptyGeneral
  )
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const setKind = (kind) => setForm(f => ({
    ...(kind === 'Catering' ? emptyCatering : emptyGeneral),
    clientId: f.clientId, eventId: f.eventId, date: f.date, status: f.status, kind,
  }))

  const setClient = (clientId) => { setForm(f => ({ ...f, clientId, eventId: '', date: '' })); setErrors(e => ({ ...e, clientId: '', eventId: '' })) }
  const clientEvents = form.clientId ? events.filter(ev => String(ev.client?.id) === form.clientId) : []

  const [allMenus, setAllMenus]       = useState([])
  const [loadingMenus, setLoadingMenus] = useState(false)

  // Cargar menús globales siempre al montar (se usan si kind=Catering)
  useEffect(() => {
    setLoadingMenus(true)
    api.get('/api/menus')
      .then(res => {
        setAllMenus(res.data)
        if (initial?.menus?.length) {
          setForm(f => ({ ...f, menuId: initial.menus[0].menuId }))
        }
      })
      .catch(() => setAllMenus([]))
      .finally(() => setLoadingMenus(false))
  }, [])

  const setEvent = (eventId) => {
    const ev = clientEvents.find(e => String(e.id) === eventId)
    const date = ev?.date ? ev.date.slice(0, 10) : ''
    setForm(f => ({ ...f, eventId, date }))
    setErrors(e => ({ ...e, eventId: '' }))
  }

  const selectMenu = (menuId) => {
    setForm(f => ({ ...f, menuId: f.menuId === menuId ? null : menuId }))
  }

  const itemsTotal   = (form.items || []).reduce((acc, i) => acc + i.quantity * i.unitPrice, 0)
  const cateringBase = form.kind === 'Catering' ? (Number(form.covers) || 0) * (Number(form.pricePerCover) || 0) : 0
  const total        = cateringBase + itemsTotal

  const validate = () => {
    const e = {}
    if (!form.clientId) e.clientId = 'Seleccionar cliente'
    if (!form.eventId)  e.eventId  = 'Seleccionar evento'
    if (form.kind === 'General') {
      if (!form.items || form.items.length === 0) e.items = 'Debe agregar al menos un ítem'
      else if (form.items.some(i => !i.description.trim())) e.items = 'Todos los ítems deben tener descripción'
    }
    if (form.kind === 'Catering') {
      if (!form.covers || Number(form.covers) <= 0)               e.covers        = 'Requerido'
      if (!form.pricePerCover || Number(form.pricePerCover) <= 0) e.pricePerCover = 'Requerido'
    }
    setErrors(e); return Object.keys(e).length === 0
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 680, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--gold)', marginBottom: 24 }}>
          {initial ? 'Editar cotización' : 'Nueva cotización'}
        </div>

        {!initial && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['General', 'Catering'].map(k => (
              <button key={k} onClick={() => setKind(k)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${form.kind === k ? kindColors[k] : 'var(--border)'}`, background: form.kind === k ? `${kindColors[k]}18` : 'transparent', color: form.kind === k ? kindColors[k] : 'var(--text-muted)' }}>{k}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Cliente *</label>
            <select style={inp(errors.clientId)} value={form.clientId} onChange={e => setClient(e.target.value)}>
              <option value="">— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <div style={err_}>{errors.clientId}</div>}
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ ...lbl, color: !form.clientId ? 'var(--border-strong)' : 'var(--text-label)' }}>Evento *</label>
            <select disabled={!form.clientId} style={{ ...inp(errors.eventId), opacity: !form.clientId ? 0.4 : 1, cursor: !form.clientId ? 'not-allowed' : 'pointer' }} value={form.eventId} onChange={e => setEvent(e.target.value)}>
              <option value="">{!form.clientId ? '— Primero seleccioná un cliente —' : clientEvents.length === 0 ? '— Este cliente no tiene eventos —' : '— Seleccionar evento —'}</option>
              {clientEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            {errors.eventId && <div style={err_}>{errors.eventId}</div>}
          </div>
          <div>
            <label style={lbl}>Fecha del evento</label>
            <div style={{ ...inp(), display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: form.eventId ? 1 : 0.45, userSelect: 'none', background: 'var(--bg-sunken)', cursor: 'default' }}>
              <span style={{ color: form.date ? 'var(--text-primary)' : 'var(--text-faint)', fontSize: 13 }}>
                {form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '— Se completa al elegir evento —'}
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-faint)', flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Pendiente', 'Aprobado', 'Rechazado'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── GENERAL ── */}
        {form.kind === 'General' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: errors.items ? '#ef4444' : 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Ítems {errors.items && `— ${errors.items}`}
            </div>
            <ItemsEditor items={form.items} onChange={val => set('items', val)} label="Descripción" />
          </div>
        )}

        {/* ── CATERING ── */}
        {form.kind === 'Catering' && (
          <div style={{ marginBottom: 20 }}>

            {/* Cubiertos y precio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Cantidad de cubiertos *</label>
                <input type="number" style={inp(errors.covers)} value={form.covers} onChange={e => set('covers', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
                {errors.covers && <div style={err_}>{errors.covers}</div>}
              </div>
              <div>
                <label style={lbl}>Precio por cubierto (ARS) *</label>
                <input type="number" style={inp(errors.pricePerCover)} value={form.pricePerCover} onChange={e => set('pricePerCover', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
                {errors.pricePerCover && <div style={err_}>{errors.pricePerCover}</div>}
              </div>
            </div>

            {cateringBase > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-sunken)', borderRadius: 8, marginBottom: 20, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-label)' }}>{form.covers} cubiertos × {formatCurrency(form.pricePerCover)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>{formatCurrency(cateringBase)}</span>
              </div>
            )}

            {/* Selector de menús globales */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>
                Menú
              </div>
              {loadingMenus ? (
                <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: '10px 0' }}>Cargando menús...</div>
              ) : allMenus.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-faint)', background: 'var(--bg-sunken)', borderRadius: 8, padding: '12px 14px', border: '1px dashed var(--border-strong)' }}>
                  No hay menús cargados. Creá uno desde <strong style={{ color: 'var(--text-label)' }}>Menús</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allMenus.map(menu => {
                    const isSelected = form.menuId === menu.id
                    const totalDishes = (menu.sections || []).reduce((a, s) => a + (s.items || []).length, 0)
                    return (
                      <div key={menu.id} onClick={() => selectMenu(menu.id)} style={{ cursor: 'pointer', padding: '12px 14px', borderRadius: 10, border: `1px solid ${isSelected ? 'var(--gold-border)' : 'var(--border)'}`, background: isSelected ? 'var(--gold-bg)' : 'var(--bg-sunken)', transition: 'all 0.15s', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border-strong)'}`, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                          {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? 'var(--gold-light)' : 'var(--text-primary)', marginBottom: 3 }}>{menu.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                            {(menu.sections || []).length} sección{(menu.sections || []).length !== 1 ? 'es' : ''} · {totalDishes} plato{totalDishes !== 1 ? 's' : ''}
                            {menu.description && ` · ${menu.description}`}
                          </div>
                          {isSelected && (menu.sections || []).length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {(menu.sections || []).flatMap(s => s.items || []).slice(0, 6).map((item, i) => (
                                <span key={item.dish?.id ?? i} style={{ fontSize: 10, background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 20 }}>{item.dish?.name}</span>
                              ))}
                              {(menu.sections || []).flatMap(s => s.items || []).length > 6 && (
                                <span style={{ fontSize: 10, color: 'var(--text-faint)', padding: '2px 6px' }}>+{(menu.sections || []).flatMap(s => s.items || []).length - 6} más</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Extras */}
            <div style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Extras (barra, torta, mesa dulce, etc.)</div>
            <ItemsEditor items={form.items} onChange={val => set('items', val)} label="Descripción del extra" />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', fontFamily: "'Playfair Display', serif" }}>{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

function QuoteDetail({ quote, onClose, onEdit }) {
  const total = calcTotal(quote)
  const cateringBase = quote.kind === 'Catering' ? (quote.covers || 0) * (quote.pricePerCover || 0) : 0
  // Los menús vienen embebidos en quote.menus (QuoteMenu[])
  const quotedMenus = (quote.menus || []).map(qm => qm.menu).filter(Boolean)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 580, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-label)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>COT-{String(quote.id).padStart(4, '0')}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--text-primary)' }}>{quote.event?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 4 }}>{quote.event?.client?.name} · {formatDate(quote.date)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
            <Badge label={quote.kind}   color={kindColors[quote.kind] || '#5a5a7a'} />
            <Badge label={quote.status} color={statusColors[quote.status] || '#5a5a7a'} />
          </div>
        </div>

        {quote.kind === 'Catering' && (
          <div style={{ marginBottom: 20 }}>
            {/* Resumen cubiertos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-sunken)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
              {[
                { label: 'Cubiertos', value: quote.covers },
                { label: 'Precio por cubierto', value: formatCurrency(quote.pricePerCover) },
                { label: 'Subtotal cubiertos', value: formatCurrency(cateringBase) },
              ].map(item => (
                <div key={item.label} style={{ textAlign: item.label === 'Cubiertos' ? 'left' : 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#f97316' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Menús incluidos */}
            {quotedMenus.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Menús incluidos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {quotedMenus.map(menu => (
                    <div key={menu.id} style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gold-bg)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-light)' }}>{menu.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{(menu.sections || []).reduce((a,s) => a+(s.items||[]).length, 0)} platos</span>
                      </div>
                      {(menu.sections || []).map((section, si) => (
                        <div key={section.id} style={{ borderTop: si > 0 ? '1px solid var(--border-row)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px 3px', background: 'var(--bg-hover)' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SECCION_COLORS[section.nombre] || '#6b7280', flexShrink: 0 }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: SECCION_COLORS[section.nombre] || 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>{section.nombre}</span>
                          </div>
                          {(section.items || []).map(item => (
                            <div key={item.id} style={{ padding: '5px 14px 5px 28px', borderTop: '1px solid var(--border-row)' }}>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.dish?.name}</div>
                              {item.dish?.descripcion && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.dish.descripcion}</div>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--text-faint)', background: 'var(--bg-sunken)', borderRadius: 8, padding: '10px 14px', border: '1px dashed var(--border-strong)' }}>
                Sin menús seleccionados.
              </div>
            )}
          </div>
        )}

        {quote.items.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {quote.kind === 'Catering' ? 'Extras' : 'Ítems'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 60px 120px 110px', padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 4, fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
              <span>Descripción</span><span style={{ textAlign: 'center' }}>Cant.</span><span style={{ textAlign: 'right' }}>Precio unit.</span><span style={{ textAlign: 'right' }}>Subtotal</span>
            </div>
            {quote.items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '3fr 60px 120px 110px', padding: '10px 0', borderBottom: '1px solid var(--border-row)', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.description}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', fontFamily: "'Playfair Display', serif" }}>{formatCurrency(total)}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
          <button onClick={() => onEdit(quote)} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Editar</button>
        </div>
      </div>
    </div>
  )
}

export default function Quotes() {
  const toast = useToast()
  const [quotes, setQuotes]     = useState([])
  const [events, setEvents]     = useState([])
  const [clients, setClients]   = useState([])
  const [lastSeenDecisions] = useState(() => localStorage.getItem('lastSeenDecisions') || new Date(0).toISOString())

  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterKind,   setFilterKind]   = useState('Todos')
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchData = async () => {
    try {
      const [qRes, evRes, clRes] = await Promise.all([
        api.get('/api/quotes'),
        api.get('/api/events'),
        api.get('/api/clients'),
      ])
      setQuotes(qRes.data); setEvents(evRes.data); setClients(clRes.data)
    } catch { toast('Error al cargar cotizaciones') }
    finally { setLoading(false) }
  }
  useEffect(() => {
    fetchData()
    // Marcar decisiones del cliente como vistas
    localStorage.setItem('lastSeenDecisions', new Date().toISOString())
    window.dispatchEvent(new Event('storage'))
  }, [])

  const filtered = quotes.filter(q => {
    const ms = q.event?.name.toLowerCase().includes(search.toLowerCase()) || q.event?.client?.name.toLowerCase().includes(search.toLowerCase())
    const mf = filterEstado === 'Todos' || q.status === filterEstado
    const mk = filterKind   === 'Todos' || q.kind   === filterKind
    return ms && mf && mk
  })

  const handleSave = async (form) => {
    try {
      const payload = {
        kind: form.kind, eventId: Number(form.eventId), date: form.date || undefined, status: form.status,
        covers: form.kind === 'Catering' ? Number(form.covers) : null,
        pricePerCover: form.kind === 'Catering' ? Number(form.pricePerCover) : null,
        menuIds: form.kind === 'Catering' && form.menuId ? [form.menuId] : [],
        items: (form.items || []).map(({ description, quantity, unitPrice }) => ({ description, quantity: Number(quantity), unitPrice: Number(unitPrice) })),
      }
      if (modal === 'new') { await api.post('/api/quotes', payload); toast('Cotización creada correctamente', 'success') }
      else { await api.put(`/api/quotes/${selected.id}`, payload); toast('Cotización actualizada', 'success') }
      await fetchData(); setModal(null); setSelected(null)
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar cotización') }
  }

  const handleDelete = async () => {
    try { await api.delete(`/api/quotes/${confirmDelete.id}`); toast('Cotización eliminada', 'success'); await fetchData() }
    catch (e) { toast(e.response?.data?.error || 'Error al eliminar cotización') }
    finally { setConfirmDelete(null) }
  }

  const handleStatusChange = async (q, newStatus) => {
    try {
      await api.patch(`/api/quotes/${q.id}/status`, { status: newStatus })
      setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, status: newStatus } : x))
    } catch { toast('Error al cambiar el estado') }
  }

  const openDetail = q => { setSelected(q); setModal('detail') }
  const openEdit   = q => { setSelected(q); setModal('edit') }
  const openNew    = () => { setModal('new') }

  const fbtn = (active, color) => ({
    padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
    borderColor: active ? (color || 'var(--gold)') : 'var(--border)',
    background:  active ? `${color || 'var(--gold)'}18` : 'transparent',
    color:       active ? (color || 'var(--gold)') : 'var(--text-muted)',
  })

  if (loading) return <SkeletonTable cols={[
    { width: '40px', skeletonWidth: '60%' }, { width: '2fr' }, { width: '1.4fr' },
    { width: '2fr' }, { width: '120px', skeletonWidth: '50%' },
  ]} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Cotizaciones</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>{filtered.length} cotizaciones encontradas</div>
        </div>
        <button onClick={openNew} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Nueva cotización</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por evento o cliente..."
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 260 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {KINDS.map(k => <button key={k} onClick={() => setFilterKind(k)} style={fbtn(filterKind === k, k === 'General' ? '#8b5cf6' : k === 'Catering' ? '#f97316' : null)}>{k}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilterEstado(e)} style={fbtn(filterEstado === e)}>{e}</button>)}
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 110px 1.5fr 1.5fr 1fr 1.2fr 130px 160px', gap: '0 16px', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
          <span>#</span><span>Tipo</span><span>Evento</span><span>Cliente</span><span>Fecha</span><span>Total</span><span>Estado</span><span></span>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>No se encontraron cotizaciones</div>
          : filtered.map((q, i) => (
            <div key={q.id} onClick={() => openDetail(q)}
              style={{ display: 'grid', gridTemplateColumns: '60px 110px 1.5fr 1.5fr 1fr 1.2fr 130px 160px', gap: '0 16px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-row)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: 11, color: 'var(--text-label)', fontWeight: 600 }}>{String(q.id).padStart(4, '0')}</div>
              <Badge label={q.kind} color={kindColors[q.kind] || '#5a5a7a'} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{q.event?.name}</div>
                {q.clientStatus && q.clientDecidedAt && new Date(q.clientDecidedAt) > new Date(lastSeenDecisions) && (
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap',
                    background: q.clientStatus === 'Aprobado' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: q.clientStatus === 'Aprobado' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${q.clientStatus === 'Aprobado' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                    Cliente {q.clientStatus === 'Aprobado' ? 'aprobó' : 'rechazó'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{q.event?.client?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(q.date)}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{formatCurrency(calcTotal(q))}</div>
              <select
                value={q.status}
                onClick={e => e.stopPropagation()}
                onChange={e => handleStatusChange(q, e.target.value)}
                style={{
                  background: `${statusColors[q.status] || '#5a5a7a'}18`,
                  color: statusColors[q.status] || 'var(--text-muted)',
                  border: `1px solid ${statusColors[q.status] || '#5a5a7a'}40`,
                  borderRadius: 20, padding: '4px 10px',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  outline: 'none', appearance: 'none', textAlign: 'center',
                }}
              >
                {['Pendiente','Aprobado','Rechazado'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(q) }} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(q) }} style={{ padding: '5px 10px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal === 'new'    && <QuoteForm events={events} clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit'   && selected && <QuoteForm initial={selected} events={events} clients={clients} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {modal === 'detail' && selected && <QuoteDetail quote={selected} onClose={() => { setModal(null); setSelected(null) }} onEdit={q => { setModal('edit'); setSelected(q) }} />}
      {confirmDelete && <ConfirmDialog title="¿Eliminar cotización?" message={`Esto eliminará la cotización COT-${String(confirmDelete.id).padStart(4,'0')} del evento "${confirmDelete.event?.name}". Esta acción no se puede deshacer.`} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    </div>
  )
}