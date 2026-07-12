/**
 * Live Chat API Service
 * Public endpoints are used by the AI assistant widget (no auth).
 * Agent endpoints are used by the staff live-chat inbox (JWT auth).
 * Base: /api/v1/live-chat
 */

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
const BASE = `${API_URL}/api/v1/live-chat`;

const getAuthToken = (): string | null => localStorage.getItem('cbe_access_token');

const jsonHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handle = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Live chat request failed');
  }
  return data.data as T;
};

export interface LiveChatMessage {
  id: string;
  sender_type: 'visitor' | 'ai' | 'agent' | 'system';
  sender_name: string | null;
  content: string;
  created_at: string;
}

export interface LiveChatConversationSummary {
  id: string;
  status: 'ai' | 'escalated' | 'closed';
  visitor_label: string | null;
  page_url: string | null;
  assigned_agent_id: string | null;
  assigned_agent_name: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
}

// ── Public (widget) ──

export async function startConversation(pageUrl?: string): Promise<{ id: string; status: string; created_at: string }> {
  const res = await fetch(`${BASE}/start`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ pageUrl }),
  });
  return handle(res);
}

export async function sendVisitorMessage(conversationId: string, content: string): Promise<{ escalated: boolean }> {
  const res = await fetch(`${BASE}/${conversationId}/message`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ content }),
  });
  return handle(res);
}

export async function escalateConversation(conversationId: string): Promise<{ escalated: boolean }> {
  const res = await fetch(`${BASE}/${conversationId}/escalate`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  return handle(res);
}

export async function getMessages(conversationId: string, after?: string): Promise<{ messages: LiveChatMessage[] }> {
  const url = after
    ? `${BASE}/${conversationId}/messages?after=${encodeURIComponent(after)}`
    : `${BASE}/${conversationId}/messages`;
  const res = await fetch(url, { headers: jsonHeaders() });
  return handle(res);
}

// ── Agent (protected) ──

export async function getInbox(): Promise<{ conversations: LiveChatConversationSummary[] }> {
  const res = await fetch(`${BASE}/inbox`, { headers: jsonHeaders() });
  return handle(res);
}

export async function claimConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE}/${conversationId}/claim`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  await handle(res);
}

export async function sendAgentReply(conversationId: string, content: string): Promise<void> {
  const res = await fetch(`${BASE}/${conversationId}/reply`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ content }),
  });
  await handle(res);
}

export async function closeConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE}/${conversationId}/close`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  await handle(res);
}
