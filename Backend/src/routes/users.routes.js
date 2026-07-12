const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { body, query } = require('express-validator');
const { authenticate, authorize, auditLog, securityHeaders } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.'));
    }
  }
});

router.use(securityHeaders);

// ==================== PROFILE ENDPOINTS ====================

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT id, email, first_name, last_name, phone_number, role, status,
        avatar_url, title, bio, date_of_birth, gender, nationality,
        alternative_email, address, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relation,
        is_active, email_verified, two_factor_enabled,
        last_login, created_at, updated_at, school_id
      FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatar_url,
        twoFactorEnabled: user.two_factor_enabled,
        personalInfo: {
          firstName: user.first_name,
          lastName: user.last_name,
          title: user.title || '',
          bio: user.bio || '',
          dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
          gender: user.gender || '',
          nationality: user.nationality || 'Kenyan',
          phone: user.phone_number || '',
          alternativeEmail: user.alternative_email || '',
          address: user.address || '',
          emergencyContactName: user.emergency_contact_name || '',
          emergencyContactPhone: user.emergency_contact_phone || '',
          emergencyContactRelation: user.emergency_contact_relation || ''
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me/personal-info
router.put('/me/personal-info', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, title, bio, dateOfBirth, gender, nationality } = req.body;

    await db.query(
      `UPDATE users SET first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name), title = COALESCE($3, title),
        bio = COALESCE($4, bio), date_of_birth = COALESCE($5::date, date_of_birth),
        gender = COALESCE($6, gender), nationality = COALESCE($7, nationality),
        updated_at = NOW()
      WHERE id = $8 AND deleted_at IS NULL`,
      [firstName, lastName, title, bio, dateOfBirth || null, gender, nationality, userId]
    );

    return res.json({ success: true, message: 'Personal information updated successfully' });
  } catch (error) {
    console.error('Update personal info error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update personal information' });
  }
});

// PUT /api/users/me/contact-info
router.put('/me/contact-info', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, alternativeEmail, address } = req.body;

    await db.query(
      `UPDATE users SET phone_number = COALESCE($1, phone_number),
        alternative_email = COALESCE($2, alternative_email),
        address = COALESCE($3, address), updated_at = NOW()
      WHERE id = $4 AND deleted_at IS NULL`,
      [phone, alternativeEmail, address, userId]
    );

    return res.json({ success: true, message: 'Contact information updated successfully' });
  } catch (error) {
    console.error('Update contact info error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update contact information' });
  }
});

// PUT /api/users/me/emergency-contact
router.put('/me/emergency-contact', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { emergencyContactName, emergencyContactPhone, emergencyContactRelation } = req.body;

    await db.query(
      `UPDATE users SET emergency_contact_name = COALESCE($1, emergency_contact_name),
        emergency_contact_phone = COALESCE($2, emergency_contact_phone),
        emergency_contact_relation = COALESCE($3, emergency_contact_relation),
        updated_at = NOW()
      WHERE id = $4 AND deleted_at IS NULL`,
      [emergencyContactName, emergencyContactPhone, emergencyContactRelation, userId]
    );

    return res.json({ success: true, message: 'Emergency contact updated successfully' });
  } catch (error) {
    console.error('Update emergency contact error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update emergency contact' });
  }
});

// POST /api/users/me/change-password
router.post('/me/change-password', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE users SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW() WHERE id = $2`, [newPasswordHash, userId]);

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// POST /api/users/me/avatar
router.post('/me/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const oldAvatar = await db.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    if (oldAvatar.rows[0]?.avatar_url) {
      const oldPath = path.join('./uploads/avatars', path.basename(oldAvatar.rows[0].avatar_url));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, userId]);
    return res.json({ success: true, data: { avatarUrl }, message: 'Avatar uploaded successfully' });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
});

// DELETE /api/users/me/avatar
router.delete('/me/avatar', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);

    if (result.rows[0]?.avatar_url) {
      const avatarPath = path.join('./uploads/avatars', path.basename(result.rows[0].avatar_url));
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    await db.query('UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1', [userId]);
    return res.json({ success: true, message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove avatar' });
  }
});

// ==================== ADMIN USER MANAGEMENT ====================

// GET /api/users
router.get('/', authenticate, async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.json({ success: true, data: [], message: 'No database connection' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const { role, status, search, school_id } = req.query;

    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (req.user.role === 'school_admin' && req.user.schoolId) {
      whereConditions.push(`u.school_id = $${paramIndex}`);
      queryParams.push(req.user.schoolId);
      paramIndex++;
      whereConditions.push(`u.role != 'super_admin'`);
    }

    if (role && role !== 'all') {
      whereConditions.push(`u.role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        whereConditions.push(`u.is_active = true AND (u.locked_until IS NULL OR u.locked_until < NOW())`);
      } else if (status === 'locked') {
        whereConditions.push(`u.locked_until > NOW()`);
      } else if (status === 'inactive') {
        whereConditions.push(`u.is_active = false`);
      } else if (status === 'not_verified') {
        whereConditions.push(`u.email_verified = false`);
      }
    }

    if (search && search.trim()) {
      whereConditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (school_id && req.user.role === 'super_admin') {
      whereConditions.push(`u.school_id = $${paramIndex}`);
      queryParams.push(school_id);
      paramIndex++;
    }

    whereConditions.push(`u.deleted_at IS NULL`);

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0]?.total) || 0;
    const totalPages = Math.ceil(total / limit);

    const dataQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, u.role, u.status,
        u.is_active, u.email_verified, u.two_factor_enabled, u.last_login, u.login_attempts,
        u.locked_until, u.active_sessions, u.max_sessions, u.school_id, u.created_at, u.updated_at,
        u.avatar_url, u.title, s.name as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...queryParams, limit, offset];
    const result = await db.query(dataQuery, dataParams);

    return res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, pages: totalPages }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// GET /api/users/stats/summary
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.json({ success: true, data: { total_users: 0, super_admins: 0, school_admins: 0, active_users: 0, locked_users: 0 } });
    }

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'school_admin' && req.user.schoolId) {
      whereClause = `WHERE school_id = $${paramIndex} AND role != 'super_admin' AND deleted_at IS NULL`;
      params.push(req.user.schoolId);
      paramIndex++;
    } else {
      whereClause = `WHERE deleted_at IS NULL`;
    }

    const statsQuery = `
      SELECT COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins,
        COUNT(*) FILTER (WHERE role = 'school_admin') as school_admins,
        COUNT(*) FILTER (WHERE is_active = true AND (locked_until IS NULL OR locked_until < NOW())) as active_users,
        COUNT(*) FILTER (WHERE locked_until > NOW()) as locked_users
      FROM users ${whereClause}
    `;

    const result = await db.query(statsQuery, params);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user statistics' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, u.role, u.status,
        u.is_active, u.email_verified, u.two_factor_enabled, u.last_login, u.login_attempts,
        u.locked_until, u.active_sessions, u.max_sessions, u.school_id, u.created_at, u.updated_at,
        u.avatar_url, u.title, u.bio, u.gender, u.nationality, u.alternative_email, u.address,
        u.emergency_contact_name, u.emergency_contact_phone, u.emergency_contact_relation,
        s.name as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// POST /api/users
router.post('/', authenticate, authorize('super_admin', 'school_admin'), [
  body('email').isEmail().withMessage('Valid email is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['super_admin', 'school_admin', 'teacher', 'parent', 'student']).withMessage('Invalid role'),
], auditLog('USER_CREATE'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    let { email, first_name, last_name, phone_number, role, school_id } = req.body;

    const checkResult = await db.query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    if (req.user.role === 'school_admin') {
      if (!['teacher', 'parent', 'student'].includes(role)) {
        return res.status(403).json({ success: false, message: 'School admins can only create teachers, parents, and students' });
      }
      // SECURITY: never trust a client-supplied school_id for a school_admin.
      // Always scope the new user to the admin's own school, regardless of
      // what (if anything) was sent in the request body — otherwise a
      // school_admin could create/attach users to a different school.
      school_id = req.user.schoolId;
      if (!school_id) {
        return res.status(400).json({ success: false, message: 'Your account is not associated with a school' });
      }
    }

    const result = await db.query(
      `INSERT INTO users (email, first_name, last_name, phone_number, role, school_id, status, is_active, login_attempts, active_sessions, max_sessions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', true, 0, 0, 5, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, school_id, created_at`,
      [email, first_name, last_name, phone_number, role, school_id || req.user.schoolId]
    );

    return res.status(201).json({ success: true, data: result.rows[0], message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, authorize('super_admin', 'school_admin'), auditLog('USER_UPDATE'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;
    let { first_name, last_name, phone_number, role, is_active, school_id } = req.body;

    if (req.user.role === 'school_admin') {
      const checkResult = await db.query('SELECT school_id, role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const targetUser = checkResult.rows[0];
      if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
      }
      if (role && ['super_admin', 'school_admin'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Not authorized to assign admin roles' });
      }
      // SECURITY: never let a school_admin move a user to a different
      // school via this body field — always pin it to their own school.
      school_id = req.user.schoolId;
    }

    const result = await db.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
        phone_number = COALESCE($3, phone_number), role = COALESCE($4, role), is_active = COALESCE($5, is_active),
        school_id = COALESCE($6, school_id), updated_at = NOW()
      WHERE id = $7 AND deleted_at IS NULL
      RETURNING id, email, first_name, last_name, role, is_active, school_id, updated_at`,
      [first_name, last_name, phone_number, role, is_active, school_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: result.rows[0], message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authenticate, authorize('super_admin', 'school_admin'), auditLog('USER_STATUS_CHANGE'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    if (req.user.role === 'school_admin') {
      const checkResult = await db.query('SELECT school_id, role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const targetUser = checkResult.rows[0];
      if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify this user' });
      }
    }

    const result = await db.query(`UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING id, email, is_active, updated_at`, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: result.rows[0], message: is_active ? 'User activated successfully' : 'User deactivated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// POST /api/users/:id/unlock
router.post('/:id/unlock', authenticate, authorize('super_admin', 'school_admin'), auditLog('USER_UNLOCK'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;

    if (req.user.role === 'school_admin') {
      const checkResult = await db.query('SELECT school_id, role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const targetUser = checkResult.rows[0];
      if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: 'Not authorized to unlock this user' });
      }
    }

    const result = await db.query(`UPDATE users SET locked_until = NULL, login_attempts = 0, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id, email, locked_until, login_attempts, updated_at`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: result.rows[0], message: 'User account unlocked successfully' });
  } catch (error) {
    console.error('Error unlocking user:', error);
    return res.status(500).json({ success: false, message: 'Failed to unlock user' });
  }
});

// POST /api/users/:id/reset-password
router.post('/:id/reset-password', authenticate, authorize('super_admin', 'school_admin'), auditLog('USER_PASSWORD_RESET'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;

    if (req.user.role === 'school_admin') {
      const checkResult = await db.query('SELECT school_id, role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const targetUser = checkResult.rows[0];
      if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: 'Not authorized to reset password for this user' });
      }
    }

    await db.query(`UPDATE users SET password_reset_required = true, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [id]);

    return res.json({ success: true, message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('super_admin', 'school_admin'), auditLog('USER_DELETE'), async (req, res) => {
  try {
    if (!db || !db.query) {
      return res.status(500).json({ success: false, message: 'Database not configured' });
    }

    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    if (req.user.role === 'school_admin') {
      const checkResult = await db.query('SELECT school_id, role FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const targetUser = checkResult.rows[0];
      if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
      }
    }

    const result = await db.query(`UPDATE users SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// ==================== NOTIFICATION PREFERENCES ====================

// GET /api/users/me/notification-preferences
router.get('/me/notification-preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT notification_preferences FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: result.rows[0].notification_preferences || {
        email: true, sms: true, announcements: true, attendance: true, grades: true, fees: true
      }
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notification preferences' });
  }
});

// PUT /api/users/me/notification-preferences
router.put('/me/notification-preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, sms, announcements, attendance, grades, fees } = req.body;

    // Merge into the existing JSONB so a partial update (e.g. just toggling
    // "sms") never wipes out the other preference keys.
    const patch = {};
    if (typeof email === 'boolean') patch.email = email;
    if (typeof sms === 'boolean') patch.sms = sms;
    if (typeof announcements === 'boolean') patch.announcements = announcements;
    if (typeof attendance === 'boolean') patch.attendance = attendance;
    if (typeof grades === 'boolean') patch.grades = grades;
    if (typeof fees === 'boolean') patch.fees = fees;

    const result = await db.query(
      `UPDATE users
       SET notification_preferences = notification_preferences || $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING notification_preferences`,
      [JSON.stringify(patch), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: result.rows[0].notification_preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification preferences' });
  }
});

// ==================== LOGIN SECURITY SETTINGS ====================

// GET /api/users/me/security-settings
router.get('/me/security-settings', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT login_alerts_enabled, trusted_devices_only, session_timeout_minutes, trusted_devices,
        last_login, last_login_ip, last_activity
      FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        loginAlerts: result.rows[0].login_alerts_enabled,
        trustedDevicesOnly: result.rows[0].trusted_devices_only,
        sessionTimeout: result.rows[0].session_timeout_minutes,
        trustedDevices: result.rows[0].trusted_devices || [],
        lastLogin: result.rows[0].last_login,
        lastLoginIp: result.rows[0].last_login_ip,
        lastActivity: result.rows[0].last_activity
      }
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch security settings' });
  }
});

// PUT /api/users/me/security-settings
router.put('/me/security-settings', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { loginAlerts, trustedDevicesOnly, sessionTimeout } = req.body;

    await db.query(
      `UPDATE users SET login_alerts_enabled = COALESCE($1, login_alerts_enabled),
        trusted_devices_only = COALESCE($2, trusted_devices_only),
        session_timeout_minutes = COALESCE($3, session_timeout_minutes),
        updated_at = NOW()
      WHERE id = $4 AND deleted_at IS NULL`,
      [loginAlerts, trustedDevicesOnly, sessionTimeout, userId]
    );

    return res.json({ success: true, message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Update security settings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update security settings' });
  }
});

// POST /api/users/me/trusted-device
router.post('/me/trusted-device', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, deviceName, deviceType } = req.body;

    const userResult = await db.query('SELECT trusted_devices FROM users WHERE id = $1', [userId]);
    let trustedDevices = userResult.rows[0]?.trusted_devices || [];

    const deviceExists = trustedDevices.some((d) => d.deviceId === deviceId);
    if (!deviceExists) {
      trustedDevices.push({ deviceId, deviceName, deviceType, addedAt: new Date().toISOString(), lastUsed: new Date().toISOString() });
    }

    await db.query('UPDATE users SET trusted_devices = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(trustedDevices), userId]);
    return res.json({ success: true, message: 'Device added to trusted list' });
  } catch (error) {
    console.error('Add trusted device error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add trusted device' });
  }
});

// DELETE /api/users/me/trusted-device/:deviceId
router.delete('/me/trusted-device/:deviceId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.params;

    const userResult = await db.query('SELECT trusted_devices FROM users WHERE id = $1', [userId]);
    let trustedDevices = userResult.rows[0]?.trusted_devices || [];
    trustedDevices = trustedDevices.filter((d) => d.deviceId !== deviceId);

    await db.query('UPDATE users SET trusted_devices = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(trustedDevices), userId]);
    return res.json({ success: true, message: 'Trusted device removed' });
  } catch (error) {
    console.error('Remove trusted device error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove trusted device' });
  }
});

// POST /api/users/me/update-activity
router.post('/me/update-activity', authenticate, async (req, res) => {
  try {
    console.log('🔍 UPDATE-ACTIVITY CALLED:', { userId: req.user?.id, timestamp: new Date().toISOString() });
    
    if (!req.user?.id) {
      console.log('❌ NO USER IN REQ.USER - AUTH FAILED');
      return res.status(401).json({ success: false, message: 'No authenticated user' });
    }
    
    const userId = req.user.id;
    const result = await db.query('UPDATE users SET last_activity = NOW() WHERE id = $1 RETURNING id, last_activity', [userId]);
    
    console.log('✅ ACTIVITY UPDATED:', result.rows[0]);
    return res.json({ success: true, last_activity: result.rows[0]?.last_activity });
  } catch (error) {
    console.error('❌ Update activity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update activity' });
  }
});

module.exports = router;
