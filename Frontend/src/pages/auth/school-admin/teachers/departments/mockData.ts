import type { Department, Teacher, Subject, DepartmentTeacher, DepartmentSubject, DepartmentFormData } from './types';

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Mock Teachers ────────────────────────────────────────────────────────────
export const mockTeachers: Teacher[] = [
  { id: 't1', name: 'Alice Mwangi', role: 'HOD', subjects: ['Mathematics', 'Physics'] },
  { id: 't2', name: 'Brian Otieno', role: 'Teacher', subjects: ['English', 'Literature'] },
  { id: 't3', name: 'Carol Kamau', role: 'Teacher', subjects: ['Chemistry', 'Biology'] },
  { id: 't4', name: 'David Njoroge', role: 'Teacher', subjects: ['History', 'Geography'] },
  { id: 't5', name: 'Esther Wambui', role: 'HOD', subjects: ['Kiswahili'] },
  { id: 't6', name: 'Francis Kiptoo', role: 'Assistant', subjects: ['Mathematics'] },
  { id: 't7', name: 'Grace Achieng', role: 'Teacher', subjects: ['Art', 'Music'] },
  { id: 't8', name: 'Henry Maina', role: 'Teacher', subjects: ['Physical Education'] },
  { id: 't9', name: 'Irene Chebet', role: 'Assistant', subjects: ['Biology'] },
  { id: 't10', name: 'James Odhiambo', role: 'Teacher', subjects: ['Computer Studies'] },
];

// ─── Mock Subjects ────────────────────────────────────────────────────────────
export const mockSubjects: Subject[] = [
  { id: 's1', name: 'Mathematics', code: 'MATH101' },
  { id: 's2', name: 'English', code: 'ENG101' },
  { id: 's3', name: 'Kiswahili', code: 'KIS101' },
  { id: 's4', name: 'Biology', code: 'BIO101' },
  { id: 's5', name: 'Chemistry', code: 'CHE101' },
  { id: 's6', name: 'Physics', code: 'PHY101' },
  { id: 's7', name: 'History', code: 'HIS101' },
  { id: 's8', name: 'Geography', code: 'GEO101' },
  { id: 's9', name: 'Computer Studies', code: 'CS101' },
  { id: 's10', name: 'Physical Education', code: 'PE101' },
];

// ─── Mock Departments ─────────────────────────────────────────────────────────
let departments: Department[] = [
  {
    id: 'd1',
    name: 'Mathematics & Sciences',
    code: 'MATH-SCI',
    description: 'Covers Mathematics, Physics, Chemistry, and Biology.',
    hodId: 't1',
    hodName: 'Alice Mwangi',
    teacherCount: 3,
    subjectCount: 4,
    status: 'active',
    createdAt: '2024-01-10',
  },
  {
    id: 'd2',
    name: 'Languages',
    code: 'LANG',
    description: 'Covers English, Kiswahili, and Literature.',
    hodId: 't5',
    hodName: 'Esther Wambui',
    teacherCount: 2,
    subjectCount: 3,
    status: 'active',
    createdAt: '2024-01-12',
  },
  {
    id: 'd3',
    name: 'Humanities',
    code: 'HUM',
    description: 'Covers History, Geography, and Social Studies.',
    hodId: 't4',
    hodName: 'David Njoroge',
    teacherCount: 2,
    subjectCount: 2,
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    id: 'd4',
    name: 'Creative Arts',
    code: 'ARTS',
    description: 'Covers Art, Music, and Physical Education.',
    hodId: 't7',
    hodName: 'Grace Achieng',
    teacherCount: 2,
    subjectCount: 2,
    status: 'inactive',
    createdAt: '2024-02-15',
  },
  {
    id: 'd5',
    name: 'Technology',
    code: 'TECH',
    description: 'Covers Computer Studies and related technical subjects.',
    hodId: 't10',
    hodName: 'James Odhiambo',
    teacherCount: 1,
    subjectCount: 1,
    status: 'active',
    createdAt: '2024-03-01',
  },
];

// ─── Department Teachers (per department) ────────────────────────────────────
const departmentTeachers: Record<string, DepartmentTeacher[]> = {
  d1: [
    { id: 'dt1', teacherId: 't1', teacherName: 'Alice Mwangi', role: 'HOD', subjects: ['Mathematics', 'Physics'] },
    { id: 'dt2', teacherId: 't3', teacherName: 'Carol Kamau', role: 'Teacher', subjects: ['Chemistry', 'Biology'] },
    { id: 'dt3', teacherId: 't6', teacherName: 'Francis Kiptoo', role: 'Assistant', subjects: ['Mathematics'] },
  ],
  d2: [
    { id: 'dt4', teacherId: 't5', teacherName: 'Esther Wambui', role: 'HOD', subjects: ['Kiswahili'] },
    { id: 'dt5', teacherId: 't2', teacherName: 'Brian Otieno', role: 'Teacher', subjects: ['English', 'Literature'] },
  ],
  d3: [
    { id: 'dt6', teacherId: 't4', teacherName: 'David Njoroge', role: 'HOD', subjects: ['History', 'Geography'] },
    { id: 'dt7', teacherId: 't8', teacherName: 'Henry Maina', role: 'Teacher', subjects: ['Physical Education'] },
  ],
  d4: [
    { id: 'dt8', teacherId: 't7', teacherName: 'Grace Achieng', role: 'HOD', subjects: ['Art', 'Music'] },
    { id: 'dt9', teacherId: 't8', teacherName: 'Henry Maina', role: 'Teacher', subjects: ['Physical Education'] },
  ],
  d5: [
    { id: 'dt10', teacherId: 't10', teacherName: 'James Odhiambo', role: 'HOD', subjects: ['Computer Studies'] },
  ],
};

// ─── Department Subjects (per department) ────────────────────────────────────
const departmentSubjects: Record<string, DepartmentSubject[]> = {
  d1: [
    { id: 'ds1', subjectId: 's1', subjectName: 'Mathematics', code: 'MATH101' },
    { id: 'ds2', subjectId: 's6', subjectName: 'Physics', code: 'PHY101' },
    { id: 'ds3', subjectId: 's5', subjectName: 'Chemistry', code: 'CHE101' },
    { id: 'ds4', subjectId: 's4', subjectName: 'Biology', code: 'BIO101' },
  ],
  d2: [
    { id: 'ds5', subjectId: 's2', subjectName: 'English', code: 'ENG101' },
    { id: 'ds6', subjectId: 's3', subjectName: 'Kiswahili', code: 'KIS101' },
  ],
  d3: [
    { id: 'ds7', subjectId: 's7', subjectName: 'History', code: 'HIS101' },
    { id: 'ds8', subjectId: 's8', subjectName: 'Geography', code: 'GEO101' },
  ],
  d4: [
    { id: 'ds9', subjectId: 's10', subjectName: 'Physical Education', code: 'PE101' },
  ],
  d5: [
    { id: 'ds10', subjectId: 's9', subjectName: 'Computer Studies', code: 'CS101' },
  ],
};

// ─── API Functions ────────────────────────────────────────────────────────────
export async function getDepartments(): Promise<Department[]> {
  await delay();
  return [...departments];
}

export async function createDepartment(data: DepartmentFormData): Promise<Department> {
  await delay();
  const teacher = mockTeachers.find(t => t.id === data.hodId);
  const newDept: Department = {
    id: `d${Date.now()}`,
    name: data.name,
    code: data.code,
    description: data.description,
    hodId: data.hodId,
    hodName: teacher?.name ?? '',
    teacherCount: 0,
    subjectCount: 0,
    status: data.status,
    createdAt: new Date().toISOString().split('T')[0],
  };
  departments = [newDept, ...departments];
  return newDept;
}

export async function updateDepartment(id: string, data: DepartmentFormData): Promise<Department> {
  await delay();
  const teacher = mockTeachers.find(t => t.id === data.hodId);
  departments = departments.map(d =>
    d.id === id
      ? { ...d, ...data, hodName: teacher?.name ?? d.hodName }
      : d
  );
  return departments.find(d => d.id === id)!;
}

export async function deleteDepartment(id: string): Promise<void> {
  await delay();
  departments = departments.filter(d => d.id !== id);
  delete departmentTeachers[id];
  delete departmentSubjects[id];
}

export async function getDepartmentTeachers(deptId: string): Promise<DepartmentTeacher[]> {
  await delay();
  return departmentTeachers[deptId] ?? [];
}

export async function assignTeacher(
  deptId: string,
  teacherId: string,
  role: 'HOD' | 'Teacher' | 'Assistant'
): Promise<DepartmentTeacher> {
  await delay();
  const teacher = mockTeachers.find(t => t.id === teacherId)!;
  const entry: DepartmentTeacher = {
    id: `dt${Date.now()}`,
    teacherId,
    teacherName: teacher.name,
    role,
    subjects: teacher.subjects,
  };
  if (!departmentTeachers[deptId]) departmentTeachers[deptId] = [];
  departmentTeachers[deptId].push(entry);
  departments = departments.map(d =>
    d.id === deptId ? { ...d, teacherCount: (departmentTeachers[deptId] ?? []).length } : d
  );
  return entry;
}

export async function removeTeacher(deptId: string, entryId: string): Promise<void> {
  await delay();
  if (departmentTeachers[deptId]) {
    departmentTeachers[deptId] = departmentTeachers[deptId].filter(t => t.id !== entryId);
    departments = departments.map(d =>
      d.id === deptId ? { ...d, teacherCount: (departmentTeachers[deptId] ?? []).length } : d
    );
  }
}

export async function getDepartmentSubjects(deptId: string): Promise<DepartmentSubject[]> {
  await delay();
  return departmentSubjects[deptId] ?? [];
}

export async function assignSubject(deptId: string, subjectId: string): Promise<DepartmentSubject> {
  await delay();
  const subject = mockSubjects.find(s => s.id === subjectId)!;
  const entry: DepartmentSubject = {
    id: `ds${Date.now()}`,
    subjectId,
    subjectName: subject.name,
    code: subject.code,
  };
  if (!departmentSubjects[deptId]) departmentSubjects[deptId] = [];
  departmentSubjects[deptId].push(entry);
  departments = departments.map(d =>
    d.id === deptId ? { ...d, subjectCount: (departmentSubjects[deptId] ?? []).length } : d
  );
  return entry;
}

export async function removeSubject(deptId: string, entryId: string): Promise<void> {
  await delay();
  if (departmentSubjects[deptId]) {
    departmentSubjects[deptId] = departmentSubjects[deptId].filter(s => s.id !== entryId);
    departments = departments.map(d =>
      d.id === deptId ? { ...d, subjectCount: (departmentSubjects[deptId] ?? []).length } : d
    );
  }
}
