import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Search, MessageSquare } from 'lucide-react';

// TODO: replace with real API once /messages backend exists.
// Shape mirrors what a GET /api/v1/messages/threads endpoint would likely return,
// so swapping the mock data source for a fetch() call later is a small change.

type AudienceType = 'parent' | 'student' | 'principal' | 'teacher';

interface Thread {
  id: string;
  name: string;
  audience: AudienceType;
  lastMessage: string;
  lastTimestamp: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  timestamp: string;
}

const AUDIENCE_LABEL: Record<AudienceType, string> = {
  parent: 'Parent',
  student: 'Student',
  principal: 'Principal',
  teacher: 'Teacher',
};

const MOCK_THREADS: Thread[] = [
  { id: 't1', name: 'Mrs. Wanjiku (Parent of Aisha K.)', audience: 'parent', lastMessage: 'Thank you, I will follow up at home.', lastTimestamp: '9:12 AM', unread: 2 },
  { id: 't2', name: 'Principal Otieno', audience: 'principal', lastMessage: 'Please submit Grade 6 marksheet by Friday.', lastTimestamp: 'Yesterday', unread: 1 },
  { id: 't3', name: 'Brian Mwangi (Student)', audience: 'student', lastMessage: 'Sir, can I get extra time for the assignment?', lastTimestamp: 'Yesterday', unread: 0 },
  { id: 't4', name: 'Mr. Kiptoo (Math dept.)', audience: 'teacher', lastMessage: 'Sharing the revision worksheet, take a look.', lastTimestamp: 'Mon', unread: 0 },
  { id: 't5', name: 'Mr. & Mrs. Odhiambo (Parents)', audience: 'parent', lastMessage: 'Noted, thank you for the update.', lastTimestamp: 'Mon', unread: 0 },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  t1: [
    { id: 'm1', fromMe: false, text: 'Good morning, how is Aisha doing in class this week?', timestamp: '8:50 AM' },
    { id: 'm2', fromMe: true, text: 'Good morning! She has improved a lot in Math, but needs more practice in Kiswahili composition.', timestamp: '9:05 AM' },
    { id: 'm3', fromMe: false, text: 'Thank you, I will follow up at home.', timestamp: '9:12 AM' },
  ],
  t2: [
    { id: 'm1', fromMe: false, text: 'Please submit Grade 6 marksheet by Friday.', timestamp: 'Yesterday' },
  ],
};

const AUDIENCE_FILTERS: Array<{ label: string; value: 'all' | AudienceType }> = [
  { label: 'All', value: 'all' },
  { label: 'Parents', value: 'parent' },
  { label: 'Students', value: 'student' },
  { label: 'Principal', value: 'principal' },
  { label: 'Other teachers', value: 'teacher' },
];

const Messages: React.FC = () => {
  const [threads] = useState<Thread[]>(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>(MOCK_THREADS[0].id);
  const [audienceFilter, setAudienceFilter] = useState<'all' | AudienceType>('all');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>(MOCK_MESSAGES.t1 || []);

  const filteredThreads = threads.filter((t) => {
    const matchesAudience = audienceFilter === 'all' || t.audience === audienceFilter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesAudience && matchesSearch;
  });

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const openThread = (id: string) => {
    setActiveThreadId(id);
    setConversation(MOCK_MESSAGES[id] || []);
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    setConversation((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, fromMe: true, text: draft.trim(), timestamp: 'Just now' },
    ]);
    // TODO: POST /api/v1/messages/threads/:id  { text }
    setDraft('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Messages
        </CardTitle>
        <CardDescription>Chat with parents, students, the principal, and other teachers — like WhatsApp, inside the school system.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[520px]">
          {/* Thread list */}
          <div className="md:col-span-1 border rounded-md flex flex-col overflow-hidden">
            <div className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={audienceFilter} onValueChange={(v) => setAudienceFilter(v as 'all' | AudienceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No conversations found.</p>
              ) : (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => openThread(thread.id)}
                    className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                      activeThreadId === thread.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{thread.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[11px] text-muted-foreground">{thread.lastTimestamp}</span>
                        {thread.unread > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center">{thread.unread}</Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px]">{AUDIENCE_LABEL[thread.audience]}</Badge>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="md:col-span-2 border rounded-md flex flex-col overflow-hidden">
            {activeThread ? (
              <>
                <div className="p-3 border-b">
                  <p className="font-semibold">{activeThread.name}</p>
                  <p className="text-xs text-muted-foreground">{AUDIENCE_LABEL[activeThread.audience]}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {conversation.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hello!</p>
                  ) : (
                    conversation.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            msg.fromMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${msg.fromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Select a conversation.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Messages;
