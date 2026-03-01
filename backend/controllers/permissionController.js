const db = require('../config/db');

// Staff: Create a new permission request
const createPermission = (req, res) => {
  const { reason, start_date, end_date, type } = req.body;
  const staff_id = req.user.id;

  if (!reason || !start_date || !end_date || !type) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({ message: 'Start date cannot be after end date.' });
  }

  db.query(
    'INSERT INTO permissions (staff_id, reason, start_date, end_date, type) VALUES (?, ?, ?, ?, ?)',
    [staff_id, reason, start_date, end_date, type],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to submit permission request.' });
      return res.status(201).json({ message: 'Permission request submitted successfully.', id: result.insertId });
    }
  );
};

// Staff: Get own permissions
const getMyPermissions = (req, res) => {
  const staff_id = req.user.id;
  db.query(
    `SELECT p.*, u1.full_name as hod_reviewer_name, u2.full_name as hoc_reviewer_name
     FROM permissions p
     LEFT JOIN users u1 ON p.hod_reviewed_by = u1.id
     LEFT JOIN users u2 ON p.hoc_reviewed_by = u2.id
     WHERE p.staff_id = ?
     ORDER BY p.created_at DESC`,
    [staff_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      return res.status(200).json(results);
    }
  );
};

// Staff: Get single permission details
const getPermissionById = (req, res) => {
  const { id } = req.params;
  const user = req.user;

  let query = `SELECT p.*, 
    us.full_name as staff_name, us.email as staff_email, us.department,
    u1.full_name as hod_reviewer_name, u2.full_name as hoc_reviewer_name
   FROM permissions p
   JOIN users us ON p.staff_id = us.id
   LEFT JOIN users u1 ON p.hod_reviewed_by = u1.id
   LEFT JOIN users u2 ON p.hoc_reviewed_by = u2.id
   WHERE p.id = ?`;

  const params = [id];

  // Staff can only see their own
  if (user.role === 'staff') {
    query += ' AND p.staff_id = ?';
    params.push(user.id);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Permission not found.' });
    return res.status(200).json(results[0]);
  });
};

// Staff: Update own pending permission
const updatePermission = (req, res) => {
  const { id } = req.params;
  const { reason, start_date, end_date, type } = req.body;
  const staff_id = req.user.id;

  // Only allow update if HOD hasn't reviewed yet
  db.query('SELECT * FROM permissions WHERE id = ? AND staff_id = ?', [id, staff_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Permission not found.' });
    if (results[0].hod_status !== 'pending') {
      return res.status(400).json({ message: 'Cannot edit a permission that has already been reviewed.' });
    }

    db.query(
      'UPDATE permissions SET reason=?, start_date=?, end_date=?, type=? WHERE id=?',
      [reason, start_date, end_date, type, id],
      (err) => {
        if (err) return res.status(500).json({ message: 'Update failed.' });
        return res.status(200).json({ message: 'Permission updated successfully.' });
      }
    );
  });
};

// Staff: Delete own pending permission
const deletePermission = (req, res) => {
  const { id } = req.params;
  const staff_id = req.user.id;

  db.query('SELECT * FROM permissions WHERE id = ? AND staff_id = ?', [id, staff_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Permission not found.' });
    if (results[0].hod_status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete a permission that has already been reviewed.' });
    }

    db.query('DELETE FROM permissions WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ message: 'Delete failed.' });
      return res.status(200).json({ message: 'Permission deleted successfully.' });
    });
  });
};

// HOD: Get all pending permissions from staff
const getPermissionsForHOD = (req, res) => {
  db.query(
    `SELECT p.*, us.full_name as staff_name, us.email as staff_email, us.department
     FROM permissions p
     JOIN users us ON p.staff_id = us.id
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      return res.status(200).json(results);
    }
  );
};

// HOD: Approve or reject a permission
const hodReview = (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;
  const hod_id = req.user.id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected.' });
  }

  db.query('SELECT * FROM permissions WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Permission not found.' });
    if (results[0].hod_status !== 'pending') {
      return res.status(400).json({ message: 'This permission has already been reviewed by HOD.' });
    }

    // If HOD rejects, final status is also rejected
    const final_status = status === 'rejected' ? 'rejected' : 'pending';

    db.query(
      `UPDATE permissions SET 
        hod_status=?, hod_comment=?, hod_reviewed_by=?, hod_reviewed_at=NOW(),
        final_status=?
       WHERE id=?`,
      [status, comment || null, hod_id, final_status, id],
      (err) => {
        if (err) return res.status(500).json({ message: 'Review failed.' });
        return res.status(200).json({ message: `Permission ${status} by HOD.` });
      }
    );
  });
};

// HOC: Get all HOD-approved permissions
const getPermissionsForHOC = (req, res) => {
  db.query(
    `SELECT p.*, us.full_name as staff_name, us.email as staff_email, us.department,
      u1.full_name as hod_reviewer_name
     FROM permissions p
     JOIN users us ON p.staff_id = us.id
     LEFT JOIN users u1 ON p.hod_reviewed_by = u1.id
     WHERE p.hod_status = 'approved'
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      return res.status(200).json(results);
    }
  );
};

// HOC: Final approve or reject
const hocReview = (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;
  const hoc_id = req.user.id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected.' });
  }

  db.query('SELECT * FROM permissions WHERE id = ? AND hod_status = "approved"', [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Permission not found or not yet approved by HOD.' });
    if (results[0].hoc_status !== 'pending') {
      return res.status(400).json({ message: 'This permission has already been reviewed by HOC.' });
    }

    db.query(
      `UPDATE permissions SET 
        hoc_status=?, hoc_comment=?, hoc_reviewed_by=?, hoc_reviewed_at=NOW(),
        final_status=?
       WHERE id=?`,
      [status, comment || null, hoc_id, status, id],
      (err) => {
        if (err) return res.status(500).json({ message: 'Review failed.' });
        return res.status(200).json({ message: `Permission ${status} by Head of College.` });
      }
    );
  });
};

// Get all permissions (HOD + HOC can see all)
const getAllPermissions = (req, res) => {
  db.query(
    `SELECT p.*, us.full_name as staff_name, us.email as staff_email, us.department,
      u1.full_name as hod_reviewer_name, u2.full_name as hoc_reviewer_name
     FROM permissions p
     JOIN users us ON p.staff_id = us.id
     LEFT JOIN users u1 ON p.hod_reviewed_by = u1.id
     LEFT JOIN users u2 ON p.hoc_reviewed_by = u2.id
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      return res.status(200).json(results);
    }
  );
};

module.exports = {
  createPermission, getMyPermissions, getPermissionById,
  updatePermission, deletePermission,
  getPermissionsForHOD, hodReview,
  getPermissionsForHOC, hocReview,
  getAllPermissions
};
