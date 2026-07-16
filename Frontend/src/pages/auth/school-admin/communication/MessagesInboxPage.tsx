import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, Send, MailOpen, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getContacts,
  searchContacts,
  getConversation,
  sendMessage,
  MessageContact,
  ConversationMessage,
  AdminContactsResponse,
} from '@/lib/api/messagesApi';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MessagesInboxPage() {
  const { user } = useAuth();

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [data, setData] = useState<AdminContactsResponse>({ teachers: [], searchResults: [], contacts: [] });

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<MessageContact | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      setContactsError(null);
      const res = await getContacts<AdminContactsResponse>();
      setData((prev) => ({ ...res, searchResults: prev.searchResults }));
    } catch (err) {
      setContactsError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Debounced search for parents/students to start a new conversation with.
  useEffect(() => {
    if (search.trim().length < 2) {
      setData((prev) => ({ ...prev, searchResults: [] }));
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await searchContacts(search.trim());
        setData((prev) => ({ ...prev, searchResults: res.searchResults }));
      } catch {
        // non-fatal — search is best-effort
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [search]);

  const openThread = useCallback(async (contact: MessageContact) => {
    setSelected(contact);
    setLoadingThread(true);
    try {
      const res = await getConversation(contact.user_id);
      setThread(res.messages || []);
      // Refresh contacts in the background so unread badges/preview stay current.
      loadContacts();
    } catch (err) {
      console.error('Failed to load conversation:', err);
      toast.error('Could not load this conversation');
    } finally {
      setLoadingThread(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setIsSending(true);
    try {
      const sent = await sendMessage({ recipient_user_id: selected.user_id, body: reply.trim() });
      setThread((prev) => [...prev, sent]);
      setReply('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = data.contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const showingSearch = search.trim().length >= 2;
  const listItems: MessageContact[] = showingSearch ? data.searchResults : data.contacts;

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
          <div className="p-4 border-b space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Inbox className="h-4 w-4" /> Inbox
              </span>
              {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parents or students to message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[60vh]">
            {loadingContacts ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Loading...</p>
            ) : contactsError ? (
              <p className="text-sm text-destructive p-4 text-center">{contactsError}</p>
            ) : showingSearch && searching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching...
              </div>
            ) : listItems.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                {showingSearch ? 'No matching parents or students.' : 'No messages yet.'}
              </p>
            ) : (
              listItems.map((c) => (
                <button
                  key={c.user_id}
                  onClick={() => openThread(c)}
                  className={`w-full text-left p-4 border-b hover:bg-accent transition-colors ${
                    selected?.user_id === c.user_id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.unread_count > 0 && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{c.role_label}</Badge>
                  {c.last_message && <p className="text-sm text-muted-foreground truncate mt-1">{c.last_message}</p>}
                  {c.last_message_at && <p className="text-xs text-muted-foreground mt-1">{timeAgo(c.last_message_at)}</p>}
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
                Select a conversation, or search above to message a parent or student.
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b">
                <p className="font-medium">{selected.name}</p>
                <p className="text-sm text-muted-foreground">{selected.role_label}</p>
              </div>
              <ScrollArea className="flex-1 h-[42vh] p-4">
                <div className="space-y-3">
                  {loadingThread ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : thread.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
                  ) : (
                    thread.map((t) => (
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
                    ))
                  )}
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
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
