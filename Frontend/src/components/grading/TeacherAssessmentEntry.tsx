import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import {
  Save, CheckCircle2, AlertCircle, Loader2, Search,
  RefreshCw, BookOpen
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

interface Learner {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface LearningArea {
  id: string;
  name: string;
  code: string;
}

interface CompetencyArea {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Term {
  id: string;
  name: string;
}

const GRADE_RANGES = [
  { code: 'EE', name: 'Exceeding Expectation', min: 75, max: 100, color: '#10B981' },
  { code: 'AE', name: 'Above Expectation', min: 50, max: 74, color: '#3B82F6' },
  { code: 'ME', name: 'Meeting Expectation', min: 25, max: 49, color: '#F59E0B' },
  { code: 'BE', name: 'Below Expectation', min: 0, max: 24, color: '#EF4444' },
];

function getGradeInfo(score: number) {
  return GRADE_RANGES.find(r => score >= r.min && score <= r.max) || GRADE_RANGES[GRADE_RANGES.length - 1];
}

export default function TeacherAssessmentEntry() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [competencyAreas, setCompetencyAreas] = useState<CompetencyArea[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedLearner, setSelectedLearner] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [score, setScore] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);
      const [classesData, areasData, termsData] = await Promise.all([
        apiFetch('/api/v1/classes'),
        apiFetch('/api/v1/curriculum/learning-areas'),
        apiFetch('/api/v1/academic-terms'),
      ]);
      setClasses(classesData.data || []);
      // Normalize learning areas - handle both array and nested data
      const areas = Array.isArray(areasData.data)
        ? areasData.data
        : areasData.data?.learning_areas || [];
      setLearningAreas(areas);
      setTerms(termsData.data || []);
    } catch (err: any) {
      setError('Failed to load initial data');
      toast.error('Failed to load assessment data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedClass) { setLearners([]); return; }
    (async () => {
      try {
        const data = await apiFetch(`/api/v1/learners?class_id=${selectedClass}`);
        setLearners(data.data || []);
        setSearchTerm('');
      } catch {
        toast.error('Failed to load learners');
      }
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedArea) { setCompetencyAreas([]); return; }
    (async () => {
      try {
        const data = await apiFetch(`/api/v1/curriculum/learning-areas/${selectedArea}/strands`);
        const areas = (data.data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code || '',
          type: 'strand',
        }));
        setCompetencyAreas(areas);
      } catch {
        toast.error('Failed to load strands');
      }
    })();
  }, [selectedArea]);

  const scoreNum = parseFloat(score) || 0;
  const gradeInfo = score ? getGradeInfo(scoreNum) : null;
  const isValidScore = !score || (scoreNum >= 0 && scoreNum <= 100);
  const canSave = selectedLearner && selectedArea && selectedCompetency && selectedTerm && score && isValidScore;

  async function handleSave() {
    if (!canSave) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      await apiFetch('/api/v1/grading/competency-assessments', {
        method: 'POST',
        body: JSON.stringify({
          learner_id: selectedLearner,
          class_id: selectedClass || undefined,
          learning_area_id: selectedArea,
          competency_area_id: selectedCompetency,
          academic_term_id: selectedTerm,
          score: scoreNum,
          teacher_remarks: remarks || undefined,
        }),
      });
      toast.success('Assessment saved successfully');
      setScore('');
      setRemarks('');
      setLastSaved(new Date());
      setRetryCount(0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save assessment');
      setRetryCount(c => c + 1);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setSelectedLearner('');
      setScore('');
      setRemarks('');
    }
  }

  const handleRetry = useCallback(() => loadInitialData(), []);

  const filteredLearners = learners.filter(l =>
    `${l.first_name} ${l.last_name} ${l.admission_number}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Assessment Entry</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter CBC competency-based assessment scores
            {lastSaved && <span className="ml-2 text-green-600 text-xs">Last saved: {lastSaved.toLocaleTimeString()}</span>}
          </p>
        </div>
        {lastSaved && (
          <Badge variant="secondary" className="text-xs shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" /> Ready
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selection Panel */}
        <Card className="lg:col-span-1 w-full min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Assessment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Class</Label>
              <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedLearner(''); }}>
                <SelectTrigger className="w-full">
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
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Learner</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or admission..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={selectedLearner} onValueChange={setSelectedLearner}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select learner" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {filteredLearners.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      {searchTerm ? 'No learners found' : 'Select a class first'}
                    </div>
                  ) : (
                    filteredLearners.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        <span className="truncate block max-w-[200px]">
                          {l.first_name} {l.last_name}
                          <span className="text-muted-foreground ml-1">({l.admission_number})</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Learning Area</Label>
              <Select value={selectedArea} onValueChange={v => { setSelectedArea(v); setSelectedCompetency(''); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {learningAreas.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Strand / Competency</Label>
              <Select value={selectedCompetency} onValueChange={setSelectedCompetency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedArea ? "Select strand" : "Select area first"} />
                </SelectTrigger>
                <SelectContent>
                  {competencyAreas.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Academic Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">
                Score (0-100)
                {gradeInfo && (
                  <Badge
                    className="ml-2 text-xs"
                    style={{ backgroundColor: gradeInfo.color, color: '#fff' }}
                  >
                    {gradeInfo.code}
                  </Badge>
                )}
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="Enter score"
                className={`w-full ${!isValidScore && score ? 'border-destructive' : ''}`}
                autoFocus
              />
              {!isValidScore && score && (
                <p className="text-xs text-destructive mt-1">Score must be between 0 and 100</p>
              )}
              {gradeInfo && (
                <p className="text-xs text-muted-foreground mt-1">{gradeInfo.name} ({gradeInfo.min}-{gradeInfo.max})</p>
              )}
            </div>

            <div className="space-y-2 min-w-0">
              <Label className="text-sm font-medium">Teacher Remarks</Label>
              <Textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional: add remarks about this assessment..."
                rows={3}
                className="w-full resize-none"
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={saving || !canSave}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Assessment</>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Ctrl+Enter to save &middot; Esc to clear
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grading Guide */}
        <Card className="lg:col-span-2 w-full min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              CBC Grading Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {GRADE_RANGES.map(grade => (
                <Card key={grade.code} className="w-full overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: grade.color }} />
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: grade.color }}
                      >
                        {grade.code}
                      </div>
                      <span className="font-medium text-xs sm:text-sm truncate">{grade.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Range: {grade.min}–{grade.max}</p>
                    {selectedLearner && score && gradeInfo?.code === grade.code && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> Current selection
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Score Preview */}
            {selectedLearner && score && gradeInfo && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: gradeInfo.color }}
                  >
                    {gradeInfo.code}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Score: {scoreNum}/100</p>
                    <p className="text-xs text-muted-foreground">
                      {gradeInfo.name} &middot; Grade: {gradeInfo.code}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4">
              <h3 className="font-medium text-sm mb-3">Quick Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Scores auto-grade using the school's grading scheme</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Edit scores before admin approval</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Add remarks to provide context for each assessment</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Saved per learner, per strand, per term</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
