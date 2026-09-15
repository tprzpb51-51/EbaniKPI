const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
	createEvent,
	getEvents,
	joinEvent,
	myEvents,
	cancelEvent,
	blockUser,
	getNearbyCount,
	getEventParticipants,
	blockEventParticipant
} = require('../controllers/eventController');

router.post('/', authMiddleware, upload.single('photo'), createEvent);
router.get('/', authMiddleware, getEvents);
router.get('/nearby-count', authMiddleware, getNearbyCount);
router.post('/:id/join', authMiddleware, joinEvent);
router.get('/:id/participants', authMiddleware, getEventParticipants);
router.post('/:id/block/:userId', authMiddleware, blockEventParticipant);
router.get('/my', authMiddleware, myEvents);
router.post('/:id/cancel', authMiddleware, cancelEvent);
router.post('/block/:userId', authMiddleware, blockUser);

module.exports = router;