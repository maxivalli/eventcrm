const router     = require('express').Router()
const controller = require('../controllers/payments')

router.get('/all', controller.getAll)
router.get('/',    controller.getByEvent)
router.post('/',   controller.create)
router.delete('/:id', controller.remove)

module.exports = router