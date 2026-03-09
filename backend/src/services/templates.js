const fs   = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '../../data/templates.json')

// Plantillas por defecto
const DEFAULTS = {
  reminder: {
    id:      'reminder',
    name:    'Recordatorio día anterior',
    trigger: 'day_before',
    active:  true,
    text:    '¡Hola {{nombre}}! 🎉 Te recordamos que mañana es tu evento *{{evento}}* en {{lugar}}. ¡Estamos listos para que sea una noche inolvidable! Ante cualquier consulta, no dudes en escribirnos.',
  },
  thanks: {
    id:      'thanks',
    name:    'Agradecimiento post evento',
    trigger: 'day_after',
    active:  true,
    text:    'Hola {{nombre}}, fue un placer haberte acompañado en *{{evento}}* 🙏 Esperamos que haya sido una experiencia especial. ¡Gracias por elegirnos y hasta la próxima!',
  },
  birthday: {
    id:      'birthday',
    name:    'Propuesta de cumpleaños',
    trigger: 'birthday_30days',
    active:  true,
    text:    '¡Hola {{nombre}}! 🎂 Nos enteramos que tu cumpleaños se acerca y nos encantaría ayudarte a celebrarlo como se merece. ¿Te gustaría que armemos algo especial juntos? ¡Escribinos y lo organizamos!',
  },
}

function ensureFile() {
  const dir = path.dirname(FILE)
  if (!fs.existsSync(dir))  fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify(DEFAULTS, null, 2))
}

function getAll() {
  ensureFile()
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { ...DEFAULTS }
  }
}

function getOne(id) {
  const all = getAll()
  return all[id] || null
}

function save(id, data) {
  const all = getAll()
  all[id] = { ...all[id], ...data, id }
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2))
  return all[id]
}

/**
 * Reemplaza variables en el texto de la plantilla.
 * Variables disponibles: {{nombre}}, {{evento}}, {{lugar}}, {{fecha}}, {{dias}}
 */
function render(templateId, vars = {}) {
  const tpl = getOne(templateId)
  if (!tpl) throw new Error(`Plantilla "${templateId}" no encontrada`)
  let text = tpl.text
  for (const [key, val] of Object.entries(vars)) {
    text = text.replaceAll(`{{${key}}}`, val || '')
  }
  return text
}

module.exports = { getAll, getOne, save, render }
