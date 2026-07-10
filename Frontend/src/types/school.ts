import { SchoolLevel } from './enums';

export interface School {
  id: string;
  name: string;
  code: string;
  level: SchoolLevel;
  county: string;
  subCounty: string;
  ward?: string;
  address: string;
  phoneNumber: string;
  email: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolStats {
  totalTeachers: number;
  totalLearners: number;
  totalParents: number;
  activeClasses: number;
  recentAssessments: number;
}

export interface CreateSchoolDto {
  name: string;
  code: string;
  level: SchoolLevel;
  county: string;
  subCounty: string;
  ward?: string;
  address: string;
  phoneNumber: string;
  email: string;
}

export enum SchoolType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum LevelOffered {
  PRE_PRIMARY = 'Pre-Primary',
  LOWER_PRIMARY = 'Lower Primary Education (Grade 1-3)',
  UPPER_PRIMARY = 'Upper Primary Education (Grade 4-6)',
  JUNIOR_SECONDARY = 'Junior Secondary School (JSS) (Grade 7-9)',
  SENIOR_SECONDARY = 'Senior Secondary School (SSS) (Grade 10-12)',
}

export enum AdministratorRole {
  HEADTEACHER = 'Headteacher',
  PRINCIPAL = 'Principal',
  DIRECTOR = 'Director',
  ADMINISTRATOR = 'Administrator',
}

export interface SchoolRegistrationStep1 {
  name: string;
  code: string;
  subdomain: string;
  schoolType?: SchoolType;
  levelsOffered: LevelOffered[];
  yearEstablished?: string;
  motto?: string;
  logo?: File;
}

export interface SchoolRegistrationStep2 {
  county: string;
  subCounty: string;
  ward: string;
  physicalAddress: string;
  postalAddress: string;
  phoneNumber: string;
  email: string;
  website?: string;
}

export interface SchoolRegistrationStep3 {
  fullName: string;
  tscNo: string;
  role?: AdministratorRole;
  phoneNumber: string;
  email: string;
  nationalIdOrPassport?: string;
  username: string;
  password: string;
  twoFactorAuth?: boolean;
}
