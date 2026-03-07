import { useState, useEffect } from 'react'
import api from '../api/axios'

const fmt     = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const today   = () => new Date().toISOString().split('T')[0]

export default function Payments() {
  const [clients, setClients]   = useState([])
  const [events, setEvents]     = useState([])
  const [clientId, setClientId] = useState('')
  const [eventId, setEventId]   = useState('')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({ amount: '', date: today(), note: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { api.get('/api/clients').then(r => setClients(r.data)).catch(() => {}) }, [])

  useEffect(() => {
    setEventId(''); setData(null)
    if (!clientId) { setEvents([]); return }
    api.get(`/api/clients/${clientId}`).then(r => setEvents(r.data.events || [])).catch(() => {})
  }, [clientId])

  useEffect(() => { setData(null); if (!eventId) return; fetchPayments() }, [eventId])

  async function fetchPayments() {
    setLoading(true)
    try { const r = await api.get(`/api/payments?eventId=${eventId}`); setData(r.data) }
    catch { setError('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  async function handleAddPayment() {
    if (!form.amount || Number(form.amount) <= 0) { setError('El monto debe ser mayor a 0'); return }
    setSaving(true); setError('')
    try {
      await api.post('/api/payments', { eventId: Number(eventId), ...form, amount: Number(form.amount) })
      setForm({ amount: '', date: today(), note: '' })
      await fetchPayments()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pago?')) return
    try { await api.delete(`/api/payments/${id}`); await fetchPayments() }
    catch { setError('No se pudo eliminar el pago') }
  }

  const sel = { background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text-primary)', padding: '10px 14px', fontSize: 14, minWidth: 220, cursor: 'pointer', outline: 'none' }
  const inp = { background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text-primary)', padding: '9px 12px', fontSize: 14, flex: 1, minWidth: 120, outline: 'none' }
  const th  = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-label)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }
  const td  = { padding: '12px', borderBottom: '1px solid var(--border-row)', fontSize: 14 }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: 'var(--gold-light)', marginBottom: 24 }}>Gestión de Cobros</div>

      {/* Selectores */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <select style={sel} value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">— Seleccionar cliente —</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={sel} value={eventId} onChange={e => setEventId(e.target.value)} disabled={!clientId}>
          <option value="">— Seleccionar evento —</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name} — {fmtDate(e.date)}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)', fontSize: 14 }}>Cargando...</div>}

      {data && (
        <>
          {/* Tarjetas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total cotizado (aceptado)', value: data.totalQuotes, color: 'var(--gold-light)' },
              { label: 'Total entregado',           value: data.totalPaid,   color: '#22c55e' },
              { label: 'Saldo pendiente',           value: data.balance,     color: data.balance > 0 ? '#ef4444' : '#22c55e' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-label)', marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>{fmt(card.value)}</div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold-light)', marginBottom: 16 }}>Registrar entrega de dinero</div>
            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {[
                { label: 'Monto', type: 'number', key: 'amount', placeholder: '0', style: {} },
                { label: 'Fecha', type: 'date',   key: 'date',   placeholder: '',  style: {} },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} style={inp} value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2 }}>
                <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Nota (opcional)</label>
                <input type="text" placeholder="Ej: Seña, Cuota 1, Saldo final..." style={inp} value={form.note} onChange={e => setForm(v => ({ ...v, note: e.target.value }))} />
              </div>
              <button onClick={handleAddPayment} disabled={saving} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {saving ? 'Guardando...' : '+ Agregar'}
              </button>
            </div>
          </div>

          {/* Historial */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--gold-light)' }}>Historial de entregas</div>
            {data.payments.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)', fontSize: 14 }}>No hay entregas registradas aún</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Fecha</th><th style={th}>Monto</th><th style={th}>Nota</th><th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ ...td, color: 'var(--text-muted)' }}>{fmtDate(p.date)}</td>
                        <td style={{ ...td, color: '#22c55e', fontWeight: 600 }}>{fmt(p.amount)}</td>
                        <td style={{ ...td, color: 'var(--text-muted)' }}>{p.note || '—'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </>
      )}

      {!eventId && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)', fontSize: 14 }}>
          Seleccioná un cliente y un evento para ver el estado de cuenta
        </div>
      )}
    </div>
  )
}