import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { User, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { getMyChildren } from '@/lib/api/parentsApi';
import { getLearnerResults, ExamSummary } from '@/lib/api/resultsApi';

// Shapes matching the backend response (snake_case, as returned by the API)
interface Child {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade_level: string;
  stream_name: string | null;
  relationship: string | null;
  is_primary_guardian: boolean;
}


const ParentPortal = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load every child linked to the logged-in parent (handles 1 or many children)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingChildren(true);
        const res = await getMyChildren();
        if (cancelled) return;
        const kids = (res.data?.children || []) as unknown as Child[];
        setChildren(kids);
        if (kids.length > 0) setSelectedChildId(kids[0].id);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load your children');
      } finally {
        if (!cancelled) setLoadingChildren(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Whenever the selected child changes, pull their performance history
  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingResults(true);
        setError(null);
        const res = await getLearnerResults(selectedChildId);
        if (cancelled) return;
        setExams((res.data?.exams || []) as unknown as ExamSummary[]);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load performance data');
          setExams([]);
        }
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const latestExam = exams[0] || null;

  const gradeColor = (grade: string) => {
    if (grade === 'EE') return 'text-green-600';
    if (grade === 'ME') return 'text-blue-600';
    if (grade === 'AE') return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parent Portal</CardTitle>
              <CardDescription>
                {children.length > 1
                  ? `You have ${children.length} children linked to your account`
                  : 'Welcome back'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm text-muted-foreground">Select Child</span>
                {loadingChildren ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : children.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No children are linked to your account yet. Contact the school office.
                  </p>
                ) : (
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.first_name} {child.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <User className="mr-2 h-4 w-4" /> Profile
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <BookOpen className="mr-2 h-4 w-4" /> Academics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          {error && (
            <Card className="border-red-200">
              <CardContent className="p-4 flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </CardContent>
            </Card>
          )}

          {/* Child overview */}
          {selectedChild && (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-4 border-primary/20">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </h2>
                      <p className="text-muted-foreground">
                        {selectedChild.grade_level}
                        {selectedChild.stream_name ? ` • ${selectedChild.stream_name}` : ''}
                        {' • Adm. No. '}{selectedChild.admission_number}
                      </p>
                    </div>
                    {latestExam && (
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                        <span>Latest average: <strong>{latestExam.average_percentage}%</strong></span>
                        <span>Overall grade: <strong className={gradeColor(latestExam.overall_grade)}>{latestExam.overall_grade}</strong></span>
                        {latestExam.position && (
                          <span>Class position: <strong>{latestExam.position} of {latestExam.class_size}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Academic Performance */}
          {selectedChild && (
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
                <CardDescription>
                  {latestExam?.exam
                    ? `${latestExam.exam.exam_name} — ${latestExam.exam.exam_type}`
                    : `Results for ${selectedChild.first_name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingResults ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading results...
                  </div>
                ) : !latestExam || latestExam.subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">
                    No results have been recorded for {selectedChild.first_name} yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestExam.subjects.map((subject, index) => (
                        <TableRow key={index}>
                          <TableCell>{subject.learning_area?.name || '—'}</TableCell>
                          <TableCell>
                            {subject.is_absent ? 'Absent' : `${subject.marks_obtained}/${subject.max_marks} (${subject.percentage}%)`}
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${gradeColor(subject.performance_level)}`}>
                              {subject.performance_level}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Past exams for this child */}
          {exams.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Exam History</CardTitle>
                <CardDescription>Every exam {selectedChild?.first_name} has sat</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Average</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.exam_id}>
                        <TableCell>{exam.exam?.exam_name || '—'}</TableCell>
                        <TableCell>{exam.average_percentage}%</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${gradeColor(exam.overall_grade)}`}>
                            {exam.overall_grade}
                          </span>
                        </TableCell>
                        <TableCell>{exam.position ? `${exam.position} / ${exam.class_size}` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
