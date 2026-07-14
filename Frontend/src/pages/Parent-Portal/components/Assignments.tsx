import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList, AlertCircle, MessageSquareText, PlayCircle, Paperclip, Download, Loader2 } from 'lucide-react';
import {
  getLearnerAssignmentsDue,
  LearnerDueAssignment,
  LearnerAssignmentStatus,
} from '@/lib/api/assignmentApi';

interface ViewerAttachment {
  url: string;
  name: string;
  type: 'pdf' | 'word' | 'video' | null;
}

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
  const [viewerAttachment, setViewerAttachment] = useState<ViewerAttachment | null>(null);
  const [downloading, setDownloading] = useState(false);

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
      // Fall back to a plain navigation if the blob fetch fails (e.g. CORS)
      window.location.href = attachment.url;
    } finally {
      setDownloading(false);
    }
  };

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
    <>
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

                      {/* Assignment material opens in the in-page viewer modal below,
                          so the underlying storage URL is never exposed to the browser tab/address bar. */}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewerAttachment({
                                url: a.attachment_url as string,
                                name: a.attachment_name || 'Assignment attachment',
                                type: a.attachment_type,
                              });
                            }}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Paperclip className="h-4 w-4" /> {a.attachment_name || 'View attachment'}
                          </button>
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
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-muted/30 h-[75vh]">
          {viewerAttachment?.type === 'video' ? (
            <video
              src={viewerAttachment.url}
              controls
              autoPlay
              className="h-full w-full bg-black"
            >
              Your browser doesn't support inline video playback.
            </video>
          ) : viewerAttachment?.type === 'pdf' ? (
            <iframe
              src={viewerAttachment.url}
              title={viewerAttachment.name}
              className="h-full w-full border-0"
            />
          ) : (
            // Word/other documents: render via Google's document viewer so it
            // stays embedded on this page instead of opening a new tab.
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

export default Assignments;
