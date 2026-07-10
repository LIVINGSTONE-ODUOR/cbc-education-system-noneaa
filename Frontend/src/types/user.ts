import { UserRole, Gender } from './enums';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  schoolId?: string;
  schoolName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher extends User {
  role: UserRole.TEACHER;
  schoolId: string;
  employeeNumber?: string;
  subjects: string[];
  qualifications?: string;
  dateJoined: string;
}

export interface Parent extends User {
  role: UserRole.PARENT;
  nationalId?: string;
  occupation?: string;
  relationship: 'father' | 'mother' | 'guardian';
  learnerIds: string[];
}

export interface SchoolAdmin extends User {
  role: UserRole.SCHOOL_ADMIN;
  schoolId: string;
}

export interface CreateTeacherDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  employeeNumber?: string;
  subjects: string[];
  qualifications?: string;
}

export interface CreateParentDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  nationalId?: string;
  occupation?: string;
  relationship: 'father' | 'mother' | 'guardian';
}
