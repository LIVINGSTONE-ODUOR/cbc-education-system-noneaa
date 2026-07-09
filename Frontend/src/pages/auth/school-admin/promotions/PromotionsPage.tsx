import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, GraduationCap, Plus, Info } from 'lucide-react';

export default function PromotionsPage() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Promotions &amp; Graduation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage promotion rules and run graduations at the end of academic
            cycles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="gap-2" variant="secondary">
            <TrendingUp className="h-3.5 w-3.5" /> Placeholder
          </Badge>
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" /> Start Process
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> What you can do here
          </CardTitle>
          <CardDescription>
            This UI page is scaffolded and ready for backend wiring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>Define promotion criteria per grade/stream</li>
            <li>Run promotion batches and lock decisions</li>
            <li>Generate graduation lists (e.g., Grade 6 / JHS / SHS)</li>
            <li>Export summaries for reporting and records</li>
          </ul>
          <div className="rounded-lg border bg-muted/20 p-4">
            Backend APIs: pending.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Next steps
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Once backend endpoints are available, this page will include: criteria
          setup, learner selection, batch actions, and audit trails.
        </CardContent>
      </Card>
    </div>
  );
}

