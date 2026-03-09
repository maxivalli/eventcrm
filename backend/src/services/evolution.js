const axios = require('axios')

function getClient() {
  const baseURL = process.env.EVOLUTION_API_URL
  const apiKey  = process.env.EVOLUTION_API_KEY
  if (!baseURL || !apiKey) throw new Error('Evolution API no configurada (faltan variables de entorno)')
  return axios.create({
    baseURL,
    headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
    timeout: 10000,
  })
}

const instance = () => process.env.EVOLUTION_INSTANCE || 'haus-crm'

// ── Estado de la instancia ────────────────────────────────────────────────────

async function getInstanceStatus() {
  const client = getClient()
  const res = await client.get(`/instance/connectionState/${instance()}`)
  return res.data
}

async function getQRCode() {
  const client = getClient()
  const res = await client.get(`/instance/connect/${instance()}`)
  return res.data
}

async function createInstance() {
  const client = getClient()
  const res = await client.post('/instance/create', {
    instanceName: instance(),
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  })
  return res.data
}

// ── Envío de mensajes ─────────────────────────────────────────────────────────

/**
 * Envía un mensaje de texto a un número.
 * @param {string} phone  - teléfono argentino, se normaliza automáticamente
 * @param {string} text   - texto del mensaje
 */
async function sendText(phone, text) {
  const client  = getClient()
  const number  = normalizePhone(phone)
  const res = await client.post(`/message/sendText/${instance()}`, {
    number,
    textMessage: { text },
  })
  return res.data
}

// ── Utilidades ────────────────────────────────────────────────────────────────

/**
 * Normaliza un número argentino al formato internacional sin + ni espacios.
 * Ejemplos: "011 4234-5678" → "5491142345678"
 *           "+54 9 11 4234-5678" → "5491142345678"
 */
function normalizePhone(phone) {
  let p = (phone || '').replace(/\D/g, '')
  // Quitar 0 inicial de área
  if (p.startsWith('0')) p = p.slice(1)
  // Agregar 9 para móviles argentinos (sin 54 todavía)
  if (!p.startsWith('54')) {
    // Si empieza con 11 (CABA) o código de área de 3 dígitos + número
    p = '549' + p
  } else if (p.startsWith('54') && !p.startsWith('549')) {
    // Tiene 54 pero sin el 9 de móvil
    p = '549' + p.slice(2)
  }
  return p
}

module.exports = { sendText, getInstanceStatus, getQRCode, createInstance, normalizePhone }