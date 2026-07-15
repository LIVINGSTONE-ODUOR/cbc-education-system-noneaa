import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink, BookOpen } from 'lucide-react';
import type { ExamSummary } from '@/lib/api/resultsApi';

interface RecommendedResourcesProps {
  /** Reuses the exams already loaded for the dashboard/marks cards — no extra fetch. */
  exams: ExamSummary[];
  emptyMessage?: string;
}

interface SubjectAverage {
  name: string;
  average: number;
  examsCounted: number;
}

interface ResourceLink {
  label: string;
  url: string;
}

// Curated, free/open study resources per CBC subject. Kept as a static
// lookup (no backend endpoint exists yet for teacher-curated resources —
// see ClassResources.tsx in this folder for the same honesty pattern).
// Matching is case-insensitive and tolerant of partial subject names
// (e.g. "Mathematics" and "Math" both hit the "math" entry).
const RESOURCE_LIBRARY: { match: string; links: ResourceLink[] }[] = [
  {
    match: 'math',
    links: [
      { label: 'Khan Academy — Math', url: 'https://www.khanacademy.org/math' },
      { label: 'Corbettmaths — Practice Questions', url: 'https://corbettmaths.com/contents/' },
    ],
  },
  {
    match: 'english',
    links: [
      { label: 'Khan Academy — Grammar', url: 'https://www.khanacademy.org/humanities/grammar' },
      { label: 'BBC Bitesize — English', url: 'https://www.bbc.co.uk/bitesize/subjects/zv48q6f' },
    ],
  },
  {
    match: 'kiswahili',
    links: [
      { label: 'Elimuwiki — Kiswahili', url: 'https://elimuwiki.com/category/kiswahili/' },
      { label: 'Twinkl — Kiswahili Resources', url: 'https://www.twinkl.com/search?q=kiswahili' },
    ],
  },
  {
    match: 'science',
    links: [
      { label: 'Khan Academy — Science', url: 'https://www.khanacademy.org/science' },
      { label: 'BBC Bitesize — Science', url: 'https://www.bbc.co.uk/bitesize/subjects/z2pfb9q' },
    ],
  },
  {
    match: 'social',
    links: [
      { label: 'Khan Academy — Social Studies', url: 'https://www.khanacademy.org/humanities' },
      { label: 'BBC Bitesize — Geography & History', url: 'https://www.bbc.co.uk/bitesize/subjects/zgh4d2p' },
    ],
  },
  {
    match: 'agri',
    links: [
      { label: 'FAO e-learning — Agriculture Basics', url: 'https://elearning.fao.org/' },
    ],
  },
  {
    match: 'creative',
    links: [
      { label: 'Khan Academy — Art & Music', url: 'https://www.khanacademy.org/humanities/art-history' },
    ],
  },
  {
    match: 'religio',
    links: [
      { label: 'BBC Bitesize — Religious Studies', url: 'https://www.bbc.co.uk/bitesize/subjects/zb48q6f' },
    ],
  },
];

const FALLBACK_LINKS = (subject: string): ResourceLink[] => [
  { label: `Khan Academy — search "${subject}"`, url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(subject)}` },
  { label: `BBC Bitesize — search "${subject}"`, url: `https://www.bbc.co.uk/bitesize/search?q=${encodeURIComponent(subject)}` },
];

const resourcesFor = (subject: string): ResourceLink[] => {
  const lower = subject.toLowerCase();
  const entry = RESOURCE_LIBRARY.find((r) => lower.includes(r.match));
  return entry ? entry.links : FALLBACK_LINKS(subject);
};

// Averages every subject across all recorded exams (not just the latest),
// so a single bad day doesn't misclassify a subject as "weak".
const weakSubjectsFrom = (exams: ExamSummary[], threshold = 65, max = 3): SubjectAverage[] => {
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

  const averages: SubjectAverage[] = Object.entries(totals).map(([name, v]) => ({
    name,
    average: Math.round((v.sum / v.count) * 10) / 10,
    examsCounted: v.count,
  }));

  return averages
    .filter((s) => s.average < threshold)
    .sort((a, b) => a.average - b.average)
    .slice(0, max);
};

const RecommendedResources: React.FC<RecommendedResourcesProps> = ({ exams, emptyMessage }) => {
  const weakSubjects = useMemo(() => weakSubjectsFrom(exams), [exams]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended Resources
        </CardTitle>
        <CardDescription>
          Personalized study suggestions based on your weakest-performing subjects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage || 'No exam results yet — recommendations will appear once your marks are recorded.'}
          </p>
        ) : weakSubjects.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nice work — none of your subjects are currently below 65% on average. Keep it up!
          </p>
        ) : (
          <div className="space-y-5">
            {weakSubjects.map((subject) => (
              <div key={subject.name} className="rounded-lg border p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    {subject.average}% average
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {resourcesFor(subject.name).map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              These are free external study resources, not materials uploaded by your school. Suggestions are
              based on your average score per subject across all recorded exams (below 65%).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedResources;
