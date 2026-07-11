// ClassManagement.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { DashboardView } from "./components/DashboardView";
import { ListView } from "./components/ListView";
import { DetailView } from "./components/DetailView";
import { CreateClassDialog } from "./components/CreateClassDialog";
import { DeleteClassDialog } from "./components/DeleteClassDialog";
import { NavigationHeader } from "./components/NavigationHeader";
import { GRADE_LEVELS, GRADIENTS, DAYS } from "./constants";
import { filterClasses, getBranches, getTotalLearners, getTotalCapacity, getActiveClassesCount, getFullClassesCount, getUtilizationRate } from "./utils";
import { ClassItem, View } from "./types";
import { createClass, deleteClass, getClasses } from "@/lib/api/classApi";
import { getLearningAreas, LearningArea } from "@/lib/api/curriculumApi";

const ClassManagement: React.FC = () => {
  // ─── STATE ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>("dashboard");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Form state
  const [formGrade, setFormGrade] = useState("");
  const [formStream, setFormStream] = useState("");
  const [formCapacity, setFormCapacity] = useState("");

  // Subjects available for the selected grade + which ones this class will take
  const [availableSubjects, setAvailableSubjects] = useState<LearningArea[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const normalizeClass = (item: any): ClassItem => ({
    id: String(item.id),
    grade_level: item.grade_level || "Unknown",
    stream_name: item.stream_name || null,
    capacity: item.capacity ?? null,
    is_active: item.is_active ?? false,
    learner_count: typeof item.learner_count === "number" ? item.learner_count : 0,
    class_teacher: item.teachers
      ? {
          id: item.teachers.id,
          name: `${item.teachers.users?.first_name || ""} ${item.teachers.users?.last_name || ""}`.trim() || "Unassigned",
        }
      : null,
    branch: item.branches || item.branch || null,
    created_at: item.created_at || new Date().toISOString().split("T")[0],
  });

  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    setIsRefreshing(true);

    try {
      const response = await getClasses();
      const apiClasses = response.data?.classes || [];
      setClasses(apiClasses.map(normalizeClass));
      toast.success("Loaded classes from backend");
    } catch (error) {
      console.error("Failed to load classes from backend:", error);
      toast.error("Unable to load classes from backend. Check your server connection.");
    } finally {
      setIsLoadingClasses(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  // ─── COMPUTED VALUES ────────────────────────────────────────────────────
  const filtered = useMemo(
    () => filterClasses(classes, search, filterGrade, filterStatus, filterBranch),
    [classes, search, filterGrade, filterStatus, filterBranch]
  );

  const branches = useMemo(() => getBranches(classes), [classes]);
  const totalLearners = useMemo(() => getTotalLearners(classes), [classes]);
  const totalCapacity = useMemo(() => getTotalCapacity(classes), [classes]);
  const activeClasses = useMemo(() => getActiveClassesCount(classes), [classes]);
  const fullClasses = useMemo(() => getFullClassesCount(classes), [classes]);
  const utilizationRate = useMemo(
    () => getUtilizationRate(totalLearners, totalCapacity),
    [totalLearners, totalCapacity]
  );

  // ─── EVENT HANDLERS ─────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    void fetchClasses();
  }, [fetchClasses]);

  // When a grade is picked, load its subjects and default to selecting all of them
  // (the common CBC case: every learner in the grade takes the same subjects).
  const handleGradeChange = useCallback(async (grade: string) => {
    setFormGrade(grade);
    setSelectedSubjectIds([]);

    if (!grade) {
      setAvailableSubjects([]);
      return;
    }

    setLoadingSubjects(true);
    try {
      const response = await getLearningAreas({ grade_level: grade, is_active: true });
      const subjects = response.data?.learning_areas || [];
      setAvailableSubjects(subjects);
      setSelectedSubjectIds(subjects.map((s) => s.id));
    } catch (error) {
      console.error("Failed to load subjects for grade:", error);
      toast.error("Could not load subjects for this grade");
      setAvailableSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const toggleSubject = useCallback((learningAreaId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(learningAreaId)
        ? prev.filter((id) => id !== learningAreaId)
        : [...prev, learningAreaId]
    );
  }, []);

  const handleCreateClass = useCallback(async () => {
    if (!formGrade) {
      toast.error("Please select a grade level");
      return;
    }

    try {
      const response = await createClass({
        grade_level: formGrade,
        stream_name: formStream || null,
        capacity: formCapacity ? parseInt(formCapacity, 10) : undefined,
        learning_area_ids: selectedSubjectIds,
      });

      const created = response.data;
      if (created) {
        setClasses((prev) => [...prev, normalizeClass(created)]);
      }

      setShowCreateDialog(false);
      setFormGrade("");
      setFormStream("");
      setFormCapacity("");
      setAvailableSubjects([]);
      setSelectedSubjectIds([]);
      toast.success(
        `Class ${formGrade}${formStream ? ` ${formStream}` : ""} created successfully`
      );
    } catch (error) {
      console.error("Failed to create class:", error);
      toast.error("Could not create class. Check backend connection and permissions.");
    }
  }, [formGrade, formStream, formCapacity, selectedSubjectIds]);

  const handleDeleteClass = useCallback(async () => {
    if (!selected) return;

    if (selected.learner_count > 0) {
      toast.error(
        `Cannot delete class with ${selected.learner_count} enrolled learners`
      );
      return;
    }

    try {
      await deleteClass(selected.id);
      setClasses((prev) => prev.filter((c) => c.id !== selected.id));
      setShowDeleteDialog(false);
      setSelected(null);
      setView("dashboard");
      toast.success("Class deleted successfully");
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error("Could not delete class. Check backend connection and permissions.");
    }
  }, [selected]);

  const handleToggleActive = useCallback((cls: ClassItem) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === cls.id ? { ...c, is_active: !c.is_active } : c
      )
    );
    toast.success(`Class ${cls.is_active ? "deactivated" : "activated"}`);
  }, []);

  const handleSelectClass = useCallback((cls: ClassItem) => {
    setSelected(cls);
    setView("detail");
  }, []);

  const handleViewAll = useCallback(() => {
    setView("list");
  }, []);

  const handleBack = useCallback(() => {
    if (view === "detail") {
      setView("list");
      setSelected(null);
    } else if (view === "list") {
      setView("dashboard");
      setSearch("");
      setFilterGrade("all");
      setFilterStatus("all");
      setFilterBranch("all");
    }
  }, [view]);

  // ─── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50">
      {/* Navigation Header */}
      <NavigationHeader
        view={view}
        selected={selected}
        filteredCount={filtered.length}
        classesCount={classes.length}
        onBack={handleBack}
        onViewAllClick={handleViewAll}
        onCreateClick={() => setShowCreateDialog(true)}
      />

      {/* Main Content */}
      {view === "dashboard" && (
        <DashboardView
          classes={classes}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onCreateClick={() => setShowCreateDialog(true)}
          onViewAllClick={handleViewAll}
          onFilterGradeClick={(grade) => {
            setFilterGrade(grade);
            setView("list");
          }}
        />
      )}

      {view === "list" && (
        <ListView
          classes={classes}
          filtered={filtered}
          search={search}
          filterGrade={filterGrade}
          filterStatus={filterStatus}
          onSearchChange={setSearch}
          onFilterGradeChange={setFilterGrade}
          onFilterStatusChange={setFilterStatus}
          onCreateClick={() => setShowCreateDialog(true)}
          onViewClick={handleSelectClass}
          onToggleActive={handleToggleActive}
        />
      )}

      {view === "detail" && selected && (
        <DetailView
          selected={selected}
          onToggleActive={handleToggleActive}
          onDeleteClick={() => setShowDeleteDialog(true)}
        />
      )}

      {/* Dialogs */}
      <CreateClassDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        formGrade={formGrade}
        formStream={formStream}
        formCapacity={formCapacity}
        onGradeChange={handleGradeChange}
        onStreamChange={setFormStream}
        onCapacityChange={setFormCapacity}
        onSubmit={handleCreateClass}
        availableSubjects={availableSubjects}
        loadingSubjects={loadingSubjects}
        selectedSubjectIds={selectedSubjectIds}
        onToggleSubject={toggleSubject}
      />

      <DeleteClassDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selected={selected}
        onConfirm={handleDeleteClass}
      />
    </div>
  );
};

export default ClassManagement;
