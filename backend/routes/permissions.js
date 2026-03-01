const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createPermission, getMyPermissions, getPermissionById,
  updatePermission, deletePermission,
  getPermissionsForHOD, hodReview,
  getPermissionsForHOC, hocReview,
  getAllPermissions
} = require('../controllers/permissionController');

// Staff routes
router.post('/', verifyToken, requireRole('staff'), createPermission);
router.get('/my', verifyToken, requireRole('staff'), getMyPermissions);
router.put('/:id', verifyToken, requireRole('staff'), updatePermission);
router.delete('/:id', verifyToken, requireRole('staff'), deletePermission);

// HOD routes
router.get('/hod/all', verifyToken, requireRole('head_of_department'), getPermissionsForHOD);
router.put('/hod/review/:id', verifyToken, requireRole('head_of_department'), hodReview);

// HOC routes
router.get('/hoc/all', verifyToken, requireRole('head_of_college'), getPermissionsForHOC);
router.put('/hoc/review/:id', verifyToken, requireRole('head_of_college'), hocReview);

// Shared (HOD + HOC)
router.get('/admin/all', verifyToken, requireRole('head_of_department', 'head_of_college'), getAllPermissions);

// Single permission (accessible by owner + admin)
router.get('/:id', verifyToken, getPermissionById);

module.exports = router;
