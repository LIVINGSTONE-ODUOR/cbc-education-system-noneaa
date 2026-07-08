'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Users,
  GraduationCap,
  UserCheck,
  ArrowLeft,
  TrendingUp,
  BookOpen,
  User,
  Loader2,
  BarChart3,
  ChevronRight,
  Grid3x3,
  List,
} from 'lucide-react';

import ProtectedPageSkeleton from '@/components/skeletons/ProtectedPageSkeleton';

import ClassCardsSkeleton from '@/components/skeletons/ClassCardsSkeleton';

import { getClasses } from '@/lib/api/classApi';
import { cn } from '@/lib/utils';

interface TermPerformance {
  term: string;
  exceeding: number;
  meeting: number;
  approaching: number;
  below: number;
}

interface ClassData {
  id: string;
  grade_level: string;
  stream_name: string | null;
  totalStudents: number;
  classTeacher: string | null;
  branch: string | null;
  is_active: boolean;
  capacity: number | null;
  performance: TermPerformance[];
}

interface ApiClassItem {
  id: string;
  grade_level: string;
  stream_name: string | null;
  capacity: number | null;
  is_active: boolean;
  learner_count?: number | null;
  teachers?: {
    id: string;
    user_id?: string;
    users?: {
      first_name?: string;
      last_name?: string;
    };
  } | null;
  branches?: {
    id: string;
    name: string;
  } | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  created_at: string;
}

const gradeColors = [
  {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: 'bg-blue-100 text-blue-600',
    accent: 'text-blue-600',
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'bg-emerald-100 text-emerald-600',
    accent: 'text-emerald-600',
  },
  {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    icon: 'bg-purple-100 text-purple-600',
    accent: 'text-purple-600',
  },
  {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    icon: 'bg-orange-100 text-orange-600',
    accent: 'text-orange-600',
  },
  {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    badge: 'bg-pink-100 text-pink-700',
    icon: 'bg-pink-100 text-pink-600',
    accent: 'text-pink-600',
  },
  {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
    icon: 'bg-teal-100 text-teal-600',
    accent: 'text-teal-600',
  },
  {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: 'bg-indigo-100 text-indigo-600',
    accent: 'text-indigo-600',
  },
  {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: 'bg-red-100 text-red-600',
    accent: 'text-red-600',
  },
  {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'bg-amber-100 text-amber-600',
    accent: 'text-amber-600',
  },
  {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-700',
    icon: 'bg-cyan-100 text-cyan-600',
    accent: 'text-cyan-600',
  },
];

const StudentClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getClasses();
      const apiClasses = response.data?.classes || [];

      // Transform API data to component format - KEPT EXACTLY AS ORIGINAL
      const transformedClasses: ClassData[] = apiClasses.map((item: ApiClassItem) => ({
        id: item.id,
        grade_level: item.grade_level,
        stream_name: item.stream_name,
        totalStudents: item.learner_count || 0,
        classTeacher: item.teachers
          ? `${item.teachers.users?.first_name || ''} ${item.teachers.users?.last_name || ''}`.trim() ||
            'Unassigned'
          : 'Unassigned',
        branch: item.branches?.name || item.branch?.name || null,
        is_active: item.is_active,
        capacity: item.capacity,
        performance: [
          { term: 'Term 1', exceeding: 0, meeting: 0, approaching: 0, below: 0 },
          { term: 'Term 2', exceeding: 0, meeting: 0, approaching: 0, below: 0 },
          { term: 'Term 3', exceeding: 0, meeting: 0, approaching: 0, below: 0 },
        ],
      }));

      setClasses(transformedClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes from backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  // CLASS DETAILS VIEW - KEPT EXACTLY AS ORIGINAL STRUCTURE
  if (selectedClass) {
    const idx = classes.findIndex((c) => c.id === selectedClass.id);
    const colors = gradeColors[idx % gradeColors.length];

    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedClass(null)}
            className="gap-2 border-slate-200 hover:bg-slate-100 h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Classes
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {selectedClass.grade_level}
            {selectedClass.stream_name ? ` ${selectedClass.stream_name}` : ''} – Class Details
          </h1>
        </div>

        {/* Summary Cards - IMPROVED DESIGN, SAME DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className={`border-2 ${colors.border} ${colors.bg} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                <Users className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedClass.totalStudents}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${colors.border} ${colors.bg} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                <User className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-1">Class Teacher</p>
                <p className="font-semibold text-slate-900 truncate">{selectedClass.classTeacher}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${colors.border} ${colors.bg} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                <GraduationCap className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-1">Capacity</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedClass.capacity ? `${selectedClass.totalStudents}/${selectedClass.capacity}` : 'Unlimited'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Per Term - IMPROVED DESIGN, EXACT SAME LOGIC */}
        <Card className="border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center`}>
              <TrendingUp className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Performance Per Term</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue={selectedClass.performance[0].term}>
              <TabsList className="mb-6 w-full grid grid-cols-3 border border-slate-200 bg-slate-50 p-1 rounded-lg">
                {selectedClass.performance.map((p) => (
                  <TabsTrigger
                    key={p.term}
                    value={p.term}
                    className="rounded-md data-[state=active]:bg-white dark:bg-slate-900 data-[state=active]:border data-[state=active]:border-blue-300 data-[state=active]:shadow-sm"
                  >
                    {p.term}
                  </TabsTrigger>
                ))}
              </TabsList>

              {selectedClass.performance.map((p) => {
                const total = selectedClass.totalStudents;
                const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

                return (
                  <TabsContent key={p.term} value={p.term} className="space-y-6">
                    {/* Performance Stats Grid - IMPROVED STYLING */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 p-5 text-center hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-2">
                          Exceeding
                        </p>
                        <p className="text-3xl font-bold text-green-700">{p.exceeding}</p>
                        <p className="text-sm font-bold text-green-600 mt-2">{pct(p.exceeding)}%</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-5 text-center hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-2">
                          Meeting
                        </p>
                        <p className="text-3xl font-bold text-blue-700">{p.meeting}</p>
                        <p className="text-sm font-bold text-blue-600 mt-2">{pct(p.meeting)}%</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 p-5 text-center hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">
                          Approaching
                        </p>
                        <p className="text-3xl font-bold text-amber-700">{p.approaching}</p>
                        <p className="text-sm font-bold text-amber-600 mt-2">{pct(p.approaching)}%</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 p-5 text-center hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-widest mb-2">
                          Below
                        </p>
                        <p className="text-3xl font-bold text-red-700">{p.below}</p>
                        <p className="text-sm font-bold text-red-600 mt-2">{pct(p.below)}%</p>
                      </div>
                    </div>

                    {/* Progress bars - SAME LOGIC, IMPROVED DESIGN */}
                    <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                      <h4 className="font-semibold text-slate-900 mb-4">Distribution Overview</h4>
                      {[
                        { label: 'Exceeding', value: p.exceeding, total, color: 'bg-green-500', lightBg: 'bg-green-100' },
                        { label: 'Meeting', value: p.meeting, total, color: 'bg-blue-500', lightBg: 'bg-blue-100' },
                        { label: 'Approaching', value: p.approaching, total, color: 'bg-amber-500', lightBg: 'bg-amber-100' },
                        { label: 'Below', value: p.below, total, color: 'bg-red-500', lightBg: 'bg-red-100' },
                      ].map((item) => (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {item.value} ({pct(item.value)}%)
                            </span>
                          </div>
                          <div className={`h-3 ${item.lightBg} rounded-full overflow-hidden border border-slate-200 dark:border-slate-700`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                              style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                            />
                          </div>
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

  // CLASSES LIST VIEW - KEPT EXACT SAME LOGIC, IMPROVED DESIGN
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header - IMPROVED DESIGN */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Student Classes</h1>
              <p className="text-slate-600 dark:text-slate-400">Select a class to view details</p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 border border-slate-200 rounded-lg p-1 bg-white dark:bg-slate-900">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`gap-2 ${viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-100'}`}
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={`gap-2 ${viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-100'}`}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-56 rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 animate-pulse" />
            <div className="h-4 w-96 rounded-md bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 animate-pulse" />
          </div>

          {viewMode === 'grid' ? (
            <ClassCardsSkeleton mode="grid" rowCount={8} />
          ) : (
            <ClassCardsSkeleton mode="list" rowCount={6} />
          )}
        </div>
      ) : classes.length === 0 ? (

        // Empty State - IMPROVED DESIGN
        <Card className="border-slate-200 bg-white dark:bg-slate-900">
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No classes found</h3>
            <p className="text-slate-600 dark:text-slate-400">No classes are available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* GRID VIEW - SAME LOGIC, IMPROVED DESIGN */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classes.map((cls, idx) => {
                const colors = gradeColors[idx % gradeColors.length];
                const displayName = cls.stream_name ? `${cls.grade_level} ${cls.stream_name}` : cls.grade_level;

                return (
                  <Card
                    key={cls.id}
                    className={`cursor-pointer border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${!cls.is_active ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Header Section */}
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.icon}`}>
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={`text-xs ${colors.badge} border-0 font-semibold`}>
                            {cls.totalStudents} students
                          </Badge>
                          {!cls.is_active && (
                            <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-700 dark:text-slate-300">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Class Name */}
                      <div>
                        <h3 className={`font-bold text-lg ${colors.accent} mb-1`}>{displayName}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">Teacher:</span> {cls.classTeacher}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                        {cls.branch && (
                          <p>
                            <span className="font-semibold">Branch:</span> {cls.branch}
                          </p>
                        )}
                        {cls.capacity && (
                          <p>
                            <span className="font-semibold">Capacity:</span> {cls.capacity}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <Button
                          size="sm"
                          className={`w-full gap-2 text-white font-semibold ${colors.accent === 'text-blue-600' ? 'bg-blue-600 hover:bg-blue-700' : colors.accent === 'text-emerald-600' ? 'bg-emerald-600 hover:bg-emerald-700' : colors.accent === 'text-purple-600' ? 'bg-purple-600 hover:bg-purple-700' : colors.accent === 'text-orange-600' ? 'bg-orange-600 hover:bg-orange-700' : colors.accent === 'text-pink-600' ? 'bg-pink-600 hover:bg-pink-700' : colors.accent === 'text-teal-600' ? 'bg-teal-600 hover:bg-teal-700' : colors.accent === 'text-indigo-600' ? 'bg-indigo-600 hover:bg-indigo-700' : colors.accent === 'text-red-600' ? 'bg-red-600 hover:bg-red-700' : colors.accent === 'text-amber-600' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClass(cls);
                          }}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* LIST VIEW - SAME LOGIC, IMPROVED DESIGN */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {classes.map((cls, idx) => {
                const colors = gradeColors[idx % gradeColors.length];
                const displayName = cls.stream_name ? `${cls.grade_level} ${cls.stream_name}` : cls.grade_level;

                return (
                  <Card
                    key={cls.id}
                    className={`cursor-pointer border-2 ${colors.border} ${colors.bg} hover:shadow-md transition-all ${!cls.is_active ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedClass(cls)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left Section */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className={`font-bold text-lg ${colors.accent}`}>{displayName}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-semibold">Teacher:</span> {cls.classTeacher}
                            </p>
                          </div>
                        </div>

                        {/* Center Section */}
                        <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                          <div>
                            <p>
                              <span className="font-semibold">{cls.totalStudents}</span> Students
                            </p>
                          </div>
                          {cls.branch && (
                            <div>
                              <p>
                                <span className="font-semibold">Branch:</span> {cls.branch}
                              </p>
                            </div>
                          )}
                          {cls.capacity && (
                            <div>
                              <p>
                                <span className="font-semibold">Cap:</span> {cls.capacity}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                          {!cls.is_active && (
                            <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-700 dark:text-slate-300">
                              Inactive
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            className={`gap-2 text-white font-semibold ${colors.accent === 'text-blue-600' ? 'bg-blue-600 hover:bg-blue-700' : colors.accent === 'text-emerald-600' ? 'bg-emerald-600 hover:bg-emerald-700' : colors.accent === 'text-purple-600' ? 'bg-purple-600 hover:bg-purple-700' : colors.accent === 'text-orange-600' ? 'bg-orange-600 hover:bg-orange-700' : colors.accent === 'text-pink-600' ? 'bg-pink-600 hover:bg-pink-700' : colors.accent === 'text-teal-600' ? 'bg-teal-600 hover:bg-teal-700' : colors.accent === 'text-indigo-600' ? 'bg-indigo-600 hover:bg-indigo-700' : colors.accent === 'text-red-600' ? 'bg-red-600 hover:bg-red-700' : colors.accent === 'text-amber-600' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                          >
                            View
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentClasses;

