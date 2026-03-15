import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <img src="/haus-logo.svg" alt="Haus" style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 28 }} />

      {/* Ícono */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%', marginBottom: 28,
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Compass size={32} color="#c9a84c" strokeWidth={1.5} />
      </div>

      {/* 404 */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 80, fontWeight: 700, lineHeight: 1,
        background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 16,
      }}>404</div>

      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 600,
        color: '#e8e8f0', marginBottom: 12,
      }}>
        Página no encontrada
      </div>

      <div style={{
        fontSize: 14, color: '#5a5a7a',
        lineHeight: 1.7, maxWidth: 320, marginBottom: 36,
      }}>
        El link que seguiste no existe o fue movido.
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 24px', borderRadius: 99,
          background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
          border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: '#09090f',
        }}
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </button>

      <div style={{
        marginTop: 40, fontSize: 11, color: '#3a3a5a',
        letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Haus · Producción de Eventos
      </div>
    </div>
  )
}
