const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createEvent, getEvents, joinEvent, myEvents, cancelEvent, blockUser } = require('../controllers/eventController');

router.post('/', authMiddleware, upload.single('photo'), createEvent);
router.get('/', authMiddleware, getEvents);
router.post('/:id/join', authMiddleware, joinEvent);
router.get('/my', authMiddleware, myEvents);
router.post('/:id/cancel', authMiddleware, cancelEvent);
router.post('/block/:userId', authMiddleware, blockUser);

module.exports = router;