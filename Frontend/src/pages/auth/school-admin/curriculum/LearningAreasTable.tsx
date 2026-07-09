import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import LearningAreaCard from './LearningAreaCard';
import { LearningArea } from '@/services/curriculumService';

interface SortConfig {
  key: "code" | "name" | "level" | "strands" | "subStrands" | "competencies" | null;
  dir: "asc" | "desc";
}

interface LearningAreasTableProps {
  rows: (LearningArea & { levelId: string; level: string; grades: string })[];
  selectedRows: Set<string>;
  sortKey: SortConfig['key'];
  sortDir: SortConfig['dir'];
  allSelected: boolean;
  someSelected: boolean;
  onToggleSort: (key: SortConfig['key']) => void;
  onToggleSelect: (code: string) => void;
  onToggleAll: () => void;
  onViewDetails: (row: LearningArea & { levelId: string; level: string; grades: string }) => void;
  onEdit: (row: LearningArea & { levelId: string; level: string; grades: string }) => void;
  onDelete: (row: LearningArea & { levelId: string; level: string; grades: string }) => void;
}

// Sort Icon Component
const SortIcon: React.FC<{ col: string; sortKey: SortConfig['key']; sortDir: SortConfig['dir'] }> = ({ col, sortKey, sortDir }) => {
  if (sortKey !== col) return <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="inline h-3 w-3 ml-1 text-primary" />
    : <ChevronDown className="inline h-3 w-3 ml-1 text-primary" />;
};

// Empty State Component
const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  return (
    <TableRow>
      <TableCell colSpan={8}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-base font-semibold text-foreground mb-1">No learning areas found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your current filters don't match any learning areas.
          </p>
          <Button variant="outline" size="sm" onClick={onReset}>
            Clear All Filters
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Main Table Component
const LearningAreasTable: React.FC<LearningAreasTableProps> = ({
  rows,
  selectedRows,
  sortKey,
  sortDir,
  allSelected,
  someSelected,
  onToggleSort,
  onToggleSelect,
  onToggleAll,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="shadow-sm border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(100vh-24rem)]">
          <Table className="w-full border-collapse">
            <TableHeader className="sticky top-0 z-10 bg-gray-100 shadow-sm">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b border-gray-300">
                {/* Select all */}
                <TableHead className="w-10 px-4 py-3 text-left">
                  <Checkbox
                    checked={allSelected}
                    ref={(el: any) => el && (el.indeterminate = someSelected)}
                    onCheckedChange={onToggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                
                {/* Code */}
                <TableHead className="w-24 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700" onClick={() => onToggleSort("code")}>
                  Code <SortIcon col="code" sortKey={sortKey} sortDir={sortDir} />
                </TableHead>
                
                {/* Learning Area */}
                <TableHead className="w-20 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700" onClick={() => onToggleSort("name")}>
                  Learning Area <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                </TableHead>
                
                {/* Level */}
                <TableHead className="w-32 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700" onClick={() => onToggleSort("level")}>
                  Level <SortIcon col="level" sortKey={sortKey} sortDir={sortDir} />
                </TableHead>
                
                {/* Sub-Strands */}
                <TableHead className="w-20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700" onClick={() => onToggleSort("subStrands")}>
                  <span className="flex items-center justify-center gap-1">
                    SUB <SortIcon col="subStrands" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
                
                {/* Competencies */}
                <TableHead className="w-20 px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700" onClick={() => onToggleSort("competencies")}>
                  <span className="flex items-center justify-center gap-1">
                    COMP <SortIcon col="competencies" sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </TableHead>
                
                {/* Type */}
                <TableHead className="w-24 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Type</TableHead>
                
                {/* Actions */}
                <TableHead className="w-32 px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <EmptyState onReset={() => {}} />
              ) : (
                rows.map((row) => {
                  const isSelected = selectedRows.has(row.code);

                  return (
                    <LearningAreaCard
                      key={row.code}
                      row={row}
                      isSelected={isSelected}
                      onToggleSelect={() => onToggleSelect(row.code)}
                      onViewDetails={() => onViewDetails(row)}
                      onEdit={() => onEdit(row)}
                      onDelete={() => onDelete(row)}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningAreasTable;
