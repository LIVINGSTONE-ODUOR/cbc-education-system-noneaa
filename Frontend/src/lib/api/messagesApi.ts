/**
 * Messages API Service (teacher / student / school_admin)
 * Base: /api/v1/messages
 *
 * This talks to the general-purpose messaging endpoints that sit alongside
 * the Parent Portal's existing /api/v1/parent-dashboard messaging (which
 * stays as-is — see lib/api/parentDashboardApi.ts). Both read and write the
 * same `messages` table on the backend, so a teacher's reply here shows up
 * correctly inside a parent's existing chat thread, and vice versa.
 */

const getApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  return raw.replace(/\/api(?:\/v1)?\/?$/, '').replace(/\/+$/, '');
};

const API_URL = getApiUrl();
const BASE = `${API_URL}/api/v1/messages`;

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
    throw new Error(data.message || 'Messaging request failed');
  }
  return data.data as T;
};

export interface MessageContact {
  user_id: string;
  name: string;
  role_label: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface TeacherContactsResponse {
  students: MessageContact[];
  parents: MessageContact[];
  admins: MessageContact[];
  contacts: MessageContact[]; // all three, merged + sorted by recent activity
}

export interface StudentContactsResponse {
  teachers: MessageContact[];
  admins: MessageContact[];
  contacts: MessageContact[];
}

export interface AdminContactsResponse {
  teachers: MessageContact[];
  searchResults: MessageContact[];
  contacts: MessageContact[];
}

export interface ConversationMessage {
  id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_user_id: string;
  recipient_user_id: string;
  learner_id: string | null;
}

export interface InboxMessage {
  id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  learner_id: string | null;
  sender: { id: string; first_name: string; last_name: string; role: string } | null;
}

/** GET /api/v1/messages/contacts (teacher/student shape) */
export async function getContacts<T = TeacherContactsResponse | StudentContactsResponse>(): Promise<T> {
  const res = await fetch(`${BASE}/contacts`, { headers: jsonHeaders() });
  return handle<T>(res);
}

/** GET /api/v1/messages/contacts?search=name (school_admin only) */
export async function searchContacts(search: string): Promise<AdminContactsResponse> {
  const res = await fetch(`${BASE}/contacts?search=${encodeURIComponent(search)}`, { headers: jsonHeaders() });
  return handle<AdminContactsResponse>(res);
}

/** GET /api/v1/messages/conversation/:otherUserId?learner_id= */
export async function getConversation(
  otherUserId: string,
  learnerId?: string
): Promise<{ contact: { id: string; name: string; role: string }; messages: ConversationMessage[] }> {
  const url = learnerId
    ? `${BASE}/conversation/${otherUserId}?learner_id=${encodeURIComponent(learnerId)}`
    : `${BASE}/conversation/${otherUserId}`;
  const res = await fetch(url, { headers: jsonHeaders() });
  return handle(res);
}

/** POST /api/v1/messages */
export async function sendMessage(payload: {
  recipient_user_id: string;
  learner_id?: string;
  subject?: string;
  body: string;
}): Promise<ConversationMessage> {
  const res = await fetch(`${BASE}/`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  return handle<ConversationMessage>(res);
}

/** GET /api/v1/messages/inbox?limit=20 */
export async function getInbox(limit = 20): Promise<{ unread_count: number; messages: InboxMessage[] }> {
  const res = await fetch(`${BASE}/inbox?limit=${limit}`, { headers: jsonHeaders() });
  return handle(res);
}
