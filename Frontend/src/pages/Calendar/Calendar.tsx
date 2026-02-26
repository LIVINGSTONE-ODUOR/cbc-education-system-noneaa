import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

// Alias for use in DatePickerField
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
  Clock, CalendarIcon, ChevronRight, BookOpen, FileText, Sparkles, Info
} from 'lucide-react';

// Types
interface AcademicYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'closed';
}

interface Term {
  id: string;
  name: string;
  code: string;
  academicYear: number;
  startDate: string;
  endDate: string;
  midtermDate?: string;
  closingDate: string;
  holidays: { date: string; name: string }[];
  notes: string;
  status: 'active' | 'upcoming' | 'completed';
}

// Mock Data
const mockYears: AcademicYear[] = [
  { id: '1', year: 2025, startDate: '2025-01-06', endDate: '2025-11-28', status: 'active' },
  { id: '2', year: 2026, startDate: '2026-01-05', endDate: '2026-11-27', status: 'upcoming' },
  { id: '3', year: 2024, startDate: '2024-01-08', endDate: '2024-11-29', status: 'closed' },
];

const mockTerms: Term[] = [
  {
    id: '1', name: 'Term 1', code: 'TRM1-2025', academicYear: 2025,
    startDate: '2025-01-06', endDate: '2025-04-04', midtermDate: '2025-02-14',
    closingDate: '2025-04-04',
    holidays: [{ date: '2025-02-14', name: 'Midterm Break Start' }, { date: '2025-02-21', name: 'Midterm Break End' }],
    notes: 'Standard CBC Term 1 schedule.', status: 'completed',
  },
  {
    id: '2', name: 'Term 2', code: 'TRM2-2025', academicYear: 2025,
    startDate: '2025-04-28', endDate: '2025-08-01', midtermDate: '2025-06-06',
    closingDate: '2025-08-01',
    holidays: [{ date: '2025-05-01', name: 'Labour Day' }, { date: '2025-06-01', name: 'Madaraka Day' }],
    notes: 'Includes national assessment week in July.', status: 'active',
  },
  {
    id: '3', name: 'Term 3', code: 'TRM3-2025', academicYear: 2025,
    startDate: '2025-08-25', endDate: '2025-11-28', midtermDate: '2025-10-10',
    closingDate: '2025-11-28',
    holidays: [{ date: '2025-10-10', name: 'Huduma Day' }, { date: '2025-10-20', name: 'Mashujaa Day' }],
    notes: 'Final term with end-of-year assessments.', status: 'upcoming',
  },
  {
    id: '4', name: 'Term 1', code: 'TRM1-2026', academicYear: 2026,
    startDate: '2026-01-05', endDate: '2026-04-03', midtermDate: '2026-02-13',
    closingDate: '2026-04-03', holidays: [], notes: '', status: 'upcoming',
  },
  {
    id: '5', name: 'Term 2', code: 'TRM2-2026', academicYear: 2026,
    startDate: '2026-04-27', endDate: '2026-07-31', closingDate: '2026-07-31',
    holidays: [], notes: '', status: 'upcoming',
  },
  {
    id: '6', name: 'Term 3', code: 'TRM3-2026', academicYear: 2026,
    startDate: '2026-08-24', endDate: '2026-11-27', closingDate: '2026-11-27',
    holidays: [], notes: '', status: 'upcoming',
  },
];

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
      if (a.academicYear !== b.academicYear) continue;
      const aStart = parseISO(a.startDate), aEnd = parseISO(a.endDate);
      const bStart = parseISO(b.startDate), bEnd = parseISO(b.endDate);
      if (isBefore(aStart, bEnd) && isAfter(aEnd, bStart)) {
        warnings.push(`${a.name} and ${b.name} have overlapping dates.`);
      }
    }
  }
  return warnings;
}

// Date Picker helper
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

const Calendar = () => {
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [terms, setTerms] = useState<Term[]>(mockTerms);
  const [years] = useState<AcademicYear[]>(mockYears);
  const [detailTerm, setDetailTerm] = useState<Term | null>(null);
  const [editTerm, setEditTerm] = useState<Term | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('terms');

  const yearNum = parseInt(selectedYear);
  const filteredTerms = useMemo(() => terms.filter(t => t.academicYear === yearNum), [terms, yearNum]);
  const currentYear = years.find(y => y.year === yearNum);
  const conflicts = useMemo(() => detectConflicts(filteredTerms), [filteredTerms]);

  const [newTerm, setNewTerm] = useState<Partial<Term>>({ academicYear: yearNum, holidays: [], notes: '' });

  const handleAddTerm = () => {
    if (!newTerm.name || !newTerm.startDate || !newTerm.endDate) {
      toast.error('Please fill in Term Name, Start Date and End Date.');
      return;
    }
    if (isAfter(parseISO(newTerm.startDate!), parseISO(newTerm.endDate!))) {
      toast.error('Start date must be before end date.');
      return;
    }
    const term: Term = {
      id: crypto.randomUUID(),
      name: newTerm.name!,
      code: `TRM${filteredTerms.length + 1}-${yearNum}`,
      academicYear: yearNum,
      startDate: newTerm.startDate!,
      endDate: newTerm.endDate!,
      midtermDate: newTerm.midtermDate,
      closingDate: newTerm.endDate!,
      holidays: [],
      notes: newTerm.notes || '',
      status: 'upcoming',
    };
    setTerms(prev => [...prev, term]);
    setShowAddDialog(false);
    setNewTerm({ academicYear: yearNum, holidays: [], notes: '' });
    toast.success(`${term.name} added successfully.`);
  };

  const handleDeleteTerm = (id: string) => {
    setTerms(prev => prev.filter(t => t.id !== id));
    toast.success('Term deleted.');
  };

  const handleSaveEdit = () => {
    if (!editTerm) return;
    if (isAfter(parseISO(editTerm.startDate), parseISO(editTerm.endDate))) {
      toast.error('Start date must be before end date.');
      return;
    }
    setTerms(prev => prev.map(t => t.id === editTerm.id ? editTerm : t));
    setEditTerm(null);
    toast.success('Term updated.');
  };

  const handleAutoGenerate = () => {
    if (filteredTerms.length >= 3) {
      toast.info('3 terms already exist for this year.');
      return;
    }
    const generated: Term[] = [
      { id: crypto.randomUUID(), name: 'Term 1', code: `TRM1-${yearNum}`, academicYear: yearNum, startDate: `${yearNum}-01-06`, endDate: `${yearNum}-04-04`, midtermDate: `${yearNum}-02-14`, closingDate: `${yearNum}-04-04`, holidays: [], notes: 'Auto-generated.', status: 'upcoming' },
      { id: crypto.randomUUID(), name: 'Term 2', code: `TRM2-${yearNum}`, academicYear: yearNum, startDate: `${yearNum}-04-28`, endDate: `${yearNum}-08-01`, midtermDate: `${yearNum}-06-06`, closingDate: `${yearNum}-08-01`, holidays: [], notes: 'Auto-generated.', status: 'upcoming' },
      { id: crypto.randomUUID(), name: 'Term 3', code: `TRM3-${yearNum}`, academicYear: yearNum, startDate: `${yearNum}-08-25`, endDate: `${yearNum}-11-28`, midtermDate: `${yearNum}-10-10`, closingDate: `${yearNum}-11-28`, holidays: [], notes: 'Auto-generated.', status: 'upcoming' },
    ];
    const existing = terms.filter(t => t.academicYear !== yearNum);
    setTerms([...existing, ...generated]);
    toast.success(`3 terms auto-generated for ${yearNum}.`);
  };

  // Summary stats
  const totalDays = filteredTerms.reduce((sum, t) => sum + calcInstructionDays(t.startDate, t.endDate, t.holidays), 0);
  const activeTerm = filteredTerms.find(t => t.status === 'active');

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-6 space-y-6">
        {/* Breadcrumb */}
     

        {/* Page Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Academic Terms Management</h1>
            <p className="text-muted-foreground mt-1">Configure term dates and academic years</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y.id} value={String(y.year)}>{y.year} Academic Year</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleAutoGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-Generate</span>
            </Button>
            <Button onClick={() => { setNewTerm({ academicYear: yearNum, holidays: [], notes: '' }); setShowAddDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Term
            </Button>
          </div>
        </div>

        {/* Conflict warnings */}
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

        {/* Summary Cards */}
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

        {/* Academic Year Info */}
        {currentYear && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{currentYear.year} Academic Year</CardTitle>
                  <CardDescription>{format(parseISO(currentYear.startDate), 'MMM d, yyyy')} — {format(parseISO(currentYear.endDate), 'MMM d, yyyy')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {(() => { const s = statusConfig[currentYear.status]; return <Badge className={cn('gap-1', s.color)}><s.icon className="h-3 w-3" />{s.label}</Badge>; })()}
                  <Button variant="outline" size="sm"><Edit2 className="h-3.5 w-3.5 mr-1" />Edit Year</Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="terms">Term Cards</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Cards View */}
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
                        <Badge className={cn('gap-1', sc.color)}><sc.icon className="h-3 w-3" />{sc.label}</Badge>
                      </div>
                      <CardDescription className="font-mono text-xs">{term.code}</CardDescription>
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
                        {term.midtermDate && (
                          <div>
                            <p className="text-muted-foreground text-xs">Midterm</p>
                            <p className="font-medium">{format(parseISO(term.midtermDate), 'MMM d')}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground text-xs">Instruction Days</p>
                          <p className="font-bold text-primary">{days} days</p>
                        </div>
                      </div>
                      {term.holidays.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          {term.holidays.length} holiday(s) registered
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setDetailTerm(term)}>
                          <Eye className="h-3.5 w-3.5" />View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => setEditTerm({ ...term })}>
                          <Edit2 className="h-3.5 w-3.5" />Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDeleteTerm(term.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

          {/* Table View */}
          <TabsContent value="table" className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Midterm</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerms.map(term => {
                    const sc = statusConfig[term.status];
                    return (
                      <TableRow key={term.id}>
                        <TableCell className="font-mono text-xs">{term.code}</TableCell>
                        <TableCell className="font-medium">{term.name}</TableCell>
                        <TableCell>{format(parseISO(term.startDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(term.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{term.midtermDate ? format(parseISO(term.midtermDate), 'MMM d') : '—'}</TableCell>
                        <TableCell className="font-bold text-primary">{calcInstructionDays(term.startDate, term.endDate, term.holidays)}</TableCell>
                        <TableCell><Badge className={cn('gap-1', sc.color)}>{sc.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailTerm(term)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTerm({ ...term })}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTerm(term.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  {filteredTerms.map((term, i) => {
                    const sc = statusConfig[term.status];
                    return (
                      <div key={term.id} className="flex gap-4 pb-8 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold', term.status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                            {i + 1}
                          </div>
                          {i < filteredTerms.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{term.name}</h3>
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

      {/* Detail Modal */}
      <Dialog open={!!detailTerm} onOpenChange={() => setDetailTerm(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailTerm?.name} Details</DialogTitle>
            <DialogDescription>Term code: {detailTerm?.code}</DialogDescription>
          </DialogHeader>
          {detailTerm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Start Date</p><p className="font-medium">{format(parseISO(detailTerm.startDate), 'PPP')}</p></div>
                <div><p className="text-muted-foreground text-xs">End Date</p><p className="font-medium">{format(parseISO(detailTerm.endDate), 'PPP')}</p></div>
                {detailTerm.midtermDate && <div><p className="text-muted-foreground text-xs">Midterm Break</p><p className="font-medium">{format(parseISO(detailTerm.midtermDate), 'PPP')}</p></div>}
                <div><p className="text-muted-foreground text-xs">Closing Date</p><p className="font-medium">{format(parseISO(detailTerm.closingDate), 'PPP')}</p></div>
                <div><p className="text-muted-foreground text-xs">Instruction Days</p><p className="font-bold text-primary">{calcInstructionDays(detailTerm.startDate, detailTerm.endDate, detailTerm.holidays)}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p><Badge className={cn('gap-1 mt-1', statusConfig[detailTerm.status].color)}>{statusConfig[detailTerm.status].label}</Badge></div>
              </div>
              {detailTerm.holidays.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Holidays & Closures</p>
                    <div className="space-y-1">
                      {detailTerm.holidays.map((h, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                          <span>{h.name}</span>
                          <span className="text-muted-foreground">{format(parseISO(h.date), 'MMM d')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {detailTerm.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{detailTerm.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
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
              <DatePickerField label="Midterm Date (optional)" value={editTerm.midtermDate} onChange={d => setEditTerm({ ...editTerm, midtermDate: d })} />
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={editTerm.notes} onChange={e => setEditTerm({ ...editTerm, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTerm(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Term Modal */}
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
            <DatePickerField label="Midterm Date (optional)" value={newTerm.midtermDate} onChange={d => setNewTerm({ ...newTerm, midtermDate: d })} />
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={newTerm.notes || ''} onChange={e => setNewTerm({ ...newTerm, notes: e.target.value })} rows={3} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddTerm}>Add Term</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
