import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, X, LogOut, Trash2, Send, ArrowLeft } from 'lucide-react';
import {
  getStudyGroups,
  createStudyGroup,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  getGroupMessages,
  postGroupMessage,
  type StudyGroup,
  type StudyGroupMember,
  type StudyGroupMessage,
} from '@/lib/api/studyGroupApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const PeerStudyGroups: React.FC = () => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [creating, setCreating] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const refreshGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudyGroups();
      setGroups(res.data.groups || []);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load study groups.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGroups();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createStudyGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        max_members: maxMembers ? Number(maxMembers) : undefined,
      });
      setName('');
      setDescription('');
      setMaxMembers('10');
      setShowCreate(false);
      await refreshGroups();
    } catch (e) {
      alert(getErrorMessage(e, 'Could not create the study group.'));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      await joinStudyGroup(groupId);
      await refreshGroups();
    } catch (e) {
      alert(getErrorMessage(e, 'Could not join the study group.'));
    }
  };

  if (selectedGroupId) {
    return (
      <GroupDetail
        groupId={selectedGroupId}
        onBack={() => setSelectedGroupId(null)}
        onChanged={refreshGroups}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Peer Study Groups
          </CardTitle>
          <CardDescription>Form or join a study group with your classmates.</CardDescription>
        </div>
        {!showCreate && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New group
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate && (
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">New study group</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="group-name">Group name</Label>
              <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chemistry Revision Squad" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="group-description">What's this group for?</Label>
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. Preparing together for the chemistry midterm"
              />
            </div>
            <div className="space-y-1 max-w-[140px]">
              <Label htmlFor="group-max">Max members</Label>
              <Input
                id="group-max"
                type="number"
                min={2}
                max={50}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? 'Creating...' : 'Create group'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : groups.length === 0 && !showCreate ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No study groups in your class yet — start one.
          </p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <button
                  className="min-w-0 text-left flex-1"
                  onClick={() => setSelectedGroupId(g.id)}
                >
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {g.learning_areas?.name ? `${g.learning_areas.name} · ` : ''}
                    {g.member_count}/{g.max_members} members
                    {g.creator ? ` · started by ${g.creator.first_name} ${g.creator.last_name}` : ''}
                  </p>
                </button>
                {g.is_member ? (
                  <Button size="sm" variant="outline" onClick={() => setSelectedGroupId(g.id)}>
                    Open
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleJoin(g.id)}
                    disabled={g.member_count >= g.max_members}
                  >
                    {g.member_count >= g.max_members ? 'Full' : 'Join'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Group detail — members list + shared message feed for coordinating.
// ---------------------------------------------------------------------------

const GroupDetail: React.FC<{ groupId: string; onBack: () => void; onChanged: () => void }> = ({
  groupId,
  onBack,
  onChanged,
}) => {
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<StudyGroupMember[]>([]);
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [detailRes, messagesRes] = await Promise.all([getStudyGroup(groupId), getGroupMessages(groupId)]);
      setGroup(detailRes.data.group);
      setMembers(detailRes.data.members || []);
      setMessages(messagesRes.data.messages || []);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load this group.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await postGroupMessage(groupId, draft.trim());
      setMessages((prev) => [...prev, res.data.message]);
      setDraft('');
    } catch (e) {
      alert(getErrorMessage(e, 'Could not send that message.'));
    } finally {
      setSending(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this study group?')) return;
    try {
      await leaveStudyGroup(groupId);
      onChanged();
      onBack();
    } catch (e) {
      alert(getErrorMessage(e, 'Could not leave the group.'));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this group for everyone? This cannot be undone.')) return;
    try {
      await deleteStudyGroup(groupId);
      onChanged();
      onBack();
    } catch (e) {
      alert(getErrorMessage(e, 'Could not delete the group.'));
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to groups
        </Button>
        {loading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>{group?.name}</CardTitle>
              {group?.description && <CardDescription>{group.description}</CardDescription>}
            </div>
            {group?.my_role === 'owner' ? (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete group
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLeave}>
                <LogOut className="h-4 w-4 mr-1" /> Leave
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Members ({members.length}/{group?.max_members})
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <span key={m.id} className="text-xs rounded-full border px-2.5 py-1">
                    {m.learners?.first_name} {m.learners?.last_name}
                    {m.role === 'owner' ? ' · owner' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="border rounded-md">
              <div className="h-64 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet — say hello to your group.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="font-medium">{m.learners?.first_name}: </span>
                      <span>{m.message}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(m.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t p-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Message your group..."
                />
                <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {!loading && !error && (
        <CardFooter>
          <p className="text-xs text-muted-foreground">Visible to group members only.</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default PeerStudyGroups;
