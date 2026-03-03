import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

const CalendarUI = CalendarPicker;
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, differenceInBusinessDays, isWithinInterval, parseISO, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarDays, Plus, Edit2, Trash2, Eye, AlertTriangle, CheckCircle2,
  Clock, CalendarIcon, BookOpen, FileText, Sparkles, Loader2
} from 'lucide-react';

const getApiUrl = () => {
  // Production: always use relative path → proxied by Vercel, no CORS
  if (import.meta.env.PROD) return '';
  // Development: use VITE_API_URL if set, otherwise fall back to Vite proxy
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

const API_URL = getApiUrl();

interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface Term {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  midtermDate?: string;
  closingDate: string;
  holidays: { date: string; name: string }[];
  notes: string;
  status: 'active' | 'upcoming' | 'completed';
  is_current: boolean;
  is_active: boolean;
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
  upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: Clock },
  completed: { label: 'Completed', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

function calcInstructionDays(start: string, end: string, holidays: { date: string }[]): number {
  const s = parseISO(start);
  const e = parseISO(end);
  let days = differenceInBusinessDays(e, s);
  holidays.forEach(h => {
    const hd = parseISO(h.date);
    if (isWithinInterval(hd, { start: s, end: e })) days--;
  });
  return Math.max(days, 0);
}

function detectConflicts(terms: Term[]): string[] {
  const warnings: string[] = [];
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const a = terms[i], b = terms[j];
      if (a.year !== b.year) continue;
      const aStart = parseISO(a.startDate), aEnd = parseISO(a.endDate);
      const bStart = parseISO(b.startDate), bEnd = parseISO(b.endDate);
      if (isBefore(aStart, bEnd) && isAfter(aEnd, bStart)) {
        warnings.push(`${a.name} and ${b.name} have overlapping dates.`);
      }
    }
  }
  return warnings;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('cbc_access_token');
};

const fetchAcademicYears = async (schoolId: string): Promise<AcademicYear[]> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms/school/${schoolId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch academic terms');
  }
  
  const data = await response.json();
  return data.data || [];
};

const fetchCurrentTerm = async (schoolId: string): Promise<AcademicYear | null> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms/school/${schoolId}/current`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.data || null;
};

const createAcademicTerm = async (termData: {
  school_id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_current?: boolean;
  is_active?: boolean;
}): Promise<AcademicYear> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(termData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create academic term');
  }
  
  const data = await response.json();
  return data.data;
};

const updateAcademicTerm = async (id: string, termData: {
  name?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  is_active?: boolean;
}): Promise<AcademicYear> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(termData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update academic term');
  }
  
  const data = await response.json();
  return data.data;
};

const setCurrentTerm = async (id: string): Promise<AcademicYear> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms/${id}/set-current`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set current term');
  }
  
  const data = await response.json();
  return data.data;
};

const toggleTermStatus = async (id: string): Promise<AcademicYear> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms/${id}/toggle-status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle term status');
  }
  
  const data = await response.json();
  return data.data;
};

const deleteAcademicTerm = async (id: string): Promise<void> => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/api/v1/academic-terms/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete academic term');
  }
};

const DatePickerField = ({ label, value, onChange }: { label: string; value?: string; onChange: (d: string) => void }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(parseISO(value), 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarUI
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(d) => d && onChange(format(d, 'yyyy-MM-dd'))}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
);

// Kenya CBC Calendar Configuration
const kenyaCBCCalendar = {
  term1: {
    name: 'Term 1',
    holidays: [
      { name: "New Year's Day", month: 0, day: 1 },
      { name: 'Midterm Break', month: 1, day: 14 },
      { name: 'Good Friday', month: 2, day: 7 },
    ],
  },
  term2: {
    name: 'Term 2',
    holidays: [
      { name: 'Labour Day', month: 4, day: 1 },
      { name: 'Madaraka Day', month: 5, day: 1 },
      { name: 'Midterm Break', month: 5, day: 16 },
    ],
  },
  term3: {
    name: 'Term 3',
    holidays: [
      { name: 'Huduma Day', month: 9, day: 10 },
      { name: 'Mashujaa Day', month: 9, day: 20 },
      { name: 'Midterm Break', month: 9, day: 14 },
      { name: 'Jamhuri Day', month: 11, day: 12 },
    ],
  },
};

const calculateHolidays = (year: number, holidays: { name: string; month: number; day: number }[]) => {
  return holidays.map(h => ({
    date: `${year}-${String(h.month + 1).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
    name: h.name,
  }));
};

const generateKenyaCBCTerms = (year: number) => {
  const terms = [];
  
  const term1Holidays = calculateHolidays(year, kenyaCBCCalendar.term1.holidays);
  terms.push({
    name: kenyaCBCCalendar.term1.name,
    year,
    startDate: `${year}-01-06`,
    endDate: `${year}-03-14`,
    holidays: term1Holidays,
  });

  const term2Holidays = calculateHolidays(year, kenyaCBCCalendar.term2.holidays);
  terms.push({
    name: kenyaCBCCalendar.term2.name,
    year,
    startDate: `${year}-04-29`,
    endDate: `${year}-07-25`,
    holidays: term2Holidays,
  });

  const term3Holidays = calculateHolidays(year, kenyaCBCCalendar.term3.holidays);
  terms.push({
    name: kenyaCBCCalendar.term3.name,
    year,
    startDate: `${year}-08-26`,
    endDate: `${year}-11-22`,
    holidays: term3Holidays,
  });

  return terms;
};

const Calendar = () => {
  const [userData, setUserData] = useState<{ schoolId: string | null; role: string } | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [currentTermId, setCurrentTermId] = useState<string | null>(null);
  const [detailTerm, setDetailTerm] = useState<Term | null>(null);
  const [editTerm, setEditTerm] = useState<Term | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('terms');
  const [actionLoading, setActionLoading] = useState(false);
  const [newTerm, setNewTerm] = useState<Partial<Term>>({ holidays: [], notes: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('cbc_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData({ schoolId: user.schoolId, role: user.role });
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  const loadAcademicTerms = useCallback(async () => {
    if (!userData?.schoolId) return;
    
    setLoading(true);
    try {
      const data = await fetchAcademicYears(userData.schoolId);
      
      const transformedTerms: Term[] = data.map(t => ({
        id: t.id,
        name: t.name,
        year: t.year,
        startDate: t.start_date,
        endDate: t.end_date,
        closingDate: t.end_date,
        holidays: [],
        notes: '',
        status: t.is_active ? (t.is_current ? 'active' : 'upcoming') : 'completed',
        is_current: t.is_current,
        is_active: t.is_active,
      }));
      
      setTerms(transformedTerms);
      
      const current = data.find((t: AcademicYear) => t.is_current);
      if (current) {
        setCurrentTermId(current.id);
        setSelectedYear(String(current.year));
      } else if (data.length > 0) {
        setSelectedYear(String(data[0].year));
      }
      
      const years = [...new Set(data.map((t: AcademicYear) => t.year))].sort((a, b) => b - a);
      setAvailableYears(years);
      
      if (years.length === 0) {
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear, currentYear + 1]);
        setSelectedYear(String(currentYear));
      }
    } catch (error) {
      console.error('Failed to load academic terms:', error);
      toast.error('Failed to load academic terms');
      const currentYear = new Date().getFullYear();
      setAvailableYears([currentYear, currentYear + 1]);
      setSelectedYear(String(currentYear));
    } finally {
      setLoading(false);
    }
  }, [userData?.schoolId]);

  useEffect(() => {
    if (userData?.schoolId) {
      loadAcademicTerms();
    }
  }, [userData?.schoolId, loadAcademicTerms]);

  const yearNum = parseInt(selectedYear);
  const filteredTerms = useMemo(() => terms.filter(t => t.year === yearNum), [terms, yearNum]);
  const conflicts = useMemo(() => detectConflicts(filteredTerms), [filteredTerms]);

  const handleAddTerm = async () => {
    if (!userData?.schoolId) {
      toast.error('School ID not found. Please login again.');
      return;
    }
    if (!newTerm.name || !newTerm.startDate || !newTerm.endDate) {
      toast.error('Please fill in Term Name, Start Date and End Date.');
      return;
    }
    if (isAfter(parseISO(newTerm.startDate!), parseISO(newTerm.endDate!))) {
      toast.error('Start date must be before end date.');
      return;
    }

    setActionLoading(true);
    try {
      const created = await createAcademicTerm({
        school_id: userData.schoolId,
        name: newTerm.name!,
        year: yearNum,
        start_date: newTerm.startDate!,
        end_date: newTerm.endDate!,
        is_current: false,
        is_active: true,
      });
      
      const newTermData: Term = {
        id: created.id,
        name: created.name,
        year: created.year,
        startDate: created.start_date,
        endDate: created.end_date,
        closingDate: created.end_date,
        holidays: [],
        notes: '',
        status: 'upcoming',
        is_current: created.is_current,
        is_active: created.is_active,
      };
      
      setTerms(prev => [...prev, newTermData]);
      
      if (!availableYears.includes(yearNum)) {
        setAvailableYears(prev => [...prev, yearNum].sort((a, b) => b - a));
      }
      
      setShowAddDialog(false);
      setNewTerm({ holidays: [], notes: '' });
      toast.success(`${created.name} added successfully.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add term');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (currentTermId === id) {
      toast.error('Cannot delete the current active term. Set another term as current first.');
      return;
    }
    
    setActionLoading(true);
    try {
      await deleteAcademicTerm(id);
      setTerms(prev => prev.filter(t => t.id !== id));
      toast.success('Term deleted.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete term');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTerm) return;
    if (isAfter(parseISO(editTerm.startDate), parseISO(editTerm.endDate))) {
      toast.error('Start date must be before end date.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await updateAcademicTerm(editTerm.id, {
        name: editTerm.name,
        year: editTerm.year,
        start_date: editTerm.startDate,
        end_date: editTerm.endDate,
      });
      
      setTerms(prev => prev.map(t => t.id === editTerm.id ? {
        ...t,
        name: updated.name,
        year: updated.year,
        startDate: updated.start_date,
        endDate: updated.end_date,
        closingDate: updated.end_date,
      } : t));
      
      setEditTerm(null);
      toast.success('Term updated.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update term');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetCurrent = async (id: string) => {
    setActionLoading(true);
    try {
      const updated = await setCurrentTerm(id);
      
      setTerms(prev => prev.map(t => ({
        ...t,
        is_current: t.id === id,
        status: t.id === id ? 'active' : (t.is_active ? 'upcoming' : 'completed'),
      })));
      
      setCurrentTermId(id);
      if (String(updated.year) !== selectedYear) {
        setSelectedYear(String(updated.year));
      }
      
      toast.success(`${updated.name} is now the current term.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set current term');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setActionLoading(true);
    try {
      const updated = await toggleTermStatus(id);
      
      setTerms(prev => prev.map(t => t.id === id ? {
        ...t,
        is_active: updated.is_active,
        status: updated.is_active ? (updated.is_current ? 'active' : 'upcoming') : 'completed',
      } : t));
      
      toast.success(`Term ${updated.is_active ? 'activated' : 'deactivated'}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle term status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!userData?.schoolId) {
      toast.error('School ID not found. Please login again.');
      return;
    }

    // Use selected year - allow generating if year has less than 3 terms
    const termsForYear = terms.filter(t => t.year === yearNum);
    
    if (termsForYear.length >= 3) {
      toast.info(`3 terms already exist for ${yearNum}. Please delete existing terms first or select a different year.`);
      return;
    }

    setActionLoading(true);
    try {
      // Only generate missing terms for this year
      const existingTermNames = termsForYear.map(t => t.name);
      const kenyaTerms = generateKenyaCBCTerms(yearNum).filter(
        kt => !existingTermNames.includes(kt.name)
      );
      
      if (kenyaTerms.length === 0) {
        toast.info(`All terms already exist for ${yearNum}.`);
        setActionLoading(false);
        return;
      }
      const newTerms: Term[] = [];
      
      for (let i = 0; i < kenyaTerms.length; i++) {
        const termData = {
          school_id: userData.schoolId,
          name: kenyaTerms[i].name,
          year: yearNum,
          start_date: kenyaTerms[i].startDate,
          end_date: kenyaTerms[i].endDate,
          is_current: i === 0,
          is_active: true,
        };
        
        const created = await createAcademicTerm(termData);
        newTerms.push({
          id: created.id,
          name: created.name,
          year: created.year,
          startDate: created.start_date,
          endDate: created.end_date,
          closingDate: created.end_date,
          holidays: kenyaTerms[i].holidays,
          notes: `Kenya CBC Calendar ${yearNum}. Includes ${kenyaTerms[i].holidays.length} holidays/breaks.`,
          status: created.is_current ? 'active' : 'upcoming',
          is_current: created.is_current,
          is_active: created.is_active,
        });
        
        if (created.is_current) {
          setCurrentTermId(created.id);
        }
      }
      
      setTerms(prev => [...prev.filter(t => t.year !== yearNum), ...newTerms]);
      
      if (!availableYears.includes(yearNum)) {
        setAvailableYears(prev => [...prev, yearNum].sort((a, b) => b - a));
      }
      
      toast.success(`Kenya CBC Calendar for ${yearNum} generated successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to auto-generate terms');
    } finally {
      setActionLoading(false);
    }
  };

  const totalDays = filteredTerms.reduce((sum, t) => sum + calcInstructionDays(t.startDate, t.endDate, t.holidays), 0);
  const activeTerm = filteredTerms.find(t => t.is_current);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading academic terms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Academic Terms Management</h1>
            <p className="text-muted-foreground mt-1">Configure term dates and academic years</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={(value) => {
              if (value === 'add-new') {
                const newYear = prompt('Enter year (e.g., 2025):');
                if (newYear && !isNaN(parseInt(newYear))) {
                  const year = parseInt(newYear);
                  if (!availableYears.includes(year)) {
                    setAvailableYears(prev => [...prev, year].sort((a, b) => b - a));
                  }
                  setSelectedYear(String(year));
                }
              } else {
                setSelectedYear(value);
              }
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y} Academic Year</SelectItem>
                ))}
                <SelectItem value="add-new">+ Add New Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleAutoGenerate} className="gap-2" disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="hidden sm:inline">Auto-Generate</span>
            </Button>
            <Button onClick={() => { setNewTerm({ holidays: [], notes: '' }); setShowAddDialog(true); }} className="gap-2" disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Term
            </Button>
          </div>
        </div>

        {conflicts.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Date Conflicts Detected</p>
                {conflicts.map((c, i) => <p key={i} className="text-sm text-destructive/80">{c}</p>)}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Academic Year</p>
                <p className="text-xl font-bold">{yearNum}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Terms</p>
                <p className="text-xl font-bold">{filteredTerms.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instruction Days</p>
                <p className="text-xl font-bold">{totalDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Term</p>
                <p className="text-xl font-bold">{activeTerm?.name || 'None'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="terms">Term Cards</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTerms.map(term => {
                const days = calcInstructionDays(term.startDate, term.endDate, term.holidays);
                const sc = statusConfig[term.status];
                return (
                  <Card key={term.id} className="group hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{term.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {term.is_current && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 gap-1">
                              <CheckCircle2 className="h-3 w-3" />Current
                            </Badge>
                          )}
                          <Badge className={cn('gap-1', sc.color)}><sc.icon className="h-3 w-3" />{sc.label}</Badge>
                        </div>
                      </div>
                      <CardDescription className="font-mono text-xs">Year {term.year}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Start Date</p>
                          <p className="font-medium">{format(parseISO(term.startDate), 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">End Date</p>
                          <p className="font-medium">{format(parseISO(term.endDate), 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Instruction Days</p>
                          <p className="font-bold text-primary">{days} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Status</p>
                          <p className="font-medium">{term.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setDetailTerm(term)}>
                          <Eye className="h-3.5 w-3.5" />View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setEditTerm({ ...term })}>
                          <Edit2 className="h-3.5 w-3.5" />Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDeleteTerm(term.id)} disabled={actionLoading}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {!term.is_current && term.is_active && (
                        <Button variant="outline" size="sm" className="w-full gap-1 text-amber-600 hover:text-amber-700" onClick={() => handleSetCurrent(term.id)} disabled={actionLoading}>
                          <CheckCircle2 className="h-3.5 w-3.5" />Set as Current
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {filteredTerms.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No terms configured for {yearNum}</p>
                  <p className="text-sm mt-1">Click "Add Term" or "Auto-Generate" to get started.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerms.map(term => {
                    const sc = statusConfig[term.status];
                    return (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell>{format(parseISO(term.startDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(term.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="font-bold text-primary">{calcInstructionDays(term.startDate, term.endDate, term.holidays)}</TableCell>
                        <TableCell>
                          {term.is_current ? (
                            <Badge className="bg-amber-100 text-amber-800">Current</Badge>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleSetCurrent(term.id)} disabled={actionLoading}>Set</Button>
                          )}
                        </TableCell>
                        <TableCell><Badge className={cn('gap-1', sc.color)}>{sc.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailTerm(term)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTerm({ ...term })}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTerm(term.id)} disabled={actionLoading}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  {filteredTerms.map((term, i) => {
                    const sc = statusConfig[term.status];
                    return (
                      <div key={term.id} className="flex gap-4 pb-8 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold', term.is_current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                            {i + 1}
                          </div>
                          {i < filteredTerms.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{term.name}</h3>
                            {term.is_current && <Badge className="bg-amber-100 text-amber-800 text-xs">Current</Badge>}
                            <Badge className={cn('gap-1 text-xs', sc.color)}>{sc.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(term.startDate), 'MMM d')} — {format(parseISO(term.endDate), 'MMM d, yyyy')} · {calcInstructionDays(term.startDate, term.endDate, term.holidays)} instruction days
                          </p>
                          {term.notes && <p className="text-xs text-muted-foreground mt-1">{term.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!detailTerm} onOpenChange={() => setDetailTerm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailTerm?.name} Details</DialogTitle>
            <DialogDescription>Academic term for {detailTerm?.year}</DialogDescription>
          </DialogHeader>
          {detailTerm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Start Date</p><p className="font-medium">{format(parseISO(detailTerm.startDate), 'PPP')}</p></div>
                <div><p className="text-muted-foreground text-xs">End Date</p><p className="font-medium">{format(parseISO(detailTerm.endDate), 'PPP')}</p></div>
                <div><p className="text-muted-foreground text-xs">Instruction Days</p><p className="font-bold text-primary">{calcInstructionDays(detailTerm.startDate, detailTerm.endDate, detailTerm.holidays)}</p></div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {detailTerm.is_current && <Badge className="bg-amber-100 text-amber-800">Current</Badge>}
                    <Badge className={cn('gap-1', statusConfig[detailTerm.status].color)}>{statusConfig[detailTerm.status].label}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTerm} onOpenChange={() => setEditTerm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editTerm?.name}</DialogTitle>
            <DialogDescription>Update term dates and details</DialogDescription>
          </DialogHeader>
          {editTerm && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Term Name</Label>
                <Input value={editTerm.name} onChange={e => setEditTerm({ ...editTerm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DatePickerField label="Start Date" value={editTerm.startDate} onChange={d => setEditTerm({ ...editTerm, startDate: d })} />
                <DatePickerField label="End Date" value={editTerm.endDate} onChange={d => setEditTerm({ ...editTerm, endDate: d, closingDate: d })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTerm(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Term</DialogTitle>
            <DialogDescription>Create a new academic term for {yearNum}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Term Name</Label>
              <Select value={newTerm.name || ''} onValueChange={v => setNewTerm({ ...newTerm, name: v })}>
                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField label="Start Date" value={newTerm.startDate} onChange={d => setNewTerm({ ...newTerm, startDate: d })} />
              <DatePickerField label="End Date" value={newTerm.endDate} onChange={d => setNewTerm({ ...newTerm, endDate: d })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={newTerm.notes || ''} onChange={e => setNewTerm({ ...newTerm, notes: e.target.value })} rows={3} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTerm} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
