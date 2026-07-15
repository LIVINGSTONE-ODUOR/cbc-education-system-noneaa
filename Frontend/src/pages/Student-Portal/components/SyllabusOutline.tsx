import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ListTree } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getCurriculumTree, CurriculumTreeNode } from '@/lib/api/curriculumApi';

interface SyllabusOutlineProps {
  gradeLevel: string | null;
}

// Renders the CBC curriculum tree (learning area -> strands -> sub-strands
// -> competencies) for the student's own grade as their syllabus / course
// outline. This is the same national/school curriculum data the Curriculum
// Management screens use, just read-only here.
const SyllabusOutline: React.FC<SyllabusOutlineProps> = ({ gradeLevel }) => {
  const [tree, setTree] = useState<CurriculumTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gradeLevel) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCurriculumTree(gradeLevel);
        if (!cancelled) setTree(res.tree || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load the syllabus');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gradeLevel]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTree className="h-5 w-5 text-primary" />
          Syllabus &amp; Course Outline
        </CardTitle>
        <CardDescription>
          {gradeLevel ? `CBC curriculum breakdown for ${gradeLevel}` : 'CBC curriculum breakdown by subject'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : tree.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No curriculum has been set up for your grade yet.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {tree.map((subject) => (
              <AccordionItem key={subject.id} value={subject.id}>
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-2">
                    {subject.name}
                    <Badge variant="outline">{subject.code}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  {subject.strands.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      No strands have been added for this subject yet.
                    </p>
                  ) : (
                    <div className="space-y-4 pl-2">
                      {subject.strands.map((strand) => (
                        <div key={strand.id}>
                          <p className="font-medium text-sm">{strand.name}</p>
                          {strand.sub_strands.length > 0 && (
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {strand.sub_strands.map((sub) => (
                                <li key={sub.id}>{sub.name}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default SyllabusOutline;
