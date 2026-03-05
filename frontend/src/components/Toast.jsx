import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const colors = { error: '#ef4444', success: '#22c55e', info: '#3b82f6' }

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#12121e', border: `1px solid ${colors[t.type]}40`,
            borderLeft: `3px solid ${colors[t.type]}`,
            borderRadius: 10, padding: '12px 18px',
            color: '#e8e8f0', fontSize: 13,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            maxWidth: 340, animation: 'slideIn 0.2s ease',
          }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
