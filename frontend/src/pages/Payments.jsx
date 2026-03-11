import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const fmt     = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const today   = () => new Date().toISOString().split('T')[0]

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

export default function Payments() {
  const toast = useToast()
  const [clients, setClients]             = useState([])
  const [events, setEvents]               = useState([])
  const [clientId, setClientId]           = useState('')
  const [eventId, setEventId]             = useState('')
  const [data, setData]                   = useState(null)
  const [loading, setLoading]             = useState(false)
  const [form, setForm]                   = useState({ amount: '', date: today(), note: '' })
  const [saving, setSaving]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    api.get('/api/clients').then(r => setClients(r.data)).catch(() => toast('Error al cargar clientes'))
  }, [])

  useEffect(() => {
    setEventId(''); setData(null)
    if (!clientId) { setEvents([]); return }
    api.get(`/api/clients/${clientId}`).then(r => setEvents(r.data.events || [])).catch(() => toast('Error al cargar eventos del cliente'))
  }, [clientId])

  useEffect(() => { setData(null); if (!eventId) return; fetchPayments() }, [eventId])

  async function fetchPayments() {
    setLoading(true)
    try { const r = await api.get(`/api/payments?eventId=${eventId}`); setData(r.data) }
    catch { toast('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  async function handleAddPayment() {
    if (!form.amount || Number(form.amount) <= 0) { toast('El monto debe ser mayor a 0'); return }
    setSaving(true)
    try {
      await api.post('/api/payments', { eventId: Number(eventId), ...form, amount: Number(form.amount) })
      setForm({ amount: '', date: today(), note: '' })
      await fetchPayments()
      toast('Cobro registrado', 'success')
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    try { await api.delete(`/api/payments/${confirmDelete}`); await fetchPayments(); toast('Cobro eliminado', 'success') }
    catch { toast('No se pudo eliminar el cobro') }
    finally { setConfirmDelete(null) }
  }

  const selectedClient = clients.find(c => c.id === Number(clientId))
  const selectedEvent  = events.find(e => e.id === Number(eventId))
  const pct = data?.totalQuotes > 0 ? Math.min(100, Math.round((data.totalPaid / data.totalQuotes) * 100)) : 0

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Cobros</div>
        <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 3 }}>Registro de entregas de dinero por evento</div>
      </div>

      {/* ── Selector panel ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Seleccionar evento
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Cliente</label>
            <select style={selStyle} value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...lbl, opacity: !clientId ? 0.4 : 1 }}>Evento</label>
            <select style={{ ...selStyle, opacity: !clientId ? 0.4 : 1 }} value={eventId}
              onChange={e => setEventId(e.target.value)} disabled={!clientId}>
              <option value="">— Seleccionar evento —</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name} · {fmtDate(e.date)}</option>)}
            </select>
          </div>
        </div>

        {/* Breadcrumb seleccionado */}
        {selectedClient && selectedEvent && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{selectedClient.name}</span>
            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>›</span>
            <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{selectedEvent.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 4 }}>{fmtDate(selectedEvent.date)}</span>
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
            <StatCard label="Total cotizado"  value={data.totalQuotes} color="var(--gold)"
              border="rgba(201,168,76,0.3)" icon={<TrendingUp size={16} />} />
            <StatCard label="Total cobrado"   value={data.totalPaid}   color="#22c55e"
              border="rgba(34,197,94,0.3)"  icon={<CheckCircle2 size={16} />} />
            <StatCard label="Saldo pendiente" value={data.balance}
              color={data.balance > 0 ? '#ef4444' : '#22c55e'}
              border={data.balance > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}
              icon={<Clock size={16} />} />
          </div>

          {/* Barra de progreso */}
          {data.totalQuotes > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Progreso de cobro</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? '#22c55e' : 'var(--gold)' }}>{pct}%</span>
              </div>
              <div style={{ background: 'var(--bg-sunken)', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width 0.7s ease',
                  background: pct >= 100 ? '#22c55e' : 'linear-gradient(90deg,#c9a84c,#4ade80)' }} />
              </div>
            </div>
          )}

          {/* Formulario */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Registrar cobro</span>
            </div>
            <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={lbl}>Monto *</label>
                <input type="number" placeholder="0" style={inpStyle} value={form.amount}
                  onChange={e => setForm(v => ({ ...v, amount: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAddPayment()} />
              </div>
              <div>
                <label style={lbl}>Fecha</label>
                <input type="date" style={inpStyle} value={form.date}
                  onChange={e => setForm(v => ({ ...v, date: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Nota (opcional)</label>
                <input type="text" placeholder="Ej: Seña, Cuota 1, Saldo final..." style={inpStyle}
                  value={form.note} onChange={e => setForm(v => ({ ...v, note: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAddPayment()} />
              </div>
              <button onClick={handleAddPayment} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                <Plus size={14} />{saving ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>

          {/* Historial */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1.5 }}>Historial</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{data.payments.length} cobro{data.payments.length !== 1 ? 's' : ''}</span>
            </div>

            {data.payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
                <div style={{ fontSize: 13 }}>No hay cobros registrados todavía.</div>
              </div>
            ) : data.payments.map((p, i) => (
              <div key={p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 22px', borderBottom: i < data.payments.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Ícono */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {p.note || 'Cobro registrado'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(p.date)}</div>
                </div>

                {/* Monto */}
                <div style={{ fontSize: 15, fontWeight: 800, color: '#22c55e', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3, flexShrink: 0 }}>
                  {fmt(p.amount)}
                </div>

                {/* Eliminar */}
                <button onClick={() => setConfirmDelete(p.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, borderRadius: 5, display: 'flex', transition: 'color 0.1s', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!eventId && !loading && (
        <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-faint)' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>💳</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Seleccioná un cliente y un evento</div>
          <div style={{ fontSize: 12 }}>para ver el estado de cuenta y registrar cobros</div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="¿Eliminar cobro?" message="Esta acción no se puede deshacer."
          onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}