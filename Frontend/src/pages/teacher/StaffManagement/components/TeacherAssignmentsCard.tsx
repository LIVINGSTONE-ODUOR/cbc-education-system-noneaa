// =============================================================================
// TeacherAssignmentsCard.tsx
// "Assign Classes & Subjects" — lets a school_admin/super_admin pick a class
// and one or more subjects (learning areas) and assign them to this teacher.
// A teacher can hold many (class, subject) pairs across many classes — add
// one class at a time, checking off however many subjects they'll teach in
// it, and repeat for as many classes as needed.
//
// This is what unlocks marks entry for the teacher: bulkUpsertResults()
// on the backend rejects any (class, subject) combination that isn't
// listed here.
// =============================================================================

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Loader2, BookOpen, School } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { getClasses, ClassApiItem } from "@/lib/api/classApi";
import { getLearningAreas, LearningArea } from "@/lib/api/curriculumApi";
import {
  getTeacherAssignments,
  assignTeacherToClasses,
  removeTeacherAssignment,
  TeacherAssignment,
} from "@/lib/api/teacherApi";

const classLabel = (c?: { grade_level: string; stream_name: string | null } | null) =>
  c ? (c.stream_name ? `${c.grade_level} — ${c.stream_name}` : c.grade_level) : "Unknown class";

interface TeacherAssignmentsCardProps {
  teacherId: string;
}

export const TeacherAssignmentsCard: React.FC<TeacherAssignmentsCardProps> = ({ teacherId }) => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassApiItem[]>([]);
  const [subjects, setSubjects] = useState<LearningArea[]>([]);
  const [refLoading, setRefLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTeacherAssignments(teacherId);
      setAssignments(res.data?.assignments || []);
    } catch (e: any) {
      setError(e.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    const loadRefData = async () => {
      setRefLoading(true);
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          getClasses({ is_active: "true", limit: 200 }),
          getLearningAreas({ is_active: true }),
        ]);
        setClasses(classesRes.data?.classes || []);
        setSubjects(subjectsRes.data?.learning_areas || []);
      } catch (e: any) {
        toast.error(e.message || "Failed to load classes/subjects");
      } finally {
        setRefLoading(false);
      }
    };
    loadRefData();
  }, []);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (!selectedClassId) {
      toast.error("Pick a class first");
      return;
    }
    if (selectedSubjectIds.length === 0) {
      toast.error("Pick at least one subject");
      return;
    }

    setSaving(true);
    try {
      const pairs = selectedSubjectIds.map((learning_area_id) => ({
        class_id: selectedClassId,
        learning_area_id,
      }));
      const res = await assignTeacherToClasses(teacherId, pairs);
      toast.success(res.message || "Assignment saved");
      setSelectedClassId("");
      setSelectedSubjectIds([]);
      await loadAssignments();
    } catch (e: any) {
      toast.error(e.message || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    setRemovingId(assignmentId);
    try {
      await removeTeacherAssignment(teacherId, assignmentId);
      toast.success("Assignment removed");
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (e: any) {
      toast.error(e.message || "Failed to remove assignment");
    } finally {
      setRemovingId(null);
    }
  };

  // Group current assignments by class for a readable summary
  const byClass = assignments.reduce<Record<string, TeacherAssignment[]>>((acc, a) => {
    const key = a.class?.id || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          Assign Classes &amp; Subjects
        </CardTitle>
        <CardDescription>
          Only subjects/classes assigned here can this teacher enter marks for.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current assignments */}
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading assignments...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : Object.keys(byClass).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not assigned to any class/subject yet — add one below.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.values(byClass).map((rows) => (
              <div key={rows[0].class?.id} className="rounded-md border p-3">
                <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                  <School className="h-3.5 w-3.5 text-muted-foreground" />
                  {classLabel(rows[0].class)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rows.map((a) => (
                    <Badge
                      key={a.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 pr-1"
                    >
                      {a.learning_area?.name || "Unknown subject"}
                      <button
                        onClick={() => handleRemove(a.id)}
                        disabled={removingId === a.id}
                        className="rounded hover:bg-destructive/20 p-0.5"
                        title="Remove"
                      >
                        {removingId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new assignment */}
        <div className="rounded-md border border-dashed p-3 space-y-3">
          <p className="text-sm font-medium">Add a new assignment</p>

          <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={refLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {classLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-md border p-2">
            {subjects.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-muted"
              >
                <Checkbox
                  checked={selectedSubjectIds.includes(s.id)}
                  onCheckedChange={() => toggleSubject(s.id)}
                />
                {s.name}
              </label>
            ))}
            {subjects.length === 0 && !refLoading && (
              <p className="text-xs text-muted-foreground col-span-full">No subjects found.</p>
            )}
          </div>

          <Button onClick={handleAdd} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <Plus className="h-3.5 w-3.5 mr-2" />
            )}
            Assign to this class
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherAssignmentsCard;
