import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) {
      setError("Completá todos los campos");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", form);
      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${focusedField === field ? "rgba(201,168,76,0.6)" : "#1e1e30"}`,
    borderRadius: 12,
    padding: "13px 16px",
    color: "#e8e8f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.25s, box-shadow 0.25s",
    boxShadow:
      focusedField === field
        ? "0 0 0 3px rgba(201,168,76,0.08), inset 0 1px 2px rgba(0,0,0,0.3)"
        : "inset 0 1px 2px rgba(0,0,0,0.2)",
    fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .login-card   { animation: fadeUp .45s ease both; }
        .login-logo   { animation: fadeUp .35s ease both; }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201,168,76,0.25);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        input::placeholder { color: #3a3a5a; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#09090f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          padding: "24px",
        }}
      >
        {/* Fondo ambiental */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background: [
              "radial-gradient(ellipse 80% 60% at 15% 55%, rgba(201,168,76,0.06) 0%, transparent 65%)",
              "radial-gradient(ellipse 60% 50% at 85% 20%, rgba(59,130,246,0.04) 0%, transparent 60%)",
              "radial-gradient(ellipse 40% 40% at 50% 90%, rgba(201,168,76,0.03) 0%, transparent 60%)",
            ].join(", "),
          }}
        />

        {/* Líneas de grilla decorativas */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
            backgroundSize: "48px 48px",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Logo — sin margin inferior, pegado a la card */}
          <div
            className="login-logo"
            style={{ textAlign: "center", marginBottom: -50, marginTop: -100}}
          >
            <img
              src="/haus-logo.svg"
              alt="Haus logo"
              style={{
                width: 350,
                height: 350,
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Card */}
          <div
            className="login-card"
            style={{
              background: "linear-gradient(145deg, #13131f, #0f0f1b)",
              border: "1px solid #1e1e30",
              borderRadius: 24,
              padding: "36px 32px",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset",
            }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 19,
                fontWeight: 700,
                color: "#c8c8d8",
                marginBottom: 28,
                paddingBottom: 20,
                borderBottom: "1px solid #1a1a28",
              }}
            >
              Iniciar sesión
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "#4a4a6a",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 7,
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <input
                style={inputStyle("email")}
                type="email"
                value={form.email}
                placeholder="usuario@haus.com"
                onChange={(e) => set("email", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "#4a4a6a",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 7,
                  fontWeight: 500,
                }}
              >
                Contraseña
              </label>
              <input
                style={inputStyle("password")}
                type="password"
                value={form.password}
                placeholder="••••••••"
                onChange={(e) => set("password", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#f87171",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 15 }}>⚠</span>
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 0",
                border: "none",
                borderRadius: 12,
                background: loading
                  ? "#1e1e30"
                  : "linear-gradient(135deg, #c9a84c 0%, #e8c97a 50%, #c9a84c 100%)",
                backgroundSize: loading ? "auto" : "200% auto",
                color: loading ? "#3a3a5a" : "#09090f",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.25s",
              }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 11,
              color: "#2a2a40",
              letterSpacing: "0.05em",
            }}
          >
            © {new Date().getFullYear()} Haus · Uso interno
          </div>
        </div>
      </div>
    </>
  );
}