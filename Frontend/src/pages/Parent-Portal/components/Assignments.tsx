import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, AlertCircle, MessageSquareText, PlayCircle, Paperclip } from 'lucide-react';
import {
  getLearnerAssignmentsDue,
  LearnerDueAssignment,
  LearnerAssignmentStatus,
} from '@/lib/api/assignmentApi';

interface AssignmentsProps {
  learnerId: string;
  reloadKey?: string;
  emptyMessage?: string;
}

const STATUS_STYLES: Record<LearnerAssignmentStatus, string> = {
  not_submitted: 'bg-red-100 text-red-700 border-red-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  late: 'bg-amber-100 text-amber-700 border-amber-200',
  graded: 'bg-green-100 text-green-700 border-green-200',
  returned: 'bg-purple-100 text-purple-700 border-purple-200',
};

const STATUS_LABELS: Record<LearnerAssignmentStatus, string> = {
  not_submitted: 'Not submitted',
  submitted: 'Submitted',
  late: 'Submitted late',
  graded: 'Graded',
  returned: 'Returned',
};

const Assignments: React.FC<AssignmentsProps> = ({ learnerId, reloadKey, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<LearnerDueAssignment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // include_submitted=true so this shows the full homework list, not
        // just outstanding work — that's still covered by the dashboard's
        // compact "Assignments due" card.
        const res = await getLearnerAssignmentsDue(learnerId, true);
        if (!cancelled) setAssignments(res.data.assignments || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load assignments');
          setAssignments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId, reloadKey]);

  const sorted = [...assignments].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );

  return (
    <Card id="assignments-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Assignments
        </CardTitle>
        <CardDescription>Homework, due dates, submission status, and teacher feedback</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || 'No assignments have been posted yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((a) => {
              const isOverdue = a.is_overdue;
              const isExpanded = expandedId === a.id;
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedId(isExpanded ? null : a.id);
                    }
                  }}
                  className="rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.learning_area?.name || 'General'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          isOverdue
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'text-muted-foreground'
                        }
                      >
                        Due {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Badge>
                      <Badge variant="outline" className={STATUS_STYLES[a.submission_status]}>
                        {isOverdue ? 'Overdue' : STATUS_LABELS[a.submission_status]}
                      </Badge>
                      {a.grade != null && (
                        <Badge variant="outline">
                          {a.grade}/{a.max_grade}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {a.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>
                      )}

                      {/* Assignment material: inline video player, or a link for PDF/Word */}
                      {a.attachment_url && a.attachment_type === 'video' ? (
                        <div>
                          <p className="mb-2 flex items-center gap-1 text-sm font-medium text-primary">
                            <PlayCircle className="h-4 w-4" />
                            {a.attachment_name || 'Assignment video'}
                          </p>
                          <video src={a.attachment_url} controls className="w-full max-w-md rounded-md border">
                            Your browser doesn't support inline video playback.
                          </video>
                        </div>
                      ) : (
                        a.attachment_url && (
                          <a
                            href={a.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Paperclip className="h-4 w-4" /> {a.attachment_name || 'View attachment'}
                          </a>
                        )
                      )}
                    </div>
                  )}

                  {/* Teacher feedback */}
                  {a.teacher_comment && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/40 p-3 text-sm">
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Teacher feedback</p>
                        <p>{a.teacher_comment}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Assignments;
