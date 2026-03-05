import { useState, useEffect } from 'react'
import api from '../api/axios'

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function Payments() {
  const [clients, setClients]     = useState([])
  const [events, setEvents]       = useState([])
  const [clientId, setClientId]   = useState('')
  const [eventId, setEventId]     = useState('')
  const [data, setData]           = useState(null)   // { payments, totalQuotes, totalPaid, balance }
  const [loading, setLoading]     = useState(false)
  const [form, setForm]           = useState({ amount: '', date: today(), note: '' })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  // Cargar clientes al montar
  useEffect(() => {
    api.get('/api/clients').then(r => setClients(r.data)).catch(() => {})
  }, [])

  // Filtrar eventos cuando cambia el cliente
  useEffect(() => {
    setEventId('')
    setData(null)
    if (!clientId) { setEvents([]); return }
    api.get(`/api/clients/${clientId}`).then(r => setEvents(r.data.events || [])).catch(() => {})
  }, [clientId])

  // Cargar pagos cuando cambia el evento
  useEffect(() => {
    setData(null)
    if (!eventId) return
    fetchPayments()
  }, [eventId])

  async function fetchPayments() {
    setLoading(true)
    try {
      const r = await api.get(`/api/payments?eventId=${eventId}`)
      setData(r.data)
    } catch {
      setError('No se pudo cargar la información')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPayment() {
    if (!form.amount || Number(form.amount) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/api/payments', { eventId: Number(eventId), ...form, amount: Number(form.amount) })
      setForm({ amount: '', date: today(), note: '' })
      await fetchPayments()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pago?')) return
    try {
      await api.delete(`/api/payments/${id}`)
      await fetchPayments()
    } catch {
      setError('No se pudo eliminar el pago')
    }
  }

  const s = {
    page: { color: '#c8c8d8' },
    title: { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: '#e8c97a', marginBottom: 24 },
    selectors: { display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' },
    select: {
      background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 10,
      color: '#c8c8d8', padding: '10px 14px', fontSize: 14, minWidth: 220, cursor: 'pointer',
    },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
    card: (color) => ({
      background: '#1a1a2e', border: `1px solid ${color}33`, borderRadius: 14,
      padding: '20px 24px',
    }),
    cardLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#4a4a6a', marginBottom: 8 },
    cardValue: (color) => ({ fontSize: 26, fontWeight: 700, color }),
    formBox: {
      background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14,
      padding: '20px 24px', marginBottom: 28,
    },
    formTitle: { fontSize: 14, fontWeight: 600, color: '#e8c97a', marginBottom: 16 },
    formRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
    input: {
      background: '#12121e', border: '1px solid #2a2a40', borderRadius: 8,
      color: '#c8c8d8', padding: '9px 12px', fontSize: 14, flex: 1, minWidth: 120,
    },
    btn: {
      background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', color: '#09090f',
      border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700,
      fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#4a4a6a', padding: '8px 12px', borderBottom: '1px solid #1e1e30' },
    td: { padding: '12px', borderBottom: '1px solid #1a1a2e', fontSize: 14 },
    delBtn: {
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      color: '#ef4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
    },
    empty: { textAlign: 'center', padding: '32px', color: '#3a3a5a', fontSize: 14 },
    error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  }

  return (
    <div style={s.page}>
      <div style={s.title}>Gestión de Cobros</div>

      {/* Selectores */}
      <div style={s.selectors}>
        <select style={s.select} value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">— Seleccionar cliente —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select style={s.select} value={eventId} onChange={e => setEventId(e.target.value)} disabled={!clientId}>
          <option value="">— Seleccionar evento —</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.name} — {fmtDate(e.date)}</option>
          ))}
        </select>
      </div>

      {loading && <div style={s.empty}>Cargando...</div>}

      {data && (
        <>
          {/* Tarjetas resumen */}
          <div style={s.cards}>
            <div style={s.card('#c9a84c')}>
              <div style={s.cardLabel}>Total cotizado (aceptado)</div>
              <div style={s.cardValue('#e8c97a')}>{fmt(data.totalQuotes)}</div>
            </div>
            <div style={s.card('#22c55e')}>
              <div style={s.cardLabel}>Total entregado</div>
              <div style={s.cardValue('#22c55e')}>{fmt(data.totalPaid)}</div>
            </div>
            <div style={s.card(data.balance > 0 ? '#ef4444' : '#22c55e')}>
              <div style={s.cardLabel}>Saldo pendiente</div>
              <div style={s.cardValue(data.balance > 0 ? '#ef4444' : '#22c55e')}>
                {fmt(data.balance)}
              </div>
            </div>
          </div>

          {/* Formulario nuevo pago */}
          <div style={s.formBox}>
            <div style={s.formTitle}>Registrar entrega de dinero</div>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.formRow}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Monto</label>
                <input
                  type="number" min="0" step="100"
                  placeholder="0"
                  style={s.input}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Fecha</label>
                <input
                  type="date"
                  style={s.input}
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2 }}>
                <label style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>Nota (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Seña, Cuota 1, Saldo final..."
                  style={s.input}
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
              <button style={s.btn} onClick={handleAddPayment} disabled={saving}>
                {saving ? 'Guardando...' : '+ Agregar'}
              </button>
            </div>
          </div>

          {/* Historial de pagos */}
          <div style={{ background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #2a2a40', fontSize: 14, fontWeight: 600, color: '#e8c97a' }}>
              Historial de entregas
            </div>
            {data.payments.length === 0 ? (
              <div style={s.empty}>No hay entregas registradas aún</div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Fecha</th>
                    <th style={s.th}>Monto</th>
                    <th style={s.th}>Nota</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...s.td, color: '#8a8aa8' }}>{fmtDate(p.date)}</td>
                      <td style={{ ...s.td, color: '#22c55e', fontWeight: 600 }}>{fmt(p.amount)}</td>
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

      {!eventId && !loading && (
        <div style={s.empty}>
          Seleccioná un cliente y un evento para ver el estado de cuenta
        </div>
      )}
    </div>
  )
}