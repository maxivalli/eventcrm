import { useState, useEffect } from 'react'
import api from '../api/axios'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const METHODS  = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro']

const methodColors = {
  'Efectivo':      '#22c55e',
  'Transferencia': '#3b82f6',
  'Cheque':        '#f59e0b',
  'Tarjeta':       '#8b5cf6',
  'Otro':          '#6b7280',
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
      background: `${color}20`, color, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

export default function SupplierPayments() {
  const [suppliers, setSuppliers]   = useState([])
  const [events, setEvents]         = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [eventId, setEventId]       = useState('')
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(false)
  const [form, setForm]             = useState({ amount: '', date: today(), note: '', method: 'Efectivo', status: 'Pendiente' })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/suppliers'),
      api.get('/api/events'),
    ]).then(([suppRes, evRes]) => {
      setSuppliers(suppRes.data.filter(s => s.status === 'Activo'))
      setEvents(evRes.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setData(null)
    if (!supplierId || !eventId) return
    fetchPayments()
  }, [supplierId, eventId])

  async function fetchPayments() {
    setLoading(true)
    try {
      const r = await api.get(`/api/supplier-payments?supplierId=${supplierId}&eventId=${eventId}`)
      setData(r.data)
    } catch {
      setError('No se pudo cargar la información')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.amount || Number(form.amount) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/api/supplier-payments', {
        supplierId: Number(supplierId),
        eventId:    Number(eventId),
        amount:     Number(form.amount),
        date:       form.date,
        note:       form.note,
        method:     form.method,
        status:     form.status,
      })
      setForm({ amount: '', date: today(), note: '', method: 'Efectivo', status: 'Pendiente' })
      await fetchPayments()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(p) {
    const newStatus = p.status === 'Pagado' ? 'Pendiente' : 'Pagado'
    try {
      await api.patch(`/api/supplier-payments/${p.id}/status`, { status: newStatus })
      await fetchPayments()
    } catch {
      setError('No se pudo actualizar el estado')
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await api.delete(`/api/supplier-payments/${id}`)
      await fetchPayments()
    } catch {
      setError('No se pudo eliminar el pago')
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === Number(supplierId))
  const selectedEvent    = events.find(e => e.id === Number(eventId))

  const s = {
    page:      { color: '#c8c8d8' },
    title:     { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#e8c97a', marginBottom: 24 },
    selectors: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
    select: {
      background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 10,
      color: '#c8c8d8', padding: '10px 14px', fontSize: 14, minWidth: 220, cursor: 'pointer',
    },
    infoBar: {
      background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 12,
      padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap',
    },
    infoItem:  { display: 'flex', flexDirection: 'column', gap: 2 },
    infoLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: '#4a4a6a' },
    infoValue: { fontSize: 13, color: '#e8e8f0', fontWeight: 500 },
    cards:     { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
    card: (color) => ({
      background: '#1a1a2e', border: `1px solid ${color}33`, borderRadius: 14, padding: '20px 24px',
    }),
    cardLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#4a4a6a', marginBottom: 8 },
    cardValue: (color) => ({ fontSize: 26, fontWeight: 700, color }),
    formBox: {
      background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14,
      padding: '20px 24px', marginBottom: 28,
    },
    formTitle: { fontSize: 14, fontWeight: 600, color: '#e8c97a', marginBottom: 16 },
    formGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' },
    fieldWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
    label:     { fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 },
    input: {
      background: '#12121e', border: '1px solid #2a2a40', borderRadius: 8,
      color: '#c8c8d8', padding: '9px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box',
    },
    btn: {
      background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f',
      border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700,
      fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
    },
    table:  { width: '100%', borderCollapse: 'collapse' },
    th: {
      textAlign: 'left', fontSize: 11, textTransform: 'uppercase',
      letterSpacing: 1, color: '#4a4a6a', padding: '8px 12px', borderBottom: '1px solid #1e1e30',
    },
    td:     { padding: '12px', borderBottom: '1px solid #1a1a2e', fontSize: 14 },
    delBtn: {
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      color: '#ef4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
    },
    toggleBtn: (status) => ({
      background: status === 'Pagado' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
      border: `1px solid ${status === 'Pagado' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
      color: status === 'Pagado' ? '#22c55e' : '#f59e0b',
      borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
    }),
    empty: { textAlign: 'center', padding: '32px', color: '#3a3a5a', fontSize: 14 },
    error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  }

  return (
    <div style={s.page}>
      <div style={s.title}>Pagos a Proveedores</div>

      <div style={s.selectors}>
        <select style={s.select} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
          <option value="">— Seleccionar proveedor —</option>
          {suppliers.map(sup => (
            <option key={sup.id} value={sup.id}>{sup.name} · {sup.category}</option>
          ))}
        </select>

        <select style={s.select} value={eventId} onChange={e => setEventId(e.target.value)}>
          <option value="">— Seleccionar evento —</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name} — {fmtDate(ev.date)}</option>
          ))}
        </select>
      </div>

      {selectedSupplier && selectedEvent && (
        <div style={s.infoBar}>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Proveedor</span>
            <span style={s.infoValue}>{selectedSupplier.name}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Categoría</span>
            <span style={s.infoValue}>{selectedSupplier.category}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Evento</span>
            <span style={s.infoValue}>{selectedEvent.name}</span>
          </div>
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Fecha evento</span>
            <span style={s.infoValue}>{fmtDate(selectedEvent.date)}</span>
          </div>
        </div>
      )}

      {loading && <div style={s.empty}>Cargando...</div>}

      {data && (
        <>
          <div style={s.cards}>
            <div style={s.card('#ef4444')}>
              <div style={s.cardLabel}>Total pagado</div>
              <div style={s.cardValue('#ef4444')}>{fmt(data.totalPaid)}</div>
            </div>
            <div style={s.card('#f59e0b')}>
              <div style={s.cardLabel}>Total pendiente</div>
              <div style={s.cardValue('#f59e0b')}>{fmt(data.totalPending)}</div>
            </div>
            <div style={s.card('#c9a84c')}>
              <div style={s.cardLabel}>Total comprometido</div>
              <div style={s.cardValue('#e8c97a')}>{fmt(data.totalPaid + data.totalPending)}</div>
            </div>
          </div>

          <div style={s.formBox}>
            <div style={s.formTitle}>Registrar pago</div>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.formGrid}>
              <div style={s.fieldWrap}>
                <label style={s.label}>Monto</label>
                <input
                  type="number" min="0" step="100" placeholder="0"
                  style={s.input}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Fecha</label>
                <input
                  type="date" style={s.input}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Método</label>
                <select style={s.input} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Estado</label>
                <select style={s.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Pendiente</option>
                  <option>Pagado</option>
                </select>
              </div>
              <div style={{ ...s.fieldWrap, gridColumn: 'span 2' }}>
                <label style={s.label}>Nota (opcional)</label>
                <input
                  type="text" placeholder="Ej: Seña, Pago final, Cuota 1..."
                  style={s.input}
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
              <button style={s.btn} onClick={handleAdd} disabled={saving}>
                {saving ? 'Guardando...' : '+ Agregar'}
              </button>
            </div>
          </div>

          <div style={{ background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a40', fontSize: 14, fontWeight: 600, color: '#e8c97a' }}>
              Historial de pagos
            </div>
            {data.payments.length === 0 ? (
              <div style={s.empty}>No hay pagos registrados aún</div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Monto</th>
                    <th style={s.th}>Método</th>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Nota</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...s.td, color: '#8a8aa8' }}>{fmtDate(p.date)}</td>
                      <td style={{ ...s.td, color: '#ef4444', fontWeight: 600 }}>{fmt(p.amount)}</td>
                      <td style={s.td}>
                        <Badge label={p.method} color={methodColors[p.method] || '#6b7280'} />
                      </td>
                      <td style={s.td}>
                        <button style={s.toggleBtn(p.status)} onClick={() => handleToggleStatus(p)}>
                          {p.status === 'Pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                        </button>
                      </td>
                      <td style={{ ...s.td, color: '#6a6a8a' }}>{p.note || '—'}</td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <button style={s.delBtn} onClick={() => handleDelete(p.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {(!supplierId || !eventId) && !loading && (
        <div style={s.empty}>
          Seleccioná un proveedor y un evento para ver y registrar pagos
        </div>
      )}
    </div>
  )
}