import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Megaphone, Send, Trash2, School, Users } from 'lucide-react';
import {
  getAnnouncements,
  createAnnouncement,
  deactivateAnnouncement,
  DashboardAnnouncement,
} from '@/lib/api/parentDashboardApi';
import { getClasses, ClassApiItem } from '@/lib/api/classApi';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetClassId, setTargetClassId] = useState<string>('school');
  const [category, setCategory] = useState<'general' | 'fee_reminder'>('general');
  const [isSending, setIsSending] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      const { data } = await getAnnouncements(50);
      setAnnouncements(data.announcements);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Could not load announcements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
    getClasses({ is_active: 'true', limit: 200 })
      .then(({ data }) => setClasses(data.classes))
      .catch((err) => console.error('Failed to load classes:', err));
  }, [loadAnnouncements]);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setIsSending(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        class_id: targetClassId === 'school' ? undefined : targetClassId,
        category,
      });
      toast.success('Announcement broadcast');
      setTitle('');
      setBody('');
      setTargetClassId('school');
      setCategory('general');
      loadAnnouncements();
    } catch (err) {
      console.error('Failed to broadcast announcement:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to broadcast announcement');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setDeactivatingId(id);
    try {
      await deactivateAnnouncement(id);
      toast.success('Announcement removed');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to deactivate announcement:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove announcement');
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Broadcast news and updates to the whole school or a single class.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            New Announcement
          </CardTitle>
          <CardDescription>Parents, teachers, and students will see this on their portals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              placeholder="e.g. Mid-term break dates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-body">Message</Label>
            <Textarea
              id="announcement-body"
              placeholder="Write the announcement..."
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">
                    <span className="flex items-center gap-2"><School className="h-4 w-4" /> Whole School</span>
                  </SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {c.grade_level}{c.stream_name ? ` - ${c.stream_name}` : ''}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as 'general' | 'fee_reminder')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="fee_reminder">Fee Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleBroadcast} disabled={isSending} className="w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Broadcasting...' : 'Broadcast Announcement'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Announcements</CardTitle>
          <CardDescription>{announcements.length} broadcast{announcements.length === 1 ? '' : 's'}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{a.title}</h3>
                      <Badge variant={a.class_id ? 'secondary' : 'outline'}>
                        {a.class_id
                          ? a.classes
                            ? `${a.classes.grade_level}${a.classes.stream_name ? ` - ${a.classes.stream_name}` : ''}`
                            : 'Class'
                          : 'Whole School'}
                      </Badge>
                      {a.category === 'fee_reminder' && <Badge variant="destructive">Fee Reminder</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">{timeAgo(a.created_at)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(a.id)}
                    disabled={deactivatingId === a.id}
                    title="Remove announcement"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
