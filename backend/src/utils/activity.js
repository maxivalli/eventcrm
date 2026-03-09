const prisma = require('../prisma')

/**
 * Registra una entrada en el log de actividad.
 * Se llama de forma fire-and-forget (no bloquea la respuesta al cliente).
 *
 * @param {object} opts
 * @param {string} opts.action   - 'create' | 'update' | 'delete' | 'status' | 'payment' | 'file' | 'checklist'
 * @param {string} opts.entity   - 'client' | 'event' | 'quote' | 'supplier' | 'payment' | 'supplierPayment' | 'file' | 'checklist' | 'dish'
 * @param {number} [opts.entityId]
 * @param {string} opts.label    - Descripción principal legible
 * @param {string} [opts.detail] - Detalle secundario (monto, estado, etc.)
 * @param {object} [opts.meta]   - Datos extra en JSON
 */
function log({ action, entity, entityId, label, detail, meta }) {
  prisma.activityLog.create({
    data: {
      action,
      entity,
      entityId: entityId ? Number(entityId) : null,
      label,
      detail: detail ?? null,
      meta:   meta ? JSON.stringify(meta) : null,
    }
  }).catch(e => console.error('[ActivityLog] Error al guardar:', e.message))
}

module.exports = { log }
