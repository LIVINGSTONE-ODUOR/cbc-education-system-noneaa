import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MyClassStudent } from '@/lib/api/teacherApi';
import { ClassSelectSkeleton, TableBodySkeleton } from './skeletons';

interface ClassOption {
  id: string;
  name: string;
  students: number;
}

interface StudentPerformanceProps {
  classes: ClassOption[];
  classesLoading: boolean;
  selectedClass: string;
  onSelectClass: (classId: string) => void;
  students: MyClassStudent[];
  studentsLoading: boolean;
}

const performanceClass = (performance: number | null) => {
  if (performance === null) return 'text-muted-foreground';
  if (performance >= 80) return 'text-green-600';
  if (performance >= 70) return 'text-blue-600';
  if (performance >= 50) return 'text-amber-600';
  return 'text-red-600';
};

const StudentPerformance: React.FC<StudentPerformanceProps> = ({
  classes,
  classesLoading,
  selectedClass,
  onSelectClass,
  students,
  studentsLoading,
}) => {
  const classAverage =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + (s.performance ?? 0), 0) /
            students.filter((s) => s.performance !== null).length || 0
        )
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Performance</CardTitle>
        <CardDescription>
          Class average: {classAverage !== null && !Number.isNaN(classAverage) ? `${classAverage}%` : 'No data yet'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {classesLoading ? (
          <ClassSelectSkeleton />
        ) : classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't been assigned to any classes yet. Contact your school admin.
          </p>
        ) : (
          <>
            <Select value={selectedClass} onValueChange={onSelectClass}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.students} students)</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {studentsLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Overall %</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Exams Recorded</TableHead>
                    <TableHead>Strengths</TableHead>
                    <TableHead>Areas for Improvement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableBodySkeleton columns={6} />
                </TableBody>
              </Table>
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No students are enrolled in this class yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Overall %</TableHead>
                    <TableHead>Attendance %</TableHead>
                    <TableHead>Exams Recorded</TableHead>
                    <TableHead>Strengths</TableHead>
                    <TableHead>Areas for Improvement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.learner_id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className={performanceClass(s.performance)}>
                        {s.performance !== null ? `${s.performance}%` : 'No data'}
                      </TableCell>
                      <TableCell>{s.attendance !== null ? `${s.attendance}%` : 'No data'}</TableCell>
                      <TableCell>{s.exams_recorded}</TableCell>
                      <TableCell className="text-sm text-green-600">{s.strengths || '—'}</TableCell>
                      <TableCell className="text-sm text-amber-600">{s.areas_for_improvement || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentPerformance;
