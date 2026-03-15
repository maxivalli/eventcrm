import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Paperclip, CloudRain, FileCheck } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import EventForm from "../components/EventForm";
import EventDetail from "../components/events/EventDetail";
import {
  fmt, fmtDate, Badge,
  statusColors, typeColors, ESTADOS,
  isPastEvent, isBadWeather, WEATHER_CODES,
} from "../utils/eventUtils";

// Keyframe for "Ya pasó" pulse animation
if (!document.getElementById('past-event-style')) {
  const style = document.createElement('style');
  style.id = 'past-event-style';
  style.textContent = `
    @keyframes pulse-past {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);
}

export default function Events() {
  const toast = useToast();
  const location = useLocation();
  const [events, setEvents]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("Todos");
  const [filterTime, setFilterTime] = useState("Todos");
  const [sortBy, setSortBy]   = useState("date");
  const [sortDir, setSortDir] = useState("asc");
  const [modal, setModal]     = useState(null);
  const [selected, setSelected]   = useState(null);
  const [detailKey, setDetailKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [weatherByDate, setWeatherByDate] = useState({});

  const fetchData = async () => {
    try {
      const [evRes, clRes] = await Promise.all([api.get("/api/events"), api.get("/api/clients")]);
      setEvents(evRes.data);
      setClients(clRes.data);
      const targetId = location.state?.openEventId;
      if (targetId) {
        const target = evRes.data.find(e => e.id === targetId);
        if (target) { setSelected(target); setModal("detail"); }
      }
    } catch { toast("Error al cargar eventos"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    localStorage.setItem('lastSeenGuestLists', new Date().toISOString());
    window.dispatchEvent(new Event('storage'));
  }, []);

  const filtered = events.filter(e => {
    const ms   = e.name.toLowerCase().includes(search.toLowerCase()) || e.client?.name.toLowerCase().includes(search.toLowerCase());
    const mf   = filter === "Todos" || e.status === filter;
    const past = isPastEvent(e);
    const mt   = filterTime === "Todos" || (filterTime === "Pasaron" && past) || (filterTime === "Próximos" && !past);
    return ms && mf && mt;
  }).sort((a, b) => {
    let va, vb;
    if (sortBy === "date")   { va = new Date(a.date); vb = new Date(b.date); }
    if (sortBy === "venue")  { va = a.venue?.toLowerCase(); vb = b.venue?.toLowerCase(); }
    if (sortBy === "status") { const o = ["Propuesta","Confirmado","Finalizado"]; va = o.indexOf(a.status); vb = o.indexOf(b.status); }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    const dates   = Array.from(new Set(filtered.map(e => new Date(e.date).toISOString().slice(0, 10))));
    const missing = dates.filter(d => !(d in weatherByDate));
    if (missing.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchForDate = async (date) => {
      try {
        const LAT = -30.2283;
        const LON = -61.4474;
        const res  = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode&timezone=auto&start_date=${date}&end_date=${date}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        const code = json.daily?.weathercode?.[0];
        if (typeof code === 'undefined') throw new Error('no forecast');
        if (cancelled) return;
        setWeatherByDate(prev => ({
          ...prev,
          [date]: { code, bad: isBadWeather(code), label: WEATHER_CODES[code]?.label || 'Clima' },
        }));
      } catch {
        if (cancelled) return;
        setWeatherByDate(prev => ({ ...prev, [date]: { error: true } }));
      }
    };

    (async () => { await Promise.all(missing.map(d => fetchForDate(d))); })();
    return () => { cancelled = true; controller.abort(); };
  }, [filtered, weatherByDate]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: "var(--gold)" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const handleSave = async (form) => {
    try {
      const p = { ...form, clientId: Number(form.clientId), guests: Number(form.guests), budget: Number(form.budget) };
      if (modal === "new") {
        await api.post("/api/events", p);
        toast("Evento creado", "success");
        await fetchData();
        setModal(null); setSelected(null);
      } else {
        await api.put(`/api/events/${selected.id}`, p);
        toast("Evento actualizado", "success");
        const evRes   = await api.get("/api/events");
        setEvents(evRes.data);
        const updated = evRes.data.find(e => e.id === selected.id);
        setSelected(updated || null);
        setDetailKey(k => k + 1);
        setModal(updated ? "detail" : null);
      }
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

  const handleStatusChange = async (ev, newStatus) => {
    try {
      await api.put(`/api/events/${ev.id}`, { ...ev, clientId: ev.clientId, status: newStatus });
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, status: newStatus } : e));
    } catch { toast("Error al cambiar el estado"); }
  };

  const openDetail = ev => { setSelected(ev); setModal("detail"); setDetailKey(k => k + 1); };
  const openEdit   = ev => { setSelected(ev); setModal("edit"); };

  const fbtn = (active) => ({
    padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", transition: "all 0.2s",
    borderColor: active ? "var(--gold)" : "var(--border)",
    background:  active ? "rgba(201,168,76,0.12)" : "transparent",
    color:       active ? "var(--gold)" : "var(--text-muted)",
  });

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-label)" }}>Cargando eventos...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "var(--text-primary)" }}>Eventos</div>
          <div style={{ fontSize: 13, color: "var(--text-label)", marginTop: 4 }}>{filtered.length} eventos encontrados</div>
        </div>
        <button onClick={() => setModal("new")} style={{ background: "linear-gradient(135deg,#c9a84c,#e8c97a)", border: "none", borderRadius: 8, padding: "10px 20px", color: "#09090f", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Nuevo evento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por evento o cliente..."
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px", color: "var(--text-primary)", fontSize: 13, outline: "none", width: 280 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ESTADOS.map(e => <button key={e} onClick={() => setFilter(e)} style={fbtn(filter === e)}>{e}</button>)}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Próximos", "Pasaron"].map(t => (
            <button key={t} onClick={() => setFilterTime(t)} style={{
              ...fbtn(filterTime === t),
              ...(t === "Pasaron" && filterTime === t ? { background: "rgba(239,68,68,0.12)", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" } : {}),
            }}>{t === "Pasaron" ? "● Ya pasaron" : t}</button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 2fr 1.5fr 1fr 1.5fr 1fr 130px 160px", gap: "0 16px", padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Tipo</span>
          <span>Evento</span>
          <span>Cliente</span>
          <span onClick={() => toggleSort("date")} style={{ cursor: "pointer", userSelect: "none" }}>Fecha<SortIcon col="date" /></span>
          <span onClick={() => toggleSort("venue")} style={{ cursor: "pointer", userSelect: "none" }}>Venue<SortIcon col="venue" /></span>
          <span>Pres. estimado</span>
          <span onClick={() => toggleSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>Estado<SortIcon col="status" /></span>
          <span />
        </div>
        {filtered.length === 0
          ? <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>No se encontraron eventos</div>
          : filtered.map((ev, i) => (
            <div key={ev.id} onClick={() => openDetail(ev)}
              style={{ display: "grid", gridTemplateColumns: "90px 2fr 1.5fr 1fr 1.5fr 1fr 130px 160px", gap: "0 16px", padding: "14px 20px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid var(--border-row)" : "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div><Badge label={ev.type} color={typeColors[ev.type] || "var(--text-muted)"} /></div>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{ev.name}</span>
                  {ev._count?.files > 0 && <Paperclip size={12} title={`${ev._count.files} adjunto${ev._count.files !== 1 ? "s" : ""}`} style={{ color: "var(--text-label)" }} />}
                  {ev._count?.eventGuests > 0 && (
                    <span title={`${ev._count.eventGuests} invitados cargados`} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 700, background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)", whiteSpace: "nowrap" }}>
                      {ev._count.eventGuests} inv.
                    </span>
                  )}
                  {ev.paidGuestListUrl && (
                    <FileCheck size={13} title={`Lista de pagados cargada${ev.paidGuestListCount ? `: ${ev.paidGuestListCount} personas` : ''}`} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  )}
                  {isPastEvent(ev) && (
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                      background: "rgba(239,68,68,0.15)", color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.3)",
                      animation: "pulse-past 1.5s ease-in-out infinite",
                      whiteSpace: "nowrap",
                    }}>
                      ● Ya pasó
                    </span>
                  )}
                  {(() => {
                    const dateKey = new Date(ev.date).toISOString().slice(0, 10);
                    const w = weatherByDate[dateKey];
                    if (!w || w.error || !w.bad) return null;
                    return (
                      <span title={w.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', whiteSpace: 'nowrap' }}>
                        <CloudRain size={11} /> Mal clima
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ev.client?.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(ev.date)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ev.venue}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{fmt(ev.budget)}</div>
              <select
                value={ev.status}
                onClick={e => e.stopPropagation()}
                onChange={e => handleStatusChange(ev, e.target.value)}
                style={{
                  background: `${statusColors[ev.status]}18`,
                  color: statusColors[ev.status] || "var(--text-muted)",
                  border: `1px solid ${statusColors[ev.status]}40`,
                  borderRadius: 20, padding: "4px 10px",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  outline: "none", appearance: "none", textAlign: "center",
                }}
              >
                {["Propuesta","Confirmado","Finalizado"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); openEdit(ev); }} style={{ padding: "5px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(ev); }} style={{ padding: "5px 10px", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Eliminar</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal === "new"    && <EventForm clients={clients} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === "edit"   && selected && <EventForm initial={selected} clients={clients} onSave={handleSave} onClose={() => { setModal(null); setSelected(null); }} />}
      {modal === "detail" && selected && <EventDetail key={detailKey} event={selected} onClose={() => { setModal(null); setSelected(null); }} onEdit={ev => { setModal("edit"); setSelected(ev); }} />}

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
