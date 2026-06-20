// ═══════════════ routes/auth.js ═══════════════
const router = require('express').Router();
const { login, verifyStudent, activateAccount, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login',           login);
router.post('/verify-student',  verifyStudent);
router.post('/activate',        activateAccount);
router.get('/me',               protect, getMe);
router.put('/change-password',  protect, changePassword);

module.exports = router;
