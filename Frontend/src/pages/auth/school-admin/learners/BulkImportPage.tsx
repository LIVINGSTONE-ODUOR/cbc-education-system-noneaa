'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  ArrowLeft,
  Loader2,
  Info,
  AlertTriangle,
  Copy,
  Download as DownloadIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ImportRecord {
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: string;
  grade_level: string;
  stream_name?: string;
  special_needs?: string;
  medical_conditions?: string;
  allergies?: string;
  previous_school?: string;
  birth_certificate_number?: string;
  nemis_number?: string;
  nationality?: string;
}

interface ImportResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  record?: ImportRecord;
  gradeLevel?: string;
  error?: string;
}

interface FailedRecord {
  admission: string;
  name: string;
  reason: string;
  errorCode: string;
  isDuplicate: boolean;
  details: string;
}

interface SuccessRecord {
  admission: string;
  name: string;
  className: string;
  enrolled: boolean;
}

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  successRecords: SuccessRecord[];
  failedRecords: FailedRecord[];
  enrollmentSuccess: number;
  enrollmentFailed: number;
}

interface ClassStatistics {
  grade: string;
  stream?: string;
  count: number;
  percentage: number;
}

const GRADES = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3',
  'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9',
];

const GENDERS = ['male', 'female'];
const NATIONALITIES = ['Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Burundian', 'South Sudanese', 'Other'];

const TEMPLATE_COLUMNS = [
  'admission_number',
  'first_name',
  'last_name',
  'middle_name',
  'date_of_birth',
  'gender',
  'grade_level',
  'stream_name',
  'special_needs',
  'medical_conditions',
  'allergies',
  'previous_school',
  'birth_certificate_number',
  'nemis_number',
  'nationality',
];

const downloadTemplate = () => {
  const templateData = [
    {
      admission_number: 'ADM2024001',
      first_name: 'John',
      last_name: 'Doe',
      middle_name: 'Michael',
      date_of_birth: '2015-01-15',
      gender: 'male',
      grade_level: 'Grade 1',
      stream_name: 'East',
      special_needs: '',
      medical_conditions: 'None',
      allergies: 'Peanuts',
      previous_school: 'Primary School',
      birth_certificate_number: '12345/ABC123',
      nemis_number: 'NEM123456',
      nationality: 'Kenyan',
    },
    {
      admission_number: 'ADM2024002',
      first_name: 'Jane',
      last_name: 'Smith',
      middle_name: 'Sarah',
      date_of_birth: '2015-03-20',
      gender: 'female',
      grade_level: 'Grade 1',
      stream_name: 'East',
      special_needs: 'Dyslexia',
      medical_conditions: 'Asthma',
      allergies: '',
      previous_school: 'Kiambu Primary',
      birth_certificate_number: '67890/DEF456',
      nemis_number: 'NEM789012',
      nationality: 'Kenyan',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 18 }));

  const wscols = [];
  TEMPLATE_COLUMNS.forEach((col) => {
    if (col === 'gender') wscols.push({ wch: 12 });
    else if (col === 'grade_level') wscols.push({ wch: 14 });
    else if (col === 'nationality') wscols.push({ wch: 15 });
    else wscols.push({ wch: 18 });
  });
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');

  const instructionsWs = XLSX.utils.aoa_to_sheet([
    ['Student Bulk Import Instructions'],
    [],
    ['Column Name', 'Required', 'Format', 'Examples/Notes'],
    ['admission_number', 'YES', 'Text (4-20 chars)', 'ADM2024001, STU001 - MUST BE UNIQUE'],
    ['first_name', 'YES', 'Text', 'John, Jane'],
    ['last_name', 'YES', 'Text', 'Doe, Smith'],
    ['middle_name', 'NO', 'Text', 'Michael, Sarah'],
    ['date_of_birth', 'YES', 'YYYY-MM-DD', '2015-01-15, 2015-03-20'],
    ['gender', 'YES', 'male OR female', 'Lowercase only'],
    ['grade_level', 'YES', 'See list below', 'Grade 1, PP1, etc.'],
    ['stream_name', 'NO', 'Text', 'East, West, A, B'],
    ['special_needs', 'NO', 'Text', 'Dyslexia, Hearing Impaired'],
    ['medical_conditions', 'NO', 'Text', 'Asthma, Diabetes'],
    ['allergies', 'NO', 'Text', 'Peanuts, Dairy'],
    ['previous_school', 'NO', 'Text', 'School Name'],
    ['birth_certificate_number', 'NO', 'Text', '12345/ABC123'],
    ['nemis_number', 'NO', 'Text (NEMIS format)', 'NEM123456 - MUST BE UNIQUE IF PROVIDED'],
    ['nationality', 'NO', 'Text', 'Kenyan (default)'],
    [],
    ['Valid Grade Levels:'],
    ...GRADES.map((g) => [g]),
    [],
    ['IMPORTANT NOTES:'],
    ['• Admission numbers must be UNIQUE - duplicates will be rejected'],
    ['• NEMIS numbers must be UNIQUE if provided'],
    ['• System will auto-enroll students in matching class'],
    ['• Failed records will be reported with specific error codes'],
    ['• Keep one student per row'],
    ['• Use exact spelling for grade levels'],
    ['• Dates must be in YYYY-MM-DD format'],
  ]);

  instructionsWs['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `student_import_template_${today}.xlsx`);
};

const validateRecord = (record: Record<string, any>, rowNumber: number): ImportResult => {
  if (!record.admission_number?.toString().trim()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Admission number is required`,
      error: 'MISSING_ADMISSION_NUMBER',
    };
  }

  if (!record.first_name?.toString().trim()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: First name is required`,
      error: 'MISSING_FIRST_NAME',
    };
  }

  if (!record.last_name?.toString().trim()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Last name is required`,
      error: 'MISSING_LAST_NAME',
    };
  }

  if (!record.date_of_birth?.toString().trim()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Date of birth is required`,
      error: 'MISSING_DOB',
    };
  }

  if (!record.gender?.toString().trim()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Gender is required`,
      error: 'MISSING_GENDER',
    };
  }

  if (!record.grade_level?.toString().trim()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Grade level is required`,
      error: 'MISSING_GRADE',
    };
  }

  const genderLower = record.gender.toString().toLowerCase();
  if (!GENDERS.includes(genderLower)) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Invalid gender "${record.gender}". Must be "male" or "female"`,
      error: 'INVALID_GENDER',
    };
  }

  if (!GRADES.includes(record.grade_level.toString())) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Invalid grade "${record.grade_level}". See instructions for valid grades`,
      error: 'INVALID_GRADE',
    };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(record.date_of_birth?.toString())) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Invalid date format "${record.date_of_birth}". Use YYYY-MM-DD`,
      error: 'INVALID_DATE_FORMAT',
    };
  }

  // Validate date is reasonable
  const dob = new Date(record.date_of_birth.toString());
  if (dob > new Date()) {
    return {
      status: 'error',
      message: `Row ${rowNumber}: Date of birth cannot be in the future`,
      error: 'FUTURE_DATE',
    };
  }

  if (record.nationality && !NATIONALITIES.includes(record.nationality.toString())) {
    return {
      status: 'warning',
      message: `Row ${rowNumber}: Unknown nationality "${record.nationality}" (will use "Other")`,
      record: {
        admission_number: record.admission_number.toString(),
        first_name: record.first_name.toString(),
        last_name: record.last_name.toString(),
        middle_name: record.middle_name?.toString(),
        date_of_birth: record.date_of_birth.toString(),
        gender: genderLower,
        grade_level: record.grade_level.toString(),
        stream_name: record.stream_name?.toString(),
        special_needs: record.special_needs?.toString(),
        medical_conditions: record.medical_conditions?.toString(),
        allergies: record.allergies?.toString(),
        previous_school: record.previous_school?.toString(),
        birth_certificate_number: record.birth_certificate_number?.toString(),
        nemis_number: record.nemis_number?.toString(),
        nationality: 'Other',
      },
      gradeLevel: record.grade_level.toString(),
    };
  }

  return {
    status: 'success',
    message: `Row ${rowNumber}: Valid ✓`,
    record: {
      admission_number: record.admission_number.toString(),
      first_name: record.first_name.toString(),
      last_name: record.last_name.toString(),
      middle_name: record.middle_name?.toString(),
      date_of_birth: record.date_of_birth.toString(),
      gender: genderLower,
      grade_level: record.grade_level.toString(),
      stream_name: record.stream_name?.toString(),
      special_needs: record.special_needs?.toString(),
      medical_conditions: record.medical_conditions?.toString(),
      allergies: record.allergies?.toString(),
      previous_school: record.previous_school?.toString(),
      birth_certificate_number: record.birth_certificate_number?.toString(),
      nemis_number: record.nemis_number?.toString(),
      nationality: record.nationality?.toString() || 'Kenyan',
    },
    gradeLevel: record.grade_level.toString(),
  };
};

const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    DUPLICATE_ADMISSION: 'Admission number already exists in the system',
    DUPLICATE_NEMIS: 'NEMIS number already exists in the system',
    DUPLICATE_IN_BATCH: 'This admission number appears multiple times in your import file',
    CLASS_NOT_FOUND: 'No matching class found for this grade/stream combination',
    ENROLLMENT_FAILED: 'Student created but enrollment failed - you can manually enroll later',
    CREATION_FAILED: 'Failed to create student record',
    SERVER_ERROR: 'Server error - please try again',
    INVALID_REQUEST: 'Invalid request data',
    UNKNOWN: 'Unknown error occurred',
  };
  return errorMessages[errorCode] || errorMessages.UNKNOWN;
};

const BulkImportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ImportResult[]>([]);
  const [importingRecords, setImportingRecords] = useState<ImportRecord[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [expandedFailures, setExpandedFailures] = useState<string[]>([]);

  const classStats = React.useMemo(() => {
    const stats: Record<string, ClassStatistics> = {};
    importingRecords.forEach((record) => {
      const key = `${record.grade_level}${record.stream_name ? `_${record.stream_name}` : ''}`;
      if (!stats[key]) {
        stats[key] = {
          grade: record.grade_level,
          stream: record.stream_name,
          count: 0,
          percentage: 0,
        };
      }
      stats[key].count++;
    });

    const total = importingRecords.length;
    Object.values(stats).forEach((stat) => {
      stat.percentage = total > 0 ? Math.round((stat.count / total) * 100) : 0;
    });

    return Object.values(stats).sort((a, b) => {
      const gradeCompare = GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
      if (gradeCompare !== 0) return gradeCompare;
      return (a.stream || '').localeCompare(b.stream || '');
    });
  }, [importingRecords]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: '❌ Invalid File Type',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: '❌ File Too Large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    setValidationResults([]);
    setImportingRecords([]);
    setImportStats(null);
  };

  const handleValidate = useCallback(async () => {
    if (!file) return;

    try {
      setIsValidating(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(worksheet);

      if (records.length === 0) {
        toast({
          title: '📋 Empty File',
          description: 'The Excel file contains no data rows',
          variant: 'destructive',
        });
        setIsValidating(false);
        return;
      }

      // Check for duplicates within the batch
      const admissionNumbers = new Set<string>();
      const nemisNumbers = new Set<string>();
      const duplicateErrors: string[] = [];

      records.forEach((record, idx) => {
        const admission = record.admission_number?.toString().trim();
        const nemis = record.nemis_number?.toString().trim();

        if (admission && admissionNumbers.has(admission)) {
          duplicateErrors.push(`Row ${idx + 2}: Duplicate admission number "${admission}"`);
        }
        if (admission) admissionNumbers.add(admission);

        if (nemis && nemisNumbers.has(nemis)) {
          duplicateErrors.push(`Row ${idx + 2}: Duplicate NEMIS number "${nemis}"`);
        }
        if (nemis) nemisNumbers.add(nemis);
      });

      const results: ImportResult[] = [];
      const validRecords: ImportRecord[] = [];

      records.forEach((record, index) => {
        const result = validateRecord(record, index + 2);
        results.push(result);

        if (result.status === 'success' || result.status === 'warning') {
          if (result.record) {
            validRecords.push(result.record);
          }
        }
      });

      // Add duplicate errors to results
      if (duplicateErrors.length > 0) {
        duplicateErrors.forEach((error) => {
          results.push({
            status: 'error',
            message: error,
            error: 'DUPLICATE_IN_BATCH',
          });
        });
      }

      setValidationResults(results);
      setImportingRecords(validRecords);

      const successCount = results.filter((r) => r.status === 'success' || r.status === 'warning').length;
      const errorCount = results.filter((r) => r.status === 'error').length;

      if (errorCount > 0) {
        toast({
          title: '⚠️ Validation Issues Found',
          description: `${successCount} valid records, ${errorCount} errors found`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Validation Successful',
          description: `All ${successCount} records are valid and ready to import`,
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: '❌ Validation Failed',
        description: 'Error reading Excel file. Please check the format and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  }, [file, toast]);

  // ✅ PROFESSIONAL: Comprehensive import with error handling
  const handleImport = useCallback(async () => {
    if (importingRecords.length === 0) return;

    try {
      setIsImporting(true);
      setImportProgress(0);

      const batchSize = 3;
      const successRecords: SuccessRecord[] = [];
      const failedRecords: FailedRecord[] = [];
      let enrollmentSuccess = 0;
      let enrollmentFailed = 0;

      for (let i = 0; i < importingRecords.length; i += batchSize) {
        const batch = importingRecords.slice(i, i + batchSize);

        const batchPromises = batch.map(async (record) => {
          let learnerId: string | null = null;

          try {
            // Step 1: Create the learner with comprehensive error handling
            const learnerResponse = await fetch('/api/v1/learners', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
              },
              body: JSON.stringify(record),
            });

            const learnerData = await learnerResponse.json();

            if (!learnerResponse.ok) {
              let errorCode = 'CREATION_FAILED';
              let errorDetails = learnerData.message || 'Unknown error';

              // Parse API error responses
              if (learnerResponse.status === 409) {
                if (learnerData.message?.includes('admission_number')) {
                  errorCode = 'DUPLICATE_ADMISSION';
                } else if (learnerData.message?.includes('nemis_number')) {
                  errorCode = 'DUPLICATE_NEMIS';
                }
              } else if (learnerResponse.status === 400) {
                errorCode = 'INVALID_REQUEST';
              } else if (learnerResponse.status === 500) {
                errorCode = 'SERVER_ERROR';
              }

              failedRecords.push({
                admission: record.admission_number,
                name: `${record.first_name} ${record.last_name}`,
                reason: getErrorMessage(errorCode),
                errorCode,
                isDuplicate: errorCode === 'DUPLICATE_ADMISSION' || errorCode === 'DUPLICATE_NEMIS',
                details: errorDetails,
              });
              return;
            }

            learnerId = learnerData.data?.id;
            if (!learnerId) {
              throw new Error('No learner ID returned from API');
            }

            // Step 2: Find and enroll in class
            try {
              const classResponse = await fetch(
                `/api/v1/classes?grade_level=${encodeURIComponent(record.grade_level)}&stream_name=${encodeURIComponent(record.stream_name || '')}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
                  },
                }
              );

              if (classResponse.ok) {
                const classData = await classResponse.json();
                const classId = classData.data?.[0]?.id || classData.classes?.[0]?.id;

                if (classId) {
                  const enrollResponse = await fetch('/api/v1/learner-enrollments', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('cbe_access_token')}`,
                    },
                    body: JSON.stringify({
                      learner_id: learnerId,
                      class_id: classId,
                      enrollment_date: new Date().toISOString().split('T')[0],
                      status: 'enrolled',
                    }),
                  });

                  if (enrollResponse.ok) {
                    enrollmentSuccess++;
                    successRecords.push({
                      admission: record.admission_number,
                      name: `${record.first_name} ${record.last_name}`,
                      className: `${record.grade_level}${record.stream_name ? ` - ${record.stream_name}` : ''}`,
                      enrolled: true,
                    });
                  } else {
                    enrollmentFailed++;
                    successRecords.push({
                      admission: record.admission_number,
                      name: `${record.first_name} ${record.last_name}`,
                      className: `${record.grade_level}${record.stream_name ? ` - ${record.stream_name}` : ''}`,
                      enrolled: false,
                    });
                  }
                } else {
                  enrollmentFailed++;
                  successRecords.push({
                    admission: record.admission_number,
                    name: `${record.first_name} ${record.last_name}`,
                    className: `${record.grade_level}${record.stream_name ? ` - ${record.stream_name}` : ''}`,
                    enrolled: false,
                  });
                }
              } else {
                enrollmentFailed++;
                successRecords.push({
                  admission: record.admission_number,
                  name: `${record.first_name} ${record.last_name}`,
                  className: `${record.grade_level}${record.stream_name ? ` - ${record.stream_name}` : ''}`,
                  enrolled: false,
                });
              }
            } catch (enrollError) {
              console.error('Enrollment error:', enrollError);
              enrollmentFailed++;
              successRecords.push({
                admission: record.admission_number,
                name: `${record.first_name} ${record.last_name}`,
                className: `${record.grade_level}${record.stream_name ? ` - ${record.stream_name}` : ''}`,
                enrolled: false,
              });
            }
          } catch (error) {
            failedRecords.push({
              admission: record.admission_number,
              name: `${record.first_name} ${record.last_name}`,
              reason: getErrorMessage('CREATION_FAILED'),
              errorCode: 'CREATION_FAILED',
              isDuplicate: false,
              details: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        });

        await Promise.all(batchPromises);
        setImportProgress(Math.round(((i + batchSize) / importingRecords.length) * 100));
      }

      setShowImportDialog(false);
      setImportStats({
        total: importingRecords.length,
        success: successRecords.length,
        failed: failedRecords.length,
        skipped: 0,
        successRecords,
        failedRecords,
        enrollmentSuccess,
        enrollmentFailed,
      });
      setShowResultsDialog(true);

      // Show appropriate toast based on results
      if (failedRecords.length === 0) {
        toast({
          title: '✅ Import Successful',
          description: `All ${successRecords.length} students imported and enrolled`,
        });
      } else {
        toast({
          title: '⚠️ Import Completed with Issues',
          description: `${successRecords.length} imported, ${failedRecords.length} failed`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: '❌ Import Failed',
        description: 'Critical error during import. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [importingRecords, toast]);

  const downloadErrorReport = () => {
    if (!importStats) return;

    const errorData = importStats.failedRecords.map((record) => ({
      admission_number: record.admission,
      name: record.name,
      error_code: record.errorCode,
      reason: record.reason,
      details: record.details,
      is_duplicate: record.isDuplicate ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `import_errors_${today}.xlsx`);
  };

  const errorCount = validationResults.filter((r) => r.status === 'error').length;
  const warningCount = validationResults.filter((r) => r.status === 'warning').length;
  const successCount = validationResults.filter((r) => r.status === 'success').length;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/school-admin/learners')}
          className="border-slate-200 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Bulk Import Students</h1>
          <p className="text-slate-600 mt-2">Import multiple students with automatic enrollment and duplicate detection</p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 items-start">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Professional Import Features</p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>✓ Automatic duplicate detection (admission number & NEMIS)</li>
            <li>✓ Detailed error reporting with specific error codes</li>
            <li>✓ Automatic class enrollment matching grade/stream</li>
            <li>✓ Batch processing with progress tracking</li>
          </ul>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Download Template */}
          <Card className="border-slate-200 bg-white border-2 border-dashed border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                Get Started
              </CardTitle>
              <CardDescription className="text-blue-800">
                Download template with validation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={downloadTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full md:w-auto"
              >
                <Download className="h-4 w-4" />
                Download Excel Template
              </Button>
              <p className="text-xs text-blue-700 mt-3">
                Template includes sample data and instructions
              </p>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
              <CardDescription>
                Select your Excel file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  file
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setValidationResults([]);
                        setImportingRecords([]);
                        setImportStats(null);
                      }}
                      className="mt-2"
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-slate-400" />
                    <p className="font-semibold text-slate-900">Click or drag file here</p>
                    <p className="text-sm text-slate-500">Excel files (.xlsx, .xls) up to 10MB</p>
                  </div>
                )}
              </div>

              {file && validationResults.length === 0 && (
                <Button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Validate File
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResults.length > 0 && (
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Validation Results
                </CardTitle>
                <CardDescription>
                  {successCount} valid, {warningCount} warnings, {errorCount} errors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {successCount > 0 && (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {successCount} Success
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {warningCount} Warning
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {errorCount} Error
                    </Badge>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50">
                      <TableRow>
                        <TableHead className="w-12">Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResults.map((result, idx) => (
                        <TableRow key={idx} className="text-sm">
                          <TableCell>
                            {result.status === 'success' && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {result.status === 'warning' && (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            {result.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell className="text-slate-700">{result.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {(successCount + warningCount) > 0 && (
                  <Button
                    onClick={() => setShowImportDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import {successCount + warningCount} Students
                  </Button>
                )}

                {errorCount > 0 && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex gap-2 items-start">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    Fix the {errorCount} error(s) before importing
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {importingRecords.length > 0 && (
            <Card className="border-slate-200 bg-white sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Import Preview
                </CardTitle>
                <CardDescription>
                  {importingRecords.length} students ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {importingRecords.length}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Distribution by Class</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {classStats.map((stat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <p className="font-medium text-slate-900">
                            {stat.grade}
                            {stat.stream && ` - ${stat.stream}`}
                          </p>
                          <Badge variant="outline" className="bg-slate-50">
                            {stat.count}
                          </Badge>
                        </div>
                        <Progress value={stat.percentage} className="h-1.5" />
                        <p className="text-xs text-slate-500">{stat.percentage}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Gender Distribution</p>
                  {(() => {
                    const maleCount = importingRecords.filter(
                      (r) => r.gender.toLowerCase() === 'male'
                    ).length;
                    const femaleCount = importingRecords.length - maleCount;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Boys</span>
                          <span className="font-semibold text-slate-900">{maleCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Girls</span>
                          <span className="font-semibold text-slate-900">{femaleCount}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 text-sm">⚠️ Duplicate Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-900">
              <p>✓ Admission numbers must be unique</p>
              <p>✓ NEMIS numbers must be unique</p>
              <p>✓ Batch duplicates detected</p>
              <p>✓ Detailed error codes provided</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>Confirm Import</AlertDialogTitle>
          <AlertDialogDescription>
            Import {importingRecords.length} students with automatic enrollment
          </AlertDialogDescription>

          {isImporting && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-semibold">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
              <p className="text-sm text-slate-500 text-center">
                Processing students...
              </p>
            </div>
          )}

          {!isImporting && (
            <div className="flex gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleImport}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Import
              </AlertDialogAction>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Import Report
            </DialogTitle>
            <DialogDescription>
              Detailed summary of the import operation
            </DialogDescription>
          </DialogHeader>

          {importStats && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-blue-50 rounded p-3 text-center">
                  <p className="text-xs text-blue-600">Total</p>
                  <p className="text-lg font-bold text-blue-900">{importStats.total}</p>
                </div>
                <div className="bg-green-50 rounded p-3 text-center">
                  <p className="text-xs text-green-600">Success</p>
                  <p className="text-lg font-bold text-green-900">{importStats.success}</p>
                </div>
                <div className="bg-red-50 rounded p-3 text-center">
                  <p className="text-xs text-red-600">Failed</p>
                  <p className="text-lg font-bold text-red-900">{importStats.failed}</p>
                </div>
                <div className="bg-purple-50 rounded p-3 text-center">
                  <p className="text-xs text-purple-600">Enrolled</p>
                  <p className="text-lg font-bold text-purple-900">{importStats.enrollmentSuccess}</p>
                </div>
              </div>

              {/* Failed Records */}
              {importStats.failedRecords.length > 0 && (
                <div className="border border-red-200 rounded-lg bg-red-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-red-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Failed Records ({importStats.failedRecords.length})
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadErrorReport}
                      className="border-red-300 text-red-700 hover:bg-red-100 gap-1"
                    >
                      <DownloadIcon className="h-3 w-3" />
                      Export
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {importStats.failedRecords.map((record, idx) => (
                      <div key={idx}>
                        <button
                          onClick={() => setExpandedFailures(
                            expandedFailures.includes(record.admission)
                              ? expandedFailures.filter(a => a !== record.admission)
                              : [...expandedFailures, record.admission]
                          )}
                          className="w-full text-left bg-white p-2 rounded border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{record.name}</p>
                            <p className="text-xs text-slate-500">{record.admission}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              'text-xs',
                              record.isDuplicate ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                            )}>
                              {record.errorCode}
                            </Badge>
                            {expandedFailures.includes(record.admission) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </button>

                        {expandedFailures.includes(record.admission) && (
                          <div className="bg-white border border-t-0 border-red-200 p-2 text-xs text-slate-600">
                            <p className="font-medium text-slate-900 mb-1">Reason:</p>
                            <p>{record.reason}</p>
                            {record.details && (
                              <>
                                <p className="font-medium text-slate-900 mt-2 mb-1">Details:</p>
                                <p className="font-mono bg-slate-50 p-1 rounded text-slate-700 break-words">
                                  {record.details}
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Summary */}
              {importStats.success > 0 && (
                <div className="border border-green-200 rounded-lg bg-green-50 p-4">
                  <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Successfully Imported ({importStats.success})
                  </p>
                  {importStats.enrollmentFailed > 0 && (
                    <p className="text-xs text-green-700 mb-2">
                      ℹ️ {importStats.enrollmentFailed} student(s) were created but enrollment failed. You can manually enroll them later.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResultsDialog(false);
                    navigate('/school-admin/learners');
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowResultsDialog(false);
                    navigate('/school-admin/learners');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View All Students
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkImportPage;

