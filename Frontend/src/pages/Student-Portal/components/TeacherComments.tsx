import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { getLearnerTeacherComments, TeacherComment } from '@/lib/api/parentDashboardApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeacherCommentsProps {
  learnerId: string;
  emptyMessage?: string;
}

const TeacherComments: React.FC<TeacherCommentsProps> = ({ learnerId, emptyMessage }) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<TeacherComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!learnerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLearnerTeacherComments(learnerId, 20);
        if (!cancelled) setComments(res.data.comments || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || t('failedToLoadTeacherComments', 'Failed to load teacher comments'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {t('teacherComments', 'Teacher Comments')}
        </CardTitle>
        <CardDescription>{t('teacherCommentsDesc', 'Feedback your teachers have left for you')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || t('noTeacherCommentsYet', 'No teacher comments yet.')}
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {c.teachers ? `${c.teachers.first_name} ${c.teachers.last_name}` : t('teacherFallback', 'Teacher')}
                  </span>
                  <div className="flex items-center gap-2">
                    {c.learning_areas && <Badge variant="outline">{c.learning_areas.name}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground">{c.comment}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherComments;
