import { useState, useEffect } from 'react'
import api from '../api/axios'

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
      background: `${color}20`, color, whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

const emptyForm    = { name: '', email: '', password: '' }
const emptyPwdForm = { password: '', confirm: '' }

function UserForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || emptyForm)
  const [error, setError] = useState('')
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.name || !form.email) return setError('Nombre y email son requeridos')
    if (!initial && !form.password) return setError('La contraseña es requerida')
    if (!initial && form.password.length < 6) return setError('Mínimo 6 caracteres')
    setError('')
    onSave(form)
  }

  const inputStyle = {
    width: '100%', background: '#0d0d18', border: '1px solid #1e1e30',
    borderRadius: 8, padding: '10px 14px', color: '#e8e8f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 5, display: 'block',
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#12121e', border: '1px solid #2a2a40',
        borderRadius: 18, padding: 32, width: 440, maxWidth: '90vw',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 24 }}>
          {initial ? 'Editar usuario' : 'Nuevo usuario'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type='email' style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          {!initial && (
            <div>
              <label style={labelStyle}>Contraseña</label>
              <input type='password' style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
          )}
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            flex: 1, padding: 11, border: 'none', borderRadius: 8,
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

function PasswordForm({ user, onSave, onClose }) {
  const [form, setForm]   = useState(emptyPwdForm)
  const [error, setError] = useState('')
  const set = (key, val)  => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.password || form.password.length < 6) return setError('Mínimo 6 caracteres')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    setError('')
    onSave(form.password)
  }

  const inputStyle = {
    width: '100%', background: '#0d0d18', border: '1px solid #1e1e30',
    borderRadius: 8, padding: '10px 14px', color: '#e8e8f0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 5, display: 'block',
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#12121e', border: '1px solid #2a2a40',
        borderRadius: 18, padding: 32, width: 400, maxWidth: '90vw',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#c9a84c', marginBottom: 6 }}>
          Cambiar contraseña
        </div>
        <div style={{ fontSize: 13, color: '#4a4a6a', marginBottom: 24 }}>{user.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nueva contraseña</label>
            <input type='password' style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Confirmar contraseña</label>
            <input type='password' style={inputStyle} value={form.confirm} onChange={e => set('confirm', e.target.value)} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            flex: 1, padding: 11, border: 'none', borderRadius: 8,
            background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
            color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [selected, setSelected] = useState(null)
  const [toast, setToast]     = useState('')
  const currentUser           = JSON.parse(localStorage.getItem('user') || '{}')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users')
      setUsers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSave = async (form) => {
    try {
      if (modal === 'new') {
        await api.post('/api/users', form)
        showToast('Usuario creado')
      } else {
        await api.put(`/api/users/${selected.id}`, form)
        showToast('Usuario actualizado')
      }
      await fetchUsers()
    } catch (e) {
      showToast(e.response?.data?.error || 'Error al guardar')
    }
    setModal(null)
    setSelected(null)
  }

  const handlePassword = async (password) => {
    try {
      await api.put(`/api/users/${selected.id}/password`, { password })
      showToast('Contraseña actualizada')
    } catch (e) {
      showToast(e.response?.data?.error || 'Error al cambiar contraseña')
    }
    setModal(null)
    setSelected(null)
  }

  const handleDelete = async (user) => {
    if (!confirm(`¿Eliminar a ${user.name}?`)) return
    try {
      await api.delete(`/api/users/${user.id}`)
      showToast('Usuario eliminado')
      await fetchUsers()
    } catch (e) {
      showToast(e.response?.data?.error || 'Error al eliminar')
    }
  }

  const formatDate = (str) =>
    new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a4a6a', fontSize: 14 }}>
      Cargando usuarios...
    </div>
  )

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: '#1e1e30', border: '1px solid #2a2a40', borderRadius: 10,
          padding: '12px 20px', fontSize: 13, color: '#e8e8f0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#e8e8f0' }}>Usuarios</div>
          <div style={{ fontSize: 13, color: '#4a4a6a', marginTop: 4 }}>{users.length} usuarios registrados</div>
        </div>
        <button onClick={() => setModal('new')} style={{
          background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', border: 'none',
          borderRadius: 8, padding: '10px 20px', color: '#09090f',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ Nuevo usuario</button>
      </div>

      {/* Tabla */}
      <div style={{ background: '#12121e', border: '1px solid #1e1e30', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 140px',
          padding: '12px 20px', borderBottom: '1px solid #1e1e30',
          fontSize: 11, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1,
        }}>
          <span>Nombre</span>
          <span>Email</span>
          <span>Creado</span>
          <span></span>
        </div>

        {users.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#3a3a5a', fontSize: 13 }}>
            No hay usuarios registrados
          </div>
        ) : users.map((user, i) => (
          <div key={user.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 140px',
            padding: '14px 20px', alignItems: 'center',
            borderBottom: i < users.length - 1 ? '1px solid #1a1a28' : 'none',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#16162a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#09090f',
              }}>{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{user.name}</div>
                {user.id === currentUser.id && (
                  <Badge label='Vos' color='#c9a84c' />
                )}
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#5a5a7a' }}>{user.email}</div>
            <div style={{ fontSize: 12, color: '#3a3a5a' }}>{formatDate(user.createdAt)}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setSelected(user); setModal('edit') }}
                style={{
                  padding: '6px 10px', border: '1px solid #1e1e30', borderRadius: 6,
                  background: 'transparent', color: '#5a5a7a', fontSize: 11, cursor: 'pointer',
                }}
              >Editar</button>
              <button
                onClick={() => { setSelected(user); setModal('password') }}
                style={{
                  padding: '6px 10px', border: '1px solid #1e1e30', borderRadius: 6,
                  background: 'transparent', color: '#5a5a7a', fontSize: 11, cursor: 'pointer',
                }}
              >🔑</button>
              {user.id !== currentUser.id && (
                <button
                  onClick={() => handleDelete(user)}
                  style={{
                    padding: '6px 10px', border: '1px solid #2a1a1a', borderRadius: 6,
                    background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 11, cursor: 'pointer',
                  }}
                >Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal === 'new' && (
        <UserForm onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal === 'edit' && selected && (
        <UserForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />
      )}
      {modal === 'password' && selected && (
        <PasswordForm user={selected} onSave={handlePassword} onClose={() => { setModal(null); setSelected(null) }} />
      )}
    </div>
  )
}