import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  // Sincronizar si otro tab hace login/logout
  useEffect(() => {
    const onStorage = () => {
      try { setUser(JSON.parse(localStorage.getItem('user') || 'null')) } catch { setUser(null) }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const role       = user?.role || 'readonly'
  const isAdmin    = role === 'admin'
  const isStaff    = role === 'staff'
  const isReadonly = role === 'readonly'

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, isStaff, isReadonly, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
