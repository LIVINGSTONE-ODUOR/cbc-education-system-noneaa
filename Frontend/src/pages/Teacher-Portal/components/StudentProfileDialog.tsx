import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UserRound, Phone, Mail, HeartPulse, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getStudentProfile,
  addStudentNote,
  type StudentProfile as StudentProfileData,
} from '@/lib/api/teacherApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const categoryBadge: Record<string, string> = {
  minor: 'bg-amber-100 text-amber-700',
  major: 'bg-red-100 text-red-700',
  commendation: 'bg-green-100 text-green-700',
};

const attendanceBadge: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-amber-100 text-amber-700',
  absent: 'bg-red-100 text-red-700',
  excused: 'bg-blue-100 text-blue-700',
};

interface StudentProfileDialogProps {
  learnerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentProfileDialog: React.FC<StudentProfileDialogProps> = ({ learnerId, open, onOpenChange }) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteType, setNoteType] = useState<'comment' | 'teacher_note'>('teacher_note');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (!open || !learnerId) return;
    setLoading(true);
    setProfile(null);
    (async () => {
      try {
        const res = await getStudentProfile(learnerId);
        setProfile(res.data);
      } catch (error) {
        toast({
          title: 'Could not load student profile',
          description: getErrorMessage(error, 'Please try again.'),
          variant: 'destructive',
        });
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, learnerId]);

  const handleAddNote = async () => {
    if (!learnerId || !noteContent.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await addStudentNote(learnerId, noteType, noteContent.trim());
      setProfile((prev) =>
        prev ? { ...prev, notes: [{ ...res.data, author: 'You' }, ...prev.notes] } : prev
      );
      setNoteContent('');
      toast({ title: noteType === 'comment' ? 'Comment added' : 'Note saved' });
    } catch (error) {
      toast({
        title: 'Could not save note',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        {loading || !profile ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Loading profile...</span>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0">
                  {profile.photo ? (
                    <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserRound className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl">{profile.name}</DialogTitle>
                  <DialogDescription>
                    Admission No. {profile.admission_number}
                    {profile.attendance.rate !== null && (
                      <> · {profile.attendance.rate}% attendance</>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="discipline">Discipline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-4">
                {/* Overview: parents + medical info */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div>
                    <h4 className="font-semibold mb-2">Parents / Guardians</h4>
                    {profile.parents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No parent contact on file.</p>
                    ) : (
                      <div className="space-y-3">
                        {profile.parents.map((p, i) => (
                          <div key={i} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-center gap-2 font-medium">
                              {p.name || 'Unnamed guardian'}
                              {p.is_primary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                              {p.relationship && (
                                <span className="text-muted-foreground font-normal">({p.relationship})</span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-col gap-1 text-muted-foreground">
                              {p.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" /> {p.phone}
                                </span>
                              )}
                              {p.email && (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="h-3.5 w-3.5" /> {p.email}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" /> Medical Info
                    </h4>
                    <div className="rounded-lg border p-3 text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground">Conditions: </span>
                        {profile.medical.conditions || 'None recorded'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Allergies: </span>
                        {profile.medical.allergies || 'None recorded'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Special needs: </span>
                        {profile.medical.special_needs || 'None recorded'}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Attendance history */}
                <TabsContent value="attendance" className="mt-0">
                  {profile.attendance.history.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No attendance records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.attendance.history.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                          <span>{new Date(r.attendance_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <div className="flex items-center gap-2">
                            {r.remarks && <span className="text-muted-foreground text-xs">{r.remarks}</span>}
                            <Badge className={`${attendanceBadge[r.status] || ''} hover:${attendanceBadge[r.status] || ''} capitalize`}>
                              {r.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Academic history */}
                <TabsContent value="academic" className="mt-0">
                  {profile.academic_history.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No exam results recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.academic_history.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                          <div>
                            <div className="font-medium">{r.subject}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.exam_name}{r.date ? ` · ${new Date(r.date).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          <span
                            className={`font-bold text-sm ${
                              r.score_percent >= 80 ? 'text-green-600' :
                              r.score_percent >= 70 ? 'text-blue-600' :
                              r.score_percent >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}
                          >
                            {r.score_percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Discipline records */}
                <TabsContent value="discipline" className="mt-0">
                  {profile.discipline.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No discipline records.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.discipline.map((d) => (
                        <div key={d.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <Badge className={`${categoryBadge[d.category]} hover:${categoryBadge[d.category]} capitalize`}>
                              {d.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(d.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-2">{d.description}</p>
                          {d.action_taken && (
                            <p className="mt-1 text-muted-foreground">
                              <span className="font-medium">Action taken: </span>{d.action_taken}
                            </p>
                          )}
                          {d.recorded_by && (
                            <p className="mt-1 text-xs text-muted-foreground">Recorded by {d.recorded_by}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Comments & teacher notes */}
                <TabsContent value="notes" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write a comment or private note..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={noteType === 'teacher_note' ? 'default' : 'outline'}
                          onClick={() => setNoteType('teacher_note')}
                        >
                          Teacher note (private)
                        </Button>
                        <Button
                          size="sm"
                          variant={noteType === 'comment' ? 'default' : 'outline'}
                          onClick={() => setNoteType('comment')}
                        >
                          Comment
                        </Button>
                      </div>
                      <Button size="sm" onClick={handleAddNote} disabled={!noteContent.trim() || submittingNote}>
                        {submittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {profile.notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No comments or notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.notes.map((n) => (
                        <div key={n.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {n.note_type === 'comment' ? 'Comment' : 'Teacher note'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {n.author} · {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p>{n.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileDialog;
