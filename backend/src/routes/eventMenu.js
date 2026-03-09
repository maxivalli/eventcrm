const router = require('express').Router()
const ctrl   = require('../controllers/eventMenu')

router.get('/event/:eventId',          ctrl.getByEvent)
router.get('/shopping/:eventId',       ctrl.shoppingList)
router.post('/sections',               ctrl.createSection)
router.delete('/sections/:id',         ctrl.removeSection)
router.post('/items',                  ctrl.addItem)
router.delete('/items/:id',            ctrl.removeItem)

module.exports = router
