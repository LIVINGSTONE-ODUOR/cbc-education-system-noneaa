import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRound } from 'lucide-react';
import type { MyClassStudent } from '@/lib/api/teacherApi';
import { ClassSelectSkeleton, StudentRowsSkeleton } from './skeletons';

interface ClassOption {
  id: string;
  name: string;
  students: number;
}

interface StudentProfilesProps {
  classes: ClassOption[];
  classesLoading: boolean;
  selectedClass: string;
  onSelectClass: (classId: string) => void;
  students: MyClassStudent[];
  studentsLoading: boolean;
  onViewProfile: (learnerId: string) => void;
}

const StudentProfiles: React.FC<StudentProfilesProps> = ({
  classes,
  classesLoading,
  selectedClass,
  onSelectClass,
  students,
  studentsLoading,
  onViewProfile,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Profiles</CardTitle>
        <CardDescription>Select a class, then open a student's full profile — medical info, discipline, academic history, and notes.</CardDescription>
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
              <StudentRowsSkeleton />
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No students are enrolled in this class yet.
              </p>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.learner_id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserRound className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {student.admission_number}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onViewProfile(student.learner_id)}>
                      View Full Profile
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentProfiles;
