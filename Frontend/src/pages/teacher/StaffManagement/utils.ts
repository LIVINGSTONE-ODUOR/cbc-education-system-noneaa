/* StaffManagement Data Mapping Utilities
 * Converts between backend snake_case and frontend camelCase
 */

import type { StaffMember } from './types';

export interface BackendTeacherResponse {
  id: string;
  tsc_number: string | null;
  qualifications: string | null; // JSON string: ["BEd", "Diploma"]
  date_joined: string | null;
  is_active: boolean;
  designation: string | null;
  branch: string | null;
  job_status: string | null;
  contract_start: string | null;
  contract_end: string | null;
  salary: number | null;
  county: string | null;
  location: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  subjects_taught: string[] | null;
  photo: string | null; // Add photo field
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    status: string;
    last_login?: string;
  };
}

export const backendToStaffMember = (backend: any): StaffMember => {
  if (!backend) {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      mobilePhone: '',
      idNumber: '',
      tscNumber: '',
      designation: 'Teacher',
      branch: '',
      county: '',
      location: '',
      dateOfBirth: '',
      sex: 'Male',
      gender: 'Male',
      hireDate: '',
      contractStart: '',
      contractEnd: '',
      jobStatus: 'Inactive',
      staffType: 'teaching' as const,
      salary: 0,
      teachingSubjects: [],
      qualifications: [],
      status: 'inactive',
    };
  }

  const user = backend.user || {};
  // Parse qualifications JSON string safely
  const parseQualifications = (qualStr: string | null): string[] => {
    if (!qualStr) return [];
    try {
      let parsed = qualStr;
      // Handle escaped JSON (multiple layers)
      for (let i = 0; i < 5; i++) {
        try {
          parsed = JSON.parse(parsed);
          if (Array.isArray(parsed)) break;
        } catch {
          break;
        }
      }
      if (Array.isArray(parsed)) {
        return parsed
          .flat(Infinity)
          .map((q: any) => String(q).replace(/^["']|["']$/g, '').trim())
          .filter(Boolean);
      }
    } catch {
      // Fallback
    }
    return [qualStr];
  };

  // Safe value getter
  const safeGet = (value: any, fallback = ''): string => {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value).trim() || fallback;
  };

  return {
    id: backend.id,
    firstName: backend.user?.first_name || '',
    lastName: backend.user?.last_name || '',
    email: backend.user?.email || '',
    phoneNumber: backend.user?.phone_number || '',
    mobilePhone: backend.user?.phone_number || '',
    idNumber: backend.id_number || '',
    tscNumber: backend.tsc_number || '',
    designation: backend.designation || '',
    branch: backend.branch || '',
    county: backend.county || '',
    location: backend.location || '',
    dateOfBirth: backend.date_of_birth || '',
    sex: backend.gender || '',
    gender: backend.gender || '',
    hireDate: backend.date_joined || '',
    dateJoined: backend.date_joined || '',
    contractStart: backend.contract_start || '',
    contractEnd: backend.contract_end || '',
    jobStatus: (backend.job_status && backend.job_status.trim()) ? backend.job_status : 'active',
    staffType: backend.staff_type || 'teaching',
    salary: Number(backend.salary) || 0,
    teachingSubjects: backend.subjects_taught || [],
    subjectsTaught: backend.subjects_taught || [],
    qualifications: parseQualifications(backend.qualifications),
    status: backend.user?.status || 'pending',
    photo: backend.photo || '', // Add photo field
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
};

export const staffMemberToBackend = (staff: Partial<StaffMember>): Record<string, any> => {
  const snake: Record<string, any> = {};

  // Basic Information
  if (staff.firstName !== undefined) snake.first_name = staff.firstName;
  if (staff.lastName !== undefined) snake.last_name = staff.lastName;
  if (staff.email !== undefined) snake.email = staff.email;
  if (staff.phoneNumber !== undefined) snake.phone_number = staff.phoneNumber || null;
  if (staff.mobilePhone !== undefined) snake.phone_number = staff.mobilePhone || null;
  
  // Identification
  if (staff.idNumber !== undefined) snake.id_number = staff.idNumber || null;
  if (staff.tscNumber !== undefined) snake.tsc_number = staff.tscNumber || null;
  
  // Employment Details
  if (staff.designation !== undefined) snake.designation = staff.designation;
  if (staff.branch !== undefined) snake.branch = staff.branch;
  if (staff.jobStatus !== undefined) snake.job_status = staff.jobStatus.toLowerCase();
  if (staff.staffType !== undefined) snake.staff_type = staff.staffType;
  if (staff.salary !== undefined) snake.salary = Number(staff.salary);
  
  // Dates
  if (staff.hireDate !== undefined) snake.date_joined = staff.hireDate;
  if (staff.dateJoined !== undefined) snake.date_joined = staff.dateJoined;
  if (staff.contractStart !== undefined) snake.contract_start = staff.contractStart;
  if (staff.contractEnd !== undefined) snake.contract_end = staff.contractEnd;
  if (staff.dateOfBirth !== undefined) snake.date_of_birth = staff.dateOfBirth;
  
  // Location
  if (staff.county !== undefined) snake.county = staff.county;
  if (staff.location !== undefined) snake.location = staff.location;
  
  // Demographics
  if (staff.sex !== undefined) snake.gender = staff.sex;
  if (staff.gender !== undefined) snake.gender = staff.gender;
  
  // Arrays
  if (staff.teachingSubjects !== undefined && Array.isArray(staff.teachingSubjects)) {
    snake.subjects_taught = staff.teachingSubjects;
  }
  if (staff.subjectsTaught !== undefined && Array.isArray(staff.subjectsTaught)) {
    snake.subjects_taught = staff.subjectsTaught;
  }
  if (staff.qualifications !== undefined && Array.isArray(staff.qualifications)) {
    snake.qualifications = JSON.stringify(staff.qualifications);
  }

  // Photo
  if (staff.photo !== undefined) {
    snake.photo = staff.photo;
  }

  // Remove undefined values and convert empty strings to null
  Object.keys(snake).forEach(key => {
    if (snake[key] === undefined) {
      delete snake[key];
    }
    if (snake[key] === '') {
      snake[key] = null;
    }
  });

  return snake;
};

