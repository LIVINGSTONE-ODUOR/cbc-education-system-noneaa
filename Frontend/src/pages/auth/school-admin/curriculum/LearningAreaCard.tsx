import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { LearningArea, LEVEL_CONFIG } from '@/services/curriculumService';

interface LearningAreaCardProps {
  row: LearningArea & { levelId: string; level: string; grades: string };
  isSelected: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const LearningAreaCard: React.FC<LearningAreaCardProps> = ({
  row,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  return (
    <tr
      className={`
        border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors
        ${isSelected ? "bg-primary/5" : ""}
      `}
    >
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300"
        />
      </td>

      {/* Code */}
      <td className="px-4 py-3 font-mono text-sm font-semibold">
        {row.code}
      </td>

      {/* Learning Area Name */}
      <td className="px-4 py-3 font-medium">
        {row.name}
      </td>

      {/* Level */}
      <td className="px-4 py-3">
        {row.level}
      </td>

      {/* Sub-Strands count */}
      <td className="px-4 py-3 text-center">
        {row.subStrands}
      </td>

      {/* Competencies count */}
      <td className="px-4 py-3 text-center">
        {row.competencies}
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        {row.optional ? "Optional" : "Core"}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-3">
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={onViewDetails}
          >
            View
          </button>
          <button
            className="text-slate-500 hover:text-slate-900 transition-colors"
            onClick={onEdit}
            title="Edit learning area"
            aria-label="Edit learning area"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="text-red-500 hover:text-red-700 transition-colors"
            onClick={onDelete}
            title="Delete learning area"
            aria-label="Delete learning area"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default LearningAreaCard;
