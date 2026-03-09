import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Plus, Download, Eye, Edit, Trash2,
  BookOpen, Layers, AlignLeft, CheckSquare, GraduationCap,
  X, Archive, Settings2, Award, ChevronRight, FileSpreadsheet, Loader2,
} from "lucide-react";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import CurriculumStats from "./CurriculumStats";
import CurriculumFilters from "./CurriculumFilters";
import LearningAreasTable from "./LearningAreasTable";

import {
  LEVEL_CONFIG,
  getAllLearningAreas,
  getCurriculumStats,
  filterLearningAreas,
  getLevelCards,
  LearningArea as LocalLearningArea,
} from "@/services/curriculumService";

import { getLearningAreas as fetchLearningAreasApi, createLearningArea, updateLearningArea, hardDeleteLearningArea } from "@/lib/api/curriculumApi";

// Type for table display - combines API and local format
type TableRow = LocalLearningArea & { levelId: string; level: string; grades: string };

// Map API response to table format  
const mapApiToTableRows = (data: any[]): TableRow[] => {
  return data.map((la: any) => {
    const grades = la.grade_levels || [];
    let levelId = "lp";
    let level = "Lower Primary";
    let gradeRange = "Grade 1 – 3";
    
    if (grades.some((g: string) => g?.startsWith("PP"))) {
      levelId = "pp";
      level = "Pre-Primary";
      gradeRange = "PP1 – PP2";
    } else if (grades.some((g: string) => g === "Grade 4" || g === "Grade 5" || g === "Grade 6")) {
      levelId = "up";
      level = "Upper Primary";
      gradeRange = "Grade 4 – 6";
    } else if (grades.some((g: string) => g === "Grade 7" || g === "Grade 8" || g === "Grade 9")) {
      levelId = "js";
      level = "Junior Secondary";
      gradeRange = "Grade 7 – 9";
    }
    
    const strandArr = la.strands || [];
    const subStrandsCount = strandArr.reduce((sum: number, s: any) => sum + (s.sub_strands?.length || 0), 0);
    const competenciesCount = strandArr.reduce((sum: number, s: any) => 
      sum + (s.sub_strands?.reduce((ssum: number, ss: any) => ssum + (ss.competencies?.length || 0), 0) || 0), 0);
    
    return {
      ...la,
      levelId,
      level,
      grades: gradeRange,
      name: la.name,
      code: la.code,
      strands: la.strand_count || strandArr.length,
      subStrands: subStrandsCount,
      competencies: competenciesCount,
      optional: false,
      desc: la.description || "",
      strandList: strandArr.map((s: any) => ({
        name: s.name,
        subStrands: s.sub_strands?.map((ss: any) => ss.name) || []
      })) || [],
      competencyList: strandArr.flatMap((s: any) => 
        s.sub_strands?.flatMap((ss: any) => ss.competencies?.map((c: any) => c.name) || []) || []
      ) || []
    };
  });
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CurriculumDashboard() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevel] = useState("all");
  const [typeFilter, setType] = useState("all");
  const [minStrands, setMinStrands] = useState("");
  const [minComp, setMinComp] = useState("");
  const [sortKey, setSortKey] = useState<"code" | "name" | "level" | "strands" | "subStrands" | "competencies" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelected] = useState(new Set<string>());
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState<TableRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<"pp" | "lp" | "up" | "js" | null>(null);
  const [showAdvFilter, setShowAdv] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // API state
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<TableRow[]>([]);

  // Add Learning Area form state
  const [newLaCode, setNewLaCode] = useState("");
  const [newLaName, setNewLaName] = useState("");
  const [newLaLevel, setNewLaLevel] = useState("");
  const [newLaDesc, setNewLaDesc] = useState("");
  const [newLaType, setNewLaType] = useState("core");
  const [isAdding, setIsAdding] = useState(false);

  // Edit Learning Area state
  const [editOpen, setEditOpen] = useState(false);
  const [editLaId, setEditLaId] = useState("");
  const [editLaCode, setEditLaCode] = useState("");
  const [editLaName, setEditLaName] = useState("");
  const [editLaLevel, setEditLaLevel] = useState("");
  const [editLaDesc, setEditLaDesc] = useState("");
  const [editLaType, setEditLaType] = useState("core");
  const [isEditing, setIsEditing] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to convert level to grade levels
  const getGradeLevelsFromLevel = (level: string): string[] => {
    switch (level) {
      case 'pp': return ['PP1', 'PP2'];
      case 'lp': return ['Grade 1', 'Grade 2', 'Grade 3'];
      case 'up': return ['Grade 4', 'Grade 5', 'Grade 6'];
      case 'js': return ['Grade 7', 'Grade 8', 'Grade 9'];
      default: return [];
    }
  };

  // Handle Add Learning Area
  const handleAddLearningArea = async () => {
    if (!newLaCode || !newLaName || !newLaLevel) {
      alert('Please fill in all required fields (Code, Name, Level)');
      return;
    }
    setIsAdding(true);
    try {
      const gradeLevels = getGradeLevelsFromLevel(newLaLevel);
      await createLearningArea({
        code: newLaCode,
        name: newLaName,
        description: newLaDesc,
        grade_levels: gradeLevels
      });
      // Refresh data
      const response = await fetchLearningAreasApi({ is_active: true });
      if (response.success && response.data) {
        const mappedData = mapApiToTableRows(response.data.learning_areas);
        setApiData(mappedData);
      }
      // Reset form and close
      setNewLaCode('');
      setNewLaName('');
      setNewLaLevel('');
      setNewLaDesc('');
      setNewLaType('core');
      setAddOpen(false);
    } catch (err: any) {
      console.error('Failed to create learning area:', err);
      alert(err.message || 'Failed to create learning area');
    } finally {
      setIsAdding(false);
    }
  };

  // Reset add form
  const resetAddForm = () => {
    setNewLaCode('');
    setNewLaName('');
    setNewLaLevel('');
    setNewLaDesc('');
    setNewLaType('core');
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await fetchLearningAreasApi({ is_active: true });
        if (response.success && response.data) {
          const mappedData = mapApiToTableRows(response.data.learning_areas);
          setApiData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch learning areas:", err);
        setApiError("Failed to load data from server. Using local data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Use API data or fallback to local data
  const allRows = useMemo(() => {
    if (apiData.length > 0) return apiData;
    return getAllLearningAreas() as TableRow[];
  }, [apiData]);
  
  const stats = useMemo(() => getCurriculumStats(), [allRows]);
  const levelCards = useMemo(() => getLevelCards(stats), [stats]);

  const filters = { search, level: levelFilter, type: typeFilter, minStrands, minComp };
  
  const filtered = useMemo(() => {
    let rows = filterLearningAreas(allRows, filters, kpiFilter);
    if (sortKey) {
      rows = [...rows].sort((a: any, b: any) => {
        const va = a[sortKey] as string | number;
        const vb = b[sortKey] as string | number;
        let cmp = 0;
        if (typeof va === 'string' && typeof vb === 'string') {
          cmp = va.localeCompare(vb);
        } else if (typeof va === 'number' && typeof vb === 'number') {
          cmp = va - vb;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [allRows, levelFilter, typeFilter, minStrands, minComp, search, sortKey, sortDir, kpiFilter]);

  const rpp = rowsPerPage === "all" ? filtered.length : parseInt(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rpp));
  const pageRows = filtered.slice((page - 1) * rpp, page * rpp);

  const hasActiveFilters = search || levelFilter !== "all" || typeFilter !== "all" || minStrands || minComp || kpiFilter;

  // Export to XLS function
  const handleExportXLS = () => {
    const dataToExport = selectedRows.size > 0 
      ? filtered.filter((row: any) => selectedRows.has(row.code))
      : filtered;
    
    const headers = ['Code', 'Name', 'Level', 'Strands', 'Sub-Strands', 'Competencies', 'Type', 'Description'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map((row: any) => [
        row.code,
        `"${row.name}"`,
        row.level,
        row.strands,
        row.subStrands,
        row.competencies,
        row.optional ? 'Optional' : 'Core',
        `"${row.desc || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `curriculum_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) return;
    
    setIsDeleting(true);
    const rowsToDelete = Array.from(selectedRows);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const code of rowsToDelete) {
        const rowData = apiData.find((r: any) => r.code === code);
        const deleteId = rowData?.id || code;
        
        try {
          await hardDeleteLearningArea(deleteId);
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Error deleting ${code}:`, err);
        }
      }
      
      if (successCount > 0) {
        const response = await fetchLearningAreasApi({ is_active: true });
        if (response.success && response.data) {
          const mappedData = mapApiToTableRows(response.data.learning_areas);
          setApiData(mappedData);
        }
      }
      
      if (successCount > 0) alert(`Deleted ${successCount} learning area(s)`);
      if (errorCount > 0) alert(`Failed to delete ${errorCount} learning area(s)`);
      
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert('Failed to delete: ' + err.message);
    } finally {
      setSelected(new Set());
      setDeleteOpen(false);
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch(""); setLevel("all"); setType("all");
    setMinStrands(""); setMinComp(""); setKpiFilter(null); setPage(1);
  };

  const toggleSort = (key: typeof sortKey) => {
    if (!key) return;
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleSelect = (code: string) => setSelected(prev => {
    const s = new Set(prev);
    s.has(code) ? s.delete(code) : s.add(code);
    return s;
  });

  const toggleAll = () => {
    if (selectedRows.size === pageRows.length) setSelected(new Set());
    else setSelected(new Set(pageRows.map((r: any) => r.code)));
  };

  const allSelected = pageRows.length > 0 && selectedRows.size === pageRows.length;
  const someSelected = selectedRows.size > 0 && !allSelected;

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'search': setSearch(value); break;
      case 'level': setLevel(value); setKpiFilter(null); break;
      case 'type': setType(value); break;
      case 'minStrands': setMinStrands(value); break;
      case 'minComp': setMinComp(value); break;
    }
    setPage(1);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6 space-y-6">
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading curriculum data...</span>
          </div>
        )}

        {/* Error Notice */}
        {apiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            {apiError}
          </div>
        )}

        {/* ── Statistics Grid ── */}
        {!isLoading && <CurriculumStats stats={stats} />}

        {/* ── Level Filter Cards ── */}
        {!isLoading && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {levelCards.map(card => (
              <button
                key={card.id}
                onClick={() => {
                  const newFilter = card.id === "all" ? null : card.id as "pp" | "lp" | "up" | "js";
                  setKpiFilter(newFilter);
                  setLevel("all");
                  setPage(1);
                }}
                className={`
                  relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200
                  hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5
                  ${(kpiFilter === card.id || (card.id === "all" && !kpiFilter))
                    ? "ring-2 ring-offset-2 shadow-xl scale-[1.02]" 
                    : "shadow-md border border-gray-200 dark:border-gray-700"
                  }
                `}
                style={{ background: `linear-gradient(135deg, ${card.gradient.includes('slate') ? '#475569,#64748b' : card.gradient.includes('blue') ? '#2563eb,#60a5fa' : card.gradient.includes('emerald') ? '#059669,#34d399' : card.gradient.includes('violet') ? '#7c3aed,#a78bfa' : '#f97316,#fb923c'})` }}
              >
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="h-5 w-5 text-white/90" />
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-sm font-medium text-white/90">{card.title}</p>
                  <p className="text-xs text-white/70">{card.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Filters Bar ── */}
        {!isLoading && (
          <>
            <div className="flex items-center justify-between gap-3">
              <CurriculumFilters
                filters={filters}
                showAdvFilter={showAdvFilter}
                filteredCount={filtered.length}
                totalCount={allRows.length}
                onFilterChange={handleFilterChange}
                onToggleAdvFilter={() => setShowAdv(v => !v)}
                onResetFilters={resetFilters}
              />
              <Button 
                onClick={() => setAddOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Learning Area
              </Button>
            </div>

            {/* ── Bulk Action Toolbar ── */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckSquare className="h-4 w-4" />
                  {selectedRows.size} row{selectedRows.size > 1 ? "s" : ""} selected
                </div>
                <Separator orientation="vertical" className="h-5 bg-primary-foreground/30" />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleExportXLS}>
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Export XLS
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto h-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setSelected(new Set())}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ── Table ── */}
            <LearningAreasTable
              rows={pageRows as any}
              selectedRows={selectedRows}
              sortKey={sortKey}
              sortDir={sortDir}
              allSelected={allSelected}
              someSelected={someSelected}
              onToggleSort={toggleSort}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
              onViewDetails={setViewRow as any}
            />

            {/* ── Pagination ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <Select value={rowsPerPage} onValueChange={v => { setRowsPerPage(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                <span>
                  Showing <span className="font-semibold text-foreground">{Math.min((page - 1) * rpp + 1, filtered.length)}</span>–<span className="font-semibold text-foreground">{Math.min(page * rpp, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> records
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Button key={p} variant={page === p ? "default" : "outline"} size="sm" className="w-9" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next ›</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
              </div>
            </div>

            {/* ── View Details Dialog ── */}
            <Dialog open={!!viewRow} onOpenChange={() => setViewRow(null)}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${viewRow ? LEVEL_CONFIG[viewRow.levelId]?.icon : ''}`}>
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{viewRow?.name}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`font-mono text-xs ${viewRow ? LEVEL_CONFIG[viewRow.levelId]?.badge : ''}`}>
                          {viewRow?.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{viewRow?.level}</Badge>
                        {viewRow?.optional ? (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Optional</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Core</Badge>
                        )}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                {viewRow && (
                  <div className="flex-1 overflow-y-auto px-1">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="w-full grid grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="strands">Strands</TabsTrigger>
                        <TabsTrigger value="substrands">Sub-Strands</TabsTrigger>
                        <TabsTrigger value="competencies">Competencies</TabsTrigger>
                      </TabsList>
                      
                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-3">Description</p>
                          <p className="text-sm">{(viewRow as any).desc}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
                            <p className="text-3xl font-bold text-blue-700">{viewRow.strands}</p>
                            <p className="text-sm font-medium text-blue-600">Strands</p>
                          </div>
                          <div className="bg-violet-50 rounded-xl border border-violet-200 p-4 text-center">
                            <p className="text-3xl font-bold text-violet-700">{viewRow.subStrands}</p>
                            <p className="text-sm font-medium text-violet-600">Sub-Strands</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                            <p className="text-3xl font-bold text-emerald-700">{viewRow.competencies}</p>
                            <p className="text-sm font-medium text-emerald-600">Competencies</p>
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-3">Grade Levels</p>
                          <p className="text-sm font-medium">{viewRow.grades}</p>
                        </div>
                      </TabsContent>
                      
                      {/* Strands Tab */}
                      <TabsContent value="strands" className="mt-4">
                        <div className="space-y-3">
                          {(viewRow.strandList as any[])?.length > 0 ? (viewRow.strandList as any[]).map((strand: any, i: number) => (
                            <div key={i} className="rounded-lg border border-border bg-background p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
                                  <Layers className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="font-semibold text-sm">{strand.name}</span>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {strand.subStrands?.length || 0} sub-strands
                                </Badge>
                              </div>
                              <div className="pl-11 space-y-2">
                                {(strand.subStrands || []).map((ss: string, j: number) => (
                                  <div key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ChevronRight className="h-3 w-3" />
                                    <span>{ss}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground">No strands data available</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      {/* Sub-Strands Tab */}
                      <TabsContent value="substrands" className="mt-4">
                        <div className="space-y-2">
                          {(viewRow.strandList as any[])?.length > 0 ? (viewRow.strandList as any[]).flatMap((s: any, si: number) => 
                            (s.subStrands || []).map((ss: string, ssi: number) => (
                              <div key={`${si}-${ssi}`} className="flex items-center gap-3 rounded-lg bg-violet-50/50 border border-violet-100 px-4 py-3 hover:bg-violet-100/50 transition-colors">
                                <div className="h-2 w-2 rounded-full bg-violet-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-violet-800">{ss}</span>
                                <Badge variant="outline" className="ml-auto text-xs bg-white">{viewRow.level}</Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No sub-strands data available</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      {/* Competencies Tab */}
                      <TabsContent value="competencies" className="mt-4">
                        <div className="space-y-2">
                          {(viewRow.competencyList as any[])?.length > 0 ? (viewRow.competencyList as any[]).map((comp: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 rounded-lg bg-emerald-50/50 border border-emerald-100 px-4 py-3 hover:bg-emerald-100/50 transition-colors">
                              <Award className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm font-medium text-emerald-800 leading-relaxed">{comp}</span>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground">No competencies data available</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
                
                <DialogFooter className="flex-shrink-0 mt-4">
                  <Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>
                  <Button variant="default">
                    <Edit className="h-4 w-4 mr-2" /> Edit Area
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Add Dialog ── */}
            <Dialog open={addOpen} onOpenChange={(open) => { if (!open) resetAddForm(); setAddOpen(open); }}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Learning Area</DialogTitle>
                  <DialogDescription>Create a new learning area in the CBC curriculum.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="la-code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code *</Label>
                      <Input 
                        id="la-code" 
                        placeholder="e.g. UPMATH" 
                        className="font-mono"
                        value={newLaCode}
                        onChange={(e) => setNewLaCode(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level *</Label>
                      <Select value={newLaLevel} onValueChange={setNewLaLevel}>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pp">Pre-Primary</SelectItem>
                          <SelectItem value="lp">Lower Primary</SelectItem>
                          <SelectItem value="up">Upper Primary</SelectItem>
                          <SelectItem value="js">Junior Secondary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name *</Label>
                    <Input 
                      placeholder="e.g. Mathematics" 
                      value={newLaName}
                      onChange={(e) => setNewLaName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                    <Input 
                      placeholder="Brief description of this learning area" 
                      value={newLaDesc}
                      onChange={(e) => setNewLaDesc(e.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
                    <Select value={newLaType} onValueChange={setNewLaType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { resetAddForm(); setAddOpen(false); }}>Cancel</Button>
                  <Button onClick={handleAddLearningArea} disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Learning Area
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ── */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedRows.size} selected learning area{selectedRows.size > 1 ? 's' : ''}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

