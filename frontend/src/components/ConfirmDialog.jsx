export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#12121e', border: '1px solid #2a2a40',
        borderRadius: 16, padding: 32, width: 380, maxWidth: '90vw',
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#e8e8f0', marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#5a5a7a', marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, border: '1px solid #1e1e30', borderRadius: 8,
            background: 'transparent', color: '#5a5a7a', fontSize: 13, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 11, border: 'none', borderRadius: 8,
            background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}
