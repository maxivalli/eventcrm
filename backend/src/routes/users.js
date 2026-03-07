const router     = require('express').Router()
const controller = require('../controllers/users')

router.get('/',                   controller.getAll)
router.post('/',                  controller.create)
router.put('/:id',                controller.update)
router.put('/:id/password',       controller.changePassword)
router.delete('/:id',             controller.remove)

module.exports = router