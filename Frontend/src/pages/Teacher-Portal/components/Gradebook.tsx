import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Save, RefreshCcw, ClipboardEdit, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getMyClasses,
  getMyClassStudents,
  type MyClassAssignment,
  type MyClassStudent,
} from '@/lib/api/teacherApi';
import { getExams, type ExamApiItem } from '@/lib/api/examApi';
import {
  getResults,
  bulkUpsertResults,
  type PerformanceLevel,
} from '@/lib/api/resultsApi';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const gradeBadgeStyles: Record<string, string> = {
  EE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  ME: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  AE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  BE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

// Same thresholds the backend uses when it computes performance_level, so
// the "Final" column the teacher sees here always matches what gets saved.
const gradeFromAverage = (avg: number): PerformanceLevel =>
  avg >= 80 ? 'EE' : avg >= 50 ? 'ME' : avg >= 30 ? 'AE' : 'BE';

const formatClassName = (cls: MyClassAssignment['class']) =>
  cls ? `Grade ${cls.grade_level}${cls.stream_name ? cls.stream_name : ''}` : 'Unknown Class';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

// One editable cell: a student's marks for one exam column.
interface Cell {
  marks_obtained: string;
  max_marks: string;
  result_id: string | null;
  dirty: boolean;
}

// Max number of exam columns a teacher can pin to the sheet at once
// (mirrors the CAT1 / CAT2 / Exam layout from the product mockup).
const MAX_COLUMNS = 4;

const Gradebook: React.FC = () => {
  const { toast } = useToast();

  // Classes this teacher is assigned to, plus the subject(s) they teach in
  // each one — both derived from GET /api/v1/teachers/me/classes.
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjectsByClass, setSubjectsByClass] = useState<Record<string, SubjectOption[]>>({});
  const [classesLoading, setClassesLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Exams available for the selected class (CATs, exams, etc.) — the
  // teacher checks which ones should appear as columns on the sheet.
  const [exams, setExams] = useState<ExamApiItem[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);

  // Class roster
  const [students, setStudents] = useState<MyClassStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // matrix[learner_id][exam_id] -> Cell
  const [matrix, setMatrix] = useState<Record<string, Record<string, Cell>>>({});
  const [resultsLoading, setResultsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const subjects = subjectsByClass[selectedClass] || [];

  // ── Load classes + subjects the teacher is assigned to ─────────────────
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

  // When the class changes, default to the first subject taught there and
  // clear any column selection from the previous class.
  useEffect(() => {
    if (!selectedClass) return;
    const subjectIds = (subjectsByClass[selectedClass] || []).map((s) => s.id);
    if (!subjectIds.includes(selectedSubject)) {
      setSelectedSubject(subjectIds[0] || '');
    }
    setSelectedExamIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, subjectsByClass]);

  // ── Load exams available for the selected class ─────────────────────────
  useEffect(() => {
    if (!selectedClass) {
      setExams([]);
      return;
    }
    setExamsLoading(true);
    (async () => {
      try {
        const res = await getExams({
          class_id: selectedClass,
          limit: 50,
          sort_by: 'start_date',
          sort_order: 'asc',
        });
        setExams(res.data?.exams || []);
      } catch (error) {
        toast({
          title: 'Could not load exams for this class',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
        setExams([]);
      } finally {
        setExamsLoading(false);
      }
    })();
  }, [selectedClass, toast]);

  // ── Load the class roster ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    (async () => {
      try {
        const res = await getMyClassStudents(selectedClass);
        setStudents(res.data.students || []);
      } catch (error) {
        toast({
          title: 'Could not load students',
          description: getErrorMessage(error, 'Please refresh and try again.'),
          variant: 'destructive',
        });
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [selectedClass, toast]);

  // ── Load existing marks for every selected exam column ──────────────────
  const loadResults = useCallback(async () => {
    if (!selectedClass || !selectedSubject || selectedExamIds.length === 0 || students.length === 0) {
      setMatrix({});
      return;
    }
    setResultsLoading(true);
    try {
      const responses = await Promise.all(
        selectedExamIds.map((examId) =>
          getResults({
            exam_id: examId,
            class_id: selectedClass,
            learning_area_id: selectedSubject,
            limit: 500,
          }).then((res) => ({ examId, rows: res.data?.results || [] }))
        )
      );

      setMatrix(() => {
        const next: Record<string, Record<string, Cell>> = {};
        students.forEach((s) => {
          next[s.learner_id] = {};
          selectedExamIds.forEach((examId) => {
            next[s.learner_id][examId] = {
              marks_obtained: '',
              max_marks: '100',
              result_id: null,
              dirty: false,
            };
          });
        });
        responses.forEach(({ examId, rows }) => {
          rows.forEach((r) => {
            if (!next[r.learner_id]) return;
            next[r.learner_id][examId] = {
              marks_obtained: String(r.marks_obtained),
              max_marks: String(r.max_marks),
              result_id: r.id,
              dirty: false,
            };
          });
        });
        return next;
      });
    } catch (error) {
      toast({
        title: 'Could not load marks',
        description: getErrorMessage(error, 'Please refresh and try again.'),
        variant: 'destructive',
      });
    } finally {
      setResultsLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedExamIds, students, toast]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const toggleExamColumn = (examId: string) => {
    setSelectedExamIds((prev) => {
      if (prev.includes(examId)) return prev.filter((id) => id !== examId);
      if (prev.length >= MAX_COLUMNS) {
        toast({ title: `You can pin up to ${MAX_COLUMNS} columns at once`, variant: 'destructive' });
        return prev;
      }
      return [...prev, examId];
    });
  };

  const updateCell = (learnerId: string, examId: string, patch: Partial<Cell>) => {
    setMatrix((prev) => ({
      ...prev,
      [learnerId]: {
        ...prev[learnerId],
        [examId]: { ...prev[learnerId]?.[examId], ...patch, dirty: true } as Cell,
      },
    }));
  };

  // ── Totals / average / grade / rank — all computed client-side from
  // whatever is currently on the sheet, so they update live as you type. ──
  const summaries = useMemo(() => {
    const rows = students.map((s) => {
      const cells = selectedExamIds.map((examId) => matrix[s.learner_id]?.[examId]);
      let totalObtained = 0;
      let totalMax = 0;
      let anyEntered = false;
      cells.forEach((c) => {
        const obtained = Number(c?.marks_obtained);
        const max = Number(c?.max_marks || 100);
        if (c && c.marks_obtained !== '' && !Number.isNaN(obtained)) {
          totalObtained += obtained;
          totalMax += max;
          anyEntered = true;
        }
      });
      const average = anyEntered && totalMax > 0 ? (totalObtained / totalMax) * 100 : null;
      return {
        learner_id: s.learner_id,
        totalObtained,
        totalMax,
        average,
        grade: average === null ? null : gradeFromAverage(average),
      };
    });

    // Rank by average, descending; students with no marks yet are unranked.
    const ranked = [...rows]
      .filter((r) => r.average !== null)
      .sort((a, b) => (b.average as number) - (a.average as number));
    const rankByLearner: Record<string, number> = {};
    ranked.forEach((r, idx) => {
      rankByLearner[r.learner_id] = idx + 1;
    });

    const byLearner: Record<string, (typeof rows)[number] & { rank: number | null }> = {};
    rows.forEach((r) => {
      byLearner[r.learner_id] = { ...r, rank: rankByLearner[r.learner_id] ?? null };
    });
    return byLearner;
  }, [students, selectedExamIds, matrix]);

  // ── Save every dirty cell, one bulk call per exam column ────────────────
  const handleSaveAll = async () => {
    if (!selectedSubject || selectedExamIds.length === 0) return;

    const dirtyByExam: Record<string, { learner_id: string; marks_obtained: number; max_marks: number }[]> = {};
    let hasInvalid = false;

    selectedExamIds.forEach((examId) => {
      students.forEach((s) => {
        const cell = matrix[s.learner_id]?.[examId];
        if (!cell || !cell.dirty) return;
        const marks = Number(cell.marks_obtained);
        const max = Number(cell.max_marks || 100);
        if (cell.marks_obtained === '' || Number.isNaN(marks) || marks < 0 || marks > max) {
          hasInvalid = true;
          return;
        }
        if (!dirtyByExam[examId]) dirtyByExam[examId] = [];
        dirtyByExam[examId].push({ learner_id: s.learner_id, marks_obtained: marks, max_marks: max });
      });
    });

    if (hasInvalid) {
      toast({
        title: 'Some marks are invalid',
        description: 'Marks must be a number between 0 and the "out of" value.',
        variant: 'destructive',
      });
    }

    const examIdsToSave = Object.keys(dirtyByExam);
    if (examIdsToSave.length === 0) {
      if (!hasInvalid) toast({ title: 'Nothing to save', description: 'No marks have changed.' });
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        examIdsToSave.map((examId) =>
          bulkUpsertResults({
            exam_id: examId,
            learning_area_id: selectedSubject,
            class_id: selectedClass,
            results: dirtyByExam[examId].map((r) => ({
              learner_id: r.learner_id,
              marks_obtained: r.marks_obtained,
              max_marks: r.max_marks,
            })),
          })
        )
      );
      toast({ title: 'Marks saved', description: 'The gradebook has been updated.' });
      await loadResults();
    } catch (error) {
      toast({
        title: 'Failed to save some marks',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedClassInfo = classes.find((c) => c.id === selectedClass);
  const anyDirty = Object.values(matrix).some((row) => Object.values(row).some((c) => c.dirty));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5 text-primary" /> Gradebook
          </CardTitle>
          <CardDescription>
            Enter CATs, assignments, and exam marks for a whole class at once — totals, averages, grades,
            and rankings are calculated for you.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadClasses} disabled={classesLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${classesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: class + subject */}
        <div className="flex flex-wrap gap-3">
          {classesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your classes...
            </div>
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

        {/* Step 2: choose which exams appear as columns */}
        {selectedClass && selectedSubject && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Choose up to {MAX_COLUMNS} assessments to show as columns (e.g. CAT 1, CAT 2, End-Term):
            </p>
            {examsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading assessments...
              </div>
            ) : exams.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No CATs, assignments, or exams have been set up for this class yet. Ask your admin to create one.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {exams.map((exam) => (
                  <label
                    key={exam.id}
                    className="flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedExamIds.includes(exam.id)}
                      onCheckedChange={() => toggleExamColumn(exam.id)}
                    />
                    {exam.exam_name}
                    <span className="text-xs text-muted-foreground">({exam.exam_type})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: the sheet itself */}
        {selectedExamIds.length > 0 && (
          <div className="rounded-md border overflow-x-auto">
            {studentsLoading || resultsLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading gradebook...
              </div>
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No students are enrolled in this class yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Student</TableHead>
                    {selectedExamIds.map((examId) => {
                      const exam = exams.find((e) => e.id === examId);
                      return (
                        <TableHead key={examId} className="w-28 text-center">
                          {exam?.exam_name || 'Exam'}
                        </TableHead>
                      );
                    })}
                    <TableHead className="w-20 text-center">Total</TableHead>
                    <TableHead className="w-24 text-center">Average</TableHead>
                    <TableHead className="w-20 text-center">Grade</TableHead>
                    <TableHead className="w-20 text-center">Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const summary = summaries[student.learner_id];
                    return (
                      <TableRow key={student.learner_id}>
                        <TableCell className="font-medium">
                          {student.name}
                          <span className="block text-xs text-muted-foreground">
                            {student.admission_number}
                          </span>
                        </TableCell>
                        {selectedExamIds.map((examId) => {
                          const cell = matrix[student.learner_id]?.[examId];
                          return (
                            <TableCell key={examId}>
                              <Input
                                type="number"
                                min={0}
                                max={Number(cell?.max_marks || 100)}
                                value={cell?.marks_obtained ?? ''}
                                onChange={(e) =>
                                  updateCell(student.learner_id, examId, { marks_obtained: e.target.value })
                                }
                                className="h-8 w-20 text-center"
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-medium">
                          {summary?.average !== null ? `${summary.totalObtained}/${summary.totalMax}` : '—'}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {summary?.average !== null ? `${summary.average.toFixed(1)}%` : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary?.grade ? (
                            <Badge className={gradeBadgeStyles[summary.grade]}>{summary.grade}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {summary?.rank ? (
                            <span className="inline-flex items-center gap-1 font-medium">
                              {summary.rank === 1 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                              #{summary.rank}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>

      {selectedExamIds.length > 0 && students.length > 0 && (
        <CardFooter className="justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedClassInfo?.name} · {subjects.find((s) => s.id === selectedSubject)?.name}
          </p>
          <Button onClick={handleSaveAll} disabled={saving || !anyDirty}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Marks
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default Gradebook;
