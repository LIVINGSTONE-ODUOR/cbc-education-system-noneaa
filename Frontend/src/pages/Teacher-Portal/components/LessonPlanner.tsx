import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, Save, Send, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ListBlockSkeleton } from './skeletons';
import {
  getMyClasses,
  getMyLessonPlans,
  saveLessonPlan,
  submitLessonPlan,
  deleteLessonPlan,
  type MyClassAssignment,
  type LessonPlan,
} from '@/lib/api/teacherApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const statusBadge: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  changes_requested: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted — awaiting review',
  approved: 'Approved',
  changes_requested: 'Changes requested',
};

const formatClass = (cls: MyClassAssignment['class']) =>
  cls ? `Grade ${cls.grade_level}${cls.stream_name || ''}` : 'Unknown class';

const LessonPlanner: React.FC = () => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<MyClassAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [objectives, setObjectives] = useState('');
  const [activities, setActivities] = useState('');
  const [resources, setResources] = useState('');
  const [homework, setHomework] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await getMyLessonPlans();
      setPlans(res.data.plans || []);
    } catch (error) {
      toast({
        title: 'Could not load lesson plans',
        description: getErrorMessage(error, 'Please refresh and try again.'),
        variant: 'destructive',
      });
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyClasses();
        const list = (res.data.assignments || []).filter((a) => a.class && a.learning_area);
        setAssignments(list);
        if (list.length > 0) setSelectedAssignmentId(list[0].id);
      } catch (error) {
        toast({
          title: 'Could not load your classes',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
      } finally {
        setAssignmentsLoading(false);
      }
    })();
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const resetForm = () => {
    setWeekNumber(1);
    setObjectives('');
    setActivities('');
    setResources('');
    setHomework('');
  };

  const handleSaveDraft = async () => {
    if (!selectedAssignment?.class || !selectedAssignment.learning_area) return;
    if (!objectives.trim() || !activities.trim()) {
      toast({ title: 'Objectives and Activities are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveLessonPlan({
        class_id: selectedAssignment.class.id,
        learning_area_id: selectedAssignment.learning_area.id,
        term_id: selectedAssignment.term?.id,
        week_number: weekNumber,
        objectives: objectives.trim(),
        activities: activities.trim(),
        resources: resources.trim() || undefined,
        homework: homework.trim() || undefined,
      });
      toast({ title: 'Draft saved' });
      resetForm();
      loadPlans();
    } catch (error) {
      toast({
        title: 'Could not save draft',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (planId: string) => {
    try {
      await submitLessonPlan(planId);
      toast({ title: 'Lesson plan submitted for review' });
      loadPlans();
    } catch (error) {
      toast({
        title: 'Could not submit lesson plan',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      await deleteLessonPlan(planId);
      toast({ title: 'Draft deleted' });
      loadPlans();
    } catch (error) {
      toast({
        title: 'Could not delete draft',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    }
  };

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.week_number - b.week_number),
    [plans]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> New Lesson Plan
          </CardTitle>
          <CardDescription>
            Prepare a plan for one of your classes — saving again for the same week updates the draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignmentsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't been assigned to any classes/subjects yet. Contact your school admin.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class & Subject</Label>
                  <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class & subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {formatClass(a.class)} — {a.learning_area?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Week</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objectives</Label>
                <Textarea
                  placeholder="What should learners be able to do by the end of this week?"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Activities</Label>
                <Textarea
                  placeholder="Lesson activities, group work, demonstrations..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resources</Label>
                  <Textarea
                    placeholder="Textbooks, charts, digital tools..."
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Homework</Label>
                  <Textarea
                    placeholder="What learners should do at home..."
                    value={homework}
                    onChange={(e) => setHomework(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
        {assignments.length > 0 && (
          <CardFooter className="justify-end">
            <Button onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Lesson Plans</CardTitle>
          <CardDescription>Drafts, submitted plans, and principal feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <ListBlockSkeleton count={4} />
          ) : sortedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No lesson plans yet — create one above.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedPlans.map((plan) => (
                <div key={plan.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        Week {plan.week_number} — {plan.learning_area?.name || 'Subject'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.class ? formatClass(plan.class) : ''}
                        {plan.term?.name ? ` · ${plan.term.name}` : ''}
                      </div>
                    </div>
                    <Badge className={`${statusBadge[plan.status]} hover:${statusBadge[plan.status]}`}>
                      {statusLabel[plan.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Objectives: </span>
                      <span className="text-muted-foreground">{plan.objectives}</span>
                    </div>
                    <div>
                      <span className="font-medium">Activities: </span>
                      <span className="text-muted-foreground">{plan.activities}</span>
                    </div>
                    {plan.resources && (
                      <div>
                        <span className="font-medium">Resources: </span>
                        <span className="text-muted-foreground">{plan.resources}</span>
                      </div>
                    )}
                    {plan.homework && (
                      <div>
                        <span className="font-medium">Homework: </span>
                        <span className="text-muted-foreground">{plan.homework}</span>
                      </div>
                    )}
                  </div>

                  {plan.review_comment && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
                      <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Principal feedback: </span>
                        {plan.review_comment}
                      </div>
                    </div>
                  )}

                  {(plan.status === 'draft' || plan.status === 'changes_requested') && (
                    <div className="mt-3 flex justify-end gap-2">
                      {plan.status === 'draft' && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      )}
                      <Button size="sm" onClick={() => handleSubmit(plan.id)}>
                        <Send className="mr-2 h-4 w-4" /> Submit for Review
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonPlanner;
