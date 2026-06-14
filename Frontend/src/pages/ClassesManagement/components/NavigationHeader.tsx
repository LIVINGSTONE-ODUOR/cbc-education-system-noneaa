import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENTS } from "../constants";
import { View, ClassItem } from "../types";

interface NavigationHeaderProps {
  view: View;
  selected: ClassItem | null;
  filteredCount: number;
  classesCount: number;
  onBack: () => void;
  onViewAllClick: () => void;
  onCreateClick: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  view,
  selected,
  filteredCount,
  classesCount,
  onBack,
  onViewAllClick,
  onCreateClick,
}) => {
  const getTitle = () => {
    if (view === "dashboard") return "Classes Management";
    if (view === "list") return "All Classes";
    return `${selected?.grade_level}${
      selected?.stream_name ? ` — ${selected.stream_name}` : ""
    }`;
  };

  const getDescription = () => {
    if (view === "dashboard")
      return "Manage classes, streams, timetables and learner enrollment";
    if (view === "list") return `${filteredCount} classes found`;
    return "Class details and information";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4 min-w-0">
        {view !== "dashboard" && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-gray-100 text-gray-600 flex-shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{getTitle()}</h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            {getDescription()}
          </p>
        </div>
      </div>
      {view === "dashboard" && (
        <div className="hidden sm:flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
            onClick={onViewAllClick}
          >
            <List className="h-4 w-4" /> View All
          </Button>
          <Button
            className={cn(
              "rounded-xl gap-1.5 bg-gradient-to-r text-white font-semibold",
              GRADIENTS.primary
            )}
            onClick={onCreateClick}
          >
            <Plus className="h-4 w-4" /> New Class
          </Button>
        </div>
      )}
    </div>
  );
};
