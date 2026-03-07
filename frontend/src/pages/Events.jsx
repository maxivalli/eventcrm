import { useState, useEffect } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Checklist from "../components/Checklist";
import EventFiles from "../components/EventFiles";

const statusColors = {
  Confirmado: "#22c55e",
  "En producción": "#3b82f6",
  Propuesta: "#f59e0b",
  Finalizado: "#8b5cf6",
};
const quoteStatusColors = {
  Aprobado: "#22c55e",
  Pendiente: "#f59e0b",
  Rechazado: "#ef4444",
  "Revisión": "#3b82f6",
};
const typeColors = {
  Corporativo: "#3b82f6",
  Cultural: "#8b5cf6",
  Social: "#ec4899",
};
const ESTADOS = ["Todos", "Confirmado", "En producción", "Propuesta", "Finalizado"];

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (str) =>
  new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

function Badge({ label, color }) {
  return (
    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: `${color}20`, color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function BalanceBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "#5a5a7a" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{fmt(value)}</span>
      </div>
      <div style={{ background: "#1a1a2e", borderRadius: 99, height: 7, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

const emptyForm = { name: "", clientId: "", date: "", venue: "", type: "Corporativo", status: "Propuesta", guests: "", budget: "" };

function EventForm({ initial, clients, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? { ...initial, clientId: String(initial.clientId), date: initial.date?.slice(0, 10) } : emptyForm
  );
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })) };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                     e.name     = "Requerido";
    if (!form.clientId)                        e.clientId = "Seleccionar cliente";
    if (!form.date)                            e.date     = "Requerido";
    if (!form.venue.trim())                    e.venue    = "Requerido";
    if (!form.guests  || Number(form.guests)  <= 0) e.guests = "Debe ser mayor a 0";
    if (!form.budget  || Number(form.budget)  <= 0) e.budget = "Debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inp = (err) => ({
    width: "100%", background: "#0d0d18", border: `1px solid ${err ? "#ef4444" : "#1e1e30"}`,
    borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 13, outline: "none", boxSizing: "border-box",
  });
  const lbl = { fontSize: 11, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, display: "block" };
  const err = { fontSize: 11, color: "#ef4444", marginTop: 4 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#12121e", border: "1px solid #2a2a40", borderRadius: 18, padding: 32, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#c9a84c", marginBottom: 24 }}>
          {initial ? "Editar evento" : "Nuevo evento"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Nombre *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set("name", e.target.value)} />
            {errors.name && <div style={err}>{errors.name}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Cliente *</label>
            <select style={inp(errors.clientId)} value={form.clientId} onChange={e => set("clientId", e.target.value)}>
              <option value="">— Seleccionar cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <div style={err}>{errors.clientId}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Venue *</label>
            <input style={inp(errors.venue)} value={form.venue} onChange={e => set("venue", e.target.value)} />
            {errors.venue && <div style={err}>{errors.venue}</div>}
          </div>
          <div>
            <label style={lbl}>Fecha *</label>
            <input type="date" style={inp(errors.date)} value={form.date} onChange={e => set("date", e.target.value)} />
            {errors.date && <div style={err}>{errors.date}</div>}
          </div>
          <div>
            <label style={lbl}>Tipo</label>
            <select style={inp()} value={form.type} onChange={e => set("type", e.target.value)}>
              {["Corporativo", "Cultural", "Social"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select style={inp()} value={form.status} onChange={e => set("status", e.target.value)}>
              {["Propuesta", "Confirmado", "En producción", "Finalizado"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Invitados *</label>
            <input type="number" style={inp(errors.guests)} value={form.guests} onChange={e => set("guests", e.target.value)} />
            {errors.guests && <div style={err}>{errors.guests}</div>}
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Presupuesto estimado (ARS) *</label>
            <input type="number" style={inp(errors.budget)} value={form.budget} onChange={e => set("budget", e.target.value)} />
            {errors.budget && <div style={err}>{errors.budget}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: "1px solid #1e1e30", borderRadius: 8, background: "transparent", color: "#5a5a7a", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: "none", borderRadius: 8, background: "linear-gradient(135deg, #c9a84c, #e8c97a)", color: "#09090f", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose, onEdit }) {
  const [quotes, setQuotes]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [spPayments, setSpPayments] = useState([]);
  const [summary, setSummary] = useState({ totalQuotes: 0, totalPaid: 0, balance: 0 });
  const [spSummary, setSpSummary] = useState({ totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/quotes"),
      api.get(`/api/payments?eventId=${event.id}`),
      api.get(`/api/supplier-payments/by-event/${event.id}`),
    ]).then(([qRes, pRes, spRes]) => {
      setQuotes(qRes.data.filter(q => q.eventId === event.id));
      setPayments(pRes.data.payments || []);
      setSummary({ totalQuotes: pRes.data.totalQuotes || 0, totalPaid: pRes.data.totalPaid || 0, balance: pRes.data.balance || 0 });
      setSpPayments(spRes.data.payments || []);
      setSpSummary({ totalPaid: spRes.data.totalPaid || 0, totalPending: spRes.data.totalPending || 0 });
    }).catch(console.error).finally(() => setLoading(false));
  }, [event.id]);

  const calcQuoteTotal = q => {
    const items    = (q.items || []).reduce((a, i) => a + i.quantity * i.unitPrice, 0);
    const catering = q.kind === "Catering" ? (q.covers || 0) * (q.pricePerCover || 0) : 0;
    return catering + items;
  };

  const totalProveedores = spSummary.totalPaid + spSummary.totalPending;
  const utilidad = summary.totalQuotes - totalProveedores;
  const balanceMax = Math.max(summary.totalQuotes, summary.totalPaid, totalProveedores, 1);

  const SL = { fontSize: 11, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 600 };
  const Card = ({ children, style = {} }) => (
    <div style={{ background: "#0d0d18", borderRadius: 12, border: "1px solid #1e1e30", overflow: "hidden", ...style }}>{children}</div>
  );
  const Row = ({ label, value, color = "#e8e8f0", last = false }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", borderBottom: last ? "none" : "1px solid #1a1a28" }}>
      <span style={{ fontSize: 12, color: "#4a4a6a" }}>{label}</span>
      <span style={{ fontSize: 13, color, fontWeight: color !== "#e8e8f0" ? 600 : 400 }}>{value}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#12121e", border: "1px solid #2a2a40", borderRadius: 20,
        width: "100%", maxWidth: 1100, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "22px 32px", borderBottom: "1px solid #1e1e30", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#e8e8f0" }}>{event.name}</div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginTop: 3 }}>{event.client?.name}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge label={event.type} color={typeColors[event.type] || "#5a5a7a"} />
            <Badge label={event.status} color={statusColors[event.status] || "#5a5a7a"} />
            <button onClick={() => onEdit(event)} style={{ marginLeft: 6, padding: "7px 16px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#c9a84c,#e8c97a)", color: "#09090f", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Editar</button>
            <button onClick={onClose} style={{ padding: "7px 13px", border: "1px solid #1e1e30", borderRadius: 8, background: "transparent", color: "#5a5a7a", fontSize: 13, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {/* Body — 2 columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>

          {/* ── Columna izquierda ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px", borderRight: "1px solid #1e1e30", display: "flex", flexDirection: "column", gap: 26 }}>

            {/* Datos */}
            <section>
              <div style={SL}>Datos del evento</div>
              <Card>
                <Row label="Fecha"          value={fmtDate(event.date)} />
                <Row label="Venue"          value={event.venue} />
                <Row label="Invitados"      value={`${event.guests} personas`} />
                <Row label="Pres. estimado" value={fmt(event.budget)} last />
              </Card>
            </section>

            {/* Cotizaciones */}
            <section>
              <div style={SL}>Cotizaciones</div>
              {loading ? <div style={{ fontSize: 13, color: "#3a3a5a" }}>Cargando...</div> : quotes.length === 0
                ? <div style={{ fontSize: 13, color: "#3a3a5a" }}>Sin cotizaciones</div>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {quotes.map(q => (
                      <div key={q.id} style={{ background: "#0d0d18", border: "1px solid #1e1e30", borderRadius: 10, padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#c8c8d8", fontWeight: 500 }}>{q.kind}</div>
                          <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 2 }}>{fmtDate(q.date)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Badge label={q.status} color={quoteStatusColors[q.status] || "#5a5a7a"} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#e8c97a" }}>{fmt(calcQuoteTotal(q))}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 15px", background: "rgba(201,168,76,0.06)", borderRadius: 8, border: "1px solid rgba(201,168,76,0.15)" }}>
                      <span style={{ fontSize: 12, color: "#4a4a6a" }}>Total aprobadas</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e8c97a" }}>{fmt(summary.totalQuotes)}</span>
                    </div>
                  </div>
                )
              }
            </section>

            {/* Cobros */}
            <section>
              <div style={SL}>Cobros al cliente</div>
              {loading ? <div style={{ fontSize: 13, color: "#3a3a5a" }}>Cargando...</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {payments.length === 0
                    ? <div style={{ fontSize: 13, color: "#3a3a5a" }}>Sin cobros registrados</div>
                    : payments.map(p => (
                      <div key={p.id} style={{ background: "#0d0d18", border: "1px solid #1e1e30", borderRadius: 10, padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#c8c8d8", fontWeight: 500 }}>{fmt(p.amount)}</div>
                          {p.note && <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 2 }}>{p.note}</div>}
                        </div>
                        <div style={{ fontSize: 11, color: "#3a3a5a" }}>{fmtDate(p.date)}</div>
                      </div>
                    ))
                  }
                  <Card>
                    <Row label="Total cobrado"         value={fmt(summary.totalPaid)} color="#22c55e" />
                    <Row label="Saldo pendiente"        value={fmt(summary.balance)}  color={summary.balance > 0 ? "#ef4444" : "#22c55e"} last />
                  </Card>
                </div>
              )}
            </section>

            {/* Pagos a proveedores */}
            <section>
              <div style={SL}>Pagos a proveedores</div>
              {loading ? <div style={{ fontSize: 13, color: "#3a3a5a" }}>Cargando...</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {spPayments.length === 0
                    ? <div style={{ fontSize: 13, color: "#3a3a5a" }}>Sin pagos registrados</div>
                    : spPayments.map(p => (
                      <div key={p.id} style={{ background: "#0d0d18", border: "1px solid #1e1e30", borderRadius: 10, padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, color: "#c8c8d8", fontWeight: 500 }}>{p.supplier?.name}</div>
                          {p.note && <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 2 }}>{p.note}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Badge label={p.status} color={p.status === "Pagado" ? "#22c55e" : "#f59e0b"} />
                          <span style={{ fontSize: 13, color: "#e8e8f0", fontWeight: 600 }}>{fmt(p.amount)}</span>
                        </div>
                      </div>
                    ))
                  }
                  <Card>
                    <Row label="Pagado a proveedores"   value={fmt(spSummary.totalPaid)}    color="#ef4444" />
                    <Row label="Pendiente proveedores"  value={fmt(spSummary.totalPending)} color="#f59e0b" last />
                  </Card>
                </div>
              )}
            </section>
          </div>

          {/* ── Columna derecha ── */}
          <div style={{ overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 26 }}>

            {/* Balance visual */}
            {!loading && (
              <section>
                <div style={SL}>Balance del evento</div>
                <div style={{ background: "#0d0d18", borderRadius: 14, border: "1px solid #1e1e30", padding: "20px 22px" }}>

                  {/* Tarjetas de resumen */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                    {[
                      { label: "Ingresos aprobados", value: summary.totalQuotes,      color: "#c9a84c" },
                      { label: "Cobrado al cliente",  value: summary.totalPaid,        color: "#22c55e" },
                      { label: "Pagado proveedores",  value: spSummary.totalPaid,      color: "#ef4444" },
                      { label: "Pend. proveedores",   value: spSummary.totalPending,   color: "#f59e0b" },
                    ].map(item => (
                      <div key={item.label} style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>{item.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{fmt(item.value)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Barras */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <BalanceBar label="Ingresos aprobados" value={summary.totalQuotes}    max={balanceMax} color="#c9a84c" />
                    <BalanceBar label="Cobrado al cliente"  value={summary.totalPaid}      max={balanceMax} color="#22c55e" />
                    <BalanceBar label="Total proveedores"   value={totalProveedores}        max={balanceMax} color="#ef4444" />
                  </div>

                  {/* Utilidad */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1a1a28", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 1 }}>Utilidad estimada</div>
                      <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 2 }}>Ingresos − total proveedores</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: utilidad >= 0 ? "#22c55e" : "#ef4444" }}>{fmt(utilidad)}</div>
                      {summary.totalQuotes > 0 && (
                        <div style={{ fontSize: 11, color: "#4a4a6a" }}>
                          {Math.round((utilidad / summary.totalQuotes) * 100)}% del ingreso
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Checklist */}
            <section>
              <Checklist eventId={event.id} />
            </section>

            {/* Archivos */}
            <section style={{ paddingTop: 20, borderTop: "1px solid #1e1e30" }}>
              <EventFiles eventId={event.id} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const toast = useToast();
  const [events, setEvents]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("Todos");
  const [modal, setModal]     = useState(null);   // "new" | "edit" | "detail"
  const [selected, setSelected]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [evRes, clRes] = await Promise.all([api.get("/api/events"), api.get("/api/clients")]);
      setEvents(evRes.data);
      setClients(clRes.data);
    } catch { toast("Error al cargar eventos"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = events.filter(e => {
    const ms = e.name.toLowerCase().includes(search.toLowerCase()) || e.client?.name.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "Todos" || e.status === filter;
    return ms && mf;
  });

  const handleSave = async (form) => {
    try {
      const p = { ...form, clientId: Number(form.clientId), guests: Number(form.guests), budget: Number(form.budget) };
      if (modal === "new") { await api.post("/api/events", p); toast("Evento creado", "success"); }
      else                 { await api.put(`/api/events/${selected.id}`, p); toast("Evento actualizado", "success"); }
      await fetchData();
      setModal(null); setSelected(null);
    } catch (e) { toast(e.response?.data?.error || "Error al guardar"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/events/${confirmDelete.id}`);
      toast("Evento eliminado", "success");
      await fetchData();
    } catch (e) { toast(e.response?.data?.error || "Error al eliminar"); }
    finally { setConfirmDelete(null); }
  };

  const openDetail = ev => { setSelected(ev); setModal("detail"); };
  const openEdit   = ev => { setSelected(ev); setModal("edit");   };

  const fbtn = (active) => ({
    padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", transition: "all 0.2s",
    borderColor: active ? "#c9a84c" : "#1e1e30",
    background:  active ? "rgba(201,168,76,0.12)" : "transparent",
    color:       active ? "#c9a84c" : "#5a5a7a",
  });

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#4a4a6a" }}>Cargando eventos...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#e8e8f0" }}>Eventos</div>
          <div style={{ fontSize: 13, color: "#4a4a6a", marginTop: 4 }}>{filtered.length} eventos encontrados</div>
        </div>
        <button onClick={() => setModal("new")} style={{ background: "linear-gradient(135deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 8, padding: "10px 20px", color: "#09090f", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Nuevo evento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por evento o cliente..."
          style={{ background: "#12121e", border: "1px solid #1e1e30", borderRadius: 8, padding: "9px 14px", color: "#e8e8f0", fontSize: 13, outline: "none", width: 280 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilter(e)} style={fbtn(filter === e)}>{e}</button>)}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "#12121e", border: "1px solid #1e1e30", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr 1fr 130px", padding: "12px 20px", borderBottom: "1px solid #1e1e30", fontSize: 11, color: "#4a4a6a", textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Evento</span><span>Cliente</span><span>Fecha</span><span>Venue</span><span>Pres. estimado</span><span>Estado</span><span/>
        </div>
        {filtered.length === 0
          ? <div style={{ padding: "40px 20px", textAlign: "center", color: "#3a3a5a", fontSize: 13 }}>No se encontraron eventos</div>
          : filtered.map((ev, i) => (
            <div key={ev.id} onClick={() => openDetail(ev)}
              style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 1fr 1fr 130px", padding: "14px 20px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid #1a1a28" : "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "#16162a"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>{ev.name}</span>
                  {ev._count?.files > 0 && <span title={`${ev._count.files} adjunto${ev._count.files !== 1 ? "s" : ""}`} style={{ fontSize: 12, color: "#4a4a6a" }}>📎</span>}
                </div>
                <Badge label={ev.type} color={typeColors[ev.type] || "#5a5a7a"} />
              </div>
              <div style={{ fontSize: 13, color: "#c8c8d8" }}>{ev.client?.name}</div>
              <div style={{ fontSize: 12, color: "#5a5a7a" }}>{fmtDate(ev.date)}</div>
              <div style={{ fontSize: 12, color: "#5a5a7a" }}>{ev.venue}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{fmt(ev.budget)}</div>
              <Badge label={ev.status} color={statusColors[ev.status] || "#5a5a7a"} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(ev) }} style={{ padding: "5px 10px", border: "1px solid #1e1e30", borderRadius: 6, background: "transparent", color: "#5a5a7a", fontSize: 12, cursor: "pointer" }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(ev) }} style={{ padding: "5px 10px", border: "1px solid #2a1a1a", borderRadius: 6, background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Eliminar</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal === "new"    && <EventForm clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === "edit"   && selected && <EventForm initial={selected} clients={clients} onSave={handleSave} onClose={() => { setModal(null); setSelected(null); }} />}
      {modal === "detail" && selected && <EventDetail event={selected} onClose={() => { setModal(null); setSelected(null); }} onEdit={ev => { setModal("edit"); setSelected(ev); }} />}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar evento?"
          message={`Esto eliminará "${confirmDelete.name}" y todas sus cotizaciones. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}