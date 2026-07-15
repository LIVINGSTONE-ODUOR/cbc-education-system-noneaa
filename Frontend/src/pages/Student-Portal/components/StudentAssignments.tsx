import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardList, AlertCircle, MessageSquareText, PlayCircle, Paperclip,
  Download, Loader2, UploadCloud, CheckCircle2,
} from 'lucide-react';
import {
  getLearnerAssignmentsDue,
  submitAssignment,
  LearnerDueAssignment,
  LearnerAssignmentStatus,
} from '@/lib/api/assignmentApi';

interface ViewerAttachment {
  url: string;
  name: string;
  type: 'pdf' | 'word' | 'video' | null;
}

interface StudentAssignmentsProps {
  learnerId: string;
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

// Extends the read-only Parent-Portal Assignments view with a real
// submission form (text + file), since submitting homework only makes
// sense from the student's own account. Backed by the existing
// POST /api/v1/assignments/:id/submit endpoint, which was already wired
// up in assignmentApi.ts but had no UI anywhere yet.
const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ learnerId, emptyMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<LearnerDueAssignment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewerAttachment, setViewerAttachment] = useState<ViewerAttachment | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [submissionFile, setSubmissionFile] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<Record<string, string>>({});
  const [justSubmitted, setJustSubmitted] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLearnerAssignmentsDue(learnerId, true);
      setAssignments(res.data.assignments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!learnerId) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  const handleDownload = async (attachment: ViewerAttachment) => {
    try {
      setDownloading(true);
      const res = await fetch(attachment.url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.location.href = attachment.url;
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    setSubmitting(assignmentId);
    setSubmitError((prev) => ({ ...prev, [assignmentId]: '' }));
    try {
      await submitAssignment(
        assignmentId,
        submissionText[assignmentId] || undefined,
        submissionFile[assignmentId] || null
      );
      setJustSubmitted((prev) => ({ ...prev, [assignmentId]: true }));
      setSubmissionText((prev) => ({ ...prev, [assignmentId]: '' }));
      setSubmissionFile((prev) => ({ ...prev, [assignmentId]: null }));
      await load();
    } catch (err: any) {
      setSubmitError((prev) => ({ ...prev, [assignmentId]: err.message || 'Submission failed. Please try again.' }));
    } finally {
      setSubmitting(null);
    }
  };

  const sorted = [...assignments].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );

  return (
    <>
      <Card id="assignments-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Homework &amp; Assignments
          </CardTitle>
          <CardDescription>Due dates, submissions, teacher feedback, and grades</CardDescription>
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
                const canSubmit = a.submission_status === 'not_submitted';
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : a.id);
                        }
                      }}
                      className="flex flex-wrap items-start justify-between gap-2 cursor-pointer focus:outline-none"
                    >
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{a.learning_area?.name || 'General'}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={isOverdue ? 'bg-red-100 text-red-700 border-red-200' : 'text-muted-foreground'}
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

                        {a.attachment_url && a.attachment_type === 'video' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setViewerAttachment({
                                url: a.attachment_url as string,
                                name: a.attachment_name || 'Assignment video',
                                type: a.attachment_type,
                              })
                            }
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            <PlayCircle className="h-4 w-4" />
                            {a.attachment_name || 'Assignment video'}
                          </button>
                        ) : (
                          a.attachment_url && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewerAttachment({
                                  url: a.attachment_url as string,
                                  name: a.attachment_name || 'Assignment attachment',
                                  type: a.attachment_type,
                                })
                              }
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <Paperclip className="h-4 w-4" /> {a.attachment_name || 'View attachment'}
                            </button>
                          )
                        )}

                        {/* Teacher feedback */}
                        {a.teacher_comment && (
                          <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-sm">
                            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Teacher feedback</p>
                              <p>{a.teacher_comment}</p>
                            </div>
                          </div>
                        )}

                        {/* Submission — text + file upload */}
                        {canSubmit ? (
                          <div className="rounded-md border border-dashed p-3 space-y-2">
                            <p className="flex items-center gap-1.5 text-sm font-medium">
                              <UploadCloud className="h-4 w-4 text-primary" />
                              Submit your work
                            </p>
                            <Textarea
                              placeholder="Optional notes for your teacher..."
                              value={submissionText[a.id] || ''}
                              onChange={(e) =>
                                setSubmissionText((prev) => ({ ...prev, [a.id]: e.target.value }))
                              }
                              rows={3}
                            />
                            <input
                              type="file"
                              onChange={(e) =>
                                setSubmissionFile((prev) => ({ ...prev, [a.id]: e.target.files?.[0] || null }))
                              }
                              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
                            />
                            {submitError[a.id] && (
                              <p className="text-sm text-destructive">{submitError[a.id]}</p>
                            )}
                            <Button
                              size="sm"
                              disabled={
                                submitting === a.id ||
                                (!submissionText[a.id] && !submissionFile[a.id])
                              }
                              onClick={() => handleSubmit(a.id)}
                            >
                              {submitting === a.id ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                              ) : (
                                <UploadCloud className="mr-1.5 h-4 w-4" />
                              )}
                              Submit
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            {justSubmitted[a.id] ? 'Submitted just now.' : 'Submitted'}
                            {a.submitted_at
                              ? ` on ${new Date(a.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                              : ''}
                            .
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewerAttachment} onOpenChange={(open) => !open && setViewerAttachment(null)}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle className="truncate text-base">
                {viewerAttachment?.name || 'Attachment'}
              </DialogTitle>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={downloading}
                onClick={() => viewerAttachment && handleDownload(viewerAttachment)}
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download
              </Button>
            </div>
          </DialogHeader>

          <div className="bg-muted/30 h-[75vh]">
            {viewerAttachment?.type === 'video' ? (
              <video src={viewerAttachment.url} controls autoPlay className="h-full w-full bg-black">
                Your browser doesn't support inline video playback.
              </video>
            ) : viewerAttachment?.type === 'pdf' ? (
              <iframe src={viewerAttachment.url} title={viewerAttachment.name} className="h-full w-full border-0" />
            ) : (
              viewerAttachment && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(viewerAttachment.url)}&embedded=true`}
                  title={viewerAttachment.name}
                  className="h-full w-full border-0"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentAssignments;
