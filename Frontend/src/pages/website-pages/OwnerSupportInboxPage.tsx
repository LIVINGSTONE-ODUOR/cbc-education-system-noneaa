import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Headset, Send, Check, X as CloseIcon, LogOut, FileText } from 'lucide-react';
import { useBlog } from '@/contexts/BlogContext';
import {
  getInbox,
  claimConversation,
  sendAgentReply,
  closeConversation,
  getMessages,
  LiveChatConversationSummary,
  LiveChatMessage,
} from '@/lib/api/liveChatApi';

const INBOX_POLL_MS = 5000;
const THREAD_POLL_MS = 3000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function OwnerSupportInboxPage() {
  const { isOwnerAuthenticated, ownerLogout } = useBlog();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<LiveChatConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInbox = useCallback(async () => {
    try {
      const { conversations: list } = await getInbox();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load live chat inbox:', err);
    }
  }, []);

  useEffect(() => {
    if (!isOwnerAuthenticated) return;
    loadInbox();
    const interval = setInterval(loadInbox, INBOX_POLL_MS);
    return () => clearInterval(interval);
  }, [isOwnerAuthenticated, loadInbox]);

  const loadThread = useCallback(async () => {
    if (!selectedId) return;
    try {
      const { messages: msgs } = await getMessages(selectedId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load conversation thread:', err);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    loadThread();
    const interval = setInterval(loadThread, THREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [selectedId, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOwnerAuthenticated) {
    return <Navigate to="/owner/login" replace />;
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  const handleClaim = async () => {
    if (!selectedId) return;
    try {
      await claimConversation(selectedId);
      await loadInbox();
    } catch (err) {
      console.error('Failed to claim conversation:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendAgentReply(selectedId, reply.trim());
      setReply('');
      await loadThread();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!selectedId) return;
    try {
      await closeConversation(selectedId);
      setSelectedId(null);
      await loadInbox();
    } catch (err) {
      console.error('Failed to close conversation:', err);
    }
  };

  const handleLogout = () => {
    ownerLogout();
    navigate('/owner/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Headset className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Support Inbox</h1>
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full border border-green-800/30">
              Owner Access
            </span>
            <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full border border-blue-800/30">
              {conversations.length} waiting
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/owner/blog-admin')}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white text-sm transition"
            >
              <FileText className="w-4 h-4" />
              Blog Manager
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-lg text-sm transition border border-red-800/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 min-h-0">
        <div className="h-[calc(100vh-11rem)] grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 min-h-0">
          {/* Conversation list */}
          <div className="border border-gray-800 rounded-lg overflow-y-auto bg-gray-900">
            {conversations.length === 0 && (
              <div className="p-6 text-sm text-gray-500 text-center">
                No conversations waiting for a human right now.
              </div>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800/60 transition-colors ${
                  selectedId === conv.id ? 'bg-gray-800/60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {conv.visitor_label || `Visitor ${conv.id.slice(0, 6)}`}
                  </span>
                  <span className="text-[10px] text-gray-500">{timeAgo(conv.updated_at)}</span>
                </div>
                <div className="text-xs text-gray-400 truncate mt-1">
                  {conv.last_message || 'No messages yet'}
                </div>
                {conv.assigned_agent_name && (
                  <div className="text-[10px] text-blue-400 mt-1">Claimed by {conv.assigned_agent_name}</div>
                )}
              </button>
            ))}
          </div>

          {/* Selected thread */}
          <div className="border border-gray-800 rounded-lg flex flex-col bg-gray-900 min-h-0">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Select a conversation to view the transcript
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {selectedConversation.visitor_label || `Visitor ${selectedConversation.id.slice(0, 6)}`}
                    </div>
                    <div className="text-xs text-gray-500">{selectedConversation.page_url || 'Unknown page'}</div>
                  </div>
                  <div className="flex gap-2">
                    {!selectedConversation.assigned_agent_id && !selectedConversation.assigned_agent_name && (
                      <button
                        onClick={handleClaim}
                        className="flex items-center gap-1 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Claim
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="flex items-center gap-1 text-xs font-semibold border border-gray-700 text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <CloseIcon className="w-3.5 h-3.5" /> Close
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                          m.sender_type === 'agent'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : m.sender_type === 'system'
                            ? 'bg-gray-800 text-gray-400 italic'
                            : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {m.sender_name && m.sender_type !== 'system' && (
                          <div className="text-[10px] opacity-70 mb-0.5">{m.sender_name}</div>
                        )}
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2 p-3 border-t border-gray-800">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a reply…"
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim() || isSending}
                    className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
