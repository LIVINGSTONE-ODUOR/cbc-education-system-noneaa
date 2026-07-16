import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, Send, MailOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMessages,
  markMessageRead,
  sendMessage,
  getConversation,
  DashboardMessage,
  ConversationMessage,
} from '@/lib/api/parentDashboardApi';

const POLL_MS = 15000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

const ROLE_LABEL: Record<string, string> = {
  parent: 'Parent',
  student: 'Student',
  teacher: 'Teacher',
  school_admin: 'Admin',
};

export default function MessagesInboxPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<DashboardMessage | null>(null);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadInbox = useCallback(async () => {
    try {
      const { data } = await getMessages(100);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, POLL_MS);
    return () => clearInterval(interval);
  }, [loadInbox]);

  const openThread = useCallback(
    async (msg: DashboardMessage) => {
      setSelected(msg);
      if (!msg.sender || !msg.learner) {
        setThread([]);
        return;
      }
      try {
        const { data } = await getConversation(msg.sender.id, msg.learner.id);
        setThread(data.messages);
        if (!msg.is_read) {
          await markMessageRead(msg.id);
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
        toast.error('Could not load this conversation');
      }
    },
    []
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleReply = async () => {
    if (!reply.trim() || !selected?.sender || !selected.learner) return;
    setIsSending(true);
    try {
      const { data: sent } = await sendMessage({
        recipient_user_id: selected.sender.id,
        learner_id: selected.learner.id,
        subject: selected.subject || undefined,
        body: reply.trim(),
      });
      setThread((prev) => [...prev, { ...sent, sender_user_id: user?.id || '' }]);
      setReply('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Read and reply to messages from students, teachers, and parents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <Inbox className="h-4 w-4" /> Inbox
            </span>
            {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
          </div>
          <ScrollArea className="h-[60vh]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No messages yet.</p>
            ) : (
              messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openThread(m)}
                  className={`w-full text-left p-4 border-b hover:bg-accent transition-colors ${
                    selected?.id === m.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">
                      {m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Unknown sender'}
                    </span>
                    {!m.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.sender && (
                      <Badge variant="outline" className="text-[10px]">
                        {ROLE_LABEL[m.sender.role] || m.sender.role}
                      </Badge>
                    )}
                    {m.learner && (
                      <span className="text-xs text-muted-foreground truncate">
                        re: {m.learner.first_name} {m.learner.last_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">{m.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(m.created_at)}</p>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-10 text-center">
              <div>
                <MailOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Select a message to read the full conversation.
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b">
                <p className="font-medium">
                  {selected.sender ? `${selected.sender.first_name} ${selected.sender.last_name}` : 'Unknown sender'}
                </p>
                {selected.subject && <p className="text-sm text-muted-foreground">{selected.subject}</p>}
              </div>
              <ScrollArea className="flex-1 h-[42vh] p-4">
                <div className="space-y-3">
                  {thread.map((t) => (
                    <div
                      key={t.id}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        t.sender_user_id === user?.id
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p>{t.body}</p>
                      <p className="text-[10px] opacity-70 mt-1">{timeAgo(t.created_at)}</p>
                    </div>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t flex gap-2">
                <Textarea
                  placeholder="Type a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <Button onClick={handleReply} disabled={isSending || !reply.trim()} size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
