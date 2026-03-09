# Curriculum UI Refactoring TODO

## Task: Refactor UI spacing and layout for professional enterprise dashboard look

### Changes Made:

- [x] 1. LearningAreaCard.tsx - Table Row Spacing
  - Added py-4 to table rows for ~64px row height
  - Added align-middle to all table cells
  - Increased badge counter height for better proportions

- [x] 2. LearningAreaCard.tsx - Learning Area Section
  - Title: text-base (slightly larger)
  - Description: text-sm text-muted-foreground
  - gap-2 between icon and text content

- [x] 3. LearningAreaCard.tsx - Badge Counters
  - Increased badge height and padding for better centering

- [x] 4. LearningAreasTable.tsx - Removed inline expand/collapse
  - Removed ExpandedRow component
  - Removed expand toggle column from table
  - Added "Details" column with View button

- [x] 5. CurriculumDashboard.tsx - Enhanced View Details Modal
  - Added tabbed interface (Overview, Strands, Sub-Strands, Competencies)
  - Added header with learning area name and badges
  - Added action buttons (Close, Edit)

- [x] 6. CurriculumDashboard.tsx - Overall spacing
  - Added mt-6 between sections

### New Design Features:
- Modal-based details view instead of inline expand/collapse
- Clean compact table with only summary data
- Tabbed interface for organizing curriculum hierarchy content
- Users can focus on one learning area at a time

