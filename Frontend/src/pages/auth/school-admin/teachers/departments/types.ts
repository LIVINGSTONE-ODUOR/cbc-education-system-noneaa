// Department types

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  hodId: string;
  hodName: string;
  teacherCount: number;
  subjectCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  /** IDs of learning_areas rows (fetched from the DB) this department covers */
  learningAreaIds: string[];
}

export interface DepartmentTeacher {
  id: string;
  teacherId: string;
  teacherName: string;
  role: 'HOD' | 'Teacher' | 'Assistant';
}

/** A learning area as attached to a department (name/code come from the real learning_areas table) */
export interface DepartmentLearningArea {
  id: string;
  name: string;
  code: string;
}

export type DepartmentFormData = {
  name: string;
  description: string;
  hodId: string;
  hodName: string;
  code: string;
  status: 'active' | 'inactive';
  /** Learning areas selected in the form, fetched live from the database */
  learningAreaIds: string[];
};
