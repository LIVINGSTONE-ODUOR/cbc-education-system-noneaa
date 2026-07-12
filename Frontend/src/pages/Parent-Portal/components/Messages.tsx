import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  AlertCircle,
  GraduationCap,
  Landmark,
  Inbox,
  Loader2,
} from 'lucide-react';
import {
  getMessageContacts,
  getMessages,
  getConversation,
  sendMessage,
  markMessageRead,
  MessageContact,
  DashboardMessage,
  ConversationMessage,
} from '@/lib/api/parentDashboardApi';

interface MessagesProps {
  learnerId: string;
  currentUserId: string;
  reloadKey?: string;
}

type Tab = 'teachers' | 'principal' | 'school';

const Messages: React.FC<MessagesProps> = ({ learnerId, currentUserId, reloadKey }) => {
  const [tab, setTab] = useState<Tab>('teachers');

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<MessageContact[]>([]);
  const [principal, setPrincipal] = useState<MessageContact | null>(null);
  const [selectedContact, setSelectedContact] = useState<MessageContact | null>(null);

  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [loadingInbox, setLoadingInbox] = useState(true);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<DashboardMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Contacts (Chat with teachers / Principal communication)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingContacts(true);
        setContactsError(null);
        const res = await getMessageContacts(learnerId);
        if (!cancelled) {
          setTeachers(res.data.teachers || []);
          setPrincipal(res.data.principal || null);
        }
      } catch (err: any) {
        if (!cancelled) setContactsError(err.message || 'Failed to load contacts');
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId, reloadKey]);

  // School messages (read-only inbox with reply capability)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingInbox(true);
        setInboxError(null);
        const res = await getMessages(30);
        if (!cancelled) setInbox(res.data.messages || []);
      } catch (err: any) {
        if (!cancelled) setInboxError(err.message || 'Failed to load school messages');
      } finally {
        if (!cancelled) setLoadingInbox(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loadConversation = async (contact: MessageContact) => {
    setSelectedContact(contact);
    setChatError(null);
    setLoadingConversation(true);
    try {
      const res = await getConversation(contact.user_id, learnerId);
      setConversation(res.data.messages || []);
    } catch (err: any) {
      setChatError(err.message || 'Failed to load conversation');
      setConversation([]);
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation]);

  const handleSend = async () => {
    if (!selectedContact || !draft.trim()) return;
    setSending(true);
    setChatError(null);
    try {
      const res = await sendMessage({
        recipient_user_id: selectedContact.user_id,
        learner_id: learnerId,
        body: draft.trim(),
      });
      setConversation((prev) => [...prev, res.data]);
      setDraft('');
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Reply from within the school inbox — turns any inbox message into a chat
  const handleReplyToInboxMessage = async (m: DashboardMessage) => {
    if (!m.sender) return;
    if (!m.is_read) {
      try {
        await markMessageRead(m.id);
      } catch {
        // non-fatal — read status is cosmetic here
      }
    }
    setTab(m.sender.role === 'teacher' ? 'teachers' : 'principal');
    await loadConversation({
      user_id: m.sender.id,
      name: `${m.sender.first_name} ${m.sender.last_name}`.trim(),
      role_label: m.sender.role === 'teacher' ? 'Teacher' : 'School Admin',
    });
  };

  const contactsForTab: MessageContact[] = useMemo(() => {
    if (tab === 'teachers') return teachers;
    if (tab === 'principal') return principal ? [principal] : [];
    return [];
  }, [tab, teachers, principal]);

  return (
    <Card id="messages-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Messages
        </CardTitle>
        <CardDescription>Chat with teachers, message the principal, and reply to school messages</CardDescription>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant={tab === 'teachers' ? 'default' : 'outline'} onClick={() => { setTab('teachers'); setSelectedContact(null); }}>
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            Chat with teachers
          </Button>
          <Button size="sm" variant={tab === 'principal' ? 'default' : 'outline'} onClick={() => { setTab('principal'); setSelectedContact(null); }}>
            <Landmark className="mr-1.5 h-3.5 w-3.5" />
            Principal
          </Button>
          <Button size="sm" variant={tab === 'school' ? 'default' : 'outline'} onClick={() => { setTab('school'); setSelectedContact(null); }}>
            <Inbox className="mr-1.5 h-3.5 w-3.5" />
            School messages
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {tab === 'school' ? (
          // School messages — inbox with the ability to reply to any message
          loadingInbox ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : inboxError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {inboxError}
            </div>
          ) : inbox.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No school messages yet.</p>
          ) : (
            <div className="space-y-2">
              {inbox.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={!m.is_read ? 'font-semibold' : ''}>{m.subject || 'No subject'}</p>
                      {!m.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="text-muted-foreground">
                      {m.sender ? `${m.sender.first_name} ${m.sender.last_name}` : 'Unknown sender'}
                      {m.sender?.role ? ` • ${m.sender.role.replace('_', ' ')}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{m.body}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => handleReplyToInboxMessage(m)}>
                    Reply
                  </Button>
                </div>
              ))}
            </div>
          )
        ) : (
          // Teachers / Principal — contact list + chat panel
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="space-y-1.5">
              {loadingContacts ? (
                <Skeleton className="h-24 w-full" />
              ) : contactsError ? (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> {contactsError}
                </p>
              ) : contactsForTab.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tab === 'principal' ? 'No principal on record yet.' : 'No teachers assigned yet.'}
                </p>
              ) : (
                contactsForTab.map((c) => (
                  <button
                    key={c.user_id}
                    type="button"
                    onClick={() => loadConversation(c)}
                    className={`w-full rounded-md border p-2.5 text-left text-sm transition-colors ${
                      selectedContact?.user_id === c.user_id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.role_label}</p>
                  </button>
                ))
              )}
            </div>

            <div className="flex min-h-[320px] flex-col rounded-md border">
              {!selectedContact ? (
                <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  Select a contact to start chatting.
                </div>
              ) : (
                <>
                  <div className="border-b p-3">
                    <p className="text-sm font-medium">{selectedContact.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedContact.role_label}</p>
                  </div>

                  <ScrollArea className="flex-1 p-3" style={{ maxHeight: 320 }}>
                    <div ref={scrollRef} className="space-y-2">
                      {loadingConversation ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : conversation.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                          No messages yet. Say hello!
                        </p>
                      ) : (
                        conversation.map((m) => {
                          const mine = m.sender_user_id === currentUserId;
                          return (
                            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                                  mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}
                              >
                                <p>{m.body}</p>
                                <p className={`mt-1 text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {new Date(m.created_at).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  {chatError && (
                    <p className="flex items-center gap-1 px-3 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" /> {chatError}
                    </p>
                  )}

                  <div className="flex items-end gap-2 border-t p-3">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="min-h-[40px] resize-none"
                      rows={1}
                    />
                    <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Messages;
