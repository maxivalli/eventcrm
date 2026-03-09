const router = require('express').Router()
const ctrl   = require('../controllers/contacts')

router.get('/',     ctrl.getAll)
router.post('/',    ctrl.create)
router.delete('/all', ctrl.removeAll)
router.put('/:id',  ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router