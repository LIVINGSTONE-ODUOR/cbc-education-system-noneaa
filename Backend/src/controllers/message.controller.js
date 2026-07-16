// =============================================================================
// message.controller.js
// Internal direct messaging between students, parents, teachers and the
// school admin.
//
// Table:   internal_messages
// Pattern: matches users.routes.js / liveChat.controller.js (raw SQL via
//          the shared db.query wrapper, not the Supabase client).
// Auth:    Bearer JWT -> req.user.id / req.user.schoolId / req.user.role
// =============================================================================

const { query } = require('../config/database');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Who is allowed to message whom. Keys/values are normalised (lowercase)
// `users.role` strings. A pair is allowed if either direction is listed.
// ---------------------------------------------------------------------------
const ALLOWED_PAIRS = [
  ['student', 'teacher'],
  ['parent', 'teacher'],
  ['student', 'school_admin'],
  ['parent', 'school_admin'],
  ['teacher', 'school_admin'],
];

const canMessage = (roleA, roleB) => {
  const a = (roleA || '').toLowerCase();
  const b = (roleB || '').toLowerCase();
  return ALLOWED_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
};

// Roles a given role is allowed to message, used to build the contacts list.
const roleTargets = (role) => {
  const r = (role || '').toLowerCase();
  const targets = new Set();
  ALLOWED_PAIRS.forEach(([x, y]) => {
    if (x === r) targets.add(y);
    if (y === r) targets.add(x);
  });
  return [...targets];
};

const respond = (res, statusCode, success, message, data = null, extra = {}) => {
  const payload = { success, message, ...extra };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const getSchoolId = (req) => req.user.schoolId || req.user.school_id;

// =============================================================================
// GET /api/v1/messages/contacts
// People the current user is allowed to start/continue a conversation with,
// scoped to their own school. Includes each contact's unread count from
// them and the timestamp of the last message exchanged (for sorting).
// =============================================================================
exports.getContacts = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const role = req.user.role;

    if (!schoolId) {
      return respond(res, 400, false, 'Your account is not associated with a school.');
    }

    const targets = roleTargets(role);
    if (targets.length === 0) {
      return respond(res, 200, true, 'Contacts fetched', []);
    }

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.role, u.avatar_url,
              lm.last_message, lm.last_message_at,
              COALESCE(unread.count, 0) AS unread_count
       FROM users u
       LEFT JOIN LATERAL (
         SELECT content AS last_message, created_at AS last_message_at
         FROM internal_messages m
         WHERE (m.sender_id = u.id AND m.recipient_id = $2)
            OR (m.sender_id = $2 AND m.recipient_id = u.id)
         ORDER BY m.created_at DESC
         LIMIT 1
       ) lm ON TRUE
       LEFT JOIN (
         SELECT sender_id, COUNT(*) AS count
         FROM internal_messages
         WHERE recipient_id = $2 AND is_read = FALSE
         GROUP BY sender_id
       ) unread ON unread.sender_id = u.id
       WHERE u.school_id = $1
         AND u.role = ANY($3::text[])
         AND u.id != $2
         AND u.deleted_at IS NULL
       ORDER BY lm.last_message_at DESC NULLS LAST, u.first_name ASC`,
      [schoolId, req.user.id, targets]
    );

    return respond(res, 200, true, 'Contacts fetched', result.rows);
  } catch (error) {
    logger.error('message.getContacts error:', error);
    return respond(res, 500, false, 'Could not fetch contacts');
  }
};

// =============================================================================
// GET /api/v1/messages/thread/:userId
// Full message thread between the current user and :userId, oldest first.
// Also marks any unread messages from :userId as read.
// =============================================================================
exports.getThread = async (req, res) => {
  try {
    const { userId } = req.params;
    const schoolId = getSchoolId(req);

    const otherResult = await query(
      `SELECT id, first_name, last_name, role, school_id, avatar_url
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    if (otherResult.rows.length === 0) {
      return respond(res, 404, false, 'User not found');
    }
    const other = otherResult.rows[0];

    if (other.school_id !== schoolId) {
      return respond(res, 403, false, 'That user is not in your school.');
    }
    if (!canMessage(req.user.role, other.role)) {
      return respond(res, 403, false, 'You are not permitted to message this user.');
    }

    const messagesResult = await query(
      `SELECT id, sender_id, recipient_id, content, is_read, created_at
       FROM internal_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC`,
      [req.user.id, userId]
    );

    await query(
      `UPDATE internal_messages
       SET is_read = TRUE, read_at = NOW()
       WHERE sender_id = $1 AND recipient_id = $2 AND is_read = FALSE`,
      [userId, req.user.id]
    );

    return respond(res, 200, true, 'Thread fetched', {
      contact: {
        id: other.id,
        firstName: other.first_name,
        lastName: other.last_name,
        role: other.role,
        avatarUrl: other.avatar_url,
      },
      messages: messagesResult.rows,
    });
  } catch (error) {
    logger.error('message.getThread error:', error);
    return respond(res, 500, false, 'Could not fetch conversation');
  }
};

// =============================================================================
// POST /api/v1/messages/thread/:userId
// Body: { content }
// =============================================================================
exports.sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { content } = req.body || {};
    const schoolId = getSchoolId(req);

    if (!content || !content.trim()) {
      return respond(res, 400, false, 'Message content is required');
    }
    if (content.trim().length > 5000) {
      return respond(res, 400, false, 'Message is too long (max 5000 characters)');
    }
    if (userId === req.user.id) {
      return respond(res, 400, false, 'You cannot message yourself');
    }

    const otherResult = await query(
      `SELECT id, role, school_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    if (otherResult.rows.length === 0) {
      return respond(res, 404, false, 'Recipient not found');
    }
    const other = otherResult.rows[0];

    if (other.school_id !== schoolId) {
      return respond(res, 403, false, 'That user is not in your school.');
    }
    if (!canMessage(req.user.role, other.role)) {
      return respond(res, 403, false, 'You are not permitted to message this user.');
    }

    const result = await query(
      `INSERT INTO internal_messages (school_id, sender_id, recipient_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
      [schoolId, req.user.id, userId, content.trim()]
    );

    return respond(res, 201, true, 'Message sent', result.rows[0]);
  } catch (error) {
    logger.error('message.sendMessage error:', error);
    return respond(res, 500, false, 'Could not send message');
  }
};

// =============================================================================
// GET /api/v1/messages/unread-count
// Lightweight badge count for the current user, used for polling.
// =============================================================================
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM internal_messages WHERE recipient_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    return respond(res, 200, true, 'Unread count fetched', null, { count: result.rows[0].count });
  } catch (error) {
    logger.error('message.getUnreadCount error:', error);
    return respond(res, 500, false, 'Could not fetch unread count');
  }
};
