import { useState, useEffect } from 'react'
import { Check, Clock, Plus, Trash2, AlertCircle } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const fmt     = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const today   = () => new Date().toISOString().split('T')[0]

const METHODS = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro']
const METHOD_COLORS = {
  'Efectivo':      { color: '#22c55e',  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
  'Transferencia': { color: '#3b82f6',  bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  'Cheque':        { color: '#f59e0b',  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)'  },
  'Tarjeta':       { color: '#a78bfa',  bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
  'Otro':          { color: '#94a3b8',  bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)'  },
}

const selStyle = {
  background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', padding: '9px 12px',
  fontSize: 13, cursor: 'pointer', outline: 'none', width: '100%',
}
const inpStyle = {
  background: 'var(--bg-base)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', padding: '9px 12px',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
}
const lbl = {
  fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase',
  letterSpacing: 1.2, marginBottom: 5, display: 'block', fontWeight: 700,
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function StatCard({ label, value, color, border, icon }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: `1px solid ${border}`, borderRadius: 14, padding: '18px 22px', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-faint)' }}>{label}</div>
        <div style={{ color, opacity: 0.5 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>{fmt(value)}</div>
    </div>
  )
}

export default function SupplierPayments() {
  const toast = useToast()
  const [suppliers, setSuppliers]         = useState([])
  const [events, setEvents]               = useState([])
  const [supplierId, setSupplierId]       = useState('')
  const [eventId, setEventId]             = useState('')
  const [data, setData]                   = useState(null)
  const [loading, setLoading]             = useState(false)
  const [form, setForm]                   = useState({ amount: '', date: today(), note: '', method: 'Efectivo', status: 'Pendiente' })
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/api/suppliers'), api.get('/api/events')])
      .then(([s, e]) => { setSuppliers(s.data.filter(x => x.status === 'Activo')); setEvents(e.data) })
      .catch(() => {})
  }, [])

  useEffect(() => { setData(null); if (!supplierId || !eventId) return; fetchPayments() }, [supplierId, eventId])

  async function fetchPayments() {
    setLoading(true)
    try { const r = await api.get(`/api/supplier-payments?supplierId=${supplierId}&eventId=${eventId}`); setData(r.data) }
    catch { toast('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  async function handleAdd() {
    if (!form.amount || Number(form.amount) <= 0) { toast('El monto debe ser mayor a 0'); return }
    setSaving(true)
    try {
      await api.post('/api/supplier-payments', {
        supplierId: Number(supplierId), eventId: Number(eventId),
        amount: Number(form.amount), date: form.date,
        note: form.note, method: form.method, status: form.status
      })
      setForm({ amount: '', date: today(), note: '', method: 'Efectivo', status: 'Pendiente' })
      await fetchPayments()
      toast('Pago registrado', 'success')
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleToggleStatus(p) {
    const newStatus = p.status === 'Pagado' ? 'Pendiente' : 'Pagado'
    try { await api.patch(`/api/supplier-payments/${p.id}/status`, { status: newStatus }); await fetchPayments() }
    catch { toast('No se pudo actualizar el estado') }
  }

  async function handleDelete() {
    try { await api.delete(`/api/supplier-payments/${confirmDelete}`); await fetchPayments(); toast('Pago eliminado', 'success') }
    catch { toast('No se pudo eliminar el pago') }
    finally { setConfirmDelete(null) }
  }

  const selectedSupplier = suppliers.find(s => s.id === Number(supplierId))
  const selectedEvent    = events.find(e => e.id === Number(eventId))
  const bothSelected     = supplierId && eventId
  const total = data ? data.totalPaid + data.totalPending : 0
  const pct   = total > 0 ? Math.min(100, Math.round((data.totalPaid / total) * 100)) : 0

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Pagos a Proveedores</div>
        <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>Registro de pagos y compromisos con proveedores</div>
      </div>

      {/* ── Selector panel ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Seleccionar proveedor y evento
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Proveedor</label>
            <select style={selStyle} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— Seleccionar proveedor —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} · {s.category}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Evento</label>
            <select style={selStyle} value={eventId} onChange={e => setEventId(e.target.value)}>
              <option value="">— Seleccionar evento —</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name} · {fmtDate(e.date)}</option>)}
            </select>
          </div>
        </div>

        {/* Info bar */}
        {selectedSupplier && selectedEvent && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Proveedor',    value: selectedSupplier.name },
              { label: 'Categoría',   value: selectedSupplier.category },
              { label: 'Evento',      value: selectedEvent.name },
              { label: 'Fecha',       value: fmtDate(selectedEvent.date) },
            ].map(item => (
              <div key={item.label}>
                <div style={{ ...lbl, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-faint)', fontSize: 13 }}>Cargando...</div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <StatCard label="Total comprometido" value={total}            color="var(--gold)" border="rgba(201,168,76,0.3)" icon={<AlertCircle size={16} />} />
            <StatCard label="Total pagado"        value={data.totalPaid}    color="#ef4444"    border="rgba(239,68,68,0.3)"  icon={<Check size={16} />} />
            <StatCard label="Total pendiente"     value={data.totalPending} color="#f59e0b"    border="rgba(245,158,11,0.3)" icon={<Clock size={16} />} />
          </div>

          {/* Barra de progreso */}
          {total > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Pagado vs comprometido</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? '#22c55e' : '#f59e0b' }}>{pct}%</span>
              </div>
              <div style={{ background: 'var(--bg-sunken)', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width 0.7s ease',
                  background: 'linear-gradient(90deg,#ef4444,#f87171)' }} />
              </div>
            </div>
          )}

          {/* Formulario */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Registrar pago</span>
            </div>
            <div style={{ padding: '16px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Monto *</label>
                  <input type="number" placeholder="0" style={inpStyle} value={form.amount}
                    onChange={e => setForm(v => ({ ...v, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Fecha</label>
                  <input type="date" style={inpStyle} value={form.date}
                    onChange={e => setForm(v => ({ ...v, date: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Método</label>
                  <select style={inpStyle} value={form.method} onChange={e => setForm(v => ({ ...v, method: e.target.value }))}>
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Estado</label>
                  <select style={inpStyle} value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}>
                    <option>Pendiente</option><option>Pagado</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>Nota (opcional)</label>
                  <input type="text" placeholder="Ej: Seña, Pago final, Cuota 1..." style={inpStyle}
                    value={form.note} onChange={e => setForm(v => ({ ...v, note: e.target.value }))} />
                </div>
                <button onClick={handleAdd} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                  <Plus size={14} />{saving ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>

          {/* Historial */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1.5 }}>Historial</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{data.payments.length} pago{data.payments.length !== 1 ? 's' : ''}</span>
            </div>

            {data.payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🧾</div>
                <div style={{ fontSize: 13 }}>No hay pagos registrados todavía.</div>
              </div>
            ) : data.payments.map((p, i) => {
              const mc = METHOD_COLORS[p.method] || METHOD_COLORS['Otro']
              const isPaid = p.status === 'Pagado'
              return (
                <div key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', borderBottom: i < data.payments.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Ícono de estado */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isPaid ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${isPaid ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                    {isPaid ? <Check size={16} color="#ef4444" /> : <Clock size={16} color="#f59e0b" />}
                  </div>

                  {/* Info principal */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {p.note || 'Pago registrado'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(p.date)}</span>
                      <Badge label={p.method} color={mc.color} bg={mc.bg} border={mc.border} />
                    </div>
                  </div>

                  {/* Monto */}
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3, flexShrink: 0 }}>
                    {fmt(p.amount)}
                  </div>

                  {/* Toggle estado */}
                  <button onClick={() => handleToggleStatus(p)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      background: isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                      border: `1px solid ${isPaid ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      color: isPaid ? '#22c55e' : '#f59e0b',
                      borderRadius: 99, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                    {isPaid ? <><Check size={10} /> Pagado</> : <><Clock size={10} /> Pendiente</>}
                  </button>

                  {/* Eliminar */}
                  <button onClick={() => setConfirmDelete(p.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, borderRadius: 5, display: 'flex', transition: 'color 0.1s', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!bothSelected && !loading && (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-faint)' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🧾</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Seleccioná un proveedor y un evento</div>
          <div style={{ fontSize: 12 }}>para ver y registrar los pagos comprometidos</div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="¿Eliminar pago?" message="Esta acción no se puede deshacer."
          onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}