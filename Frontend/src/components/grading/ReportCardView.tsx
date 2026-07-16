import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, Download, Printer, TrendingUp, Award,
  BookOpen, Users, User,
  FileText, AlertCircle, RefreshCw, Eye, EyeOff
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

interface SubjectAssessment {
  id: string;
  subject_name: string;
  total_score: number;
  max_score: number;
  grade_code: string;
  competency_level: string;
  teacher_remarks: string;
}

interface ReportCardFull {
  id: string;
  learner_id: string;
  class_name: string;
  school_name: string;
  school_address: string;
  logo_url: string;
  term_name: string;
  academic_year_name: string;
  total_score: number;
  average_score: number;
  overall_grade: string;
  subject_count: number;
  teacher_comments: string;
  principal_comments: string;
  attendance_summary: any;
  is_finalized: boolean;
  promotion_decision: string;
  promotion_notes: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  photo_url: string;
  grade_level: string;
  subjects: SubjectAssessment[];
}

const GRADE_COLORS: Record<string, string> = {
  EE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
  AE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  ME: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  BE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
};

const GRADE_BG_COLORS: Record<string, string> = {
  EE: '#10B981',
  AE: '#3B82F6',
  ME: '#F59E0B',
  BE: '#EF4444',
};

export default function ReportCardView({ learnerId: propLearnerId }: { learnerId?: string }) {
  const { user } = useAuth();
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [fullReport, setFullReport] = useState<ReportCardFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const learnerId = propLearnerId || user?.id;

  useEffect(() => {
    loadData();
  }, [learnerId]);

  async function loadData() {
    if (!learnerId) return;
    try {
      setLoading(true);
      setError(null);
      const reportData = await apiFetch(`/api/v1/grading/report-cards?learner_id=${learnerId}`);
      const reports = reportData.data || [];
      setReportCards(reports);
      if (reports.length > 0) {
        setSelectedReportId(reports[0].id);
      }
    } catch (err: any) {
      setError('Failed to load report cards');
      toast.error('Failed to load report cards');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedReportId) { setFullReport(null); return; }
    (async () => {
      try {
        const data = await apiFetch(`/api/v1/grading/report-cards/${selectedReportId}/full`);
        setFullReport(data.data);
      } catch {
        toast.error('Failed to load report details');
      }
    })();
  }, [selectedReportId]);

  function getGradeColor(grade: string) {
    return GRADE_COLORS[grade] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    if (!fullReport?.subjects) return;
    const headers = 'Subject,Score,Max Score,Grade,Competency Level,Remarks\n';
    const rows = fullReport.subjects.map(s =>
      `"${s.subject_name}",${s.total_score},${s.max_score},"${s.grade_code}","${s.competency_level}","${(s.teacher_remarks || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-card-${fullReport.admission_number}-${fullReport.term_name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading report cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load Reports</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadData}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
      </div>
    );
  }

  if (reportCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Report Cards Yet</h2>
        <p className="text-muted-foreground max-w-md">
          {isStudent
            ? "Your report cards will appear here once your teachers submit assessments."
            : isParent
              ? "Your child's report cards will appear here once teachers submit assessments."
              : "Report cards will appear here once teachers submit assessments."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto min-w-0 print:p-0 print:max-w-none">
      {/* Header — hidden when printing */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap print:hidden">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Report Cards</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isStudent ? 'Your assessment reports' : isParent ? "Your child's assessment reports" : 'CBC competency-based assessment reports'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          <Select value={selectedReportId || ''} onValueChange={setSelectedReportId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              {reportCards.map(rc => (
                <SelectItem key={rc.id} value={rc.id}>
                  {rc.term_name || 'Term'} - {rc.academic_year_name || ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handlePrint} title="Print report">
            <Printer className="w-4 h-4" />
          </Button>
          {fullReport?.subjects && (
            <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export as CSV">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {fullReport && (
        <div className="space-y-6 print:space-y-4">
          {/* Print Header */}
          <div className="hidden print:block text-center mb-4">
            <h1 className="text-xl font-bold">{fullReport.school_name}</h1>
            <p className="text-sm">{fullReport.school_address}</p>
            <hr className="my-2" />
            <h2 className="text-lg font-semibold">CBC REPORT CARD</h2>
            <p className="text-sm">{fullReport.term_name} - {fullReport.academic_year_name}</p>
          </div>

          {/* Student Info Card */}
          <Card className="w-full overflow-hidden print:border print:shadow-none">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 flex-wrap">
                {fullReport.photo_url ? (
                  <img
                    src={fullReport.photo_url}
                    alt="Student"
                    className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-muted"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold break-words">{fullReport.first_name} {fullReport.last_name}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground flex-wrap">
                    <span>{fullReport.class_name}</span>
                    <span className="hidden sm:inline">&middot;</span>
                    <span>{fullReport.school_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground flex-wrap mt-1">
                    <span>Admission: {fullReport.admission_number}</span>
                    {fullReport.date_of_birth && (
                      <>
                        <span className="hidden sm:inline">&middot;</span>
                        <span>DOB: {fullReport.date_of_birth}</span>
                      </>
                    )}
                    <span className="hidden sm:inline">&middot;</span>
                    <span>{fullReport.term_name} - {fullReport.academic_year_name}</span>
                  </div>
                </div>
                <div className="text-center sm:text-right shrink-0 w-full sm:w-auto">
                  <div className="text-3xl sm:text-4xl font-bold">{fullReport.average_score?.toFixed(1)}%</div>
                  <Badge className={`${getGradeColor(fullReport.overall_grade)} mt-1 text-sm px-3 py-1`}>
                    {fullReport.overall_grade}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Overall Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance Table */}
          <Card className="w-full overflow-hidden print:border print:shadow-none">
            <CardHeader className="pb-0 print:pb-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary shrink-0" />
                  Subject Performance
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs print:hidden"
                >
                  {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {showDetails ? 'Hide details' : 'Show details'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm print:text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Subject</th>
                      <th className="text-center p-3 font-semibold">Score</th>
                      <th className="text-center p-3 font-semibold">Grade</th>
                      <th className={`text-center p-3 font-semibold ${showDetails ? '' : 'hidden'}`}>Competency</th>
                      <th className={`text-left p-3 font-semibold ${showDetails ? '' : 'hidden'}`}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullReport.subjects?.map((subj: any) => (
                      <tr key={subj.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium break-words min-w-0 max-w-[150px] sm:max-w-none">
                          {subj.subject_name || 'N/A'}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">{subj.total_score}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="secondary"
                            className={getGradeColor(subj.grade_code)}
                          >
                            {subj.grade_code}
                          </Badge>
                        </td>
                        <td className={`p-3 text-center text-muted-foreground ${showDetails ? '' : 'hidden'}`}>
                          {subj.competency_level || '-'}
                        </td>
                        <td className={`p-3 text-muted-foreground ${showDetails ? '' : 'hidden'}`}>
                          <span className="block max-w-[200px] truncate" title={subj.teacher_remarks}>
                            {subj.teacher_remarks || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="w-full min-w-0 print:border print:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Class Teacher's Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {fullReport.teacher_comments || 'No comments yet.'}
                </p>
              </CardContent>
            </Card>
            <Card className="w-full min-w-0 print:border print:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Principal's Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {fullReport.principal_comments || 'No comments yet.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card className="w-full overflow-hidden print:border print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Overall Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Score', value: fullReport.total_score?.toFixed(1) },
                  { label: 'Average Score', value: `${fullReport.average_score?.toFixed(1)}%` },
                  {
                    label: 'Overall Grade',
                    value: fullReport.overall_grade,
                    color: GRADE_BG_COLORS[fullReport.overall_grade],
                  },
                  { label: 'Subjects', value: fullReport.subject_count },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p
                      className="text-xl font-bold mt-1"
                      style={item.color ? { color: item.color } : undefined}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {fullReport.promotion_decision && (
                <Alert className="mt-4">
                  <Award className="w-4 h-4" />
                  <AlertDescription>
                    <span className="font-medium">Promotion:</span>{' '}
                    <Badge variant={
                      fullReport.promotion_decision === 'promoted' ? 'default' :
                      fullReport.promotion_decision === 'probation' ? 'secondary' : 'destructive'
                    }>
                      {fullReport.promotion_decision}
                    </Badge>
                    {fullReport.promotion_notes && (
                      <span className="ml-2 text-muted-foreground">- {fullReport.promotion_notes}</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!fullReport.is_finalized && (
                <Alert className="mt-4" variant="default">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <AlertDescription>
                    This report is pending finalization. Scores may change.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Print Footer */}
          <div className="hidden print:block text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
            <p>Generated by NONEAA CBC Education System</p>
            <p>Report for {fullReport.first_name} {fullReport.last_name} - {fullReport.admission_number}</p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white; font-size: 12pt; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}
