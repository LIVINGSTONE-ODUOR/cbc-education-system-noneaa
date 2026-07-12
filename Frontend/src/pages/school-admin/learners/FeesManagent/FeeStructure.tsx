import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  RefreshCw, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Filter, 
  Download,
  Printer,
  FileDown,
  FileText,
  Loader2,
  AlertCircle,
  School,
  GraduationCap,
  DollarSign,
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getFeeStructures, 
  createFeeStructure, 
  updateFeeStructure, 
  deleteFeeStructure,
  FeeStructure,
  CreateFeeStructurePayload,
  UpdateFeeStructurePayload
} from '@/lib/api/feeStructureApi';
import { FEE_STRUCTURE_TEMPLATES, estimateAnnualTotal, FeeStructureTemplate } from './feeStructureTemplates';

// Academic year types (matching backend)
interface AcademicYear {
  id: string;
  name: string;
  year: number;
  is_current: boolean;
  term_names?: string[];
}

// Categories from backend
const VALID_CATEGORIES = [
  'tuition', 'activity', 'uniform', 'transport',
  'meals', 'examination', 'registration', 'other',
];

// Frequencies from backend
const VALID_FREQUENCIES = [
  'per_term', 'per_year', 'once_off', 'monthly',
];

// Valid grades from backend
const VALID_GRADES = [
  'PP1', 'PP2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
  'Grade 10', 'Grade 11', 'Grade 12',
];

// Default academic years - these are placeholders
// In production, fetch real academic years from /api/v1/academic-terms/school/:school_id
const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  { id: 'placeholder-1', name: 'Term 1 2025', year: 2025, is_current: true, term_names: ['Term 1', 'Term 2', 'Term 3'] },
  { id: 'placeholder-2', name: 'Term 2 2024', year: 2024, is_current: false, term_names: ['Term 1', 'Term 2', 'Term 3'] },
  { id: 'placeholder-3', name: 'Term 3 2024', year: 2024, is_current: false, term_names: ['Term 1', 'Term 2', 'Term 3'] },
];

// Helper to check if a string is a valid UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Fetch academic years from backend
const fetchAcademicYears = async (schoolId: string): Promise<AcademicYear[]> => {
  try {
    const token = localStorage.getItem('cbe_access_token');
    const API_URL = import.meta.env.PROD 
      ? 'https://cbc-education-system-1.onrender.com' 
      : '';
    
    const response = await fetch(`${API_URL}/api/v1/academic-terms/school/${schoolId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch academic years');
    }
    
    const data = await response.json();
    if (data.success && data.data) {
      return data.data.map((term: any) => ({
        id: term.id,
        name: term.name || `Term ${term.term_number} ${term.year}`,
        year: term.year,
        is_current: term.is_current,
        term_names: term.term_names,
      }));
    }
    return DEFAULT_ACADEMIC_YEARS;
  } catch (error) {
    console.error('[FeeStructure] Error fetching academic years:', error);
    return DEFAULT_ACADEMIC_YEARS;
  }
};

interface FeeStructuresTabProps {
  // Add any props if needed
}

export default function FeeStructuresTab({}: FeeStructuresTabProps) {
  const { user } = useAuth();
  
  // State
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(DEFAULT_ACADEMIC_YEARS);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template picker state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeStructureTemplate | null>(null);
  const [templateGrade, setTemplateGrade] = useState<string>('all');
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    grade_level: string;
    category: string;
    amount: string;
    frequency: string;
    description: string;
    is_mandatory: boolean;
  }>({
    name: '',
    grade_level: '',
    category: 'tuition',
    amount: '',
    frequency: 'per_term',
    description: '',
    is_mandatory: true,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      grade_level: '',
      category: 'tuition',
      amount: '',
      frequency: 'per_term',
      description: '',
      is_mandatory: true,
    });
    setSelectedFee(null);
  };

  // Fetch fee structures from API
  const fetchFeeStructures = useCallback(async () => {
    if (!user?.schoolId) {
      console.warn('[FeeStructure] No schoolId found. User:', user);
      setError('School ID not found. Please log in again.');
      return;
    }

    console.log('[FeeStructure] User schoolId:', user.schoolId);
    
    setIsLoading(true);
    setError(null);

    try {
      // When a specific grade is selected, we need to fetch more comprehensively
      // to include "All Grades" (null grade_level) records that may have different academic years
      let feeStructuresData: FeeStructure[] = [];
      
      if (selectedGrade && selectedGrade !== 'all') {
        // When filtering by specific grade, first get all active fees for the school
        // This ensures we get both specific grade AND All Grades records
        const allFilters = {
          is_active: true,
        };
        
        const response = await getFeeStructures(allFilters);
        let allData = (response as any).data?.fee_structures || (response as any).fee_structures || [];
        
        console.log('[FeeStructure] All data fetched:', allData.length);
        
        // Now filter on frontend: get specific grade + null grade (All Grades)
        const specificGradeFees = allData.filter((fee: FeeStructure) => 
          fee.grade_level === selectedGrade
        );
        const allGradesFees = allData.filter((fee: FeeStructure) => 
          fee.grade_level === null
        );
        
        // Combine both - specific grade fees + All Grades fees
        // Remove duplicates by ID
        const combinedFees = [...specificGradeFees];
        const existingIds = new Set(combinedFees.map((f: FeeStructure) => f.id));
        
        allGradesFees.forEach((fee: FeeStructure) => {
          if (!existingIds.has(fee.id)) {
            combinedFees.push(fee);
          }
        });
        
        feeStructuresData = combinedFees;
        console.log('[FeeStructure] Combined fees (specific + All Grades):', feeStructuresData);
        
        // If academic year is also selected, filter to that year as well
        // but keep both specific grade and All Grades records
        if (selectedYear && isValidUUID(selectedYear)) {
          feeStructuresData = feeStructuresData.filter((fee: FeeStructure) => 
            fee.academic_year_id === selectedYear
          );
          console.log('[FeeStructure] After year filter:', feeStructuresData);
        }
      } else {
        // Normal filtering for "All Grades" view
        const filters: {
          academic_year_id?: string;
          grade_level?: string;
          is_active?: boolean;
        } = {};

        // Only filter by year if it's a valid UUID (real academic year from backend)
        if (selectedYear && isValidUUID(selectedYear)) {
          filters.academic_year_id = selectedYear;
        }

        filters.is_active = true;

        console.log('[FeeStructure] Fetching with filters:', filters);
        
        const response = await getFeeStructures(filters);
        feeStructuresData = (response as any).data?.fee_structures || (response as any).fee_structures || [];
      }
      
      console.log('[FeeStructure] fee_structures:', feeStructuresData);
      setFeeStructures(feeStructuresData);
    } catch (err: any) {
      console.error('[FeeStructure] Error fetching:', err);
      setError(err.message || 'Failed to load fee structures');
      toast.error(err.message || 'Failed to load fee structures');
    } finally {
      setIsLoading(false);
    }
  }, [user?.schoolId, selectedYear, selectedGrade]);

  // Fetch academic years on mount
  useEffect(() => {
    const loadAcademicYears = async () => {
      if (user?.schoolId) {
        const years = await fetchAcademicYears(user.schoolId);
        setAcademicYears(years);
        
        // Set current year as default
        const currentYear = years.find(ay => ay.is_current);
        if (currentYear) {
          setSelectedYear(currentYear.id);
        }
      }
    };
    
    loadAcademicYears();
  }, [user?.schoolId]);

  // Fetch when year or grade changes
  useEffect(() => {
    // Always fetch when user is available and on mount
    if (user?.schoolId) {
      fetchFeeStructures();
    }
  }, [selectedYear, selectedGrade, user?.schoolId]);

  // Group fees by grade
  const groupedFees = feeStructures.reduce((acc, fee) => {
    const grade = fee.grade_level || 'All Grades';
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(fee);
    return acc;
  }, {} as Record<string, FeeStructure[]>);

  // Calculate totals by grade
  const calculateGradeTotal = (fees: FeeStructure[]): number => {
    return fees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  };

  // Handle create
  const handleCreate = async () => {
    if (!formData.name || !formData.amount || !selectedYear) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateFeeStructurePayload = {
        academic_year_id: selectedYear,
        name: formData.name,
        grade_level: formData.grade_level || undefined,
        category: formData.category,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        description: formData.description || undefined,
        is_mandatory: formData.is_mandatory,
      };

      await createFeeStructure(payload);
      toast.success('Fee structure created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchFeeStructures();
    } catch (err: any) {
      console.error('[FeeStructure] Create error:', err);
      toast.error(err.message || 'Failed to create fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!selectedFee || !formData.name || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateFeeStructurePayload = {
        name: formData.name,
        grade_level: formData.grade_level || undefined,
        category: formData.category,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        description: formData.description || undefined,
        is_mandatory: formData.is_mandatory,
      };

      await updateFeeStructure(selectedFee.id, payload);
      toast.success('Fee structure updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      fetchFeeStructures();
    } catch (err: any) {
      console.error('[FeeStructure] Update error:', err);
      toast.error(err.message || 'Failed to update fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedFee) return;

    setIsSubmitting(true);
    try {
      await deleteFeeStructure(selectedFee.id);
      toast.success('Fee structure deleted successfully');
      setIsDeleteDialogOpen(false);
      resetForm();
      fetchFeeStructures();
    } catch (err: any) {
      console.error('[FeeStructure] Delete error:', err);
      toast.error(err.message || 'Failed to delete fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply a chosen template: create one fee structure per template item
  // for the selected grade (or All Grades) in the current academic year.
  const applyTemplate = async () => {
    if (!selectedTemplate) return;
    if (!selectedYear || !isValidUUID(selectedYear)) {
      toast.error('Select a real academic year first (not a placeholder) before applying a template.');
      return;
    }

    setIsApplyingTemplate(true);
    let succeeded = 0;
    let skipped = 0;

    for (const item of selectedTemplate.items) {
      // Skip zero-amount placeholder items (e.g. "government funded" tuition)
      // — nothing to bill, so no fee record is needed.
      if (item.amount <= 0) {
        skipped++;
        continue;
      }
      try {
        await createFeeStructure({
          academic_year_id: selectedYear,
          name: item.label,
          grade_level: templateGrade && templateGrade !== 'all' ? templateGrade : undefined,
          category: item.category,
          amount: item.amount,
          frequency: item.frequency,
          is_mandatory: item.is_mandatory,
          description: item.note,
        });
        succeeded++;
      } catch (err: any) {
        // Most likely a duplicate (already applied before) — skip and continue.
        console.warn('[FeeStructure] Template item skipped:', item.label, err.message);
        skipped++;
      }
    }

    setIsApplyingTemplate(false);
    setIsTemplateDialogOpen(false);
    setSelectedTemplate(null);
    setTemplateGrade('all');

    if (succeeded > 0) {
      toast.success(`Applied "${selectedTemplate.name}" — ${succeeded} fee item${succeeded === 1 ? '' : 's'} created${skipped > 0 ? `, ${skipped} skipped` : ''}.`);
      fetchFeeStructures();
    } else {
      toast.error('No fee items were created — they may already exist for this grade and year.');
    }
  };

  const openEditDialog = (fee: FeeStructure) => {
    setSelectedFee(fee);
    setFormData({
      name: fee.name,
      grade_level: fee.grade_level || '',
      category: fee.category,
      amount: String(fee.amount),
      frequency: fee.frequency,
      description: fee.description || '',
      is_mandatory: fee.is_mandatory,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (fee: FeeStructure) => {
    setSelectedFee(fee);
    setIsDeleteDialogOpen(true);
  };

  // Get display name for frequency
  const getFrequencyLabel = (freq: string): string => {
    const labels: Record<string, string> = {
      'per_term': 'Per Term',
      'per_year': 'Per Year',
      'once_off': 'Once Off',
      'monthly': 'Monthly',
    };
    return labels[freq] || freq;
  };

  // Get category badge color
  const getCategoryBadgeColor = (cat: string): string => {
    const colors: Record<string, string> = {
      'tuition': 'bg-blue-100 text-blue-800',
      'activity': 'bg-green-100 text-green-800',
      'uniform': 'bg-purple-100 text-purple-800',
      'transport': 'bg-yellow-100 text-yellow-800',
      'meals': 'bg-orange-100 text-orange-800',
      'examination': 'bg-red-100 text-red-800',
      'registration': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-gray-100 text-gray-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  // Current year name for display
  const currentYearName = academicYears.find(ay => ay.id === selectedYear)?.name || 'Select Year';

  // Check if user is admin
  const isAdmin = user?.role === 'school_admin' || user?.role === 'super_admin';

  // Export to CSV function
  const exportToCSV = () => {
    if (feeStructures.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Academic Year', 'Term', 'Grade Level', 'Fee Name', 'Category', 'Frequency', 'Amount', 'Mandatory'];
    const rows = feeStructures.map(fee => [
      currentYearName,
      'All Terms',
      fee.grade_level || 'All Grades',
      fee.name,
      fee.category.charAt(0).toUpperCase() + fee.category.slice(1),
      getFrequencyLabel(fee.frequency),
      Number(fee.amount).toString(),
      fee.is_mandatory ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fee_structure_${selectedGrade}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Fee structure exported to CSV');
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (feeStructures.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window');
      return;
    }

    const gradeFilter = selectedGrade === 'all' ? 'All Grades' : selectedGrade;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Structure - ${currentYearName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 14px; color: #666; }
          .filters { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .filters p { font-size: 13px; margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background-color: #333; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .amount { text-align: right; font-weight: bold; }
          .mandatory-yes { color: green; font-weight: bold; }
          .mandatory-no { color: #888; }
          .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #666; }
          .summary { margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fee Structure Report</h1>
          <p>School Management System</p>
        </div>
        
        <div class="filters">
          <p><strong>Academic Year:</strong> ${currentYearName}</p>
          <p><strong>Grade Level:</strong> ${gradeFilter}</p>
          <p><strong>Total Fee Items:</strong> ${feeStructures.length}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Grade Level</th>
              <th>Fee Name</th>
              <th>Category</th>
              <th>Frequency</th>
              <th>Amount (KES)</th>
              <th>Mandatory</th>
            </tr>
          </thead>
          <tbody>
            ${feeStructures.map(fee => `
              <tr>
                <td>${fee.grade_level || 'All Grades'}</td>
                <td>${fee.name}</td>
                <td>${fee.category.charAt(0).toUpperCase() + fee.category.slice(1)}</td>
                <td>${getFrequencyLabel(fee.frequency)}</td>
                <td class="amount">${Number(fee.amount).toLocaleString()}</td>
                <td class="${fee.is_mandatory ? 'mandatory-yes' : 'mandatory-no'}">${fee.is_mandatory ? 'Yes' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span><strong>Total Fee Items:</strong></span>
            <span>${feeStructures.length}</span>
          </div>
          <div class="summary-row">
            <span><strong>Total Amount:</strong></span>
            <span><strong>KES ${feeStructures.reduce((sum, fee) => sum + Number(fee.amount), 0).toLocaleString()}</strong></span>
          </div>
        </div>

        <div class="footer">
          <p>Generated from CBC Education System on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
    
    toast.success('Preparing PDF for download...');
  };

  // Handle export based on format
  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fee Structure</h2>
          <p className="text-muted-foreground">Manage fee structures by grade and academic year</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchFeeStructures}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          
          {isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Fee Structure</DialogTitle>
                  <DialogDescription>
                    Add a new fee structure for a specific grade and category.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Fee Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Grade 4 Tuition Fee"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="grade">Grade Level</Label>
                      <Select
                        value={formData.grade_level}
                        onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (KES) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="frequency">Frequency *</Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VALID_FREQUENCIES.map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {getFrequencyLabel(freq)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Fee
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Dialog
              open={isTemplateDialogOpen}
              onOpenChange={(open) => {
                setIsTemplateDialogOpen(open);
                if (!open) {
                  setSelectedTemplate(null);
                  setTemplateGrade('all');
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
                {!selectedTemplate ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Choose a fee structure template</DialogTitle>
                      <DialogDescription>
                        Start from a typical Kenyan school fee structure, then customize amounts afterward. Applies to the academic year selected below ({currentYearName}).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                      {FEE_STRUCTURE_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplate(template)}
                          className="text-left border rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-semibold text-sm">{template.name}</span>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{template.tag}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{template.items.length} fee items</span>
                            <span className="font-semibold">
                              ~KES {estimateAnnualTotal(template.items).toLocaleString()}/yr
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => setSelectedTemplate(null)}>
                          ← Back
                        </Button>
                      </DialogTitle>
                      <DialogTitle>{selectedTemplate.name}</DialogTitle>
                      <DialogDescription>{selectedTemplate.description}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="grid gap-2">
                        <Label>Apply to grade</Label>
                        <Select value={templateGrade} onValueChange={setTemplateGrade}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Grades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Grades</SelectItem>
                            {VALID_GRADES.map((grade) => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="border rounded-lg divide-y">
                        {selectedTemplate.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.label}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {item.category} · {getFrequencyLabel(item.frequency)}
                                {!item.is_mandatory && ' · Optional'}
                              </p>
                            </div>
                            <span className="font-semibold shrink-0">
                              {item.amount > 0 ? `KES ${item.amount.toLocaleString()}` : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSelectedTemplate(null)} disabled={isApplyingTemplate}>
                        Cancel
                      </Button>
                      <Button onClick={applyTemplate} disabled={isApplyingTemplate}>
                        {isApplyingTemplate ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Apply Template
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}
          
          {/* Print Dropdown */}
          {feeStructures.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Termly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Yearly
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Download Dropdown */}
          {feeStructures.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="mb-2 block">Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.is_current && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label className="mb-2 block">Grade Level</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {VALID_GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => { setSelectedYear(''); setSelectedGrade('all'); }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="link" onClick={fetchFeeStructures}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading fee structures...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Structure Table */}
      {!isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Fee Structure - {currentYearName}
            </CardTitle>
            <CardDescription>
              {feeStructures.length > 0 
                ? `${feeStructures.length} fee item(s) configured`
                : 'No fee structures found. Click "Add Fee" to create one.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {feeStructures.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mandatory</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">
                        {fee.grade_level || 'All Grades'}
                      </TableCell>
                      <TableCell>{fee.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(fee.category)}>
                          {fee.category.charAt(0).toUpperCase() + fee.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getFrequencyLabel(fee.frequency)}</TableCell>
                      <TableCell className="font-medium">
                        KES {Number(fee.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {fee.is_mandatory ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(fee)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(fee)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Fee Structures</h3>
                <p className="text-muted-foreground max-w-md">
                  No fee structures found for the selected filters. 
                  {isAdmin && ' Click "Add Fee" to create your first fee structure.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {!isLoading && feeStructures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Fee Items</CardDescription>
              <CardTitle className="text-3xl">{feeStructures.length}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue (if all paid)</CardDescription>
              <CardTitle className="text-3xl">
                KES {feeStructures.reduce((sum, fee) => sum + Number(fee.amount), 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Grade Levels Configured</CardDescription>
              <CardTitle className="text-3xl">
                {Object.keys(groupedFees).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>
              Update the fee structure details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Fee Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Grade 4 Tuition Fee"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-grade">Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount (KES) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-frequency">Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {getFrequencyLabel(freq)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Structure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFee?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
