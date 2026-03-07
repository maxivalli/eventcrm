const router     = require('express').Router()
const controller = require('../controllers/eventFiles')
const upload     = require('../upload')

router.get('/event/:eventId',    controller.getByEvent)
router.post('/', upload.single('file'), controller.upload)
router.delete('/:id',            controller.remove)
router.get('/:id/view', controller.proxy)

module.exports = router