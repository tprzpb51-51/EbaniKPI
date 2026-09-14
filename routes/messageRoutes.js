const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sendMessage, getMessages } = require('../controllers/messageController');

router.post('/:eventId', authMiddleware, sendMessage);
router.get('/:eventId', authMiddleware, getMessages);

module.exports = router;