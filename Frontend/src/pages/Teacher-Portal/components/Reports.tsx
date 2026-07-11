import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, ClipboardCheck, BarChart3, GraduationCap, FileSpreadsheet } from 'lucide-react';
import type { MyClassStudent } from '@/lib/api/teacherApi';

interface ClassOption {
  id: string;
  name: string;
  students: number;
}

interface ReportsProps {
  classes: ClassOption[];
  selectedClass: string;
  selectedClassName: string;
  students: MyClassStudent[];
  onGoToClasses: () => void;
}

// Turns an array of row objects into a downloadable CSV file.
// This runs entirely in the browser — no backend endpoint required.
const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const REPORT_CARDS = [
  { key: 'class_list', icon: Users, title: 'Class List', description: 'Names and admission numbers for the selected class.' },
  { key: 'attendance', icon: ClipboardCheck, title: 'Attendance Report', description: 'Attendance percentage per student.' },
  { key: 'marksheet', icon: FileSpreadsheet, title: 'Marksheet', description: 'Recent assessment scores per student.' },
  { key: 'performance', icon: BarChart3, title: 'Performance Analysis', description: 'Strengths and areas for improvement.' },
  { key: 'report_cards', icon: GraduationCap, title: 'Report Cards', description: 'Full per-student summary, one row each.' },
  { key: 'student_report', icon: FileText, title: 'Student Report', description: 'Same data, formatted for a single student.' },
] as const;

const Reports: React.FC<ReportsProps> = ({ classes, selectedClass, selectedClassName, students, onGoToClasses }) => {
  const hasClass = Boolean(selectedClass) && students.length > 0;

  const handleExcelDownload = (reportKey: (typeof REPORT_CARDS)[number]['key']) => {
    const filenameBase = `${selectedClassName || 'class'}_${reportKey}`.replace(/\s+/g, '_');

    switch (reportKey) {
      case 'class_list':
        downloadCsv(`${filenameBase}.csv`, students.map((s) => ({
          Name: s.name,
          'Admission No.': s.admission_number,
        })));
        break;
      case 'attendance':
        downloadCsv(`${filenameBase}.csv`, students.map((s) => ({
          Name: s.name,
          'Admission No.': s.admission_number,
          'Attendance %': s.attendance ?? 'No data',
        })));
        break;
      case 'marksheet':
        downloadCsv(`${filenameBase}.csv`, students.map((s) => ({
          Name: s.name,
          'Admission No.': s.admission_number,
          'Recent Scores': s.recent_scores.join(' | ') || 'No data',
        })));
        break;
      case 'performance':
      case 'report_cards':
      case 'student_report':
        downloadCsv(`${filenameBase}.csv`, students.map((s) => ({
          Name: s.name,
          'Admission No.': s.admission_number,
          'Overall %': s.performance ?? 'No data',
          'Attendance %': s.attendance ?? 'No data',
          Strengths: s.strengths,
          'Areas for Improvement': s.areas_for_improvement,
        })));
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {hasClass
              ? `Generate reports for ${selectedClassName} (${students.length} students).`
              : classes.length === 0
              ? "You haven't been assigned to any classes yet."
              : 'Select a class from "My Classes" to generate reports.'}
          </CardDescription>
        </CardHeader>
        {!hasClass && classes.length > 0 && (
          <CardContent>
            <Button variant="outline" onClick={onGoToClasses}>Go to My Classes</Button>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map(({ key, icon: Icon, title, description }) => (
          <Card key={key}>
            <CardContent className="pt-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{description}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!hasClass}
                  onClick={() => handleExcelDownload(key)}
                >
                  Excel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled
                  title="PDF export is coming soon"
                >
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
