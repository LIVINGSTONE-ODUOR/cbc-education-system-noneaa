const crypto = require('crypto');
const OpenAI = require('openai');
const siteKnowledge = require('../services/siteKnowledge.service');
// Supabase admin client is initialized in server-side layers (repos/services).




const CFG = {
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  appUrl:
    process.env.OPENROUTER_APP_URL ||
    process.env.FRONTEND_URL ||
    'https://cbc-education-systems.onrender.com',
  appName: process.env.OPENROUTER_APP_NAME || 'CBC Education Systems',
  timeoutMs: toInt(process.env.AI_REQUEST_TIMEOUT_MS, 35000),
  maxInputChars: toInt(process.env.AI_MAX_INPUT_CHARS, 6000),
  maxContextMessages: toInt(process.env.AI_MAX_CONTEXT_MESSAGES, 20),
  userRpm: toInt(process.env.AI_USER_RATE_LIMIT_PER_MIN, 20),
  schoolRpm: toInt(process.env.AI_SCHOOL_RATE_LIMIT_PER_MIN, 120),
  monthlyTokenLimit: toInt(process.env.AI_MONTHLY_TOKEN_LIMIT_PER_SCHOOL, 250000),
  inputCostPer1k: toNumber(process.env.AI_COST_INPUT_PER_1K, 0.00015),
  outputCostPer1k: toNumber(process.env.AI_COST_OUTPUT_PER_1K, 0.0006),
  defaultTemperature: toNumber(process.env.AI_DEFAULT_TEMPERATURE, 0.3),
  defaultMaxTokens: toInt(process.env.AI_DEFAULT_MAX_TOKENS, 900),
  fallbackEnabled: process.env.AI_ALLOW_FALLBACK !== 'false',
};

const ALLOWED_ROLES = new Set(['admin', 'teacher', 'school_admin', 'super_admin']);
const RATE_WINDOW_MS = 60 * 1000;
const tableCache = new Map();
const userBuckets = new Map();
const schoolBuckets = new Map();
const AI_DB_CONTEXT_ENABLED = process.env.AI_ENABLE_DB_CONTEXT === 'true';


const PRESETS = {
  fee_inquiry:
    'Prioritize school fee policy clarity. Do not guess balances. Ask for missing invoice details.',
  learner_lookup:
    'Protect learner privacy. Ask for admission number or class if data is insufficient.',
  attendance_followup:
    'Focus on absenteeism patterns and practical intervention steps for staff.',
  cbc_report_guidance:
    'Focus on CBC competency reporting language and actionable next steps.',
};

const BASE_PROMPT = [
  'You are Jarvis, an assistant for Kenyan CBC school operations.',
  'Only answer school-management-relevant questions.',
  'Never fabricate records, balances, names, or IDs.',
  'If data is missing, explicitly say what data is required.',
].join(' ');

const openrouter = CFG.apiKey
  ? new OpenAI({
      apiKey: CFG.apiKey,
      baseURL: CFG.baseUrl,
      defaultHeaders: {
        'HTTP-Referer': CFG.appUrl,
        'X-Title': CFG.appName,
      },
    })
  : null;

const respond = (res, statusCode, success, message, data = null, errors = null) => {
  const payload = { success, message };
  if (data) payload.data = data;
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function asBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function sanitizeText(value, max = CFG.maxInputChars) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((item) => {
      const role = sanitizeText(item?.role, 20).toLowerCase();
      const content = sanitizeText(item?.content);
      if (!role || !content) return null;
      if (!['system', 'user', 'assistant', 'tool'].includes(role)) return null;
      return { role, content };
    })
    .filter(Boolean);
}

function requestId(req) {
  const incoming = sanitizeText(req.headers['x-request-id'], 120);
  if (incoming) return incoming;
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function log(level, event, payload) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...payload });
  if (level === 'error') {
    console.error('[ai-assistant]', line);
    return;
  }
  console.log('[ai-assistant]', line);
}

function consumeBucket(map, key, maxPerWindow) {
  const now = Date.now();
  const current = map.get(key);

  if (!current || current.expiresAt <= now) {
    map.set(key, { count: 1, expiresAt: now + RATE_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  if (current.count >= maxPerWindow) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
    };
  }

  current.count += 1;
  map.set(key, current);
  return { ok: true, retryAfter: 0 };
}

async function hasTable(name) {
  // Placeholder until we migrate table existence checks to Supabase schema RPC.
  // For now, we assume tables exist when AI_DB_CONTEXT_ENABLED=true.
  return AI_DB_CONTEXT_ENABLED;
}


async function getTableSupport() {
  const [conversations, messages, usage] = await Promise.all([
    hasTable('ai_conversations'),
    hasTable('ai_messages'),
    hasTable('ai_usage_daily'),
  ]);
  return { conversations, messages, usage };
}

function validateAiAssistantEnv() {
  const missing = [];
  if (!CFG.apiKey) missing.push('OPENROUTER_API_KEY');
  if (!CFG.baseUrl) missing.push('OPENROUTER_BASE_URL');

  if (missing.length) {
    console.error(
      `[ai-assistant] Missing env vars: ${missing.join(', ')}. Running in fallback mode.`
    );
    return { ok: false, missing };
  }

  console.log(`[ai-assistant] OpenRouter configured. model=${CFG.model}, timeoutMs=${CFG.timeoutMs}`);
  return { ok: true, missing: [] };
}

const envState = validateAiAssistantEnv();

async function loadSchoolContext(schoolId) {
  const context = {
    school_name: null,
    school_code: null,
    school_level: null,
    current_year: null,
    current_term: null,
    active_fee_items: 0,
    active_fee_total: 0,
  };

  if (!AI_DB_CONTEXT_ENABLED) {
    return context;
  }

  // TODO: Migrate to Supabase Admin SDK queries.
  // Temporary behavior: return empty context until repositories are implemented.
  return context;
}

// DB context loading block intentionally disabled during refactor (pg -> Supabase).
/*
try {




    const year = await query(
      `SELECT name, year
       FROM academic_years
       WHERE school_id = $1 AND is_current = true
       ORDER BY start_date DESC NULLS LAST
       LIMIT 1`,
      [schoolId]
    );
    if (year.rows.length) {
      context.current_year = year.rows[0].name || String(year.rows[0].year);
    }
  } catch (error) {
    if (error.code !== '42P01') {
      log('error', 'context_year_failed', {
        schoolId,
        code: error.code,
        message: sanitizeText(error.message, 180),
      });
    }
  }

  try {
    if (await hasTable('terms')) {
      const term = await query(
        `SELECT name, term_number
         FROM terms
         WHERE school_id = $1 AND is_current = true
         ORDER BY updated_at DESC NULLS LAST
         LIMIT 1`,
        [schoolId]
      );
      if (term.rows.length) {
        context.current_term = term.rows[0].name || `Term ${term.rows[0].term_number}`;
      }
    }
  } catch (error) {
    log('error', 'context_term_failed', {
      schoolId,
      code: error.code,
      message: sanitizeText(error.message, 180),
    });
  }

  try {
    const fees = await query(
      `SELECT COUNT(*)::int AS fee_items,
              COALESCE(SUM(amount), 0)::numeric AS fee_total
       FROM fee_structures
       WHERE school_id = $1 AND is_active = true AND deleted_at IS NULL`,
      [schoolId]
    );

    if (fees.rows.length) {
      context.active_fee_items = Number(fees.rows[0].fee_items || 0);
      context.active_fee_total = Number(fees.rows[0].fee_total || 0);
    }
  } catch (error) {
    if (error.code !== '42P01') {
      log('error', 'context_fees_failed', {
        schoolId,
        code: error.code,
        message: sanitizeText(error.message, 180),
      });
    }
  }

  return context;
}

function buildSystemPrompt(context, preset, custom) {
  const lines = [
    `School: ${context.school_name || 'Unknown'} (${context.school_code || 'N/A'})`,
    `Level: ${context.school_level || 'N/A'}`,
    `Current year: ${context.current_year || 'Not set'}`,
    `Current term: ${context.current_term || 'Not set'}`,
    `Active fee items: ${context.active_fee_items}`,
    `Active fee total: ${context.active_fee_total}`,
  ];

  const blocks = [BASE_PROMPT, `School context:\n${lines.join('\n')}`];
  if (preset && PRESETS[preset]) blocks.push(`Preset (${preset}): ${PRESETS[preset]}`);

  const customPrompt = sanitizeText(custom, 2000);
  if (customPrompt) blocks.push(`Additional instructions: ${customPrompt}`);

  return blocks.join('\n\n');
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function normalizeUsage(rawUsage, promptText, replyText) {
  const prompt_tokens = Number.isFinite(Number(rawUsage?.prompt_tokens))
    ? Number(rawUsage.prompt_tokens)
    : estimateTokens(promptText);

  const completion_tokens = Number.isFinite(Number(rawUsage?.completion_tokens))
    ? Number(rawUsage.completion_tokens)
    : estimateTokens(replyText);

  const total_tokens = Number.isFinite(Number(rawUsage?.total_tokens))
    ? Number(rawUsage.total_tokens)
    : prompt_tokens + completion_tokens;

  return { prompt_tokens, completion_tokens, total_tokens };
}

function usageCost(usage) {
  const input = (usage.prompt_tokens / 1000) * CFG.inputCostPer1k;
  const output = (usage.completion_tokens / 1000) * CFG.outputCostPer1k;
  return Number((input + output).toFixed(6));
}

async function monthlyUsage(schoolId, support) {
  if (!support.usage) return { total_tokens: 0, total_cost_usd: 0 };

  const result = await query(
    `SELECT COALESCE(SUM(total_tokens), 0)::bigint AS total_tokens,
            COALESCE(SUM(total_cost_usd), 0)::numeric AS total_cost_usd
     FROM ai_usage_daily
     WHERE school_id = $1
       AND usage_date >= date_trunc('month', CURRENT_DATE)::date`,
    [schoolId]
  );

  return {
    total_tokens: Number(result.rows[0]?.total_tokens || 0),
    total_cost_usd: Number(result.rows[0]?.total_cost_usd || 0),
  };
}

async function ensureConversation({ support, schoolId, userId, conversationId, preset }) {
  if (!support.conversations) return { id: null, created: false };

  const safeId = sanitizeText(conversationId, 80);
  if (safeId) {
    const existing = await query(
      `SELECT id
       FROM ai_conversations
       WHERE id = $1 AND school_id = $2 AND user_id = $3
       LIMIT 1`,
      [safeId, schoolId, userId]
    );

    if (existing.rows.length) return { id: existing.rows[0].id, created: false };
  }

  const created = await query(
    `INSERT INTO ai_conversations (school_id, user_id, title, preset, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [schoolId, userId, 'New conversation', preset || null]
  );

  return { id: created.rows[0].id, created: true };
}

async function historyMessages({ support, conversationId, schoolId, limit }) {
  if (!support.messages || !conversationId) return [];

  const result = await query(
    `SELECT role, content
     FROM ai_messages
     WHERE conversation_id = $1 AND school_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [conversationId, schoolId, clamp(limit, 1, 50)]
  );

  return result.rows.reverse().map((row) => ({
    role: row.role,
    content: sanitizeText(row.content),
  }));
}

async function persistInteraction({
  support,
  schoolId,
  userId,
  conversationId,
  preset,
  userMessage,
  assistantMessage,
  usage,
  model,
  costUsd,
  providerStatus,
  meta,
}) {
  if (!support.conversations && !support.messages && !support.usage) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (support.conversations && conversationId) {
      const title = sanitizeText(userMessage, 120) || 'New conversation';
      await client.query(
        `UPDATE ai_conversations
         SET title = COALESCE(NULLIF(title, ''), $1),
             preset = COALESCE($2, preset),
             updated_at = NOW()
         WHERE id = $3`,
        [title, preset || null, conversationId]
      );
    }

    if (support.messages && conversationId) {
      await client.query(
        `INSERT INTO ai_messages (
           conversation_id, school_id, user_id, role, content, model,
           prompt_tokens, completion_tokens, total_tokens,
           provider_status, provider_metadata, created_at
         ) VALUES
           ($1, $2, $3, 'user', $4, $5, 0, 0, 0, $6, $7::jsonb, NOW()),
           ($1, $2, $3, 'assistant', $8, $5, $9, $10, $11, $6, $7::jsonb, NOW())`,
        [
          conversationId,
          schoolId,
          userId,
          sanitizeText(userMessage, CFG.maxInputChars),
          model,
          providerStatus,
          JSON.stringify(meta || {}),
          sanitizeText(assistantMessage, CFG.maxInputChars),
          usage.prompt_tokens,
          usage.completion_tokens,
          usage.total_tokens,
        ]
      );
    }

    if (support.usage) {
      await client.query(
        `INSERT INTO ai_usage_daily (
           school_id, usage_date, request_count,
           prompt_tokens, completion_tokens, total_tokens,
           total_cost_usd, updated_at
         ) VALUES ($1, CURRENT_DATE, 1, $2, $3, $4, $5, NOW())
         ON CONFLICT (school_id, usage_date)
         DO UPDATE SET
           request_count = ai_usage_daily.request_count + 1,
           prompt_tokens = ai_usage_daily.prompt_tokens + EXCLUDED.prompt_tokens,
           completion_tokens = ai_usage_daily.completion_tokens + EXCLUDED.completion_tokens,
           total_tokens = ai_usage_daily.total_tokens + EXCLUDED.total_tokens,
           total_cost_usd = ai_usage_daily.total_cost_usd + EXCLUDED.total_cost_usd,
           updated_at = NOW()`,
        [schoolId, usage.prompt_tokens, usage.completion_tokens, usage.total_tokens, costUsd]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    log('error', 'persist_failed', {
      schoolId,
      userId,
      conversationId,
      code: error.code,
      message: sanitizeText(error.message, 200),
    });
  } finally {
    client.release();
  }
}

function mapProviderError(error) {
  const status = Number(error?.status) || 500;
  const code = sanitizeText(error?.code || error?.type || 'provider_error', 80);
  const providerMessage = sanitizeText(
    error?.message || error?.error?.message || 'OpenRouter request failed',
    300
  );

  if (error?.name === 'AbortError') {
    return {
      status: 504,
      code: 'timeout',
      userMessage: 'The AI request timed out before completion.',
      providerMessage,
    };
  }

  if (status === 401) {
    return {
      status: 502,
      code: 'upstream_auth_failed',
      userMessage: 'AI provider authentication failed. Check OPENROUTER_API_KEY.',
      providerMessage,
    };
  }

  if (status === 403) {
    return {
      status: 502,
      code: 'upstream_forbidden',
      userMessage: 'AI provider rejected this request. Check model access and headers.',
      providerMessage,
    };
  }

  if (status === 429) {
    return {
      status: 429,
      code: 'upstream_rate_limited',
      userMessage: 'AI provider rate limit reached. Retry shortly.',
      providerMessage,
    };
  }

  if (status >= 500) {
    return {
      status: 502,
      code,
      userMessage: 'AI provider is temporarily unavailable.',
      providerMessage,
    };
  }

  return {
    status,
    code,
    userMessage: providerMessage || 'AI request failed',
    providerMessage,
  };
}

function fallbackTextForPreset(preset) {
  const map = {
    fee_inquiry:
      'The AI provider is unavailable. Please check invoice and fee structure records, then retry.',
    learner_lookup:
      'The AI provider is unavailable. Please verify learner details in the learner profile and retry.',
    attendance_followup:
      'The AI provider is unavailable. Please review the absentee register and retry for insights.',
    cbc_report_guidance:
      'The AI provider is unavailable. Please use existing competency notes and retry for drafting support.',
  };

  return (
    map[preset] ||
    'The AI provider is temporarily unavailable. Please retry shortly or contact support.'
  );
}

async function prepareRequest(req, reqId) {
  const user = req.user;
  if (!user) {
    return { ok: false, statusCode: 401, message: 'Authentication is required.' };
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    return { ok: false, statusCode: 403, message: 'Your role is not allowed to use this assistant.' };
  }

  if (!user.schoolId) {
    return { ok: false, statusCode: 403, message: 'User account is not linked to a school.' };
  }

  const userRate = consumeBucket(userBuckets, `${user.schoolId}:${user.id}`, CFG.userRpm);
  if (!userRate.ok) {
    return {
      ok: false,
      statusCode: 429,
      message: 'User rate limit reached. Retry shortly.',
      errors: [{ field: 'rate_limit', message: `Retry in ${userRate.retryAfter}s` }],
    };
  }

  const schoolRate = consumeBucket(schoolBuckets, String(user.schoolId), CFG.schoolRpm);
  if (!schoolRate.ok) {
    return {
      ok: false,
      statusCode: 429,
      message: 'School rate limit reached. Retry shortly.',
      errors: [{ field: 'rate_limit', message: `Retry in ${schoolRate.retryAfter}s` }],
    };
  }

  const body = req.body || {};
  const directMessage = sanitizeText(body.message);
  const fromBody = sanitizeMessages(body.messages);
  const messages = fromBody.length
    ? fromBody
    : directMessage
      ? [{ role: 'user', content: directMessage }]
      : [];

  if (!messages.length) {
    return {
      ok: false,
      statusCode: 422,
      message: 'Provide `message` or `messages` with valid content.',
    };
  }

  const latestUserMessage = [...messages].reverse().find((item) => item.role === 'user');
  if (!latestUserMessage) {
    return {
      ok: false,
      statusCode: 422,
      message: 'At least one user role message is required.',
    };
  }

  const preset = sanitizeText(body.preset, 60).toLowerCase();
  const model = sanitizeText(body.model, 120) || CFG.model;
  const temperature = clamp(toNumber(body.temperature, CFG.defaultTemperature), 0, 1.5);
  const maxTokens = clamp(toInt(body.max_tokens, CFG.defaultMaxTokens), 64, 3000);
  const support = await getTableSupport();
  const month = await monthlyUsage(user.schoolId, support);

  if (month.total_tokens >= CFG.monthlyTokenLimit) {
    return {
      ok: false,
      statusCode: 429,
      message: 'Monthly token limit reached for this school.',
      errors: [
        {
          field: 'token_limit',
          message: `Limit ${CFG.monthlyTokenLimit}, used ${month.total_tokens}`,
        },
      ],
    };
  }

  const conversation = await ensureConversation({
    support,
    schoolId: user.schoolId,
    userId: user.id,
    conversationId: body.conversation_id,
    preset,
  });

  const history = await historyMessages({
    support,
    conversationId: conversation.id,
    schoolId: user.schoolId,
    limit: CFG.maxContextMessages,
  });

  const context = await loadSchoolContext(user.schoolId);
  const systemPrompt = buildSystemPrompt(context, preset, body.systemPrompt);

  const merged = [...history, ...messages]
    .slice(-CFG.maxContextMessages)
    .map((item) => ({ role: item.role, content: item.content }));

  const modelMessages = [{ role: 'system', content: systemPrompt }, ...merged];
  const promptText = modelMessages.map((item) => `${item.role}: ${item.content}`).join('\n');

  log('info', 'request_prepared', {
    reqId,
    userId: user.id,
    schoolId: user.schoolId,
    model,
    preset: preset || null,
    messageCount: modelMessages.length,
    monthlyTokensUsed: month.total_tokens,
  });

  return {
    ok: true,
    reqId,
    user,
    support,
    preset,
    model,
    temperature,
    maxTokens,
    modelMessages,
    promptText,
    latestUserMessage: latestUserMessage.content,
    conversationId: conversation.id,
  };
}

function sendFallback(res, legacy, prepared, providerError) {
  const text = fallbackTextForPreset(prepared.preset);

  if (!CFG.fallbackEnabled) {
    if (legacy) {
      return res.status(providerError.status).json({
        error: providerError.userMessage,
        code: providerError.code,
        request_id: prepared.reqId,
      });
    }

    return respond(res, providerError.status, false, providerError.userMessage, {
      code: providerError.code,
      request_id: prepared.reqId,
    });
  }

  if (legacy) {
    return res.status(200).json({
      message: text,
      fallback: true,
      conversation_id: prepared.conversationId,
      request_id: prepared.reqId,
      provider_error: providerError.code,
    });
  }

  return respond(res, 200, true, 'Fallback response generated', {
    reply: text,
    fallback: true,
    conversation_id: prepared.conversationId,
    request_id: prepared.reqId,
    provider_error: providerError.code,
  });
}

async function runNonStream(prepared, req, res, legacy = false) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CFG.timeoutMs);

  const persistFallback = async (providerStatus, providerMeta) => {
    const text = fallbackTextForPreset(prepared.preset);
    const usage = normalizeUsage(null, prepared.promptText, text);
    await persistInteraction({
      support: prepared.support,
      schoolId: prepared.user.schoolId,
      userId: prepared.user.id,
      conversationId: prepared.conversationId,
      preset: prepared.preset,
      userMessage: prepared.latestUserMessage,
      assistantMessage: text,
      usage,
      model: prepared.model,
      costUsd: 0,
      providerStatus,
      meta: providerMeta,
    });
  };

  try {
    if (!openrouter) {
      await persistFallback('fallback', {
        reason: 'ai_not_configured',
        request_id: prepared.reqId,
      });

      return sendFallback(res, legacy, prepared, {
        status: 503,
        code: 'ai_not_configured',
        userMessage: 'OpenRouter is not configured on this server.',
      });
    }

    const completion = await openrouter.chat.completions.create(
      {
        model: prepared.model,
        messages: prepared.modelMessages,
        temperature: prepared.temperature,
        max_tokens: prepared.maxTokens,
      },
      { signal: controller.signal }
    );

    const reply = sanitizeText(completion?.choices?.[0]?.message?.content, CFG.maxInputChars);
    const finalReply = reply || 'No response generated by the AI provider.';
    const usage = normalizeUsage(completion?.usage, prepared.promptText, finalReply);
    const costUsd = usageCost(usage);

    await persistInteraction({
      support: prepared.support,
      schoolId: prepared.user.schoolId,
      userId: prepared.user.id,
      conversationId: prepared.conversationId,
      preset: prepared.preset,
      userMessage: prepared.latestUserMessage,
      assistantMessage: finalReply,
      usage,
      model: completion?.model || prepared.model,
      costUsd,
      providerStatus: 'ok',
      meta: { request_id: prepared.reqId },
    });

    log('info', 'response_generated', {
      reqId: prepared.reqId,
      userId: prepared.user.id,
      schoolId: prepared.user.schoolId,
      durationMs: Date.now() - startedAt,
      tokens: usage.total_tokens,
      costUsd,
    });

    if (legacy) {
      return res.status(200).json({
        message: finalReply,
        conversation_id: prepared.conversationId,
        usage,
        request_id: prepared.reqId,
      });
    }

    return respond(res, 200, true, 'AI response generated', {
      reply: finalReply,
      conversation_id: prepared.conversationId,
      usage,
      model: completion?.model || prepared.model,
      request_id: prepared.reqId,
      fallback: false,
    });
  } catch (error) {
    const mapped = mapProviderError(error);

    log('error', 'provider_failed', {
      reqId: prepared.reqId,
      userId: prepared.user.id,
      schoolId: prepared.user.schoolId,
      code: mapped.code,
      status: mapped.status,
      providerMessage: mapped.providerMessage,
    });

    await persistFallback(CFG.fallbackEnabled ? 'fallback' : 'error', {
      request_id: prepared.reqId,
      provider_code: mapped.code,
      provider_message: mapped.providerMessage,
    });

    return sendFallback(res, legacy, prepared, mapped);
  } finally {
    clearTimeout(timeout);
  }
}

async function runStream(prepared, req, res) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CFG.timeoutMs);
  let full = '';
  let rawUsage = null;

  req.on('close', () => controller.abort());

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(
    `data: ${JSON.stringify({
      type: 'meta',
      conversation_id: prepared.conversationId,
      request_id: prepared.reqId,
    })}\n\n`
  );

  const fallbackAndPersist = async (providerStatus, providerMeta) => {
    const fallback = fallbackTextForPreset(prepared.preset);
    const usage = normalizeUsage(rawUsage, prepared.promptText, fallback);

    await persistInteraction({
      support: prepared.support,
      schoolId: prepared.user.schoolId,
      userId: prepared.user.id,
      conversationId: prepared.conversationId,
      preset: prepared.preset,
      userMessage: prepared.latestUserMessage,
      assistantMessage: fallback,
      usage,
      model: prepared.model,
      costUsd: 0,
      providerStatus,
      meta: providerMeta,
    });

    if (CFG.fallbackEnabled) {
      res.write(`data: ${JSON.stringify({ type: 'delta', content: fallback })}\n\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          conversation_id: prepared.conversationId,
          fallback: true,
          request_id: prepared.reqId,
          provider_error: providerMeta?.provider_code || providerMeta?.reason || null,
        })}\n\n`
      );
    } else {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          code: providerMeta?.provider_code || providerMeta?.reason || 'provider_error',
          message: 'Streaming failed and fallback is disabled.',
          request_id: prepared.reqId,
        })}\n\n`
      );
    }

    res.end();
  };

  try {
    if (!openrouter) {
      await fallbackAndPersist('fallback', {
        reason: 'ai_not_configured',
        request_id: prepared.reqId,
      });
      return;
    }

    const stream = await openrouter.chat.completions.create(
      {
        model: prepared.model,
        messages: prepared.modelMessages,
        temperature: prepared.temperature,
        max_tokens: prepared.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: controller.signal }
    );

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content || '';
      if (delta) {
        full += delta;
        res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
      }
      if (chunk?.usage) rawUsage = chunk.usage;
    }

    const reply = sanitizeText(full, CFG.maxInputChars) || 'No response generated by the AI provider.';
    const usage = normalizeUsage(rawUsage, prepared.promptText, reply);
    const costUsd = usageCost(usage);

    await persistInteraction({
      support: prepared.support,
      schoolId: prepared.user.schoolId,
      userId: prepared.user.id,
      conversationId: prepared.conversationId,
      preset: prepared.preset,
      userMessage: prepared.latestUserMessage,
      assistantMessage: reply,
      usage,
      model: prepared.model,
      costUsd,
      providerStatus: 'ok',
      meta: { request_id: prepared.reqId, stream: true },
    });

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        conversation_id: prepared.conversationId,
        usage,
        request_id: prepared.reqId,
        fallback: false,
      })}\n\n`
    );
    res.end();
  } catch (error) {
    const mapped = mapProviderError(error);

    log('error', 'stream_failed', {
      reqId: prepared.reqId,
      userId: prepared.user.id,
      schoolId: prepared.user.schoolId,
      code: mapped.code,
      status: mapped.status,
      providerMessage: mapped.providerMessage,
    });

    await fallbackAndPersist(CFG.fallbackEnabled ? 'fallback' : 'error', {
      request_id: prepared.reqId,
      provider_code: mapped.code,
      provider_message: mapped.providerMessage,
      stream: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Main chat endpoint.
 */
async function chat(req, res) {
  const reqId = requestId(req);

  if (!envState.ok && !CFG.fallbackEnabled) {
    return respond(res, 503, false, 'AI service is not configured', {
      request_id: reqId,
      missing_env: envState.missing,
    });
  }

  const prepared = await prepareRequest(req, reqId);
  if (!prepared.ok) {
    return respond(res, prepared.statusCode, false, prepared.message, null, prepared.errors || null);
  }

  if (asBool(req.body?.stream, false)) {
    return runStream(prepared, req, res);
  }

  return runNonStream(prepared, req, res, false);
}

/**
 * Dedicated streaming endpoint.
 */
async function streamChat(req, res) {
  const reqId = requestId(req);

  if (!envState.ok && !CFG.fallbackEnabled) {
    return res.status(503).json({
      success: false,
      message: 'AI service is not configured',
      request_id: reqId,
      missing_env: envState.missing,
    });
  }

  const prepared = await prepareRequest(req, reqId);
  if (!prepared.ok) {
    return res.status(prepared.statusCode).json({
      success: false,
      message: prepared.message,
      errors: prepared.errors || null,
      request_id: reqId,
    });
  }

  return runStream(prepared, req, res);
}

// Public rate limiting for unauthenticated requests
const publicBuckets = new Map();
const PUBLIC_RATE_LIMIT_PER_MIN = 10;

/**
 * Legacy endpoint returning { message } for old frontend clients.
 * Supports both authenticated and unauthenticated (guest) users.
 */
async function legacyChat(req, res) {
  const reqId = requestId(req);

  if (!envState.ok && !CFG.fallbackEnabled) {
    return res.status(503).json({
      error: 'AI service is not configured',
      request_id: reqId,
      missing_env: envState.missing,
    });
  }

  // Check if user is authenticated
  if (req.user) {
    // Authenticated user - use the existing prepareRequest
    const prepared = await prepareRequest(req, reqId);
    if (!prepared.ok) {
      return res.status(prepared.statusCode).json({
        error: prepared.message,
        errors: prepared.errors || null,
        request_id: reqId,
      });
    }
    return runNonStream(prepared, req, res, true);
  } else {
    // Unauthenticated/guest user - use public mode
    const prepared = await preparePublicRequest(req, reqId);
    if (!prepared.ok) {
      return res.status(prepared.statusCode).json({
        error: prepared.message,
        errors: prepared.errors || null,
        request_id: reqId,
      });
    }
    return runPublicNonStream(prepared, req, res, true);
  }
}

/**
 * Dedicated streaming endpoint - supports authenticated and public users.
 */
async function streamChatLegacy(req, res) {
  const reqId = requestId(req);

  if (!envState.ok && !CFG.fallbackEnabled) {
    return res.status(503).json({
      success: false,
      message: 'AI service is not configured',
      request_id: reqId,
      missing_env: envState.missing,
    });
  }

  // Check if user is authenticated
  if (req.user) {
    const prepared = await prepareRequest(req, reqId);
    if (!prepared.ok) {
      return res.status(prepared.statusCode).json({
        success: false,
        message: prepared.message,
        errors: prepared.errors || null,
        request_id: reqId,
      });
    }
    return runStream(prepared, req, res);
  } else {
    // Unauthenticated/guest user - use public mode
    const prepared = await preparePublicRequest(req, reqId);
    if (!prepared.ok) {
      return res.status(prepared.statusCode).json({
        success: false,
        message: prepared.message,
        errors: prepared.errors || null,
        request_id: reqId,
      });
    }
    return runPublicStream(prepared, req, res);
  }
}

/**
 * Prepare request for public/unauthenticated users (guest mode).
 * Provides general CBE platform information without school-specific context.
 */
async function preparePublicRequest(req, reqId) {

  // Apply public rate limiting
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
  const publicRate = consumeBucket(publicBuckets, clientIp, PUBLIC_RATE_LIMIT_PER_MIN);
  
  if (!publicRate.ok) {
    return {
      ok: false,
      statusCode: 429,
      message: 'Too many requests. Please try again shortly.',
      errors: [{ field: 'rate_limit', message: `Retry in ${publicRate.retryAfter}s` }],
    };
  }

  const body = req.body || {};
  const directMessage = sanitizeText(body.message);
  const fromBody = sanitizeMessages(body.messages);
  const messages = fromBody.length
    ? fromBody
    : directMessage
      ? [{ role: 'user', content: directMessage }]
      : [];

  if (!messages.length) {
    return {
      ok: false,
      statusCode: 422,
      message: 'Provide `message` or `messages` with valid content.',
    };
  }

  const latestUserMessage = [...messages].reverse().find((item) => item.role === 'user');
  if (!latestUserMessage) {
    return {
      ok: false,
      statusCode: 422,
      message: 'At least one user role message is required.',
    };
  }

  const preset = sanitizeText(body.preset, 60).toLowerCase();
  const model = sanitizeText(body.model, 120) || CFG.model;
  const temperature = clamp(toNumber(body.temperature, CFG.defaultTemperature), 0, 1.5);
  const maxTokens = clamp(toInt(body.max_tokens, CFG.defaultMaxTokens), 64, 3000);
  
  // Public users don't get database context or history
  const support = { conversations: false, messages: false, usage: false };
  
  // Build a general system prompt for public users
  const publicSystemPrompt = `You are Jarvis, an AI assistant for the Nonea CBE Education Platform.
You provide helpful information about the Kenyan Competency-Based Education (CBE) system and the Nonea platform.
You strictly answer questions related to:
1. The Kenyan Competency-Based Education (CBE) system
2. The Nonea platform features and functionality
3. How teachers, parents, and school administrators can use the platform
4. CBE curriculum structure, learning areas, strands, and competencies
5. Assessment methods under CBE (formative and summative)
6. The transition from 8-4-4 to the 2-6-3-3-3 education system
7. When asked about the developers, say it's the Teksoft Developers Team
8. If you don't know something or need more specific information, recommend they contact support at contact@teksoft.co.ke

If asked about topics unrelated to CBE or this platform, politely redirect the conversation back to these topics.

Key CBE information:
- CBE focuses on learner competencies rather than content coverage
- The structure is: 2 years Early Years, 6 years Primary, 3 years Junior Secondary, 3 years Senior Secondary, 3+ years Tertiary
- Core competencies include: Communication, Collaboration, Critical Thinking, Creativity, Citizenship, Digital Literacy, Learning to Learn, Self-Efficacy
- Assessment is continuous and formative, focusing on competency development`;

  const merged = messages.slice(-10); // Limit to last 10 messages for public users
  const modelMessages = [{ role: 'system', content: publicSystemPrompt }, ...merged];
  const promptText = modelMessages.map((item) => `${item.role}: ${item.content}`).join('\n');

  log('info', 'public_request_prepared', {
    reqId,
    clientIp,
    model,
    messageCount: modelMessages.length,
  });

  return {
    ok: true,
    reqId,
    isPublic: true,
    user: { id: 'guest', role: 'guest', schoolId: null },
    support,
    preset,
    model,
    temperature,
    maxTokens,
    modelMessages,
    promptText,
    latestUserMessage: latestUserMessage.content,
    conversationId: null,
  };
}

/**
 * Run non-stream for public/guest users.
 */
async function runPublicNonStream(prepared, req, res, legacy = false) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CFG.timeoutMs);

  try {
    if (!openrouter) {
      return sendPublicFallback(res, legacy, prepared, {
        status: 503,
        code: 'ai_not_configured',
        userMessage: 'OpenRouter is not configured on this server.',
      });
    }

    const completion = await openrouter.chat.completions.create(
      {
        model: prepared.model,
        messages: prepared.modelMessages,
        temperature: prepared.temperature,
        max_tokens: prepared.maxTokens,
      },
      { signal: controller.signal }
    );

    const reply = sanitizeText(completion?.choices?.[0]?.message?.content, CFG.maxInputChars);
    const finalReply = reply || 'No response generated by the AI provider.';
    const usage = normalizeUsage(completion?.usage, prepared.promptText, finalReply);

    log('info', 'public_response_generated', {
      reqId: prepared.reqId,
      durationMs: Date.now() - startedAt,
      tokens: usage.total_tokens,
    });

    if (legacy) {
      return res.status(200).json({
        message: finalReply,
        conversation_id: prepared.conversationId,
        usage,
        request_id: prepared.reqId,
      });
    }

    return respond(res, 200, true, 'AI response generated', {
      reply: finalReply,
      conversation_id: prepared.conversationId,
      usage,
      model: completion?.model || prepared.model,
      request_id: prepared.reqId,
      fallback: false,
    });
  } catch (error) {
    const mapped = mapProviderError(error);

    log('error', 'public_provider_failed', {
      reqId: prepared.reqId,
      code: mapped.code,
      status: mapped.status,
      providerMessage: mapped.providerMessage,
    });

    return sendPublicFallback(res, legacy, prepared, mapped);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Run streaming for public/guest users.
 */
async function runPublicStream(prepared, req, res) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CFG.timeoutMs);
  let full = '';
  let rawUsage = null;

  req.on('close', () => controller.abort());

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(
    `data: ${JSON.stringify({
      type: 'meta',
      conversation_id: prepared.conversationId,
      request_id: prepared.reqId,
    })}\n\n`
  );

  try {
    if (!openrouter) {
      const fallback = 'AI service is not configured. Please try again later.';
      res.write(`data: ${JSON.stringify({ type: 'delta', content: fallback })}\n\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          conversation_id: prepared.conversationId,
          fallback: true,
          request_id: prepared.reqId,
          provider_error: 'ai_not_configured',
        })}\n\n`
      );
      res.end();
      return;
    }

    const stream = await openrouter.chat.completions.create(
      {
        model: prepared.model,
        messages: prepared.modelMessages,
        temperature: prepared.temperature,
        max_tokens: prepared.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: controller.signal }
    );

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content || '';
      if (delta) {
        full += delta;
        res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
      }
      if (chunk?.usage) rawUsage = chunk.usage;
    }

    const reply = sanitizeText(full, CFG.maxInputChars) || 'No response generated by the AI provider.';
    const usage = normalizeUsage(rawUsage, prepared.promptText, reply);

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        conversation_id: prepared.conversationId,
        usage,
        request_id: prepared.reqId,
        fallback: false,
      })}\n\n`
    );
    res.end();
  } catch (error) {
    const mapped = mapProviderError(error);

    log('error', 'public_stream_failed', {
      reqId: prepared.reqId,
      code: mapped.code,
      status: mapped.status,
      providerMessage: mapped.providerMessage,
    });

    const fallback = fallbackTextForPreset(prepared.preset);
    res.write(`data: ${JSON.stringify({ type: 'delta', content: fallback })}\n\n`);
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        conversation_id: prepared.conversationId,
        fallback: true,
        request_id: prepared.reqId,
        provider_error: mapped.code,
      })}\n\n`
    );
    res.end();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send fallback response for public/guest users.
 */
function sendPublicFallback(res, legacy, prepared, providerError) {
  const text = fallbackTextForPreset(prepared.preset);

  if (!CFG.fallbackEnabled) {
    if (legacy) {
      return res.status(providerError.status).json({
        error: providerError.userMessage,
        code: providerError.code,
        request_id: prepared.reqId,
      });
    }

    return respond(res, providerError.status, false, providerError.userMessage, {
      code: providerError.code,
      request_id: prepared.reqId,
    });
  }

  if (legacy) {
    return res.status(200).json({
      message: text,
      fallback: true,
      conversation_id: prepared.conversationId,
      request_id: prepared.reqId,
      provider_error: providerError.code,
    });
  }

  return respond(res, 200, true, 'Fallback response generated', {
    reply: text,
    fallback: true,
    conversation_id: prepared.conversationId,
    request_id: prepared.reqId,
    provider_error: providerError.code,
  });
}

/**
 * List conversations for current user.
 */
async function listConversations(req, res) {
  try {
    const support = await getTableSupport();
    if (!support.conversations) {
      return respond(
        res,
        503,
        false,
        'Conversation history table is missing. Run the latest migration.'
      );
    }

    const limit = clamp(toInt(req.query.limit, 20), 1, 100);
    const result = await query(
      `SELECT id, title, preset, is_archived, created_at, updated_at
       FROM ai_conversations
       WHERE school_id = $1 AND user_id = $2
       ORDER BY updated_at DESC
       LIMIT $3`,
      [req.user.schoolId, req.user.id, limit]
    );

    return respond(res, 200, true, 'Conversations retrieved', {
      conversations: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    log('error', 'list_conversations_failed', {
      code: error.code,
      message: sanitizeText(error.message, 200),
      userId: req.user?.id,
      schoolId: req.user?.schoolId,
    });

    return respond(res, 500, false, 'Failed to retrieve conversations');
  }
}

/**
 * List messages for one user-owned conversation.
 */
async function getConversationMessages(req, res) {
  try {
    const support = await getTableSupport();
    if (!support.conversations || !support.messages) {
      return respond(
        res,
        503,
        false,
        'Conversation message tables are missing. Run the latest migration.'
      );
    }

    const conversationId = sanitizeText(req.params.id, 80);
    if (!conversationId) return respond(res, 400, false, 'Conversation id is required');

    const owner = await query(
      `SELECT id
       FROM ai_conversations
       WHERE id = $1 AND school_id = $2 AND user_id = $3
       LIMIT 1`,
      [conversationId, req.user.schoolId, req.user.id]
    );

    if (!owner.rows.length) return respond(res, 404, false, 'Conversation not found');

    const limit = clamp(toInt(req.query.limit, 100), 1, 300);
    const result = await query(
      `SELECT id, role, content, model, prompt_tokens, completion_tokens, total_tokens, provider_status, created_at
       FROM ai_messages
       WHERE conversation_id = $1 AND school_id = $2
       ORDER BY created_at ASC
       LIMIT $3`,
      [conversationId, req.user.schoolId, limit]
    );

    return respond(res, 200, true, 'Conversation messages retrieved', {
      conversation_id: conversationId,
      messages: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    log('error', 'get_conversation_messages_failed', {
      code: error.code,
      message: sanitizeText(error.message, 200),
      userId: req.user?.id,
      schoolId: req.user?.schoolId,
      conversationId: sanitizeText(req.params?.id, 80),
    });

    return respond(res, 500, false, 'Failed to retrieve conversation messages');
  }
}

module.exports = {
  validateAiAssistantEnv,
  chat,
  streamChat,
  legacyChat,
  listConversations,
  getConversationMessages,
};
