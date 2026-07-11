import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Plus,
  Paperclip,
  FileText,
  Trash2,
  Users,
  CalendarClock,
  Save,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClassSelectSkeleton, ListBlockSkeleton } from './skeletons';
import { getMyClasses, type MyClassAssignment } from '@/lib/api/teacherApi';
import {
  createAssignment,
  getAssignments,
  deleteAssignment,
  getSubmissions,
  gradeSubmission,
  type Assignment,
  type SubmissionRow,
} from '@/lib/api/assignmentApi';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const formatClassName = (cls: MyClassAssignment['class']) =>
  cls ? `Grade ${cls.grade_level}${cls.stream_name ? cls.stream_name : ''}` : 'Unknown Class';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const statusStyles: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  late: 'bg-amber-100 text-amber-700',
  graded: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-purple-100 text-purple-700',
  missing: 'bg-red-100 text-red-700',
};

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

const formatDueDate = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

const Assignments: React.FC = () => {
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjectsByClass, setSubjectsByClass] = useState<Record<string, SubjectOption[]>>({});
  const [classesLoading, setClassesLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxGrade, setMaxGrade] = useState('100');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // Submissions viewer
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { grade: string; comment: string }>>({});
  const [savingLearnerId, setSavingLearnerId] = useState<string | null>(null);

  const subjects = subjectsByClass[selectedClass] || [];

  // ── Load the teacher's classes + subjects ───────────────────────────────
  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const res = await getMyClasses();
      const classMap = new Map<string, ClassOption>();
      const subjMap: Record<string, SubjectOption[]> = {};
      (res.data.assignments || []).forEach((a) => {
        if (!a.class || !a.learning_area) return;
        if (!classMap.has(a.class.id)) {
          classMap.set(a.class.id, { id: a.class.id, name: formatClassName(a.class) });
        }
        if (!subjMap[a.class.id]) subjMap[a.class.id] = [];
        if (!subjMap[a.class.id].some((s) => s.id === a.learning_area!.id)) {
          subjMap[a.class.id].push({
            id: a.learning_area.id,
            name: a.learning_area.name,
            code: a.learning_area.code,
          });
        }
      });
      const list = Array.from(classMap.values());
      setClasses(list);
      setSubjectsByClass(subjMap);
      if (list.length > 0) {
        setSelectedClass((prev) => prev || list[0].id);
        setSelectedSubject((prev) => prev || subjMap[list[0].id]?.[0]?.id || '');
      }
    } catch (error) {
      toast({
        title: 'Could not load your classes',
        description: getErrorMessage(error, 'Please refresh and try again.'),
        variant: 'destructive',
      });
    } finally {
      setClassesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!selectedClass) return;
    const subjectIds = (subjectsByClass[selectedClass] || []).map((s) => s.id);
    if (!subjectIds.includes(selectedSubject)) {
      setSelectedSubject(subjectIds[0] || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, subjectsByClass]);

  // ── Load assignments for the selected class + subject ───────────────────
  const loadAssignments = useCallback(async () => {
    if (!selectedClass || !selectedSubject) {
      setAssignments([]);
      return;
    }
    setAssignmentsLoading(true);
    try {
      const res = await getAssignments({ class_id: selectedClass, learning_area_id: selectedSubject });
      setAssignments(res.data?.assignments || []);
    } catch (error) {
      toast({
        title: 'Could not load assignments',
        description: getErrorMessage(error, 'Please refresh and try again.'),
        variant: 'destructive',
      });
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [selectedClass, selectedSubject, toast]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // ── Create assignment ────────────────────────────────────────────────────
  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setMaxGrade('100');
    setAttachment(null);
  };

  const handleCreate = async () => {
    if (!selectedClass || !selectedSubject) return;
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!dueDate) {
      toast({ title: 'Due date is required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      await createAssignment({
        class_id: selectedClass,
        learning_area_id: selectedSubject,
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: new Date(dueDate).toISOString(),
        max_grade: Number(maxGrade || 100),
        attachment,
      });
      toast({ title: 'Assignment created', description: `"${title.trim()}" was posted to the class.` });
      resetCreateForm();
      setCreateOpen(false);
      loadAssignments();
    } catch (error) {
      toast({
        title: 'Could not create assignment',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    try {
      await deleteAssignment(assignment.id);
      toast({ title: 'Assignment deleted' });
      if (viewingAssignment?.id === assignment.id) setViewingAssignment(null);
      loadAssignments();
    } catch (error) {
      toast({
        title: 'Could not delete assignment',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    }
  };

  // ── Submissions viewer ────────────────────────────────────────────────────
  const openSubmissions = async (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setSubmissionsLoading(true);
    try {
      const res = await getSubmissions(assignment.id);
      const rows = res.data?.students || [];
      setSubmissions(rows);
      const drafts: Record<string, { grade: string; comment: string }> = {};
      rows.forEach((r) => {
        drafts[r.learner_id] = {
          grade: r.submission?.grade !== null && r.submission?.grade !== undefined ? String(r.submission.grade) : '',
          comment: r.submission?.teacher_comment || '',
        };
      });
      setGradeDrafts(drafts);
    } catch (error) {
      toast({
        title: 'Could not load submissions',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleGrade = async (row: SubmissionRow, status: 'graded' | 'returned') => {
    if (!row.submission) return;
    const draft = gradeDrafts[row.learner_id] || { grade: '', comment: '' };
    const maxGradeForAssignment = viewingAssignment?.max_grade ?? 100;

    if (draft.grade !== '') {
      const numGrade = Number(draft.grade);
      if (Number.isNaN(numGrade) || numGrade < 0 || numGrade > maxGradeForAssignment) {
        toast({
          title: 'Invalid grade',
          description: `Grade must be between 0 and ${maxGradeForAssignment}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSavingLearnerId(row.learner_id);
    try {
      const updated = await gradeSubmission(row.submission.id, {
        grade: draft.grade === '' ? null : Number(draft.grade),
        teacher_comment: draft.comment,
        status,
      });
      setSubmissions((prev) =>
        prev.map((r) => (r.learner_id === row.learner_id ? { ...r, submission: updated.data } : r))
      );
      toast({
        title: status === 'returned' ? 'Returned to student' : 'Grade saved',
      });
    } catch (error) {
      toast({
        title: 'Could not save grade',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSavingLearnerId(null);
    }
  };

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Assignments
          </CardTitle>
          <CardDescription>
            Create assignments, attach a PDF or Word document, and grade, comment on, or return what
            students submit.
          </CardDescription>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!selectedClass || !selectedSubject}>
          <Plus className="h-4 w-4 mr-2" /> New Assignment
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Class + subject */}
        <div className="flex flex-wrap gap-3">
          {classesLoading ? (
            <ClassSelectSkeleton />
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You aren't assigned to teach any class yet. Contact your school admin.
            </p>
          ) : (
            <>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={subjects.length === 0}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Assignment list */}
        {assignmentsLoading ? (
          <ListBlockSkeleton />
        ) : assignments.length === 0 ? (
          selectedClass &&
          selectedSubject && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No assignments yet for this class and subject. Click "New Assignment" to create one.
            </p>
          )
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div key={a.id} className="border rounded-md p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{a.title}</h4>
                      {isOverdue(a.due_date) && <Badge variant="outline">Past due</Badge>}
                    </div>
                    {a.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" /> Due {formatDueDate(a.due_date)}
                      </span>
                      {a.attachment_url && (
                        <a
                          href={a.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" /> {a.attachment_name || 'Attachment'}
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {a.submission_counts?.submitted ?? 0} submitted ·{' '}
                        {a.submission_counts?.graded ?? 0} graded
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openSubmissions(a)}>
                      <Users className="h-3.5 w-3.5 mr-1.5" /> Submissions
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submissions viewer */}
        {viewingAssignment && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Submissions — {viewingAssignment.title}</CardTitle>
              <CardDescription>
                Out of {viewingAssignment.max_grade} marks. Grade, comment, and return each student's work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <ListBlockSkeleton count={4} />
              ) : submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No students are enrolled in this class yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((row) => {
                    const draft = gradeDrafts[row.learner_id] || { grade: '', comment: '' };
                    const status = row.submission?.status || 'missing';
                    return (
                      <div key={row.learner_id} className="border rounded-md p-3 space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <p className="font-medium">
                              {row.learner.first_name} {row.learner.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{row.learner.admission_number}</p>
                          </div>
                          <Badge className={statusStyles[status]}>{status}</Badge>
                        </div>

                        {row.submission ? (
                          <>
                            {row.submission.submission_text && (
                              <p className="text-sm bg-muted/50 rounded p-2">{row.submission.submission_text}</p>
                            )}
                            {row.submission.file_url && (
                              <a
                                href={row.submission.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline w-fit"
                              >
                                <Paperclip className="h-3.5 w-3.5" /> {row.submission.file_name || 'View file'}
                              </a>
                            )}
                            <div className="flex flex-wrap items-end gap-2 pt-1">
                              <div>
                                <Label className="text-xs">Grade (/{viewingAssignment.max_grade})</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={viewingAssignment.max_grade}
                                  className="h-8 w-24"
                                  value={draft.grade}
                                  onChange={(e) =>
                                    setGradeDrafts((prev) => ({
                                      ...prev,
                                      [row.learner_id]: { ...draft, grade: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <Label className="text-xs">Comment</Label>
                                <Textarea
                                  className="h-8 min-h-8 py-1.5"
                                  placeholder="e.g. Great improvement on part 2!"
                                  value={draft.comment}
                                  onChange={(e) =>
                                    setGradeDrafts((prev) => ({
                                      ...prev,
                                      [row.learner_id]: { ...draft, comment: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={savingLearnerId === row.learner_id}
                                onClick={() => handleGrade(row, 'graded')}
                              >
                                {savingLearnerId === row.learner_id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                disabled={savingLearnerId === row.learner_id}
                                onClick={() => handleGrade(row, 'returned')}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" /> Return
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" onClick={() => setViewingAssignment(null)}>
                Close
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>

      {/* Create assignment dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Assignment</DialogTitle>
            <DialogDescription>
              Posting to {selectedClassInfo?.name} · {subjects.find((s) => s.id === selectedSubject)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignment-title">Title</Label>
              <Input
                id="assignment-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Homework"
              />
            </div>
            <div>
              <Label htmlFor="assignment-description">Description (optional)</Label>
              <Textarea
                id="assignment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for the assignment..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignment-due">Due date</Label>
                <Input
                  id="assignment-due"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="assignment-max-grade">Max grade</Label>
                <Input
                  id="assignment-max-grade"
                  type="number"
                  min={1}
                  value={maxGrade}
                  onChange={(e) => setMaxGrade(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="assignment-attachment">Attach PDF or Word (optional)</Label>
              <Input
                id="assignment-attachment"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Assignments;
