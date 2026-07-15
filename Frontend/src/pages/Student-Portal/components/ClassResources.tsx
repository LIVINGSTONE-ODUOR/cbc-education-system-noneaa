import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, FolderOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// NOTE: The backend has no endpoints yet for teacher-uploaded learning
// materials/notes or class resources (PDFs, videos, links) — only
// assignments, exams, timetable, attendance, and curriculum data exist
// today. Rather than fabricate content, these two sections render an
// honest "nothing published yet" state. Once a materials/resources API
// exists (e.g. GET /api/v1/classes/:id/materials), swap the empty-state
// paragraph below for a real fetch + list, following the same
// loading/error/empty pattern used in SubjectsAndTeachers.tsx and
// SyllabusOutline.tsx in this folder.

const ClassResources: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('learningMaterialsNotes', 'Learning Materials & Notes')}
          </CardTitle>
          <CardDescription>{t('learningMaterialsNotesDesc', 'Notes and study material shared by your teachers')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noLearningMaterialsYet', "Your teachers haven't published any learning materials or notes yet. Check back later.")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            {t('classResources', 'Class Resources')}
          </CardTitle>
          <CardDescription>{t('classResourcesDesc', 'PDFs, videos, and links shared for your class')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noClassResourcesYet', 'No class resources have been shared yet. Anything your teachers add will show up here.')}
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default ClassResources;
