const router     = require('express').Router()
const controller = require('../controllers/supplierPayments')

router.get('/pending-total',     controller.getPendingTotal)
router.get('/all',               controller.getAll)
router.get('/by-event/:eventId', controller.getByEvent)          // ← nuevo
router.get('/',                  controller.getBySupplierAndEvent)
router.post('/',                 controller.create)
router.patch('/:id/status',      controller.updateStatus)
router.delete('/:id',            controller.remove)

module.exports = router