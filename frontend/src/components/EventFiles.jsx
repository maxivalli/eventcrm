import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import ConfirmDialog from './ConfirmDialog'

const getIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['zip', 'rar'].includes(ext)) return '🗜️'
  return '📎'
}

const formatDate = (str) =>
  new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function EventFiles({ eventId }) {
  const [files, setFiles]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const [error, setError]             = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const inputRef                      = useRef()

  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 3500) }

  const fetchFiles = async () => {
    try { const res = await api.get(`/api/event-files/event/${eventId}`); setFiles(res.data) }
    catch { showError('No se pudieron cargar los archivos') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchFiles() }, [eventId])

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      await api.post('/api/event-files', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchFiles()
    } catch { showError('No se pudo subir el archivo') }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    try { await api.delete(`/api/event-files/${confirmDelete}`); setFiles(prev => prev.filter(f => f.id !== confirmDelete)) }
    catch { showError('No se pudo eliminar el archivo') }
    finally { setConfirmDelete(null) }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  if (loading) return <div style={{ fontSize: 13, color: 'var(--text-label)', padding: '12px 0' }}>Cargando archivos...</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--gold)' }}>
          Archivos adjuntos
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-label)' }}>{files.length} archivo{files.length !== 1 ? 's' : ''}</div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border-strong)'}`,
          borderRadius: 10, padding: '20px 16px', textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 14,
          background: dragOver ? 'var(--gold-glow)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 6 }}>{uploading ? '⏳' : '📎'}</div>
        <div style={{ fontSize: 13, color: uploading ? 'var(--gold)' : 'var(--text-label)' }}>
          {uploading ? 'Subiendo archivo...' : 'Hacé clic o arrastrá un archivo acá'}
        </div>
        <input ref={inputRef} type='file' style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} disabled={uploading} />
      </div>

      {/* Lista */}
      {files.length === 0
        ? <div style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '8px 0' }}>No hay archivos adjuntos</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map(file => (
              <div key={file.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--bg-sunken)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{getIcon(file.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{formatDate(file.createdAt)}</div>
                </div>
                <a
                  href={file.url} target='_blank' rel='noopener noreferrer'
                  style={{
                    padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6,
                    background: 'transparent', color: 'var(--text-muted)', fontSize: 11,
                    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >Ver</a>
                <button
                  title="Eliminar archivo"
                  onClick={() => setConfirmDelete(file.id)}
                  style={{
                    width: 26, height: 26, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                    background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                    cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )
      }

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar archivo?"
          message="Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}