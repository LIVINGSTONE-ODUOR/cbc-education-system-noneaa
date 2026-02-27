const express = require('express');
const { body, query } = require('express-validator');
const { authenticate, authorize, auditLog, securityHeaders } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Apply security headers to all user routes
router.use(securityHeaders);

// GET /api/users - Get all users (with pagination and filters)
router.get('/',
  authenticate,
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.json({
          success: true,
          data: [],
          message: 'No database connection - using demo mode'
        });
      }

      // Parse and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
      const offset = (page - 1) * limit;

      const { role, status, search, school_id } = req.query;

      // Build WHERE clause dynamically
      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      // Role-based filtering: school_admin can only see users from their school
      if (req.user.role === 'school_admin' && req.user.schoolId) {
        whereConditions.push(`u.school_id = $${paramIndex}`);
        queryParams.push(req.user.schoolId);
        paramIndex++;
        // School admins cannot see super admins
        whereConditions.push(`u.role != 'super_admin'`);
      }

      // Role filter
      if (role && role !== 'all') {
        whereConditions.push(`u.role = $${paramIndex}`);
        queryParams.push(role);
        paramIndex++;
      }

      // Status filter
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

      // Search filter
      if (search && search.trim()) {
        whereConditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // School filter (only super_admin can filter by school_id)
      if (school_id && req.user.role === 'super_admin') {
        whereConditions.push(`u.school_id = $${paramIndex}`);
        queryParams.push(school_id);
        paramIndex++;
      }

      // Build WHERE clause
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Count query - same filtering conditions as main query
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users u
        ${whereClause}
      `;

      const countResult = await db.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0]?.total) || 0;
      const totalPages = Math.ceil(total / limit);

      // Main query - explicitly exclude sensitive fields (password_hash, mfa_secret_encrypted)
      const dataQuery = `
        SELECT 
          u.id, 
          u.email, 
          u.first_name, 
          u.last_name, 
          u.phone_number, 
          u.role, 
          u.status, 
          u.is_active, 
          u.email_verified, 
          u.two_factor_enabled,
          u.last_login, 
          u.login_attempts, 
          u.locked_until, 
          u.active_sessions, 
          u.max_sessions, 
          u.school_id, 
          u.created_at, 
          u.updated_at,
          s.name as school_name
        FROM users u
        LEFT JOIN schools s ON u.school_id = s.id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Add pagination parameters
      const dataParams = [...queryParams, limit, offset];
      const result = await db.query(dataQuery, dataParams);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }
);

// GET /api/users/stats/summary - Get user statistics
router.get('/stats/summary',
  authenticate,
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.json({
          success: true,
          data: {
            total_users: 0,
            super_admins: 0,
            school_admins: 0,
            active_users: 0,
            locked_users: 0
          }
        });
      }

      let whereClause = '';
      const params = [];
      let paramIndex = 1;

      if (req.user.role === 'school_admin' && req.user.schoolId) {
        whereClause = `WHERE school_id = $${paramIndex} AND role != 'super_admin'`;
        params.push(req.user.schoolId);
        paramIndex++;
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins,
          COUNT(*) FILTER (WHERE role = 'school_admin') as school_admins,
          COUNT(*) FILTER (WHERE is_active = true AND (locked_until IS NULL OR locked_until < NOW())) as active_users,
          COUNT(*) FILTER (WHERE locked_until > NOW()) as locked_users
        FROM users
        ${whereClause}
      `;

      const result = await db.query(statsQuery, params);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics',
        error: error.message
      });
    }
  }
);

// GET /api/users/:id - Get single user by ID
router.get('/:id',
  authenticate,
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured'
        });
      }

      const { id } = req.params;

      // Explicitly exclude sensitive fields
      const queryText = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone_number, 
          u.role, u.status, u.is_active, u.email_verified, u.two_factor_enabled,
          u.last_login, u.login_attempts, u.locked_until, u.active_sessions, 
          u.max_sessions, u.school_id, u.created_at, u.updated_at,
          s.name as school_name
        FROM users u
        LEFT JOIN schools s ON u.school_id = s.id
        WHERE u.id = $1
      `;

      const result = await db.query(queryText, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }
);

// POST /api/users - Create new user
router.post('/',
  authenticate,
  authorize('super_admin', 'school_admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['super_admin', 'school_admin', 'teacher', 'parent', 'student']).withMessage('Invalid role'),
  ],
  auditLog('USER_CREATE'),
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured'
        });
      }

      const { email, first_name, last_name, phone_number, role, school_id } = req.body;

      const checkQuery = 'SELECT id FROM users WHERE email = $1';
      const checkResult = await db.query(checkQuery, [email]);
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      if (req.user.role === 'school_admin') {
        if (!['teacher', 'parent'].includes(role)) {
          return res.status(403).json({
            success: false,
            message: 'School admins can only create teachers and parents'
          });
        }
        if (!school_id) {
          return res.status(400).json({
            success: false,
            message: 'School ID is required'
          });
        }
      }

      const insertQuery = `
        INSERT INTO users (email, first_name, last_name, phone_number, role, school_id, status, is_active, login_attempts, active_sessions, max_sessions, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'active', true, 0, 0, 5, NOW(), NOW())
        RETURNING id, email, first_name, last_name, role, school_id, created_at
      `;

      const result = await db.query(insertQuery, [email, first_name, last_name, phone_number, role, school_id || req.user.schoolId]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }
);

// PUT /api/users/:id - Update user
router.put('/:id',
  authenticate,
  authorize('super_admin', 'school_admin'),
  auditLog('USER_UPDATE'),
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured'
        });
      }

      const { id } = req.params;
      const { first_name, last_name, phone_number, role, is_active, school_id } = req.body;

      if (req.user.role === 'school_admin') {
        const checkQuery = 'SELECT school_id, role FROM users WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUser = checkResult.rows[0];
        
        if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to update this user'
          });
        }

        if (role && ['super_admin', 'school_admin'].includes(role)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to assign admin roles'
          });
        }
      }

      const updateQuery = `
        UPDATE users 
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone_number = COALESCE($3, phone_number),
            role = COALESCE($4, role),
            is_active = COALESCE($5, is_active),
            school_id = COALESCE($6, school_id),
            updated_at = NOW()
        WHERE id = $7
        RETURNING id, email, first_name, last_name, role, is_active, school_id, updated_at
      `;

      const result = await db.query(updateQuery, [first_name, last_name, phone_number, role, is_active, school_id, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  }
);

// PATCH /api/users/:id/status - Toggle user active status
router.patch('/:id/status',
  authenticate,
  authorize('super_admin', 'school_admin'),
  auditLog('USER_STATUS_CHANGE'),
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured'
        });
      }

      const { id } = req.params;
      const { is_active } = req.body;

      if (req.user.role === 'school_admin') {
        const checkQuery = 'SELECT school_id, role FROM users WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUser = checkResult.rows[0];
        
        if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to modify this user'
          });
        }
      }

      const updateQuery = `
        UPDATE users 
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, is_active, updated_at
      `;

      const result = await db.query(updateQuery, [is_active, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: is_active ? 'User activated successfully' : 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  }
);

// POST /api/users/:id/unlock - Unlock a locked user account
router.post('/:id/unlock',
  authenticate,
  authorize('super_admin', 'school_admin'),
  auditLog('USER_UNLOCK'),
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured'
        });
      }

      const { id } = req.params;

      if (req.user.role === 'school_admin') {
        const checkQuery = 'SELECT school_id, role FROM users WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUser = checkResult.rows[0];
        
        if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to unlock this user'
          });
        }
      }

      const updateQuery = `
        UPDATE users 
        SET locked_until = NULL, login_attempts = 0, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, locked_until, login_attempts, updated_at
      `;

      const result = await db.query(updateQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'User account unlocked successfully'
      });
    } catch (error) {
      console.error('Error unlocking user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unlock user',
        error: error.message
      });
    }
  }
);

// DELETE /api/users/:id - Delete user
router.delete('/:id',
  authenticate,
  authorize('super_admin', 'school_admin'),
  auditLog('USER_DELETE'),
  async (req, res) => {
    try {
      if (!db || !db.query) {
        return res.status(500).json({
          success: false,
          message: 'Database not configured'
        });
      }

      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      if (req.user.role === 'school_admin') {
        const checkQuery = 'SELECT school_id, role FROM users WHERE id = $1';
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetUser = checkResult.rows[0];
        
        if (targetUser.role === 'super_admin' || targetUser.school_id !== req.user.schoolId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this user'
          });
        }
      }

      const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const result = await db.query(deleteQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }
);

module.exports = router;
