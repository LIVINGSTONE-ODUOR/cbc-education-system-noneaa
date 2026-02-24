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
}

export interface Teacher {
  id: string;
  name: string;
  role: 'HOD' | 'Teacher' | 'Assistant';
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentTeacher {
  id: string;
  teacherId: string;
  teacherName: string;
  role: 'HOD' | 'Teacher' | 'Assistant';
  subjects: string[];
}

export interface DepartmentSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  code: string;
}

export type DepartmentFormData = {
  name: string;
  description: string;
  hodId: string;
  code: string;
  status: 'active' | 'inactive';
};
