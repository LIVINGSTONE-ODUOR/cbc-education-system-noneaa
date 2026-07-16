const { query } = require('../config/database');
const logger = require('../utils/logger');

// Phrases that signal the visitor wants (or needs) a human, checked
// case-insensitively against each visitor message.
const ESCALATION_PHRASES = [
  'talk to a human',
  'talk to someone',
  'speak to a human',
  'speak to someone',
  'real person',
  'human agent',
  'live agent',
  'talk to an agent',
  'talk to a person',
  'customer service rep',
  'representative',
  'connect me to support',
  'escalate',
];

const shouldEscalate = (text) => {
  const lower = (text || '').toLowerCase();
  return ESCALATION_PHRASES.some((phrase) => lower.includes(phrase));
};

const respond = (res, statusCode, success, message, data = null) => {
  const payload = { success, message };
  if (data) payload.data = data;
  return res.status(statusCode).json(payload);
};

// ==================== PUBLIC (widget) ENDPOINTS ====================

// POST /api/v1/live-chat/start
exports.startConversation = async (req, res) => {
  try {
    const { pageUrl } = req.body || {};
    const result = await query(
      `INSERT INTO support_conversations (page_url)
       VALUES ($1)
       RETURNING id, status, created_at`,
      [pageUrl || null]
    );
    return respond(res, 201, true, 'Conversation started', result.rows[0]);
  } catch (error) {
    logger.error('liveChat.startConversation error:', error);
    return respond(res, 500, false, 'Could not start conversation');
  }
};

// POST /api/v1/live-chat/:id/message
// Stores the visitor's message and checks whether it should trigger a
// handoff to a human agent. Does NOT generate an AI reply itself — the
// widget keeps handling that on its own, this endpoint is purely for
// persistence + escalation detection so an agent can see the transcript.
exports.postVisitorMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return respond(res, 400, false, 'Message content is required');
    }

    const convResult = await query(
      `SELECT id, status FROM support_conversations WHERE id = $1`,
      [id]
    );
    if (convResult.rows.length === 0) {
      return respond(res, 404, false, 'Conversation not found');
    }
    const conversation = convResult.rows[0];

    await query(
      `INSERT INTO support_messages (conversation_id, sender_type, content)
       VALUES ($1, 'visitor', $2)`,
      [id, content.trim()]
    );

    let escalated = conversation.status === 'escalated';

    if (!escalated && shouldEscalate(content)) {
      await query(
        `UPDATE support_conversations SET status = 'escalated', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      await query(
        `INSERT INTO support_messages (conversation_id, sender_type, content)
         VALUES ($1, 'system', 'Connecting you to a member of our team. Someone will be with you shortly.')`,
        [id]
      );
      escalated = true;
    } else {
      await query(
        `UPDATE support_conversations SET updated_at = NOW() WHERE id = $1`,
        [id]
      );
    }

    return respond(res, 200, true, 'Message received', { escalated });
  } catch (error) {
    logger.error('liveChat.postVisitorMessage error:', error);
    return respond(res, 500, false, 'Could not send message');
  }
};

// POST /api/v1/live-chat/:id/escalate
// Explicit "talk to a human" button in the widget.
exports.escalateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const convResult = await query(
      `SELECT id, status FROM support_conversations WHERE id = $1`,
      [id]
    );
    if (convResult.rows.length === 0) {
      return respond(res, 404, false, 'Conversation not found');
    }

    if (convResult.rows[0].status !== 'escalated') {
      await query(
        `UPDATE support_conversations SET status = 'escalated', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      await query(
        `INSERT INTO support_messages (conversation_id, sender_type, content)
         VALUES ($1, 'system', 'Connecting you to a member of our team. Someone will be with you shortly.')`,
        [id]
      );
    }

    return respond(res, 200, true, 'Conversation escalated', { escalated: true });
  } catch (error) {
    logger.error('liveChat.escalateConversation error:', error);
    return respond(res, 500, false, 'Could not escalate conversation');
  }
};

// GET /api/v1/live-chat/:id/messages?after=ISO_TIMESTAMP
// Used both by the widget (polling for agent replies) and the agent
// dashboard (loading the full thread).
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { after } = req.query;

    const params = [id];
    let sql = `SELECT id, sender_type, sender_name, content, created_at
               FROM support_messages
               WHERE conversation_id = $1`;
    if (after) {
      params.push(after);
      sql += ` AND created_at > $2`;
    }
    sql += ` ORDER BY created_at ASC`;

    const result = await query(sql, params);
    return respond(res, 200, true, 'Messages fetched', { messages: result.rows });
  } catch (error) {
    logger.error('liveChat.getMessages error:', error);
    return respond(res, 500, false, 'Could not fetch messages');
  }
};

// ==================== AGENT (protected) ENDPOINTS ====================

// GET /api/v1/live-chat/inbox
// Lists escalated conversations with a preview of the latest message.
exports.getInbox = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.status, c.visitor_label, c.page_url, c.assigned_agent_id,
              c.assigned_agent_name, c.created_at, c.updated_at,
              (SELECT content FROM support_messages m
                WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC LIMIT 1) AS last_message
       FROM support_conversations c
       WHERE c.status = 'escalated'
       ORDER BY c.updated_at DESC
       LIMIT 100`
    );
    return respond(res, 200, true, 'Inbox fetched', { conversations: result.rows });
  } catch (error) {
    logger.error('liveChat.getInbox error:', error);
    return respond(res, 500, false, 'Could not fetch inbox');
  }
};

// POST /api/v1/live-chat/:id/claim
exports.claimConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const agentName = req.user?.email || 'Support agent';

    // assigned_agent_id has a foreign key to the school-platform `users`
    // table. Website owners authenticate against the separate
    // `website_owners` table, so their id would violate that FK — store
    // the name only for them and leave assigned_agent_id null.
    const agentId = req.user?.isOwner ? null : req.user.id;

    const result = await query(
      `UPDATE support_conversations
       SET assigned_agent_id = $2, assigned_agent_name = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING id, assigned_agent_id, assigned_agent_name`,
      [id, agentId, agentName]
    );
    if (result.rows.length === 0) {
      return respond(res, 404, false, 'Conversation not found');
    }
    return respond(res, 200, true, 'Conversation claimed', result.rows[0]);
  } catch (error) {
    logger.error('liveChat.claimConversation error:', error);
    return respond(res, 500, false, 'Could not claim conversation');
  }
};

// POST /api/v1/live-chat/:id/reply
exports.postAgentReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    if (!content || !content.trim()) {
      return respond(res, 400, false, 'Reply content is required');
    }

    const agentName = req.user?.email || 'Support agent';

    await query(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_name, content)
       VALUES ($1, 'agent', $2, $3)`,
      [id, agentName, content.trim()]
    );
    await query(
      `UPDATE support_conversations SET updated_at = NOW() WHERE id = $1`,
      [id]
    );

    return respond(res, 200, true, 'Reply sent');
  } catch (error) {
    logger.error('liveChat.postAgentReply error:', error);
    return respond(res, 500, false, 'Could not send reply');
  }
};

// POST /api/v1/live-chat/:id/close
exports.closeConversation = async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE support_conversations SET status = 'closed', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    await query(
      `INSERT INTO support_messages (conversation_id, sender_type, content)
       VALUES ($1, 'system', 'This conversation has been closed.')`,
      [id]
    );
    return respond(res, 200, true, 'Conversation closed');
  } catch (error) {
    logger.error('liveChat.closeConversation error:', error);
    return respond(res, 500, false, 'Could not close conversation');
  }
};
