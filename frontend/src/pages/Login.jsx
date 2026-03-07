import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleLogin = async () => {
    setError('')
    if (!form.email || !form.password) {
      setError('Completá todos los campos')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user',  JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#0d0d18', border: '1px solid #1e1e30',
    borderRadius: 10, padding: '12px 16px', color: '#e8e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#09090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.04) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: '#09090f',
          }}>H</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: '#e8e8f0' }}>
            Haus-CRM
          </div>
          <div style={{ fontSize: 12, color: '#4a4a6a', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' }}>
            Producción de Eventos
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#12121e', border: '1px solid #1e1e30',
          borderRadius: 20, padding: 32,
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#e8e8f0', marginBottom: 24 }}>
            Iniciar sesión
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Email
            </div>
            <input
              style={inputStyle}
              type='email'
              value={form.email}
              placeholder='admin@eventcrm.com'
              onChange={e => set('email', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              onFocus={e => e.target.style.borderColor = '#c9a84c'}
              onBlur={e => e.target.style.borderColor = '#1e1e30'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Contraseña
            </div>
            <input
              style={inputStyle}
              type='password'
              value={form.password}
              placeholder='••••••••'
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              onFocus={e => e.target.style.borderColor = '#c9a84c'}
              onBlur={e => e.target.style.borderColor = '#1e1e30'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
              color: '#ef4444', marginBottom: 16,
            }}>{error}</div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: 13, border: 'none', borderRadius: 10,
              background: loading ? '#2a2a40' : 'linear-gradient(135deg, #c9a84c, #e8c97a)',
              color: loading ? '#5a5a7a' : '#09090f',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          
        </div>
      </div>
    </div>
  )
}
