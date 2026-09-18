const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
	register,
	login,
	getMe,
	registerPushToken,
	updateAvatar,
	removeAvatar,
	updateName,
	updateAge,
	updateProfile,
	requestPasswordReset,
	confirmPasswordReset,
	getTelegramLink,
	getVerificationStatus
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/push-token', authMiddleware, registerPushToken);
router.post('/avatar', authMiddleware, upload.single('avatar'), updateAvatar);
router.delete('/avatar', authMiddleware, removeAvatar);
router.patch('/name', authMiddleware, updateName);
router.patch('/age', authMiddleware, updateAge);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);
router.get('/telegram-link', getTelegramLink);
router.get('/verification-status', getVerificationStatus);

module.exports = router;