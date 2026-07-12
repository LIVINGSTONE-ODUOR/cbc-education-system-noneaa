import { useState, useEffect, useRef, useCallback } from 'react';
import { Headset, Send, Check, X as CloseIcon } from 'lucide-react';
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

export default function LiveChatInbox() {
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
    loadInbox();
    const interval = setInterval(loadInbox, INBOX_POLL_MS);
    return () => clearInterval(interval);
  }, [loadInbox]);

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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Headset className="w-5 h-5 text-[#1E3A28]" />
        <h1 className="text-xl font-bold text-[#1C1C1C]">Live chat</h1>
        <span className="text-xs bg-[#9C7A3C]/15 text-[#6b5228] px-2 py-0.5 rounded-full">
          {conversations.length} waiting
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* Conversation list */}
        <div className="border border-[#9C7A3C]/20 rounded-lg overflow-y-auto bg-white">
          {conversations.length === 0 && (
            <div className="p-6 text-sm text-[#4A4A44]/70 text-center">
              No conversations waiting for a human right now.
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full text-left px-4 py-3 border-b border-[#9C7A3C]/10 hover:bg-[#F6F1E7] transition-colors ${
                selectedId === conv.id ? 'bg-[#F6F1E7]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1C1C1C]">
                  {conv.visitor_label || `Visitor ${conv.id.slice(0, 6)}`}
                </span>
                <span className="text-[10px] text-[#4A4A44]/60">{timeAgo(conv.updated_at)}</span>
              </div>
              <div className="text-xs text-[#4A4A44]/70 truncate mt-1">
                {conv.last_message || 'No messages yet'}
              </div>
              {conv.assigned_agent_name && (
                <div className="text-[10px] text-[#1E3A28] mt-1">Claimed by {conv.assigned_agent_name}</div>
              )}
            </button>
          ))}
        </div>

        {/* Selected thread */}
        <div className="border border-[#9C7A3C]/20 rounded-lg flex flex-col bg-white min-h-0">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#4A4A44]/60">
              Select a conversation to view the transcript
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#9C7A3C]/20">
                <div>
                  <div className="text-sm font-semibold text-[#1C1C1C]">
                    {selectedConversation.visitor_label || `Visitor ${selectedConversation.id.slice(0, 6)}`}
                  </div>
                  <div className="text-xs text-[#4A4A44]/60">{selectedConversation.page_url || 'Unknown page'}</div>
                </div>
                <div className="flex gap-2">
                  {!selectedConversation.assigned_agent_id && (
                    <button
                      onClick={handleClaim}
                      className="flex items-center gap-1 text-xs font-semibold bg-[#1E3A28] text-white px-3 py-1.5 rounded-md hover:bg-[#173420] transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Claim
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1 text-xs font-semibold border border-[#9C7A3C]/30 text-[#1C1C1C] px-3 py-1.5 rounded-md hover:bg-[#F6F1E7] transition-colors"
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
                          ? 'bg-[#1E3A28] text-white rounded-br-sm'
                          : m.sender_type === 'system'
                          ? 'bg-[#9C7A3C]/10 text-[#6b5228] italic'
                          : 'bg-[#F6F1E7] border border-[#9C7A3C]/20 text-[#1C1C1C] rounded-bl-sm'
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

              <form onSubmit={handleSendReply} className="flex gap-2 p-3 border-t border-[#9C7A3C]/20">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  className="flex-1 px-3 py-2 text-sm border border-[#9C7A3C]/30 rounded-md focus:outline-none focus:border-[#1E3A28]"
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || isSending}
                  className="w-10 h-10 flex items-center justify-center bg-[#1E3A28] hover:bg-[#173420] disabled:bg-[#9C7A3C]/40 text-white rounded-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
