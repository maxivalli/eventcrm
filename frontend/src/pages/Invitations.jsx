import { useState, useEffect } from "react";
import { Sparkles, Download, MessageCircle, RefreshCw, ChevronDown } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../components/Toast";

const fmtDate = (str) =>
  new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

export default function Invitations() {
  const { showToast } = useToast();

  const [events, setEvents]         = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending]       = useState(false);
  const [imageUrl, setImageUrl]     = useState(null);
  const [caption, setCaption]       = useState("");
  const [promptUsed, setPromptUsed] = useState("");

  // Cargar eventos al montar
  useEffect(() => {
    api.get("/api/events")
      .then(r => {
        const active = r.data.filter(e => e.status !== "Finalizado");
        setEvents(active);
      })
      .catch(() => showToast("No se pudieron cargar los eventos", "error"));
  }, []);

  const selectedEvent = events.find(e => String(e.id) === String(selectedId));

  // ── Generar imagen ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedId) return showToast("Seleccioná un evento primero", "error");
    setGenerating(true);
    setImageUrl(null);
    setPromptUsed("");
    try {
      const res = await api.post("/api/invitations/generate", { eventId: selectedId });
      setImageUrl(res.data.imageUrl);
      setPromptUsed(res.data.prompt || "");
      // Caption por defecto
      const ev = events.find(e => String(e.id) === String(selectedId));
      if (ev) {
        const date = new Date(ev.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
        setCaption(`🎉 ¡Estás invitado a ${ev.name}!\n📅 ${date}${ev.venue ? `\n📍 ${ev.venue}` : ""}`);
      }
      showToast("¡Invitación generada!", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Error al generar la imagen", "error");
    } finally {
      setGenerating(false);
    }
  };

  // ── Descargar imagen ────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `invitacion-${selectedEvent?.name?.replace(/\s+/g, "-") || "evento"}.webp`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Si CORS lo bloquea, abrimos en nueva pestaña
      window.open(imageUrl, "_blank");
    }
  };

  // ── Enviar por WhatsApp ─────────────────────────────────────────────────────
  const handleSendWhatsApp = async () => {
    if (!imageUrl || !selectedId) return;
    setSending(true);
    try {
      await api.post(`/api/whatsapp/send/invitation/${selectedId}`, {
        imageUrl,
        caption,
      });
      showToast("Invitación enviada por WhatsApp ✅", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Error al enviar por WhatsApp", "error");
    } finally {
      setSending(false);
    }
  };

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const card = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 28,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--text-label)",
    marginBottom: 8,
    display: "block",
  };

  const selectStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--text-primary)",
    fontSize: 14,
    cursor: "pointer",
    appearance: "none",
    outline: "none",
  };

  const btnPrimary = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
    border: "none",
    borderRadius: 10,
    color: "#09090f",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "opacity 0.2s",
  };

  const btnSecondary = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--text-secondary)",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const btnWhatsApp = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    background: "rgba(37,211,102,0.12)",
    border: "1px solid rgba(37,211,102,0.3)",
    borderRadius: 10,
    color: "#25d366",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "var(--gold-bg)",
            border: "1px solid var(--gold-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={20} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Invitaciones IA
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Generá tarjetas de invitación únicas para cada evento
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Panel izquierdo — configuración */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Selector de evento */}
          <div style={card}>
            <label style={labelStyle}>Evento</label>
            <div style={{ position: "relative" }}>
              <select
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); setImageUrl(null); }}
                style={selectStyle}
              >
                <option value="">Seleccioná un evento…</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {fmtDate(ev.date)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} style={{
                position: "absolute", right: 14, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)", pointerEvents: "none",
              }} />
            </div>

            {/* Info del evento seleccionado */}
            {selectedEvent && (
              <div style={{
                marginTop: 16, padding: "12px 14px",
                background: "var(--bg-sunken)",
                borderRadius: 10, fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}>
                <div><strong style={{ color: "var(--text-primary)" }}>{selectedEvent.name}</strong></div>
                {selectedEvent.venue && <div>📍 {selectedEvent.venue}</div>}
                <div>📅 {fmtDate(selectedEvent.date)}{selectedEvent.time ? ` · ${selectedEvent.time}` : ""}</div>
                {selectedEvent.client?.name && <div>👤 {selectedEvent.client.name}</div>}
              </div>
            )}
          </div>

          {/* Caption para WhatsApp */}
          {imageUrl && (
            <div style={card}>
              <label style={labelStyle}>Mensaje para WhatsApp</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text-primary)",
                  fontSize: 13,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
                placeholder="Texto que acompañará la imagen en WhatsApp…"
              />
            </div>
          )}

          {/* Prompt técnico (colapsado) */}
          {promptUsed && (
            <details style={{ ...card, padding: "14px 18px" }}>
              <summary style={{ fontSize: 11, color: "var(--text-faint)", cursor: "pointer", letterSpacing: 0.5 }}>
                Ver prompt utilizado
              </summary>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.6 }}>
                {promptUsed}
              </p>
            </details>
          )}

          {/* Botones de acción */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleGenerate}
              disabled={!selectedId || generating}
              style={{ ...btnPrimary, opacity: (!selectedId || generating) ? 0.6 : 1 }}
            >
              {generating
                ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Generando…</>
                : <><Sparkles size={16} /> {imageUrl ? "Regenerar invitación" : "Generar invitación"}</>
              }
            </button>

            {imageUrl && (
              <>
                <button onClick={handleDownload} style={btnSecondary}>
                  <Download size={16} /> Descargar imagen
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={sending}
                  style={{ ...btnWhatsApp, opacity: sending ? 0.6 : 1 }}
                >
                  <MessageCircle size={16} />
                  {sending ? "Enviando…" : "Enviar por WhatsApp"}
                </button>
                {selectedEvent && !selectedEvent.client?.phone && (
                  <p style={{ fontSize: 12, color: "#f59e0b", margin: 0 }}>
                    ⚠️ El cliente no tiene teléfono cargado. El envío por WhatsApp no estará disponible.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel derecho — preview de la imagen */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{
            ...card,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 480,
            position: "relative",
            overflow: "hidden",
          }}>
            {generating && (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 16,
                color: "var(--text-muted)",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: "3px solid var(--border)",
                  borderTop: "3px solid var(--gold)",
                  animation: "spin 1s linear infinite",
                }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>Generando con IA…</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", maxWidth: 200 }}>
                  Esto puede tardar entre 5 y 15 segundos
                </div>
              </div>
            )}

            {!generating && !imageUrl && (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 12,
                color: "var(--text-faint)", textAlign: "center",
              }}>
                <Sparkles size={48} strokeWidth={1} />
                <div style={{ fontSize: 14 }}>
                  Seleccioná un evento y generá<br />la tarjeta de invitación
                </div>
              </div>
            )}

            {!generating && imageUrl && (
              <img
                src={imageUrl}
                alt="Invitación generada"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 12,
                  display: "block",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
