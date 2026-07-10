import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Search, Plus, Download, Eye, Edit, Trash2, AlertCircle, CheckCircle2,
  BookOpen, Layers, GraduationCap, X, Award, Loader2, RefreshCw, Check,
  Filter, Grid3x3, List, ChevronLeft, ChevronRight,
} from "lucide-react";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import CurriculumStats from "./CurriculumStats";
import LearningAreasTable from "./LearningAreasTable";

import { LEVEL_CONFIG } from "@/services/curriculumService";
import { getClasses, type ClassApiItem } from "@/lib/api/classApi";
import {
  getLearningAreas as fetchLearningAreasApi,
  createLearningArea,
  updateLearningArea,
  hardDeleteLearningArea,
} from "@/lib/api/curriculumApi";
import { toast } from "sonner";

// Turns a CurriculumApiError's field-level errors (if any) into one readable
// line, e.g. "grade_levels: Invalid grade in array. Valid: PP1, PP2, ..."
// Falls back to the generic top-level message when there's nothing more specific.
const describeApiError = (err: any, fallback: string): string => {
  if (Array.isArray(err?.errors) && err.errors.length > 0) {
    return err.errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(" | ");
  }
  return err?.message || fallback;
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface CurriculumStatsType {
  total: number;
  byLevel: Record<string, number>;
  strands: number;
  subStrands: number;
  competencies: number;
}

interface LevelCard {
  id: string;
  title: string;
  value: number;
  sub: string;
  gradient: string;
  icon: React.ReactNode;
}

type TableRow = {
  id: string;
  code: string;
  name: string;
  level: string;
  levelId: string;
  grades: string;
  gradeLevels: string[];
  classIds: string[];
  strands: number;
  subStrands: number;
  competencies: number;
  optional: boolean;
  desc: string;
  strandList: any[];
  competencyList: any[];
};

type SortKey = "code" | "name" | "level" | "strands" | "subStrands" | "competencies" | null;
type LevelFilter = "pp" | "lp" | "up" | "js" | null;

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════��═════════════════════════════════

const mapApiToTableRows = (data: any[]): TableRow[] => {
  return data.map((la: any) => {
    const grades = la.grade_levels || [];
    let levelId: LevelFilter = "lp";
    let level = "Lower Primary";
    let gradeRange = "Grade 1 – 3";

    if (grades.some((g: string) => g?.startsWith("PP"))) {
      levelId = "pp";
      level = "Pre-Primary";
      gradeRange = "PP1 – PP2";
    } else if (grades.some((g: string) => ["Grade 4", "Grade 5", "Grade 6"].includes(g))) {
      levelId = "up";
      level = "Upper Primary";
      gradeRange = "Grade 4 – 6";
    } else if (grades.some((g: string) => ["Grade 7", "Grade 8", "Grade 9"].includes(g))) {
      levelId = "js";
      level = "Junior Secondary";
      gradeRange = "Grade 7 – 9";
    }

    return {
      id: la.id,
      code: la.code,
      name: la.name,
      level,
      levelId,
      grades: gradeRange,
      gradeLevels: grades,
      classIds: la.class_ids || [],
      strands: typeof la.strand_count === "number" ? la.strand_count : 0,
      subStrands: 0,
      competencies: 0,
      optional: false,
      desc: la.description || "",
      strandList: [],
      competencyList: [],
    };
  });
};

const getGradeLevelsFromLevel = (level: string): string[] => {
  const gradeLevelMap: Record<string, string[]> = {
    pp: ["PP1", "PP2"],
    lp: ["Grade 1", "Grade 2", "Grade 3"],
    up: ["Grade 4", "Grade 5", "Grade 6"],
    js: ["Grade 7", "Grade 8", "Grade 9"],
  };
  return gradeLevelMap[level] || [];
};

const exportToCSV = (data: TableRow[]) => {
  const headers = ["Code", "Name", "Level", "Strands", "Sub-Strands", "Competencies", "Type", "Description"];
  const csvContent = [
    headers.join(","),
    ...data.map((row) => [
      row.code,
      `"${row.name}"`,
      row.level,
      row.strands,
      row.subStrands,
      row.competencies,
      row.optional ? "Optional" : "Core",
      `"${(row.desc || "").replace(/"/g, '""')}"`,
    ].join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `curriculum_export_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CurriculumDashboard() {
  // ───────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────

  // API State
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<TableRow[]>([]);

  // Registered classes (fetched live from the classes table, for the
  // Learning Area class picker -- never a hardcoded list)
  const [registeredClasses, setRegisteredClasses] = useState<ClassApiItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState("");
  const [levelFilter, setLevel] = useState("all");
  const [typeFilter, setType] = useState("all");
  const [minStrands, setMinStrands] = useState("");
  const [minComp, setMinComp] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [kpiFilter, setKpiFilter] = useState<LevelFilter>(null);
  const [showAdvFilter, setShowAdv] = useState(false);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [page, setPage] = useState(1);

  // Selection State
  const [selectedRows, setSelected] = useState(new Set<string>());

  // UI State
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [viewRow, setViewRow] = useState<TableRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form State - Add
  const [newLaCode, setNewLaCode] = useState("");
  const [newLaName, setNewLaName] = useState("");
  const [newLaLevel, setNewLaLevel] = useState("");
  const [newLaClassIds, setNewLaClassIds] = useState<string[]>([]);
  const [newLaDesc, setNewLaDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Form State - Edit
  const [editLaId, setEditLaId] = useState("");
  const [editLaCode, setEditLaCode] = useState("");
  const [editLaName, setEditLaName] = useState("");
  const [editLaLevel, setEditLaLevel] = useState("");
  const [editLaClassIds, setEditLaClassIds] = useState<string[]>([]);
  const [editLaDesc, setEditLaDesc] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);

  // ───────────────────────────────────────────────────────────────────────
  // API CALLS
  // ──────────��────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
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
      setApiError("Failed to load data from server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch the school's actual registered classes (grade + stream), used to
  // populate the Learning Area class picker. Always live from the DB.
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    try {
      const response = await getClasses({ is_active: "true", limit: 500 });
      if (response.success && response.data) {
        setRegisteredClasses(response.data.classes);
      }
    } catch (err) {
      console.error("Failed to fetch registered classes:", err);
      toast.error("Could not load registered classes");
    } finally {
      setClassesLoading(false);
    }
  }, []);

  const toggleNewLaClass = (classId: string) => {
    setNewLaClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const toggleEditLaClass = (classId: string) => {
    setEditLaClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleAddLearningArea = async () => {
    if (!newLaCode?.trim() || !newLaName?.trim() || newLaClassIds.length === 0) {
      toast.error("Please fill in all required fields, including at least one class", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    setIsAdding(true);
    try {
      const selectedClasses = registeredClasses.filter((c) => newLaClassIds.includes(c.id));
      const gradeLevels = Array.from(new Set(selectedClasses.map((c) => c.grade_level)));

      await createLearningArea({
        code: newLaCode.trim(),
        name: newLaName.trim(),
        description: newLaDesc.trim(),
        grade_levels: gradeLevels,
        class_ids: newLaClassIds,
      });

      await fetchData();
      setNewLaCode("");
      setNewLaName("");
      setNewLaLevel("");
      setNewLaClassIds([]);
      setNewLaDesc("");
      setAddOpen(false);

      toast.success(`✓ Learning area "${newLaName}" created successfully`, {
        icon: <Check className="h-4 w-4" />,
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Failed to create learning area:", err, err?.errors);
      toast.error(describeApiError(err, "Failed to create learning area"), {
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 6000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditLearningArea = async () => {
    if (!editLaCode?.trim() || !editLaName?.trim() || editLaClassIds.length === 0) {
      toast.error("Please fill in all required fields, including at least one class", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    setIsEditing(true);
    try {
      const selectedClasses = registeredClasses.filter((c) => editLaClassIds.includes(c.id));
      const gradeLevels = Array.from(new Set(selectedClasses.map((c) => c.grade_level)));

      await updateLearningArea(editLaId, {
        code: editLaCode.trim(),
        name: editLaName.trim(),
        description: editLaDesc.trim(),
        grade_levels: gradeLevels,
        class_ids: editLaClassIds,
      });

      await fetchData();
      setEditOpen(false);

      toast.success(`✓ Learning area updated successfully`, {
        icon: <Check className="h-4 w-4" />,
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Failed to update learning area:", err, err?.errors);
      toast.error(describeApiError(err, "Failed to update learning area"), {
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 6000,
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;

    setIsDeleting(true);
    const rowsToDelete = Array.from(selectedRows);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const code of rowsToDelete) {
        const rowData = apiData.find((r) => r.code === code);
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
        await fetchData();
        setSelected(new Set());
        setDeleteOpen(false);
        toast.success(`✓ Deleted ${successCount} learning area(s)`, {
          icon: <Check className="h-4 w-4" />,
        });
      }

      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} learning area(s)`, {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err.message || "Failed to delete learning areas", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData();
    fetchClasses();
  }, [fetchData, fetchClasses]);

  // ───────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ───────────────────────────────────────────────────────────────────────

  const stats = useMemo((): CurriculumStatsType => {
    const byLevel: Record<string, number> = { pp: 0, lp: 0, up: 0, js: 0 };
    let totalStrands = 0;
    let totalSubStrands = 0;
    let totalCompetencies = 0;

    apiData.forEach((row) => {
      if (row.levelId && byLevel[row.levelId] !== undefined) {
        byLevel[row.levelId]++;
      }
      totalStrands += row.strands || 0;
      totalSubStrands += row.subStrands || 0;
      totalCompetencies += row.competencies || 0;
    });

    return {
      total: apiData.length,
      byLevel,
      strands: totalStrands,
      subStrands: totalSubStrands,
      competencies: totalCompetencies,
    };
  }, [apiData]);

  const levelCards = useMemo((): LevelCard[] => {
    return [
      {
        id: "all",
        title: "All Levels",
        value: stats.total,
        sub: "Total areas",
        gradient: "from-slate-600 to-slate-500",
        icon: <Grid3x3 className="h-5 w-5" />,
      },
      {
        id: "pp",
        title: "Pre-Primary",
        value: stats.byLevel.pp || 0,
        sub: "PP1 – PP2",
        gradient: "from-blue-600 to-blue-400",
        icon: <GraduationCap className="h-5 w-5" />,
      },
      {
        id: "lp",
        title: "Lower Primary",
        value: stats.byLevel.lp || 0,
        sub: "Grade 1 – 3",
        gradient: "from-emerald-600 to-emerald-400",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        id: "up",
        title: "Upper Primary",
        value: stats.byLevel.up || 0,
        sub: "Grade 4 – 6",
        gradient: "from-violet-600 to-violet-400",
        icon: <Layers className="h-5 w-5" />,
      },
      {
        id: "js",
        title: "Junior Secondary",
        value: stats.byLevel.js || 0,
        sub: "Grade 7 – 9",
        gradient: "from-orange-500 to-orange-400",
        icon: <Award className="h-5 w-5" />,
      },
    ];
  }, [stats]);

  const filtered = useMemo(() => {
    let rows = apiData.filter((row) => {
      const lvl = kpiFilter || levelFilter;
      if (lvl !== "all" && lvl !== null && row.levelId !== lvl) return false;

      if (typeFilter !== "all") {
        if (typeFilter === "optional" ? !row.optional : row.optional) return false;
      }

      if (minStrands && row.strands < parseInt(minStrands)) return false;
      if (minComp && row.competencies < parseInt(minComp)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          row.name.toLowerCase().includes(q) ||
          row.code.toLowerCase().includes(q) ||
          row.level.toLowerCase().includes(q)
        );
      }

      return true;
    });

    if (sortKey) {
      rows = [...rows].sort((a: any, b: any) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        let cmp = 0;

        if (typeof va === "string" && typeof vb === "string") {
          cmp = va.localeCompare(vb);
        } else if (typeof va === "number" && typeof vb === "number") {
          cmp = va - vb;
        }

        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [apiData, levelFilter, typeFilter, minStrands, minComp, search, sortKey, sortDir, kpiFilter]);

  const rpp = rowsPerPage === "all" ? filtered.length : parseInt(rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rpp));
  const pageRows = filtered.slice((page - 1) * rpp, page * rpp);

  const hasActiveFilters = search || levelFilter !== "all" || typeFilter !== "all" || minStrands || minComp || kpiFilter;
  const allSelected = pageRows.length > 0 && selectedRows.size === pageRows.length;
  const someSelected = selectedRows.size > 0 && !allSelected;

  // ───────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ───────────────────────────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    try {
      const dataToExport =
        selectedRows.size > 0
          ? filtered.filter((row) => selectedRows.has(row.code))
          : filtered;

      exportToCSV(dataToExport);

      toast.success(`✓ Exported ${dataToExport.length} learning area(s)`, {
        icon: <Check className="h-4 w-4" />,
      });
    } catch (err) {
      toast.error("Failed to export data", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  }, [selectedRows, filtered]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setLevel("all");
    setType("all");
    setMinStrands("");
    setMinComp("");
    setKpiFilter(null);
    setPage(1);
    toast.info("Filters cleared", { duration: 2000 });
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  const toggleSelect = useCallback((code: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(code) ? s.delete(code) : s.add(code);
      return s;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedRows.size === pageRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageRows.map((r) => r.code)));
    }
  }, [selectedRows.size, pageRows]);

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-900 p-4 md:p-6 space-y-6">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HEADER */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Curriculum Management
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Manage CBC learning areas, strands, and competencies
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                  className="gap-2"
                >
                  {viewMode === "table" ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  <span className="hidden sm:inline">{viewMode === "table" ? "Grid" : "Table"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Switch view mode</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={filtered.length === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to CSV</TooltipContent>
            </Tooltip>

            <Button
              onClick={() => setAddOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Learning Area</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* ════════════════���═══════════════════════════════════════════════ */}
        {/* LOADING STATE */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
            </div>
            <p className="text-foreground font-semibold mt-4">Loading curriculum data...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ERROR STATE */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {apiError && !isLoading && (
          <div className="bg-gradient-to-br from-red-50 to-red-50/50 dark:from-red-950/30 dark:to-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-100">Unable to Load Data</p>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">{apiError}</p>
              </div>
              <Button
                onClick={() => fetchData()}
                className="bg-red-600 hover:bg-red-700 text-white gap-2 flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {!isLoading && !apiError && (
          <>
            {/* Statistics */}
            <CurriculumStats stats={stats} />

            {/* Level Filter Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {levelCards.map((card) => (
                <Tooltip key={card.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        const newFilter = card.id === "all" ? null : (card.id as LevelFilter);
                        setKpiFilter(newFilter);
                        setLevel("all");
                        setPage(1);
                      }}
                      className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 cursor-pointer group bg-gradient-to-r ${
                        card.gradient
                      } ${
                        kpiFilter === card.id || (card.id === "all" && !kpiFilter)
                          ? "ring-2 ring-offset-2 ring-primary shadow-2xl scale-105"
                          : "shadow-lg border border-white/50 dark:border-slate-700/50 hover:border-white/80 hover:shadow-2xl hover:scale-105"
                      }`}
                    >
                      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white dark:bg-slate-900/20 blur-3xl group-hover:scale-150 transition-transform" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-white/90">{card.icon}</div>
                          {(kpiFilter === card.id || (card.id === "all" && !kpiFilter)) && (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <p className="text-3xl font-bold text-white">{card.value}</p>
                        <p className="text-sm font-semibold text-white/95 mt-1">{card.title}</p>
                        <p className="text-xs text-white/75">{card.sub}</p>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Filter by {card.title}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, code, or level..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9 h-10 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  {/* Level Filter */}
                  <Select
                    value={levelFilter}
                    onValueChange={(v) => {
                      setLevel(v);
                      setKpiFilter(null);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-[180px] h-10 bg-slate-50 dark:bg-slate-800">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="pp">Pre-Primary</SelectItem>
                      <SelectItem value="lp">Lower Primary</SelectItem>
                      <SelectItem value="up">Upper Primary</SelectItem>
                      <SelectItem value="js">Junior Secondary</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Type Filter */}
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      setType(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-[140px] h-10 bg-slate-50 dark:bg-slate-800">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Advanced Filter Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdv(!showAdvFilter)}
                    className="gap-2 h-10 whitespace-nowrap"
                  >
                    <Filter className="h-4 w-4" />
                    {showAdvFilter ? "Simple" : "Advanced"}
                  </Button>

                  {/* Reset */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="gap-2 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <X className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>

                {/* Advanced Filters */}
                {showAdvFilter && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">Min Strands</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 5"
                          value={minStrands}
                          onChange={(e) => {
                            setMinStrands(e.target.value);
                            setPage(1);
                          }}
                          className="h-9 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">Min Competencies</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 10"
                          value={minComp}
                          onChange={(e) => {
                            setMinComp(e.target.value);
                            setPage(1);
                          }}
                          className="h-9 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                  <span className="font-semibold text-foreground">{apiData.length}</span> learning areas
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 shadow-lg animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  {selectedRows.size} row{selectedRows.size > 1 ? "s" : ""} selected
                </div>
                <Separator orientation="vertical" className="h-6 bg-primary/20" />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 shadow-sm"
                    onClick={handleExportCSV}
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs gap-1"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-8 px-2 text-primary/70 hover:text-primary hover:bg-primary/10"
                  onClick={() => setSelected(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg bg-white dark:bg-slate-900 dark:bg-slate-950">
                <LearningAreasTable
                  rows={pageRows}
                  selectedRows={selectedRows}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  allSelected={allSelected}
                  someSelected={someSelected}
                  onToggleSort={toggleSort}
                  onToggleSelect={toggleSelect}
                  onToggleAll={toggleAll}
                  onViewDetails={setViewRow}
                  onEdit={(row) => {
                    setEditLaId(row.id);
                    setEditLaCode(row.code);
                    setEditLaName(row.name);
                    setEditLaLevel(row.levelId);
                    setEditLaClassIds(row.classIds || []);
                    setEditLaDesc(row.desc);
                    setEditOpen(true);
                  }}
                  onDelete={(row) => {
                    setSelected(new Set([row.code]));
                    setDeleteOpen(true);
                  }}
                />
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageRows.map((row) => (
                  <button
                    key={row.code}
                    onClick={() => setViewRow(row)}
                    className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left hover:border-primary/50 dark:hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          LEVEL_CONFIG[row.levelId]?.bg || "bg-primary/10"
                        }`}
                      >
                        <GraduationCap
                          className={`h-5 w-5 ${
                            LEVEL_CONFIG[row.levelId]?.text || "text-primary"
                          }`}
                        />
                      </div>
                      <Badge
                        variant={row.optional ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {row.optional ? "Optional" : "Core"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{row.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mb-2">{row.code}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {row.desc || "No description provided"}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-slate-700">
                      <Badge variant="outline" className="text-xs">
                        {row.level}
                      </Badge>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{row.strands} strands</span>
                        <span>•</span>
                        <span>{row.competencies} comps</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No learning areas found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your filters to find what you're looking for"
                    : "Get started by creating your first learning area"}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={resetFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setAddOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Learning Area
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span className="whitespace-nowrap">Rows per page:</span>
                  <Select
                    value={rowsPerPage}
                    onValueChange={(v) => {
                      setRowsPerPage(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 w-20 bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="whitespace-nowrap">
                    Page{" "}
                    <span className="font-semibold text-foreground">
                      {totalPages > 0 ? page : 0}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">{totalPages}</span>
                  </span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(1)}
                        className="h-9 w-9"
                      >
                        «
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>First page</TooltipContent>
                  </Tooltip>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        className="h-9 w-9"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(totalPages)}
                        className="h-9 w-9"
                      >
                        »
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Last page</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DIALOGS */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {/* Add Learning Area Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Learning Area</DialogTitle>
              <DialogDescription>
                Create a new learning area with required information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code" className="text-sm font-semibold mb-2 block">
                    Code *
                  </Label>
                  <Input
                    id="code"
                    value={newLaCode}
                    onChange={(e) => setNewLaCode(e.target.value)}
                    placeholder="e.g., EN"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="level" className="text-sm font-semibold mb-2 block">
                    Level (quick-select)
                  </Label>
                  <Select
                    value={newLaLevel}
                    onValueChange={(val) => {
                      setNewLaLevel(val);
                      const bandGrades = getGradeLevelsFromLevel(val);
                      setNewLaClassIds(
                        registeredClasses
                          .filter((c) => bandGrades.includes(c.grade_level))
                          .map((c) => c.id)
                      );
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pp">Pre-Primary</SelectItem>
                      <SelectItem value="lp">Lower Primary</SelectItem>
                      <SelectItem value="up">Upper Primary</SelectItem>
                      <SelectItem value="js">Junior Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Class(es) *
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select every registered class this learning area applies to
                </p>
                {classesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading registered classes...
                  </div>
                ) : registeredClasses.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                    No registered classes found. Add classes in Classes Management first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                    {registeredClasses.map((cls) => (
                      <label
                        key={cls.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newLaClassIds.includes(cls.id)}
                          onChange={() => toggleNewLaClass(cls.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {cls.grade_level}{cls.stream_name ? ` - ${cls.stream_name}` : ""}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={newLaName}
                  onChange={(e) => setNewLaName(e.target.value)}
                  placeholder="e.g., English Language"
                  className="h-10"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold mb-2 block">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newLaDesc}
                  onChange={(e) => setNewLaDesc(e.target.value)}
                  placeholder="Add a description..."
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  setNewLaCode("");
                  setNewLaName("");
                  setNewLaLevel("");
                  setNewLaClassIds([]);
                  setNewLaDesc("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddLearningArea}
                disabled={isAdding}
                className="gap-2"
              >
                {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAdding ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Learning Area Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Learning Area</DialogTitle>
              <DialogDescription>Update the learning area details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-code" className="text-sm font-semibold mb-2 block">
                    Code *
                  </Label>
                  <Input
                    id="edit-code"
                    value={editLaCode}
                    onChange={(e) => setEditLaCode(e.target.value)}
                    placeholder="e.g., EN"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-level" className="text-sm font-semibold mb-2 block">
                    Level (quick-select)
                  </Label>
                  <Select
                    value={editLaLevel}
                    onValueChange={(val) => {
                      setEditLaLevel(val);
                      const bandGrades = getGradeLevelsFromLevel(val);
                      setEditLaClassIds(
                        registeredClasses
                          .filter((c) => bandGrades.includes(c.grade_level))
                          .map((c) => c.id)
                      );
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pp">Pre-Primary</SelectItem>
                      <SelectItem value="lp">Lower Primary</SelectItem>
                      <SelectItem value="up">Upper Primary</SelectItem>
                      <SelectItem value="js">Junior Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Class(es) *
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select every registered class this learning area applies to
                </p>
                {classesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading registered classes...
                  </div>
                ) : registeredClasses.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                    No registered classes found. Add classes in Classes Management first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                    {registeredClasses.map((cls) => (
                      <label
                        key={cls.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editLaClassIds.includes(cls.id)}
                          onChange={() => toggleEditLaClass(cls.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {cls.grade_level}{cls.stream_name ? ` - ${cls.stream_name}` : ""}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-name" className="text-sm font-semibold mb-2 block">
                  Name *
                </Label>
                <Input
                  id="edit-name"
                  value={editLaName}
                  onChange={(e) => setEditLaName(e.target.value)}
                  placeholder="e.g., English Language"
                  className="h-10"
                />
              </div>

              <div>
                <Label htmlFor="edit-description" className="text-sm font-semibold mb-2 block">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={editLaDesc}
                  onChange={(e) => setEditLaDesc(e.target.value)}
                  placeholder="Add a description..."
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditLearningArea}
                disabled={isEditing}
                className="gap-2"
              >
                {isEditing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Learning Areas?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete {selectedRows.size} learning area{selectedRows.size > 1 ? "s" : ""}. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Details Dialog */}
        {viewRow && (
          <Dialog open={!!viewRow} onOpenChange={(open) => !open && setViewRow(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{viewRow.name}</DialogTitle>
                <DialogDescription>{viewRow.code}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Level</p>
                    <p className="font-semibold text-foreground">{viewRow.level}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <Badge variant={viewRow.optional ? "secondary" : "default"}>
                      {viewRow.optional ? "Optional" : "Core"}
                    </Badge>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Strands</p>
                    <p className="font-semibold text-foreground">{viewRow.strands}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Competencies</p>
                    <p className="font-semibold text-foreground">{viewRow.competencies}</p>
                  </div>
                </div>

                {viewRow.desc && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Description</p>
                    <p className="text-sm text-foreground">{viewRow.desc}</p>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Grade Levels</p>
                  <p className="text-sm text-foreground">{viewRow.grades}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    Classes ({(viewRow.classIds || []).length})
                  </p>
                  {(viewRow.classIds || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Applies to every class matching the grade levels above.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {viewRow.classIds!.map((classId) => {
                        const cls = registeredClasses.find((c) => c.id === classId);
                        const label = cls
                          ? `${cls.grade_level}${cls.stream_name ? ` - ${cls.stream_name}` : ''}`
                          : 'Unknown class';
                        return (
                          <Badge key={classId} variant="outline">
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewRow(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditLaId(viewRow.id);
                    setEditLaCode(viewRow.code);
                    setEditLaName(viewRow.name);
                    setEditLaLevel(viewRow.levelId);
                    setEditLaClassIds(viewRow.classIds || []);
                    setEditLaDesc(viewRow.desc);
                    setEditOpen(true);
                    setViewRow(null);
                  }}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
