const router = require('express').Router()
const ctrl   = require('../controllers/whatsapp')

// Instancia
router.get('/status',          ctrl.getStatus)
router.get('/qr',              ctrl.getQR)
router.post('/instance',       ctrl.createInstance)

// Plantillas
router.get('/templates',           ctrl.getTemplates)
router.put('/templates/:id',       ctrl.updateTemplate)
router.get('/templates/preview',   ctrl.previewTemplate)

// Envío
router.post('/send/event/:eventId',   ctrl.sendToEvent)
router.post('/send/client/:clientId', ctrl.sendToClient)

// Cron manual
router.post('/jobs/:jobId/run', ctrl.triggerJob)

module.exports = router
