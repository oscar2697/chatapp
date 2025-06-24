import express from 'express'
import webhookControllers from '../controls/webhookControllers.js'

const router = express.Router()

router.post('/webhook', webhookControllers.handleIncoming)
router.get('/webhook', webhookControllers.verifyWebhook)

export default router