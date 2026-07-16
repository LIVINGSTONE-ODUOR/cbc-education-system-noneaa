import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, TrendingUp, TrendingDown, Users, BookOpen,
  Award, Download, RefreshCw, AlertCircle, BarChart3,
  PieChart, School, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('cbe_access_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
  return data;
}

const GRADE_BAR_COLORS: Record<string, string> = {
  EE: '#10B981',
  AE: '#3B82F6',
  ME: '#F59E0B',
  BE: '#EF4444',
};

export default function GradingAnalytics() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFilters();
  }, []);

  async function loadFilters() {
    try {
      setError(null);
      const [classesData, termsData] = await Promise.all([
        apiFetch('/api/v1/classes'),
        apiFetch('/api/v1/academic-terms'),
      ]);
      setClasses(classesData.data || []);
      setTerms(termsData.data || []);
    } catch {
      setError('Failed to load filters');
    }
  }

  useEffect(() => {
    if (!selectedClassId || !selectedTermId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch(`/api/v1/grading/analytics/class/${selectedClassId}?academic_term_id=${selectedTermId}`);
        setAnalytics(data.data);
      } catch (err: any) {
        setError('Failed to load analytics');
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClassId, selectedTermId]);

  function exportAllCSV() {
    if (!analytics) return;

    // Grade distribution
    const gradeCSV = 'Grade,Students,Percentage\n' +
      (analytics.gradeDistribution || []).map((g: any) =>
        `"${g.grade_code}",${g.count},${g.percentage}`
      ).join('\n');

    // Subject performance
    const subjectCSV = '\n\nSubject,Average,Min,Max\n' +
      (analytics.subjectPerformance || []).map((s: any) =>
        `"${s.subject_name}",${s.avg_score},${s.min_score},${s.max_score}`
      ).join('\n');

    // Top learners
    const learnerCSV = '\n\nRank,Name,Admission,Average,Subjects\n' +
      (analytics.topLearners || []).map((l: any, i: number) =>
        `${i + 1},"${l.first_name} ${l.last_name}","${l.admission_number}",${l.average_score},${l.subjects_assessed}`
      ).join('\n');

    const blob = new Blob([gradeCSV + subjectCSV + learnerCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-analytics-${selectedClassId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getGradeBarColor(grade: string) {
    return GRADE_BAR_COLORS[grade] || '#6B7280';
  }

  const hasData = analytics?.gradeDistribution?.length > 0 ||
    analytics?.subjectPerformance?.length > 0 ||
    analytics?.topLearners?.length > 0;

  const totalStudents = analytics?.topLearners?.length || 0;
  const totalAttendance = analytics?.attendance?.reduce((s: number, a: any) => s + a.count, 0) || 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Grading Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Class performance analysis, grade distribution, and learner insights
          </p>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0 w-full sm:w-auto">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name || `${c.grade_level || ''} ${c.stream_name || ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {analytics && hasData && (
            <Button variant="outline" size="icon" onClick={exportAllCSV} title="Export all data">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {(!selectedClassId || !selectedTermId) && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4 border-2 border-dashed rounded-xl border-muted-foreground/20">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
          <h2 className="text-lg font-semibold mb-2">Select a Class & Term</h2>
          <p className="text-muted-foreground max-w-md">
            Choose a class and academic term above to view performance analytics, grade distribution, and learner insights.
          </p>
        </div>
      )}

      {/* Loading */}
      {selectedClassId && selectedTermId && loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading analytics...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to Load Analytics</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => { setError(null); setLoading(true); }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      )}

      {/* Analytics Content */}
      {selectedClassId && selectedTermId && !loading && !error && analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: Users,
                label: 'Students Assessed',
                value: totalStudents,
                color: 'bg-blue-100 dark:bg-blue-900/50',
                iconColor: 'text-blue-600 dark:text-blue-300',
              },
              {
                icon: BookOpen,
                label: 'Subjects',
                value: analytics.subjectPerformance?.length || 0,
                color: 'bg-green-100 dark:bg-green-900/50',
                iconColor: 'text-green-600 dark:text-green-300',
              },
              {
                icon: Award,
                label: 'Grade Levels',
                value: analytics.gradeDistribution?.length || 0,
                color: 'bg-purple-100 dark:bg-purple-900/50',
                iconColor: 'text-purple-600 dark:text-purple-300',
              },
              {
                icon: School,
                label: 'Attendance Records',
                value: totalAttendance,
                color: 'bg-amber-100 dark:bg-amber-900/50',
                iconColor: 'text-amber-600 dark:text-amber-300',
              },
            ].map(item => (
              <Card key={item.label} className="w-full min-w-0">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                      <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                      <p className="text-lg sm:text-xl font-bold">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Grade Distribution */}
          <Card className="w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="w-5 h-5 text-primary" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.gradeDistribution?.length > 0 ? (
                <div className="space-y-4">
                  {/* Visual bar chart */}
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    {analytics.gradeDistribution.map((g: any) => (
                      <div
                        key={g.grade_code}
                        className="flex items-center justify-center text-xs font-bold text-white transition-all duration-500"
                        style={{
                          width: `${g.percentage}%`,
                          backgroundColor: getGradeBarColor(g.grade_code),
                          minWidth: g.percentage > 5 ? undefined : 0,
                        }}
                        title={`${g.grade_code}: ${g.count} students (${g.percentage}%)`}
                      >
                        {g.percentage > 8 ? `${g.grade_code} (${g.percentage}%)` : ''}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {analytics.gradeDistribution.map((g: any) => (
                      <div key={g.grade_code} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                        <div
                          className="w-3 h-3 rounded shrink-0"
                          style={{ backgroundColor: getGradeBarColor(g.grade_code) }}
                        />
                        <span className="font-medium">{g.grade_code}</span>
                        <span className="text-muted-foreground ml-auto">{g.count} ({g.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No grade data available</p>
              )}
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card className="w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {analytics.subjectPerformance?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold">Subject</th>
                        <th className="text-center p-3 font-semibold">Average</th>
                        <th className="text-center p-3 font-semibold">Min</th>
                        <th className="text-center p-3 font-semibold">Max</th>
                        <th className="text-center p-3 font-semibold hidden sm:table-cell">Performance Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.subjectPerformance.map((s: any) => (
                        <tr key={s.subject_name} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-medium break-words min-w-0 max-w-[150px] sm:max-w-none">
                            {s.subject_name}
                          </td>
                          <td className="p-3 text-center font-semibold">{s.avg_score}</td>
                          <td className="p-3 text-center text-muted-foreground">{s.min_score}</td>
                          <td className="p-3 text-center text-muted-foreground">{s.max_score}</td>
                          <td className="p-3 hidden sm:table-cell">
                            <div className="flex items-center gap-2 max-w-[150px] mx-auto">
                              <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${Math.min(100, s.avg_score)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">
                                {s.avg_score}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No subject performance data</p>
              )}
            </CardContent>
          </Card>

          {/* Top Learners */}
          <Card className="w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {analytics.topLearners?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-semibold w-12">#</th>
                        <th className="text-left p-3 font-semibold">Name</th>
                        <th className="text-center p-3 font-semibold hidden sm:table-cell">Admission</th>
                        <th className="text-center p-3 font-semibold">Average</th>
                        <th className="text-center p-3 font-semibold hidden md:table-cell">Subjects</th>
                        <th className="text-center p-3 font-semibold hidden lg:table-cell">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topLearners.map((l: any, i: number) => (
                        <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                              i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                              i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {i + 1}
                            </div>
                          </td>
                          <td className="p-3 font-medium break-words min-w-0">
                            {l.first_name} {l.last_name}
                          </td>
                          <td className="p-3 text-center text-muted-foreground hidden sm:table-cell">
                            {l.admission_number}
                          </td>
                          <td className="p-3 text-center font-semibold">{l.average_score}</td>
                          <td className="p-3 text-center text-muted-foreground hidden md:table-cell">
                            {l.subjects_assessed}
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2 max-w-[100px] mx-auto">
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, l.average_score)}%`,
                                    backgroundColor:
                                      l.average_score >= 75 ? '#10B981' :
                                      l.average_score >= 50 ? '#3B82F6' :
                                      l.average_score >= 25 ? '#F59E0B' : '#EF4444',
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No learner performance data</p>
              )}
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          {analytics.attendance?.length > 0 && (
            <Card className="w-full overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Attendance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  {analytics.attendance.map((a: any) => (
                    <Badge key={a.status} variant="secondary" className="text-sm px-3 py-1.5">
                      {a.status}: {a.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data */}
          {!hasData && (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
              <TrendingDown className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No assessment data available for the selected class and term</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
