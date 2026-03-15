import { useState, useEffect } from "react";
import { AlertCircle, FileText, ClipboardList, Star, CreditCard, Users, X, Check, Copy, Cloud, Link2 } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../Toast";
import { useAuth } from "../../contexts/AuthContext";
import ConfirmDialog from "../ConfirmDialog";
import Checklist from "../Checklist";
import Cronograma from "../Cronograma";
import QuoteDetailCard from "./QuoteDetailCard";
import {
  fmt, fmtDate, Badge, BalanceBar,
  WEATHER_CODES, SECCION_COLORS, DIETARY_OPTIONS,
  statusColors, typeColors,
} from "../../utils/eventUtils";

export default function EventDetail({ event, onClose, onEdit }) {
  const toast = useToast();
  const { isReadonly } = useAuth();
  const [tab, setTab]               = useState('info');
  const [quotes, setQuotes]         = useState([]);
  const [payments, setPayments]     = useState([]);
  const [spPayments, setSpPayments] = useState([]);
  const [summary, setSummary]       = useState({ totalQuotes: 0, totalPaid: 0, balance: 0 });
  const [spSummary, setSpSummary]   = useState({ totalPaid: 0, totalPending: 0 });
  const [loading, setLoading]       = useState(true);
  const [portalToken, setPortalToken]     = useState(event.portalToken || null);
  const [portalCopied, setPortalCopied]   = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [alerts, setAlerts]               = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlerts, setShowAlerts]       = useState(false);
  const [proposal, setProposal]           = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalCopied, setProposalCopied]   = useState(false);
  const [showProposal, setShowProposal]   = useState(false);
  const [weather, setWeather]             = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError]   = useState(false);
  const [guests, setGuests]               = useState([]);
  const [guestsLoaded, setGuestsLoaded]   = useState(false);
  const [checkinToken, setCheckinToken]   = useState(event.checkinToken || null);
  const [checkinCopied, setCheckinCopied] = useState(false);
  const [guestSearch, setGuestSearch]     = useState('');
  const [paidListUrl, setPaidListUrl]     = useState(event.paidGuestListUrl || null);
  const [paidListCount, setPaidListCount] = useState(event.paidGuestListCount ?? null);
  const [confirmDeleteGuest, setConfirmDeleteGuest]     = useState(null);
  const [confirmDeletePaidList, setConfirmDeletePaidList] = useState(false);

  const portalUrl  = portalToken  ? `${window.location.origin}/portal/${portalToken}`  : null;
  const checkinUrl = checkinToken ? `${window.location.origin}/checkin/${checkinToken}` : null;

  const handleGeneratePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await api.post(`/api/events/${event.id}/portal-token`);
      setPortalToken(res.data.portalToken);
    } catch { } finally { setPortalLoading(false); }
  };
  const handleCopyPortal = () => {
    navigator.clipboard.writeText(portalUrl);
    setPortalCopied(true); setTimeout(() => setPortalCopied(false), 2000);
  };

  const handleAlerts = async () => {
    setShowAlerts(true); if (alerts) return;
    setAlertsLoading(true);
    try {
      let currentGuests = guests;
      if (!guestsLoaded) {
        const gRes = await api.get(`/api/event-guests?eventId=${event.id}`);
        currentGuests = gRes.data;
        setGuests(gRes.data);
        setGuestsLoaded(true);
      }
      const res = await api.post('/api/ai/event-alerts', {
        event: { ...event, client: event.client },
        quotes, payments, spPayments, guests: currentGuests,
      });
      setAlerts(res.data.alerts);
    } catch { setAlerts([]); }
    finally { setAlertsLoading(false); }
  };

  const handleProposal = async () => {
    setShowProposal(true); if (proposal) return;
    setProposalLoading(true);
    try {
      const res = await api.post('/api/ai/proposal', { event: { ...event, client: event.client }, quotes, payments });
      setProposal(res.data.proposal);
    } catch { setProposal('No se pudo generar la propuesta. Intentá de nuevo.'); }
    finally { setProposalLoading(false); }
  };
  const handleCopyProposal = () => {
    navigator.clipboard.writeText(proposal);
    setProposalCopied(true); setTimeout(() => setProposalCopied(false), 2000);
  };

  const loadGuests = async () => {
    if (guestsLoaded) return;
    const res = await api.get(`/api/event-guests?eventId=${event.id}`);
    setGuests(res.data);
    setGuestsLoaded(true);
  };

  const handleTogglePagado = async (guest) => {
    const res = await api.put(`/api/event-guests/${guest.id}`, { pagado: !guest.pagado });
    setGuests(prev => prev.map(g => g.id === guest.id ? res.data : g));
  };

  const handleDeleteGuest = async (id) => {
    await api.delete(`/api/event-guests/${id}`);
    setGuests(prev => prev.filter(g => g.id !== id));
    setConfirmDeleteGuest(null);
  };

  const handleDeletePaidList = async () => {
    try {
      await api.delete(`/api/events/${event.id}/paid-guest-list`);
      setPaidListUrl(null); setPaidListCount(null);
      setConfirmDeletePaidList(false);
    } catch { toast.error('No se pudo eliminar la lista'); }
  };

  const handleGenerateCheckin = async () => {
    const res = await api.post(`/api/events/${event.id}/checkin-token`);
    setCheckinToken(res.data.checkinToken);
  };

  const handleCopyCheckin = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCheckinCopied(true); setTimeout(() => setCheckinCopied(false), 2000);
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/quotes'),
      api.get(`/api/payments?eventId=${event.id}`),
      api.get(`/api/supplier-payments/by-event/${event.id}`),
      api.get(`/api/event-guests?eventId=${event.id}`),
    ]).then(([qRes, pRes, spRes, gRes]) => {
      setQuotes(qRes.data.filter(q => q.eventId === event.id));
      setPayments(pRes.data.payments || []);
      setSummary({ totalQuotes: pRes.data.totalQuotes || 0, totalPaid: pRes.data.totalPaid || 0, balance: pRes.data.balance || 0 });
      setSpPayments(spRes.data.payments || []);
      setSpSummary({ totalPaid: spRes.data.totalPaid || 0, totalPending: spRes.data.totalPending || 0 });
      setGuests(gRes.data);
      setGuestsLoaded(true);
    }).catch(console.error).finally(() => setLoading(false));
  }, [event.id]);

  useEffect(() => {
    if (tab !== 'info' || !event.date) return;
    const date = new Date(event.date).toISOString().slice(0, 10);
    setWeatherLoading(true);
    setWeatherError(false);
    const fetchWeather = async () => {
      try {
        const LAT = -30.2283;
        const LON = -61.4474;
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`
        );
        const w = await weatherRes.json();
        const code = w.daily?.weathercode?.[0];
        const max  = w.daily?.temperature_2m_max?.[0];
        const min  = w.daily?.temperature_2m_min?.[0];
        if (typeof code === 'undefined') throw new Error('no forecast');
        setWeather({ code, max, min, location: 'San Cristóbal, Santa Fe' });
      } catch {
        setWeather(null);
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [tab, event.date]);

  const calcQuoteTotal = q => {
    const items    = (q.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0);
    const catering = q.kind === 'Catering' ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
    return catering + items;
  };

  const totalProveedores = spSummary.totalPaid + spSummary.totalPending;
  const utilidad   = summary.totalQuotes - totalProveedores;
  const balanceMax = Math.max(summary.totalQuotes, summary.totalPaid, totalProveedores, 1);

  const SL   = { fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, fontWeight: 800 };
  const Card = ({ children, style = {} }) => (
    <div style={{ background: 'var(--bg-sunken)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', ...style }}>{children}</div>
  );
  const Row = ({ label, value, color = 'var(--text-primary)', last = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: last ? 'none' : '1px solid var(--border-row)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-label)' }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: color !== 'var(--text-primary)' ? 600 : 400 }}>{value}</span>
    </div>
  );

  const weatherInfo = weather
    ? (WEATHER_CODES[weather.code] || { label: 'Clima', icon: <Cloud size={14} />, color: 'var(--text-muted)' })
    : null;

  const confirmedQuotes = quotes.filter(q => q.clientStatus === 'Aprobado');
  const pendingQuotes   = quotes.filter(q => q.clientStatus == null);

  const TABS = [
    { id: 'info',      label: 'Info',      icon: <ClipboardList size={13} /> },
    { id: 'servicios', label: 'Servicios', icon: <Star size={13} />, badge: confirmedQuotes.length },
    ...(!isReadonly ? [{ id: 'finanzas', label: 'Finanzas', icon: <CreditCard size={13} /> }] : []),
    { id: 'invitados', label: 'Invitados', icon: <Users size={13} />, badge: guests.length || null },
  ];

  return (
    <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 20,
        width: '100%', maxWidth: 1200, height: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.2 }}>{event.name}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-label)', marginTop: 3 }}>
                {event.client?.name} · {fmtDate(event.date)}{event.time ? ` · ${event.time}` : ''}
              </div>
            </div>
            <Badge label={event.status} color={statusColors[event.status] || 'var(--text-muted)'} />
            <Badge label={event.type}   color={typeColors[event.type]   || 'var(--text-muted)'} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleAlerts} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              <AlertCircle size={13} /> Alertas
            </button>
            <button onClick={handleProposal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              <FileText size={13} /> Propuesta
            </button>
            <button onClick={() => onEdit(event)} style={{ padding: '7px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#09090f', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Editar</button>
            <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}><X size={14} /></button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', flexShrink: 0, paddingLeft: 28 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
            }}>
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: '#22c55e', color: '#fff', borderRadius: 99, padding: '1px 6px' }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Modal Alertas ── */}
        {showAlerts && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setShowAlerts(false)}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={15} /> Alertas de inconsistencias</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {alerts && !alertsLoading && (
                    <button onClick={() => { setAlerts(null); handleAlerts(); }} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Reanalizar</button>
                  )}
                  <button onClick={() => setShowAlerts(false)} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {alertsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-label)', fontSize: 13 }}>Analizando el evento con IA...</div>
                ) : !alerts || alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Check size={32} color="#22c55e" /></div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', marginBottom: 6 }}>Sin inconsistencias detectadas</div>
                    <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>El evento parece estar en orden.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map((a, i) => {
                      const nivelColor = a.nivel === 'alto' ? '#ef4444' : a.nivel === 'medio' ? '#f59e0b' : '#3b82f6';
                      return (
                        <div key={i} style={{ background: `${nivelColor}0d`, border: `1px solid ${nivelColor}30`, borderLeft: `3px solid ${nivelColor}`, borderRadius: 10, padding: '12px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: nivelColor }}>{a.nivel}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-faint)', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 20, padding: '1px 8px' }}>{a.categoria}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{a.mensaje}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Propuesta ── */}
        {showProposal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => e.target === e.currentTarget && setShowProposal(false)}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} /> Propuesta comercial</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {proposal && !proposalLoading && (
                    <>
                      <button onClick={handleCopyProposal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: proposalCopied ? 'rgba(34,197,94,0.1)' : 'transparent', color: proposalCopied ? '#22c55e' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                        {proposalCopied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                      </button>
                      <button onClick={() => { setProposal(null); handleProposal(); }} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Regenerar</button>
                    </>
                  )}
                  <button onClick={() => setShowProposal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {proposalLoading
                  ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-label)', fontSize: 13 }}>Generando propuesta con IA...</div>
                  : <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)' }}>{proposal}</pre>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Tab body ── */}
        <div style={{ flex: 1, overflow: 'hidden' }}>

          {/* ═══ TAB: INFO ═══ */}
          {tab === 'info' && (
            <div style={{ height: '100%', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

              {/* Columna izquierda */}
              <div style={{ padding: '28px 32px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 28 }}>
                <section>
                  <div style={SL}>Datos del evento</div>
                  <Card>
                    <Row label="Fecha"          value={fmtDate(event.date)} />
                    <Row label="Hora"            value={event.time || '—'} />
                    <Row label="Venue"           value={event.venue} />
                    <Row label="Invitados"       value={`${event.guests} personas`} />
                    <Row label="Pres. estimado"  value={fmt(event.budget)} last={!event.ticketPrice && !event.dietaryOptions} />
                    {event.ticketPrice && (
                      <Row label="Precio tarjeta" value={fmt(event.ticketPrice)} last={!event.dietaryOptions} />
                    )}
                    {(() => {
                      const raw = (() => { try { return typeof event.dietaryOptions === 'string' ? JSON.parse(event.dietaryOptions) : (event.dietaryOptions || []) } catch { return [] } })();
                      const opts = Array.isArray(raw) ? raw : [];
                      if (!opts.length) return null;
                      return (
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Necesidades alimentarias</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {opts.map(o => (
                              <div key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', fontSize: 12 }}>
                                <span>{DIETARY_OPTIONS.find(d => d.key === o.key)?.icon}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{o.label}</span>
                                {o.cantidad && <span style={{ color: 'var(--gold)', fontWeight: 700 }}>× {o.cantidad}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </Card>

                  {/* Portal del cliente */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
                    {portalUrl ? (
                      <>
                        <button onClick={handleCopyPortal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, background: portalCopied ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.06)', color: portalCopied ? '#22c55e' : 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                          {portalCopied ? <><Check size={13} /> Copiado</> : <><Link2 size={13} /> Copiar link cliente</>}
                        </button>
                        <button onClick={handleGeneratePortal} disabled={portalLoading} title="Regenerar link" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-faint)', fontSize: 13, cursor: 'pointer' }}>↺</button>
                      </>
                    ) : (
                      <button onClick={handleGeneratePortal} disabled={portalLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                        {portalLoading ? 'Generando...' : <><Link2 size={13} /> Generar link cliente</>}
                      </button>
                    )}
                  </div>

                  {(weatherLoading || weather || weatherError) && (
                    <div style={{ marginTop: 20 }}>
                      <div style={SL}>Clima estimado</div>
                      <Card>
                        {weatherLoading ? (
                          <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-faint)' }}>Cargando clima…</div>
                        ) : weather ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 38, height: 38, borderRadius: 16, background: `${weatherInfo.color}20`, color: weatherInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {weatherInfo.icon}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{weatherInfo.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{weather.location}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(weather.max)}° / {Math.round(weather.min)}°</div>
                              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>max / min</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-faint)' }}>El pronóstico del clima no está disponible para esta fecha.</div>
                        )}
                      </Card>
                    </div>
                  )}
                </section>

                <section>
                  <div style={SL}>Cronograma del día</div>
                  <Cronograma event={event} />
                </section>
              </div>

              {/* Columna derecha */}
              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                <section>
                  <div style={SL}>Checklist</div>
                  <Checklist eventId={event.id} event={event} />
                </section>
              </div>
            </div>
          )}

          {/* ═══ TAB: SERVICIOS ═══ */}
          {tab === 'servicios' && (
            <div style={{ height: '100%', overflowY: 'auto', padding: '28px 36px' }}>
              {loading ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Cargando...</div>
              ) : quotes.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin cotizaciones cargadas.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {confirmedQuotes.length > 0 && (
                    <section>
                      <div style={{ ...SL, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 5 }}><Check size={13} /> Confirmados por el cliente</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {confirmedQuotes.map(q => (
                          <QuoteDetailCard key={q.id} quote={q} calcTotal={calcQuoteTotal} SECCION_COLORS={SECCION_COLORS} />
                        ))}
                      </div>
                    </section>
                  )}
                  {pendingQuotes.length > 0 && (
                    <section>
                      <div style={{ ...SL, color: 'var(--text-faint)' }}>Pendientes de confirmación</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {pendingQuotes.map(q => (
                          <QuoteDetailCard key={q.id} quote={q} calcTotal={calcQuoteTotal} SECCION_COLORS={SECCION_COLORS} muted />
                        ))}
                      </div>
                    </section>
                  )}
                  {quotes.filter(q => q.clientStatus === 'Rechazado').length > 0 && (
                    <section>
                      <div style={{ ...SL, color: '#ef4444' }}>Rechazadas</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {quotes.filter(q => q.clientStatus === 'Rechazado').map(q => (
                          <div key={q.id} style={{ padding: '11px 16px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{q.kind}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{fmt(calcQuoteTotal(q))}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: FINANZAS ═══ */}
          {tab === 'finanzas' && (
            <div style={{ height: '100%', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <div style={{ padding: '28px 32px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 28 }}>
                <section>
                  <div style={SL}>Cobros al cliente</div>
                  {loading ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Cargando...</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {payments.length === 0
                        ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin cobros registrados</div>
                        : payments.map(p => (
                          <div key={p.id} style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{fmt(p.amount)}</div>
                              {p.note && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{p.note}</div>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(p.date)}</div>
                          </div>
                        ))
                      }
                      <Card>
                        <Row label="Total cobrado"   value={fmt(summary.totalPaid)}  color="#22c55e" />
                        <Row label="Saldo pendiente" value={fmt(summary.balance)}    color={summary.balance > 0 ? '#ef4444' : '#22c55e'} last />
                      </Card>
                    </div>
                  )}
                </section>

                <section>
                  <div style={SL}>Pagos a proveedores</div>
                  {loading ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Cargando...</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {spPayments.length === 0
                        ? <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin pagos registrados</div>
                        : spPayments.map(p => (
                          <div key={p.id} style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{p.supplier?.name}</div>
                              {p.note && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{p.note}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <Badge label={p.status} color={p.status === 'Pagado' ? '#22c55e' : '#f59e0b'} />
                              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(p.amount)}</span>
                            </div>
                          </div>
                        ))
                      }
                      <Card>
                        <Row label="Pagado a proveedores"  value={fmt(spSummary.totalPaid)}    color="#ef4444" />
                        <Row label="Pendiente proveedores" value={fmt(spSummary.totalPending)} color="#f59e0b" last />
                      </Card>
                    </div>
                  )}
                </section>
              </div>

              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {!loading && (
                  <section>
                    <div style={SL}>Balance del evento</div>
                    <div style={{ background: 'var(--bg-sunken)', borderRadius: 14, border: '1px solid var(--border)', padding: '22px 24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                        {[
                          { label: 'Ingresos aprobados', value: summary.totalQuotes,    color: 'var(--gold)' },
                          { label: 'Cobrado al cliente',  value: summary.totalPaid,      color: '#22c55e' },
                          { label: 'Pagado proveedores',  value: spSummary.totalPaid,    color: '#ef4444' },
                          { label: 'Pend. proveedores',   value: spSummary.totalPending, color: '#f59e0b' },
                        ].map(item => (
                          <div key={item.label} style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{item.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{fmt(item.value)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                        <BalanceBar label="Ingresos aprobados" value={summary.totalQuotes} max={balanceMax} color="var(--gold)" />
                        <BalanceBar label="Cobrado al cliente"  value={summary.totalPaid}   max={balanceMax} color="#22c55e" />
                        <BalanceBar label="Total proveedores"   value={totalProveedores}     max={balanceMax} color="#ef4444" />
                      </div>
                      <div style={{ paddingTop: 18, borderTop: '1px solid var(--border-row)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>Utilidad estimada</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Ingresos − total proveedores</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 26, fontWeight: 800, color: utilidad >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(utilidad)}</div>
                          {summary.totalQuotes > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-label)' }}>{Math.round((utilidad / summary.totalQuotes) * 100)}% del ingreso</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: INVITADOS ═══ */}
          {tab === 'invitados' && (() => {
            if (!guestsLoaded) loadGuests();
            const mayores    = guests.filter(g => g.tipo === 'Mayor');
            const menores    = guests.filter(g => g.tipo === 'Menor');
            const pagados    = guests.filter(g => g.pagado);
            const ingresaron = guests.filter(g => g.ingreso);

            return (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {[
                      { label: 'Total',      value: guests.length,      color: 'var(--gold)' },
                      { label: 'Mayores',    value: mayores.length,     color: 'var(--text-primary)' },
                      { label: 'Menores',    value: menores.length,     color: '#8b5cf6' },
                      { label: 'Pagaron',    value: pagados.length,     color: '#22c55e' },
                      { label: 'Ingresaron', value: ingresaron.length,  color: '#3b82f6' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {paidListUrl && (
                      <>
                        <a href={paidListUrl} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8, background: 'rgba(201,168,76,0.07)', color: 'var(--gold)', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          <FileText size={13} /> Lista pagados
                          {paidListCount != null && (
                            <span style={{ background: 'var(--gold)', color: '#09090f', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 6px', marginLeft: 2 }}>
                              {paidListCount}
                            </span>
                          )}
                        </a>
                        <button onClick={() => setConfirmDeletePaidList(true)} title="Eliminar lista" style={{ padding: '7px 10px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer', opacity: 0.8 }}>✕</button>
                      </>
                    )}
                    {checkinUrl ? (
                      <>
                        <button onClick={handleCopyCheckin} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 8, background: checkinCopied ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.08)', color: checkinCopied ? '#22c55e' : '#3b82f6', fontSize: 12, cursor: 'pointer' }}>
                          {checkinCopied ? <><Check size={13} /> Copiado</> : <><Link2 size={13} /> Link portero</>}
                        </button>
                        <button onClick={handleGenerateCheckin} title="Regenerar link" style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-faint)', fontSize: 11, cursor: 'pointer' }}>↺</button>
                      </>
                    ) : (
                      <button onClick={handleGenerateCheckin} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                        Generar link portero
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                  <input
                    value={guestSearch}
                    onChange={e => setGuestSearch(e.target.value)}
                    placeholder="Buscar invitado..."
                    style={{ width: '100%', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {guests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-faint)', fontSize: 13 }}>
                      Sin invitados cargados aún
                    </div>
                  ) : (() => {
                    const q        = guestSearch.toLowerCase();
                    const filtered = q ? guests.filter(g => g.name.toLowerCase().includes(q)) : guests;
                    const rsvp     = filtered.filter(g => g.confirmed);
                    const otros    = filtered.filter(g => !g.confirmed);

                    const GuestRow = ({ g }) => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border-row)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{g.name}</span>
                          <span style={{ marginLeft: 8, fontSize: 10, color: g.tipo === 'Menor' ? '#8b5cf6' : 'var(--text-faint)', background: g.tipo === 'Menor' ? 'rgba(139,92,246,0.1)' : 'var(--bg-sunken)', border: `1px solid ${g.tipo === 'Menor' ? 'rgba(139,92,246,0.3)' : 'var(--border)'}`, borderRadius: 20, padding: '1px 7px', fontWeight: 600 }}>{g.tipo}</span>
                        </div>
                        {g.pagadoEnPuerta ? (
                          <span style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            <Check size={11} style={{ display: 'inline', marginRight: 3 }} /> Pagó en puerta
                          </span>
                        ) : (
                          <button onClick={() => handleTogglePagado(g)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${g.pagado ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`, background: g.pagado ? 'rgba(34,197,94,0.12)' : 'var(--bg-sunken)', color: g.pagado ? '#22c55e' : 'var(--text-faint)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {g.pagado ? <><Check size={11} /> Pagó</> : 'Sin pagar'}
                          </button>
                        )}
                        {g.ingreso && <span style={{ fontSize: 10, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>Ingresó</span>}
                        <button onClick={() => setConfirmDeleteGuest(g.id)} style={{ padding: '4px 8px', border: '1px solid transparent', borderRadius: 6, background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer', opacity: 0.7 }} title="Eliminar">✕</button>
                      </div>
                    );

                    return (
                      <>
                        {rsvp.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                              Confirmados via portal ({rsvp.length})
                            </div>
                            {rsvp.map(g => <GuestRow key={g.id} g={g} />)}
                          </div>
                        )}
                        {otros.length > 0 && (
                          <div>
                            {rsvp.length > 0 && (
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                                Cargados manualmente ({otros.length})
                              </div>
                            )}
                            {otros.map(g => <GuestRow key={g.id} g={g} />)}
                          </div>
                        )}
                        {filtered.length === 0 && q && (
                          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontSize: 13 }}>
                            Sin resultados para "{guestSearch}"
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>

    {confirmDeleteGuest && (
      <ConfirmDialog
        title="¿Eliminar invitado?"
        message="Esta acción no se puede deshacer."
        onConfirm={() => handleDeleteGuest(confirmDeleteGuest)}
        onCancel={() => setConfirmDeleteGuest(null)}
      />
    )}
    {confirmDeletePaidList && (
      <ConfirmDialog
        title="¿Eliminar lista de invitados?"
        message="Se eliminará la lista pagada adjunta al evento. Esta acción no se puede deshacer."
        onConfirm={handleDeletePaidList}
        onCancel={() => setConfirmDeletePaidList(false)}
      />
    )}
    </>
  );
}
