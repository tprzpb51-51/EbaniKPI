const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
	register,
	login,
	getMe,
	updateAvatar,
	updateName,
	requestPasswordReset,
	confirmPasswordReset,
	getTelegramLink
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/avatar', authMiddleware, upload.single('avatar'), updateAvatar);
router.patch('/name', authMiddleware, updateName);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);
router.get('/telegram-link', getTelegramLink);

module.exports = router;