import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck } from 'lucide-react';
import { ClassSelectSkeleton } from './skeletons';

interface ClassOption {
  id: string;
  name: string;
  students: number;
}

interface AttendanceProps {
  classes: ClassOption[];
  classesLoading: boolean;
  selectedClass: string;
  onSelectClass: (classId: string) => void;
  studentCount: number;
  onMarkAttendance: () => void;
}

const Attendance: React.FC<AttendanceProps> = ({
  classes,
  classesLoading,
  selectedClass,
  onSelectClass,
  studentCount,
  onMarkAttendance,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" /> Attendance
        </CardTitle>
        <CardDescription>Select a class and mark today's attendance.</CardDescription>
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
            <Button onClick={onMarkAttendance} disabled={!selectedClass || studentCount === 0}>
              <ClipboardCheck className="mr-2 h-4 w-4" /> Mark Attendance
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Attendance;
