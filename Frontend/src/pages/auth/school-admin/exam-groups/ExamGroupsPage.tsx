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
import { ClipboardList, Plus, Info } from 'lucide-react';

export default function ExamGroupsPage() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exam Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize examinations into coherent groups for easier scheduling and
            results management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="gap-2" variant="secondary">
            <ClipboardList className="h-3.5 w-3.5" /> Placeholder
          </Badge>
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" /> Create Group
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
            <li>
              Create exam groups (e.g., Term 1 CATs, Mid-Term Exams, End-Term
              Exams)
            </li>
            <li>Assign subjects/classes to each exam group</li>
            <li>Enable/disable groups and track active configuration</li>
            <li>Prepare data for exam schedule and results entry</li>
          </ul>
          <div className="rounded-lg border bg-muted/20 p-4">
            Backend APIs: pending.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

