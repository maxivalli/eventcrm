const router     = require('express').Router()
const controller = require('../controllers/checklist')

router.get('/event/:eventId', controller.getByEvent)
router.post('/',              controller.create)
router.put('/:id/toggle',     controller.toggle)
router.delete('/:id',         controller.remove)

module.exports = router