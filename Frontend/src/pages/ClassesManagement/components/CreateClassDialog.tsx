import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENTS, GRADE_LEVELS } from "../constants";
import { ClassLearningArea } from "@/lib/api/classApi";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formGrade: string;
  formStream: string;
  formCapacity: string;
  onGradeChange: (value: string) => void;
  onStreamChange: (value: string) => void;
  onCapacityChange: (value: string) => void;
  onSubmit: () => void;
  // Subjects this class will take. Populated once a grade is picked.
  availableSubjects: ClassLearningArea[];
  loadingSubjects: boolean;
  selectedSubjectIds: string[];
  onToggleSubject: (learningAreaId: string) => void;
}

export const CreateClassDialog: React.FC<CreateClassDialogProps> = ({
  open,
  onOpenChange,
  formGrade,
  formStream,
  formCapacity,
  onGradeChange,
  onStreamChange,
  onCapacityChange,
  onSubmit,
  availableSubjects,
  loadingSubjects,
  selectedSubjectIds,
  onToggleSubject,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", GRADIENTS.primary)}>
              <GraduationCap className="h-5 w-5" />
            </div>
            Create New Class
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-bold mb-2 block text-gray-900 uppercase tracking-widest">Grade Level *</label>
            <Select value={formGrade} onValueChange={onGradeChange}>
              <SelectTrigger className="rounded-xl h-11 border-gray-300 focus:border-indigo-500">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-bold mb-2 block text-gray-900 uppercase tracking-widest">Stream Name</label>
            <Input
              placeholder="e.g. East, West, A, B"
              value={formStream}
              onChange={(e) => onStreamChange(e.target.value)}
              className="rounded-xl h-11 border-gray-300 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-2 block text-gray-900 uppercase tracking-widest">Capacity</label>
            <Input
              type="number"
              placeholder="e.g. 40"
              value={formCapacity}
              onChange={(e) => onCapacityChange(e.target.value)}
              className="rounded-xl h-11 border-gray-300 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-bold mb-2 block text-gray-900 uppercase tracking-widest">
              Subjects
            </label>
            {!formGrade ? (
              <p className="text-sm text-gray-500">Select a grade level to see its subjects.</p>
            ) : loadingSubjects ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subjects for {formGrade}...
              </div>
            ) : availableSubjects.length === 0 ? (
              <p className="text-sm text-gray-500">No subjects configured for {formGrade} yet.</p>
            ) : (
              <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
                {availableSubjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSubjectIds.includes(subject.id)}
                      onCheckedChange={() => onToggleSubject(subject.id)}
                    />
                    {subject.name}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Learners enrolled in this class will take exactly these subjects. You can change this later.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className={cn("rounded-xl bg-gradient-to-r text-white font-semibold", GRADIENTS.primary)}
            onClick={onSubmit}
          >
            Create Class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
