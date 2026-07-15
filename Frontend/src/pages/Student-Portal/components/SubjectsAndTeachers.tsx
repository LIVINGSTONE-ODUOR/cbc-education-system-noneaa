import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getClassLearningAreas } from '@/lib/api/classApi';
import { getLearnerTimetable } from '@/lib/api/parentDashboardApi';

interface SubjectsAndTeachersProps {
  classId: string | null;
  learnerId: string;
}

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  teacherName: string | null;
}

// Subjects come from the class's resolved learning-area list (explicit
// assignment or grade-level default). There's no direct "subject -> teacher"
// endpoint for students, so we derive the teacher per subject from the
// learner's own timetable periods, which already carry both the learning
// area and the teacher who takes that lesson.
const SubjectsAndTeachers: React.FC<SubjectsAndTeachersProps> = ({ classId, learnerId }) => {
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [subjectsRes, timetableRes] = await Promise.all([
          getClassLearningAreas(classId),
          getLearnerTimetable(learnerId).catch(() => null),
        ]);

        const teacherBySubjectId = new Map<string, string>();
        (timetableRes?.data.periods || []).forEach((p) => {
          if (p.learning_areas?.id && p.teachers) {
            teacherBySubjectId.set(
              p.learning_areas.id,
              `${p.teachers.first_name} ${p.teachers.last_name}`.trim()
            );
          }
        });

        const merged = (subjectsRes.data.learning_areas || []).map((la) => ({
          id: la.id,
          name: la.name,
          code: la.code,
          teacherName: teacherBySubjectId.get(la.id) || null,
        }));

        if (!cancelled) setRows(merged);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load subjects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, learnerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Subjects &amp; Teachers
        </CardTitle>
        <CardDescription>The subjects on your timetable and who teaches them</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No subjects have been assigned to your class yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.code}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.teacherName || 'Not yet assigned'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectsAndTeachers;
