import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, AlertCircle, Loader2, Users, Landmark, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getContacts,
  getConversation,
  sendMessage,
  MessageContact,
  ConversationMessage,
  TeacherContactsResponse,
} from '@/lib/api/messagesApi';

type Tab = 'students' | 'parents' | 'admins';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const [tab, setTab] = useState<Tab>('parents');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [data, setData] = useState<TeacherContactsResponse>({ students: [], parents: [], admins: [], contacts: [] });

  const [selectedContact, setSelectedContact] = useState<MessageContact | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      setContactsError(null);
      const res = await getContacts<TeacherContactsResponse>();
      setData(res);
    } catch (err: any) {
      setContactsError(err.message || 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversation = async (contact: MessageContact) => {
    setSelectedContact(contact);
    setChatError(null);
    setLoadingConversation(true);
    try {
      const res = await getConversation(contact.user_id);
      setConversation(res.messages || []);
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
      const sent = await sendMessage({ recipient_user_id: selectedContact.user_id, body: draft.trim() });
      setConversation((prev) => [...prev, sent]);
      setDraft('');
      loadContacts(); // refresh unread counts / previews in the background
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const contactsForTab: MessageContact[] = useMemo(() => {
    if (tab === 'students') return data.students;
    if (tab === 'parents') return data.parents;
    return data.admins;
  }, [tab, data]);

  const totalUnread = data.contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Messages
          {totalUnread > 0 && <Badge className="ml-1">{totalUnread} unread</Badge>}
        </CardTitle>
        <CardDescription>Chat with your students, their parents, and the school admin.</CardDescription>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant={tab === 'parents' ? 'default' : 'outline'} onClick={() => { setTab('parents'); setSelectedContact(null); }}>
            <Users className="mr-1.5 h-3.5 w-3.5" /> Parents
          </Button>
          <Button size="sm" variant={tab === 'students' ? 'default' : 'outline'} onClick={() => { setTab('students'); setSelectedContact(null); }}>
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> Students
          </Button>
          <Button size="sm" variant={tab === 'admins' ? 'default' : 'outline'} onClick={() => { setTab('admins'); setSelectedContact(null); }}>
            <Landmark className="mr-1.5 h-3.5 w-3.5" /> School Admin
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <div className="space-y-1.5">
            {loadingContacts ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : contactsError ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {contactsError}
              </p>
            ) : contactsForTab.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tab === 'students' && 'No students found in your classes.'}
                {tab === 'parents' && 'No parents found for your students.'}
                {tab === 'admins' && 'No school admin on record yet.'}
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{c.name}</p>
                    {c.unread_count > 0 && (
                      <Badge className="h-5 min-w-5 shrink-0 px-1.5 flex items-center justify-center">{c.unread_count}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.role_label}</p>
                  {c.last_message && <p className="mt-0.5 text-xs text-muted-foreground truncate">{c.last_message}</p>}
                </button>
              ))
            )}
          </div>

          <div className="flex min-h-[380px] flex-col rounded-md border">
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

                <ScrollArea className="flex-1 p-3" style={{ maxHeight: 380 }}>
                  <div ref={scrollRef} className="space-y-2">
                    {loadingConversation ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : conversation.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
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
      </CardContent>
    </Card>
  );
};

export default Messages;
