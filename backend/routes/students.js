const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudents, getStudent, createStudent, updateStudent,
  deleteStudent, importStudents, uploadMiddleware, adjustTrust,
} = require('../controllers/studentController');

router.get('/',                 protect, authorize('admin','librarian'), getStudents);
router.post('/',                protect, authorize('admin'), createStudent);
router.post('/import',          protect, authorize('admin'), uploadMiddleware, importStudents);
router.get('/:id',              protect, authorize('admin','librarian'), getStudent);
router.put('/:id',              protect, authorize('admin'), updateStudent);
router.delete('/:id',           protect, authorize('admin'), deleteStudent);
router.patch('/:id/trust',      protect, authorize('admin'), adjustTrust);

module.exports = router;
