import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  GraduationCap,
  UserCheck,
  ArrowLeft,
  TrendingUp,
  BookOpen,
  User,
} from 'lucide-react';

interface TermPerformance {
  term: string;
  exceeding: number;
  meeting: number;
  approaching: number;
  below: number;
}

interface ClassData {
  grade: string;
  totalStudents: number;
  classTeacher: string;
  classSecretary: string;
  performance: TermPerformance[];
}

const classData: ClassData[] = [
  {
    grade: 'Grade 1',
    totalStudents: 48,
    classTeacher: 'Mrs. Faith Wanjiku',
    classSecretary: 'Alan Kamau',
    performance: [
      { term: 'Term 1', exceeding: 12, meeting: 22, approaching: 10, below: 4 },
      { term: 'Term 2', exceeding: 14, meeting: 24, approaching: 7, below: 3 },
      { term: 'Term 3', exceeding: 16, meeting: 25, approaching: 5, below: 2 },
    ],
  },
  {
    grade: 'Grade 2',
    totalStudents: 55,
    classTeacher: 'Mr. Peter Ochieng',
    classSecretary: 'Brenda Akinyi',
    performance: [
      { term: 'Term 1', exceeding: 15, meeting: 25, approaching: 10, below: 5 },
      { term: 'Term 2', exceeding: 18, meeting: 27, approaching: 7, below: 3 },
      { term: 'Term 3', exceeding: 20, meeting: 28, approaching: 5, below: 2 },
    ],
  },
  {
    grade: 'Grade 3',
    totalStudents: 50,
    classTeacher: 'Ms. Rose Njeri',
    classSecretary: 'Collins Mwangi',
    performance: [
      { term: 'Term 1', exceeding: 10, meeting: 22, approaching: 12, below: 6 },
      { term: 'Term 2', exceeding: 12, meeting: 24, approaching: 10, below: 4 },
      { term: 'Term 3', exceeding: 14, meeting: 26, approaching: 8, below: 2 },
    ],
  },
  {
    grade: 'Grade 4',
    totalStudents: 47,
    classTeacher: 'Mr. James Kariuki',
    classSecretary: 'Diana Otieno',
    performance: [
      { term: 'Term 1', exceeding: 11, meeting: 20, approaching: 11, below: 5 },
      { term: 'Term 2', exceeding: 13, meeting: 22, approaching: 9, below: 3 },
      { term: 'Term 3', exceeding: 15, meeting: 23, approaching: 7, below: 2 },
    ],
  },
  {
    grade: 'Grade 5',
    totalStudents: 42,
    classTeacher: 'Mrs. Susan Muthoni',
    classSecretary: 'Eric Kipkoech',
    performance: [
      { term: 'Term 1', exceeding: 9, meeting: 18, approaching: 10, below: 5 },
      { term: 'Term 2', exceeding: 11, meeting: 20, approaching: 8, below: 3 },
      { term: 'Term 3', exceeding: 13, meeting: 21, approaching: 6, below: 2 },
    ],
  },
  {
    grade: 'Grade 6',
    totalStudents: 38,
    classTeacher: 'Mr. David Otieno',
    classSecretary: 'Florence Wambui',
    performance: [
      { term: 'Term 1', exceeding: 8, meeting: 16, approaching: 9, below: 5 },
      { term: 'Term 2', exceeding: 10, meeting: 18, approaching: 7, below: 3 },
      { term: 'Term 3', exceeding: 12, meeting: 19, approaching: 5, below: 2 },
    ],
  },
  {
    grade: 'Grade 7',
    totalStudents: 35,
    classTeacher: 'Ms. Anne Waweru',
    classSecretary: 'George Njoroge',
    performance: [
      { term: 'Term 1', exceeding: 7, meeting: 15, approaching: 9, below: 4 },
      { term: 'Term 2', exceeding: 9, meeting: 17, approaching: 7, below: 2 },
      { term: 'Term 3', exceeding: 11, meeting: 18, approaching: 5, below: 1 },
    ],
  },
  {
    grade: 'Grade 8',
    totalStudents: 30,
    classTeacher: 'Mr. Samuel Ndung\'u',
    classSecretary: 'Harriet Chebet',
    performance: [
      { term: 'Term 1', exceeding: 6, meeting: 13, approaching: 8, below: 3 },
      { term: 'Term 2', exceeding: 8, meeting: 15, approaching: 5, below: 2 },
      { term: 'Term 3', exceeding: 10, meeting: 16, approaching: 3, below: 1 },
    ],
  },
  {
    grade: 'Grade 9',
    totalStudents: 25,
    classTeacher: 'Mrs. Jane Maina',
    classSecretary: 'Ian Kiplangat',
    performance: [
      { term: 'Term 1', exceeding: 5, meeting: 11, approaching: 6, below: 3 },
      { term: 'Term 2', exceeding: 7, meeting: 12, approaching: 4, below: 2 },
      { term: 'Term 3', exceeding: 9, meeting: 12, approaching: 3, below: 1 },
    ],
  },
  {
    grade: 'Grade 10',
    totalStudents: 22,
    classTeacher: 'Mr. Tom Kipchoge',
    classSecretary: 'Josephine Auma',
    performance: [
      { term: 'Term 1', exceeding: 4, meeting: 10, approaching: 5, below: 3 },
      { term: 'Term 2', exceeding: 6, meeting: 11, approaching: 3, below: 2 },
      { term: 'Term 3', exceeding: 8, meeting: 11, approaching: 2, below: 1 },
    ],
  },
];

const gradeColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'bg-blue-100 text-blue-600' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
  { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: 'bg-purple-100 text-purple-600' },
  { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: 'bg-orange-100 text-orange-600' },
  { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', icon: 'bg-pink-100 text-pink-600' },
  { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', icon: 'bg-teal-100 text-teal-600' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', icon: 'bg-indigo-100 text-indigo-600' },
  { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: 'bg-red-100 text-red-600' },
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'bg-amber-100 text-amber-600' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', icon: 'bg-cyan-100 text-cyan-600' },
];

const StudentClasses: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  if (selectedClass) {
    const idx = classData.findIndex((c) => c.grade === selectedClass.grade);
    const colors = gradeColors[idx % gradeColors.length];

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedClass(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Button>
          <h1 className="text-2xl font-bold">{selectedClass.grade} – Class Details</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={`border ${colors.border} ${colors.bg}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold">{selectedClass.totalStudents}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${colors.border} ${colors.bg}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Teacher</p>
                <p className="text-base font-semibold">{selectedClass.classTeacher}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${colors.border} ${colors.bg}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class Secretary</p>
                <p className="text-base font-semibold">{selectedClass.classSecretary}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Per Term */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Performance Per Term</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedClass.performance[0].term}>
              <TabsList className="mb-4">
                {selectedClass.performance.map((p) => (
                  <TabsTrigger key={p.term} value={p.term}>
                    {p.term}
                  </TabsTrigger>
                ))}
              </TabsList>

              {selectedClass.performance.map((p) => {
                const total = selectedClass.totalStudents;
                const pct = (n: number) =>
                  total > 0 ? Math.round((n / total) * 100) : 0;

                return (
                  <TabsContent key={p.term} value={p.term}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Exceeding</p>
                        <p className="text-2xl font-bold text-green-700">{p.exceeding}</p>
                        <p className="text-xs text-green-600 mt-1">{pct(p.exceeding)}%</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Meeting</p>
                        <p className="text-2xl font-bold text-blue-700">{p.meeting}</p>
                        <p className="text-xs text-blue-600 mt-1">{pct(p.meeting)}%</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Approaching</p>
                        <p className="text-2xl font-bold text-amber-700">{p.approaching}</p>
                        <p className="text-xs text-amber-600 mt-1">{pct(p.approaching)}%</p>
                      </div>
                      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Below</p>
                        <p className="text-2xl font-bold text-red-700">{p.below}</p>
                        <p className="text-xs text-red-600 mt-1">{pct(p.below)}%</p>
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div className="mt-6 space-y-3">
                      {[
                        { label: 'Exceeding', value: p.exceeding, total, color: 'bg-green-500' },
                        { label: 'Meeting', value: p.meeting, total, color: 'bg-blue-500' },
                        { label: 'Approaching', value: p.approaching, total, color: 'bg-amber-500' },
                        { label: 'Below', value: p.below, total, color: 'bg-red-500' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-muted-foreground shrink-0">
                            {item.label}
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="w-8 text-sm text-right shrink-0">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Student Classes</h1>
          <p className="text-sm text-muted-foreground">
            Select a grade to view class details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {classData.map((cls, idx) => {
          const colors = gradeColors[idx % gradeColors.length];
          return (
            <Card
              key={cls.grade}
              className={`cursor-pointer border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
              onClick={() => setSelectedClass(cls)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}
                  >
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <Badge className={`text-xs ${colors.badge} border-0`}>
                    {cls.totalStudents} students
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-1">{cls.grade}</h3>
                <p className="text-xs text-muted-foreground mb-1">
                  <span className="font-medium">Teacher:</span> {cls.classTeacher}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Secretary:</span> {cls.classSecretary}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StudentClasses;
