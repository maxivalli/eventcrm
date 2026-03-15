import { useState, useEffect, useRef } from 'react'
import { X, Upload, Phone, Mail, Trash2, BookUser } from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import SkeletonTable from '../components/SkeletonTable'

// ── Quoted-Printable decoder ──────────────────────────────────────────────────
// Algunos exportadores (Google, Android) codifican tildes y ñ como =C3=B3, etc.

function decodeQuotedPrintable(str) {
  // Unir líneas partidas con soft line break (= al final)
  const joined = str.replace(/=\r?\n/g, '')
  // Decodificar secuencias =XX como bytes hexadecimales
  const bytes = []
  let i = 0
  while (i < joined.length) {
    if (joined[i] === '=' && i + 2 < joined.length) {
      const hex = joined.slice(i + 1, i + 3)
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 3
        continue
      }
    }
    bytes.push(joined.charCodeAt(i))
    i++
  }
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
  } catch {
    return str
  }
}

function decodeVcfValue(line) {
  // Detectar si la línea usa ENCODING=QUOTED-PRINTABLE
  if (/ENCODING=QUOTED-PRINTABLE/i.test(line)) {
    const value = line.substring(line.indexOf(':') + 1)
    return decodeQuotedPrintable(value).trim()
  }
  // Detectar si usa CHARSET= con valor directo
  return line.substring(line.indexOf(':') + 1).trim()
}

// ── VCF Parser ────────────────────────────────────────────────────────────────

function parseVcf(text) {
  const contacts = []
  const cards = text.split(/BEGIN:VCARD/i).filter(s => s.trim())

  for (const card of cards) {
    const lines = card
      .replace(/\r\n|\r/g, '\n')
      .replace(/\n[ \t]/g, '')   // unfold continuations
      .split('\n')

    const get    = (prefix) => {
      const line = lines.find(l => l.toUpperCase().startsWith(prefix.toUpperCase()))
      return line ? decodeVcfValue(line) : ''
    }
    const getAll = (prefix) =>
      lines
        .filter(l => l.toUpperCase().startsWith(prefix.toUpperCase()))
        .map(l => decodeVcfValue(l))

    const fn = get('FN')
    if (!fn) continue

    const email = getAll('EMAIL')[0] || ''
    const phone = (getAll('TEL')[0] || '').replace(/[^\d+\-() ]/g, '')

    contacts.push({ name: fn, email, phone })
  }

  return contacts
}

// ── Spinner keyframe (inyectado una sola vez) ─────────────────────────────────
if (!document.getElementById('vcf-spin-style')) {
  const s = document.createElement('style')
  s.id = 'vcf-spin-style'
  s.textContent = `@keyframes vcf-spin { to { transform: rotate(360deg) } }`
  document.head.appendChild(s)
}

// ── Modal importación VCF ─────────────────────────────────────────────────────

function VcfImportModal({ existingContacts, onImport, onClose }) {
  const [step,      setStep]      = useState('upload')
  const [contacts,  setContacts]  = useState([])
  const [selected,  setSelected]  = useState(new Set())
  const [importing, setImporting] = useState(false)
  const [progress,  setProgress]  = useState({ current: 0, total: 0 })
  const [error,     setError]     = useState('')
  const fileRef = useRef()

  const existingEmails = new Set(
    existingContacts.map(c => c.email?.toLowerCase()).filter(Boolean)
  )
  const existingNames = new Set(
    existingContacts.map(c => c.name?.toLowerCase().trim()).filter(Boolean)
  )
  const existingPhones = new Set(
    existingContacts.map(c => c.phone?.replace(/\D/g, '')).filter(Boolean)
  )
  const isDup = (c) => {
    if (c.email && existingEmails.has(c.email.toLowerCase())) return true
    const phone = c.phone?.replace(/\D/g, '')
    if (phone && existingPhones.has(phone)) return true
    if (c.name && existingNames.has(c.name.toLowerCase().trim())) return true
    return false
  }

  const handleFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.(vcf|vcard)$/i)) {
      setError('El archivo debe ser .vcf o .vcard')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseVcf(e.target.result)
      if (!parsed.length) { setError('No se encontraron contactos válidos en el archivo.'); return }
      setContacts(parsed)
      setSelected(new Set(parsed.map((_, i) => i).filter(i => !isDup(parsed[i]))))
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const toggleAll = () =>
    setSelected(selected.size === contacts.length ? new Set() : new Set(contacts.map((_, i) => i)))

  const toggle = (i) => {
    const s = new Set(selected)
    s.has(i) ? s.delete(i) : s.add(i)
    setSelected(s)
  }

  const handleImport = async () => {
    const toImport = contacts.filter((_, i) => selected.has(i))
    setProgress({ current: 0, total: toImport.length })
    setImporting(true)
    await onImport(toImport, (current, total) => setProgress({ current, total }))
    setImporting(false)
  }

  const dupCount  = contacts.filter(isDup).length
  const newCount  = contacts.length - dupCount
  const selCount  = selected.size

  return (
    <div onClick={importing ? undefined : onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: step === 'preview' ? 16 : 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--gold)' }}>
              Importar desde VCF
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}><X size={18} /></button>
          </div>
          {step === 'preview' && (
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Encontrados',   value: contacts.length, color: 'var(--text-primary)' },
                { label: 'Nuevos',        value: newCount,         color: '#22c55e' },
                { label: 'Duplicados',    value: dupCount,         color: '#f59e0b' },
                { label: 'Seleccionados', value: selCount,         color: 'var(--gold)' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

          {importing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 24 }}>
              {/* Spinner */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '4px solid var(--border)',
                borderTopColor: 'var(--gold)',
                animation: 'vcf-spin 0.8s linear infinite',
              }} />
              {/* Texto de progreso */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Importando contactos...
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-label)' }}>
                  {progress.current} de {progress.total}
                </div>
              </div>
              {/* Barra de progreso */}
              <div style={{ width: '100%', height: 6, background: 'var(--bg-sunken)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  width: `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                No cierres esta ventana hasta que termine
              </div>
            </div>
          )}

          {!importing && step === 'upload' && (
            <div>
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-strong)'; handleFile(e.dataTransfer.files[0]) }}
                style={{ border: '2px dashed var(--border-strong)', borderRadius: 14, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
              >
                <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}><Upload size={36} color="var(--text-faint)" /></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Arrastrá tu archivo VCF aquí
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                  o hacé click para seleccionarlo
                </div>
                <div style={{ display: 'inline-block', padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-label)' }}>
                  Seleccionar archivo .vcf
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".vcf,.vcard" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

              {error && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
                  {error}
                </div>
              )}

              <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-sunken)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-label)', marginBottom: 8 }}>¿Cómo exportar desde Google Contacts?</div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.9 }}>
                  <li>Abrí <strong style={{ color: 'var(--text-secondary)' }}>contacts.google.com</strong></li>
                  <li>Seleccioná los contactos a exportar (o todos)</li>
                  <li>Menú <strong style={{ color: 'var(--text-secondary)' }}>Exportar</strong> → formato <strong style={{ color: 'var(--text-secondary)' }}>vCard (.vcf)</strong></li>
                  <li>Importá el archivo acá arriba</li>
                </ol>
              </div>
            </div>
          )}

          {!importing && step === 'preview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-label)' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>Amarillo</span> = ya existe en la agenda (mismo email)
                </div>
                <button onClick={toggleAll} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  {selected.size === contacts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contacts.map((c, i) => {
                  const dup     = isDup(c)
                  const checked = selected.has(i)
                  return (
                    <div
                      key={i}
                      onClick={() => toggle(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${dup ? 'rgba(245,158,11,0.35)' : checked ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                        background: dup ? 'rgba(245,158,11,0.06)' : 'var(--bg-sunken)',
                        opacity: checked ? 1 : 0.5,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${checked ? '#22c55e' : 'var(--border-strong)'}`,
                        background: checked ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          {dup && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>Duplicado</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                          {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {c.phone}</span>}
                          {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> {c.email}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!importing && step === 'preview' && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={selCount === 0 || importing}
              style={{
                flex: 2, padding: 11, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: selCount === 0 ? 'not-allowed' : 'pointer',
                background: selCount === 0 ? 'var(--bg-sunken)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                color: selCount === 0 ? 'var(--text-faint)' : '#09090f',
                transition: 'all 0.2s',
              }}
            >
              {importing ? 'Importando...' : `Importar ${selCount} contacto${selCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Formulario de contacto ────────────────────────────────────────────────────

const inp  = (err) => ({ width: '100%', background: 'var(--bg-sunken)', border: `1px solid ${err ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' })
const lbl  = { fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'block' }
const err_ = { fontSize: 11, color: '#ef4444', marginTop: 4 }

const emptyForm = { name: '', phone: '', email: '' }

function ContactForm({ initial, onSave, onClose }) {
  const [form,   setForm]   = useState(initial ? { ...initial } : emptyForm)
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Requerido'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 18, padding: 32, width: 420, maxWidth: '90vw' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--gold)', marginBottom: 24 }}>
          {initial ? 'Editar contacto' : 'Nuevo contacto'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input style={inp(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
            {errors.name && <div style={err_}>{errors.name}</div>}
          </div>
          <div>
            <label style={lbl}>Teléfono</label>
            <input style={inp()} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input style={inp(errors.email)} value={form.email} onChange={e => set('email', e.target.value)} placeholder="Opcional" />
            {errors.email && <div style={err_}>{errors.email}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (validate()) onSave(form) }} style={{ flex: 1, padding: 11, border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#09090f', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Contacts() {
  const toast = useToast()
  const [contacts,      setContacts]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [modal,         setModal]         = useState(null)   // 'new' | 'edit'
  const [selected,      setSelected]      = useState(null)
  const [checkedIds,    setCheckedIds]    = useState(new Set())
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteSel, setConfirmDeleteSel] = useState(false)
  const [showVcf,       setShowVcf]       = useState(false)

  const fetchContacts = async () => {
    try { const r = await api.get('/api/contacts'); setContacts(r.data) }
    catch { toast('Error al cargar contactos') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchContacts() }, [])

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const filteredIds    = filtered.map(c => c.id)
  const allChecked     = filteredIds.length > 0 && filteredIds.every(id => checkedIds.has(id))
  const someChecked    = filteredIds.some(id => checkedIds.has(id))
  const checkedCount   = [...checkedIds].filter(id => filteredIds.includes(id)).length

  const toggleAll = () => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (allChecked) filteredIds.forEach(id => next.delete(id))
      else            filteredIds.forEach(id => next.add(id))
      return next
    })
  }

  const toggleOne = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Limpiar selección cuando cambia el filtro
  useEffect(() => { setCheckedIds(new Set()) }, [search])

  const handleSave = async (form) => {
    try {
      if (modal === 'new') {
        await api.post('/api/contacts', form)
        toast('Contacto creado', 'success')
      } else {
        await api.put(`/api/contacts/${selected.id}`, form)
        toast('Contacto actualizado', 'success')
      }
      await fetchContacts()
      setModal(null); setSelected(null)
    } catch (e) { toast(e.response?.data?.error || 'Error al guardar') }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/contacts/${confirmDelete.id}`)
      toast('Contacto eliminado', 'success')
      setCheckedIds(prev => { const n = new Set(prev); n.delete(confirmDelete.id); return n })
      await fetchContacts()
    } catch (e) { toast(e.response?.data?.error || 'Error al eliminar') }
    finally { setConfirmDelete(null) }
  }

  const handleDeleteSelected = async () => {
    const ids = [...checkedIds].filter(id => filteredIds.includes(id))
    try {
      await Promise.all(ids.map(id => api.delete(`/api/contacts/${id}`)))
      toast(`${ids.length} contacto${ids.length !== 1 ? 's' : ''} eliminado${ids.length !== 1 ? 's' : ''}`, 'success')
      setCheckedIds(new Set())
      await fetchContacts()
    } catch (e) { toast('Error al eliminar contactos') }
    finally { setConfirmDeleteSel(false) }
  }

  const handleVcfImport = async (toImport, onProgress) => {
    let ok = 0, fail = 0
    for (const c of toImport) {
      try { await api.post('/api/contacts', c); ok++ }
      catch { fail++ }
      onProgress?.(ok + fail, toImport.length)
    }
    await fetchContacts()
    setShowVcf(false)
    if (fail === 0) toast(`${ok} contacto${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''}`, 'success')
    else            toast(`${ok} importados, ${fail} fallaron`, 'success')
  }

  const openWhatsApp = (phone) => {
    let p = (phone || '').replace(/[\s\-().+]/g, '')
    if (p.startsWith('0')) p = p.slice(1)
    if (!p.startsWith('54')) p = '54' + p
    window.open(`https://wa.me/${p}`, '_blank')
  }

  if (loading) return <SkeletonTable cols={[
    { width: '40px', skeletonWidth: '60%' }, { width: '2fr' }, { width: '1.4fr' },
    { width: '2fr' }, { width: '120px', skeletonWidth: '50%' },
  ]} />

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>Contactos</div>
          <div style={{ fontSize: 13, color: 'var(--text-label)', marginTop: 4 }}>{filtered.length} contactos</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowVcf(true)}
            style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', color: 'var(--text-muted)', fontSize: 13, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Upload size={14} /> Importar VCF
          </button>
          <button
            onClick={() => setModal('new')}
            style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#09090f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Nuevo contacto
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 320 }}
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}><BookUser size={32} color="var(--text-faint)" /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {search ? 'Sin resultados' : 'Agenda vacía'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {search ? 'Probá con otro término.' : 'Creá tu primer contacto o importalos desde un archivo VCF.'}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Cabecera */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.4fr 2fr 120px', gap: '0 16px', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-label)', textTransform: 'uppercase', letterSpacing: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                onClick={toggleAll}
                style={{
                  width: 18, height: 18, borderRadius: 5, cursor: 'pointer', flexShrink: 0,
                  border: `2px solid ${allChecked ? '#ef4444' : someChecked ? '#ef4444' : 'var(--border-strong)'}`,
                  background: allChecked ? '#ef4444' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {allChecked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                {!allChecked && someChecked && <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>−</span>}
              </div>
            </div>
            <span>Nombre</span><span>Teléfono</span><span>Email</span><span></span>
          </div>

          {filtered.map((c, i) => (
            <div
              key={c.id}
              style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.4fr 2fr 120px', gap: '0 16px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-row)' : 'none', transition: 'background 0.15s', background: checkedIds.has(c.id) ? 'rgba(239,68,68,0.04)' : 'transparent' }}
              onMouseEnter={e => { if (!checkedIds.has(c.id)) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.background = checkedIds.has(c.id) ? 'rgba(239,68,68,0.04)' : 'transparent' }}
            >
              {/* Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  onClick={() => toggleOne(c.id)}
                  style={{
                    width: 18, height: 18, borderRadius: 5, cursor: 'pointer', flexShrink: 0,
                    border: `2px solid ${checkedIds.has(c.id) ? '#ef4444' : 'var(--border-strong)'}`,
                    background: checkedIds.has(c.id) ? '#ef4444' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {checkedIds.has(c.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
              </div>
              {/* Nombre + avatar inicial */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--gold-bg)', border: '1px solid rgba(201,168,76,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--gold)',
                }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
              </div>

              {/* Teléfono */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.phone ? (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.phone}</span>
                    <button
                      onClick={() => openWhatsApp(c.phone)}
                      title="WhatsApp"
                      style={{ padding: '4px 7px', borderRadius: 6, border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.08)', color: '#25d366', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.849L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.847 9.847 0 012.118 12C2.118 6.533 6.533 2.118 12 2.118S21.882 6.533 21.882 12 17.467 21.882 12 21.882z"/>
      </svg>
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>—</span>
                )}
              </div>

              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.email ? (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                    <button
                      onClick={() => window.open(`mailto:${c.email}`, '_blank')}
                      title="Enviar email"
                      style={{ padding: '4px 7px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <Mail size={12} />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>—</span>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { setSelected(c); setModal('edit') }}
                  style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(c)}
                  style={{ padding: '5px 7px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barra flotante de selección */}
      {checkedCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
          borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center',
          gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{checkedCount}</strong> contacto{checkedCount !== 1 ? 's' : ''} seleccionado{checkedCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setCheckedIds(new Set())}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Deseleccionar
          </button>
          <button
            onClick={() => setConfirmDeleteSel(true)}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Trash2 size={14} /> Eliminar {checkedCount}
          </button>
        </div>
      )}

      {/* Modales */}
      {modal === 'new'  && <ContactForm onSave={handleSave} onClose={() => setModal(null)} />}
      {modal === 'edit' && selected && <ContactForm initial={selected} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />}
      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar contacto?"
          message={`Se eliminará a "${confirmDelete.name}" de la agenda. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmDeleteSel && (
        <ConfirmDialog
          title={`¿Eliminar ${checkedCount} contacto${checkedCount !== 1 ? 's' : ''}?`}
          message={`Se eliminarán ${checkedCount} contacto${checkedCount !== 1 ? 's' : ''} de la agenda. Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmDeleteSel(false)}
        />
      )}
      {showVcf && (
        <VcfImportModal
          existingContacts={contacts}
          onImport={handleVcfImport}
          onClose={() => setShowVcf(false)}
        />
      )}
    </div>
  )
}