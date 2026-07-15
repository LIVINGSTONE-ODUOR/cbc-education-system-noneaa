import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarRange, AlertCircle } from 'lucide-react';
import type { ExamSummary } from '@/lib/api/resultsApi';
import type { LearnerUpcomingExam } from '@/lib/api/examApi';

interface ExamRevisionPlannerProps {
  /** Past results — reused to weight the plan toward weaker subjects. */
  exams: ExamSummary[];
  /** Upcoming exams — the planner builds a schedule for the soonest one. */
  upcomingExams: LearnerUpcomingExam[];
  loading?: boolean;
  emptyMessage?: string;
}

interface SubjectWeight {
  name: string;
  average: number | null;
  weight: number;
}

interface PlanDay {
  date: Date;
  subjects: string[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SLOTS_PER_DAY = 2;
const MAX_PLAN_DAYS = 14;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Every subject seen in past results, weakest-weighted-heaviest. A subject
// with no history (weight floor) still gets at least light coverage so
// the plan never silently skips it.
const subjectWeightsFrom = (exams: ExamSummary[]): SubjectWeight[] => {
  const totals: Record<string, { sum: number; count: number }> = {};
  exams.forEach((exam) => {
    exam.subjects.forEach((s) => {
      if (s.is_absent || !s.learning_area?.name) return;
      const name = s.learning_area.name;
      if (!totals[name]) totals[name] = { sum: 0, count: 0 };
      totals[name].sum += s.percentage;
      totals[name].count += 1;
    });
  });

  return Object.entries(totals).map(([name, v]) => {
    const average = Math.round((v.sum / v.count) * 10) / 10;
    // Lower average -> higher weight (more revision slots), floored so
    // strong subjects still get occasional review rather than none.
    const weight = Math.max(100 - average, 15);
    return { name, average, weight };
  });
};

// Spreads weighted subjects across the available slots without clustering
// the same subject into back-to-back sessions: subjects are expanded into
// a bag sized by weight, then merged round-robin so heavier subjects
// recur evenly through the plan instead of front-loading.
const buildSlotSequence = (weights: SubjectWeight[], totalSlots: number): string[] => {
  if (weights.length === 0 || totalSlots <= 0) return [];

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const bags = weights
    .map((w) => ({
      name: w.name,
      count: Math.max(1, Math.round((w.weight / totalWeight) * totalSlots)),
    }))
    .sort((a, b) => b.count - a.count);

  const sequence: string[] = [];
  let remaining = bags.map((b) => b.count);
  let anyLeft = true;
  while (anyLeft && sequence.length < totalSlots * 2) {
    anyLeft = false;
    for (let i = 0; i < bags.length; i++) {
      if (remaining[i] > 0) {
        sequence.push(bags[i].name);
        remaining[i] -= 1;
        anyLeft = true;
      }
    }
  }
  return sequence.slice(0, totalSlots);
};

const buildPlan = (weights: SubjectWeight[], examDate: Date): PlanDay[] => {
  const today = startOfDay(new Date());
  const exam = startOfDay(examDate);
  const daysUntilExam = Math.round((exam.getTime() - today.getTime()) / MS_PER_DAY);
  if (daysUntilExam <= 0) return [];

  const planDays = Math.min(daysUntilExam, MAX_PLAN_DAYS);
  const totalSlots = planDays * SLOTS_PER_DAY;
  const sequence = buildSlotSequence(weights, totalSlots);

  const days: PlanDay[] = [];
  for (let i = 0; i < planDays; i++) {
    const date = new Date(today.getTime() + (i + 1) * MS_PER_DAY);
    const daySlots = sequence.slice(i * SLOTS_PER_DAY, i * SLOTS_PER_DAY + SLOTS_PER_DAY);
    // Dedupe within a single day so both slots aren't the same subject.
    const uniqueSubjects = Array.from(new Set(daySlots));
    days.push({ date, subjects: uniqueSubjects });
  }
  return days;
};

const formatDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const ExamRevisionPlanner: React.FC<ExamRevisionPlannerProps> = ({ exams, upcomingExams, loading, emptyMessage }) => {
  const nextExam = useMemo(
    () => [...upcomingExams].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0] || null,
    [upcomingExams]
  );

  const weights = useMemo(() => subjectWeightsFrom(exams), [exams]);

  const plan = useMemo(() => {
    if (!nextExam) return [];
    return buildPlan(weights, new Date(nextExam.start_date));
  }, [weights, nextExam]);

  const daysUntilExam = useMemo(() => {
    if (!nextExam) return null;
    const today = startOfDay(new Date());
    const exam = startOfDay(new Date(nextExam.start_date));
    return Math.round((exam.getTime() - today.getTime()) / MS_PER_DAY);
  }, [nextExam]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          Exam Revision Planner
        </CardTitle>
        <CardDescription>
          {nextExam
            ? `A study schedule leading up to ${nextExam.exam_name}, weighted toward your weaker subjects`
            : 'A study schedule automatically built ahead of your next exam'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !nextExam ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || 'No upcoming exams are scheduled yet — a revision plan will appear once one is.'}
          </p>
        ) : weights.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Not enough exam history yet to weight a plan toward your weaker subjects. Once at least one exam's
            marks are recorded, the planner will prioritize the topics that need the most attention.
          </div>
        ) : daysUntilExam !== null && daysUntilExam <= 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {nextExam.exam_name} is today or already underway — good luck!
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                {daysUntilExam} day{daysUntilExam === 1 ? '' : 's'} until {nextExam.exam_name}
                {daysUntilExam! > MAX_PLAN_DAYS ? ` — showing the first ${MAX_PLAN_DAYS} days` : ''}
              </span>
              <Badge variant="outline">{plan.length} revision day{plan.length === 1 ? '' : 's'} planned</Badge>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {plan.map((day) => (
                <div key={day.date.toISOString()} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="font-medium w-32 shrink-0">{formatDay(day.date)}</span>
                  <div className="flex flex-wrap gap-1.5 justify-end flex-1">
                    {day.subjects.length === 0 ? (
                      <span className="text-muted-foreground text-xs">Rest / light review</span>
                    ) : (
                      day.subjects.map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">
                          {s}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Weaker subjects (by average score across your recorded exams) appear more often. Two focus subjects
              per day, capped at {MAX_PLAN_DAYS} days out.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamRevisionPlanner;
