const router = require('express').Router()
const ctrl   = require('../controllers/catering')

router.get('/event/:eventId', ctrl.getByEvent)
router.post('/',              ctrl.create)
router.put('/:id',            ctrl.update)
router.delete('/:id',         ctrl.remove)

module.exports = router