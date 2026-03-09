const router     = require('express').Router()
const controller = require('../controllers/schedule')

router.get   ('/event/:eventId', controller.getByEvent)
router.post  ('/event/:eventId', controller.saveByEvent)
router.delete('/event/:eventId', controller.deleteByEvent)

module.exports = router
