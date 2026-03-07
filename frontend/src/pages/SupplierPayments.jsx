import { useState, useEffect } from 'react'
import api from '../api/axios'

const fmt     = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const today   = () => new Date().toISOString().split('T')[0]

const METHODS = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro']
const methodColors = { 'Efectivo': '#22c55e', 'Transferencia': '#3b82f6', 'Cheque': '#f59e0b', 'Tarjeta': '#8b5cf6', 'Otro': '#6b7280' }

function Badge({ label, color }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: 'nowrap' }}>{label}</span>
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
    Promise.all([api.get('/api/suppliers'), api.get('/api/events')])
      .then(([s, e]) => { setSuppliers(s.data.filter(x => x.status === 'Activo')); setEvents(e.data) })
      .catch(() => {})
  }, [])

  useEffect(() => { setData(null); if (!supplierId || !eventId) return; fetchPayments() }, [supplierId, eventId])

  async function fetchPayments() {
    setLoading(true)
    try { const r = await api.get(`/api/supplier-payments?supplierId=${supplierId}&eventId=${eventId}`); setData(r.data) }
    catch { setError('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  async function handleAdd() {
    if (!form.amount || Number(form.amount) <= 0) { setError('El monto debe ser mayor a 0'); return }
    setSaving(true); setError('')
    try {
      await api.post('/api/supplier-payments', { supplierId: Number(supplierId), eventId: Number(eventId), amount: Number(form.amount), date: form.date, note: form.note, method: form.method, status: form.status })
      setForm({ amount: '', date: today(), note: '', method: 'Efectivo', status: 'Pendiente' })
      await fetchPayments()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleToggleStatus(p) {
    const newStatus = p.status === 'Pagado' ? 'Pendiente' : 'Pagado'
    try { await api.patch(`/api/supplier-payments/${p.id}/status`, { status: newStatus }); await fetchPayments() }
    catch { setError('No se pudo actualizar el estado') }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pago?')) return
    try { await api.delete(`/api/supplier-payments/${id}`); await fetchPayments() }
    catch { setError('No se pudo eliminar el pago') }
  }

  const selectedSupplier = suppliers.find(s => s.id === Number(supplierId))
  const selectedEvent    = events.find(e => e.id === Number(eventId))

  const sel = { background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 10, color: 'var(--text-primary)', padding: '10px 14px', fontSize: 14, minWidth: 220, cursor: 'pointer', outline: 'none' }
  const inp = { background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text-primary)', padding: '9px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' }
  const th  = { textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-label)', padding: '8px 12px', borderBottom: '1px solid var(--border)' }
  const td  = { padding: '12px', borderBottom: '1px solid var(--border-row)', fontSize: 14 }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: 'var(--gold-light)', marginBottom: 24 }}>Pagos a Proveedores</div>

      {/* Selectores */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <select style={sel} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
          <option value="">— Seleccionar proveedor —</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} · {s.category}</option>)}
        </select>
        <select style={sel} value={eventId} onChange={e => setEventId(e.target.value)}>
          <option value="">— Seleccionar evento —</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name} — {fmtDate(e.date)}</option>)}
        </select>
      </div>

      {/* Info bar */}
      {selectedSupplier && selectedEvent && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'Proveedor',    value: selectedSupplier.name },
            { label: 'Categoría',   value: selectedSupplier.category },
            { label: 'Evento',      value: selectedEvent.name },
            { label: 'Fecha evento',value: fmtDate(selectedEvent.date) },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-label)' }}>{item.label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)', fontSize: 14 }}>Cargando...</div>}

      {data && (
        <>
          {/* Tarjetas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total pagado',       value: data.totalPaid,                       color: '#ef4444' },
              { label: 'Total pendiente',    value: data.totalPending,                    color: '#f59e0b' },
              { label: 'Total comprometido', value: data.totalPaid + data.totalPending,   color: 'var(--gold-light)' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-label)', marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>{fmt(card.value)}</div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold-light)', marginBottom: 16 }}>Registrar pago</div>
            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
              {[
                { label: 'Monto',  type: 'number', key: 'amount', placeholder: '0' },
                { label: 'Fecha',  type: 'date',   key: 'date',   placeholder: '' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} style={inp} value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Método</label>
                <select style={inp} value={form.method} onChange={e => setForm(v => ({ ...v, method: e.target.value }))}>
                  {METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Estado</label>
                <select style={inp} value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}>
                  <option>Pendiente</option><option>Pagado</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Nota (opcional)</label>
                <input type="text" placeholder="Ej: Seña, Pago final, Cuota 1..." style={inp} value={form.note} onChange={e => setForm(v => ({ ...v, note: e.target.value }))} />
              </div>
              <button onClick={handleAdd} disabled={saving} style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Guardando...' : '+ Agregar'}
              </button>
            </div>
          </div>

          {/* Historial */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--gold-light)' }}>Historial de pagos</div>
            {data.payments.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)', fontSize: 14 }}>No hay pagos registrados aún</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Fecha</th><th style={th}>Monto</th><th style={th}>Método</th><th style={th}>Estado</th><th style={th}>Nota</th><th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ ...td, color: 'var(--text-muted)' }}>{fmtDate(p.date)}</td>
                        <td style={{ ...td, color: '#ef4444', fontWeight: 600 }}>{fmt(p.amount)}</td>
                        <td style={td}><Badge label={p.method} color={methodColors[p.method] || '#6b7280'} /></td>
                        <td style={td}>
                          <button onClick={() => handleToggleStatus(p)} style={{ background: p.status === 'Pagado' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${p.status === 'Pagado' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`, color: p.status === 'Pagado' ? '#22c55e' : '#f59e0b', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {p.status === 'Pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                          </button>
                        </td>
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

      {(!supplierId || !eventId) && !loading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-faint)', fontSize: 14 }}>
          Seleccioná un proveedor y un evento para ver y registrar pagos
        </div>
      )}
    </div>
  )
}