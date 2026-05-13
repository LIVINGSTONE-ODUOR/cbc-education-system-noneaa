import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

// Types kept in this context to avoid coupling to placeholder API stubs.
export type SchoolLevel = 'ecde' | 'primary' | 'secondary';

export interface SchoolProfile {
  name: string;
  code: string;
  level: SchoolLevel;
  county: string;
  subCounty: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
  established: string;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  schoolName: string;
}

export interface AcademicSettings {
  currentYear: string;
  startDate: string;
  endDate: string;
  termsPerYear: number;
  gradingScale: 'a_f' | 'numeric' | 'percentages';
}

export interface AcademicStructure {
  numberOfClasses: number;
  classLevels: string[];
  streams: number;
  maxStudentsPerClass: number;
}

export interface AttendanceSettings {
  trackingMethod: 'daily' | 'hourly' | 'both';
  presentThreshold: number;
  absentThreshold: number;
  autoReportGeneration: boolean;
}

export interface ExaminationSettings {
  numberOfExams: number;
  passingScore: number;
  gradesMethod: 'terminal' | 'continuous' | 'combined';
}

export interface FinanceSettings {
  currency: string;
  academicYearStart: string;
  invoicePrefix: string;
  enablePaymentGateway: boolean;
}

export interface CommunicationSettings {
  smsNotifications: boolean;
  emailNotifications: boolean;
  parentPortalAccess: boolean;
  announcementsToParents: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  ipWhitelist: boolean;
  passwordExpiry: number;
  sessionTimeout: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface SchoolSettingsState {
  schoolProfile: SchoolProfile;
  branding: BrandingSettings;
  academicSettings: AcademicSettings;
  academicStructure: AcademicStructure;
  attendance: AttendanceSettings;
  examination: ExaminationSettings;
  finance: FinanceSettings;
  communication: CommunicationSettings;
  security: SecuritySettings;
}

type SchoolSettingsContextValue = {
  state: SchoolSettingsState;
  // Generic safe setters (partial updates)
  setSchoolProfile: (patch: Partial<SchoolProfile>) => void;
  setBranding: (patch: Partial<BrandingSettings>) => void;
  setAcademicSettings: (patch: Partial<AcademicSettings>) => void;
  setAcademicStructure: (patch: Partial<AcademicStructure>) => void;
  setAttendance: (patch: Partial<AttendanceSettings>) => void;
  setExamination: (patch: Partial<ExaminationSettings>) => void;
  setFinance: (patch: Partial<FinanceSettings>) => void;
  setCommunication: (patch: Partial<CommunicationSettings>) => void;
  setSecurity: (patch: Partial<SecuritySettings>) => void;

  // Hooks for later API integration
  // Since current backend endpoints are stubs, these are no-ops/dummy.
  refresh: () => Promise<void>;
  saveSection: (section: string) => Promise<void>;
};

const SchoolSettingsContext = createContext<SchoolSettingsContextValue | undefined>(undefined);

const defaultState: SchoolSettingsState = {
  schoolProfile: {
    name: 'Example Primary School',
    code: 'EPS001',
    level: 'primary',
    county: 'Nairobi',
    subCounty: 'Westlands',
    address: '123 Education Street, Nairobi',
    phone: '+254 700 123 456',
    email: 'info@exampleprimary.edu',
    website: 'https://exampleprimary.edu',
    motto: 'Excellence in Education',
    established: '2005',
  },
  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    logoUrl: '',
    faviconUrl: '',
    schoolName: 'Example Primary School',
  },
  academicSettings: {
    currentYear: '2024-2025',
    startDate: '2024-01-08',
    endDate: '2024-11-22',
    termsPerYear: 3,
    gradingScale: 'a_f',
  },
  academicStructure: {
    numberOfClasses: 8,
    classLevels: [
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
    ],
    streams: 2,
    maxStudentsPerClass: 50,
  },
  attendance: {
    trackingMethod: 'daily',
    presentThreshold: 80,
    absentThreshold: 20,
    autoReportGeneration: true,
  },
  examination: {
    numberOfExams: 3,
    passingScore: 50,
    gradesMethod: 'combined',
  },
  finance: {
    currency: 'KES',
    academicYearStart: '01',
    invoicePrefix: 'INV',
    enablePaymentGateway: true,
  },
  communication: {
    smsNotifications: true,
    emailNotifications: true,
    parentPortalAccess: true,
    announcementsToParents: true,
  },
  security: {
    twoFactorAuth: false,
    ipWhitelist: false,
    passwordExpiry: 90,
    sessionTimeout: 30,
    backupFrequency: 'daily',
  },
};

export function SchoolSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<SchoolSettingsState>(defaultState);

  // Prevent concurrent refresh/save to keep UI predictable.
  const inFlightRef = useRef<{ refresh: boolean; save: boolean }>({ refresh: false, save: false });

  const refresh = useCallback(async () => {
    if (inFlightRef.current.refresh) return;
    inFlightRef.current.refresh = true;
    try {
      // TODO: connect to backend to load settings
      await new Promise((r) => setTimeout(r, 200));
    } finally {
      inFlightRef.current.refresh = false;
    }
  }, []);

  const saveSection = useCallback(async (_section: string) => {
    if (inFlightRef.current.save) return;
    inFlightRef.current.save = true;
    try {
      // TODO: connect to backend to persist settings
      await new Promise((r) => setTimeout(r, 1000));
    } finally {
      inFlightRef.current.save = false;
    }
  }, []);

  const setSchoolProfile = useCallback((patch: Partial<SchoolProfile>) => {
    setState((s) => ({ ...s, schoolProfile: { ...s.schoolProfile, ...patch } }));
  }, []);
  const setBranding = useCallback((patch: Partial<BrandingSettings>) => {
    setState((s) => ({ ...s, branding: { ...s.branding, ...patch } }));
  }, []);
  const setAcademicSettings = useCallback((patch: Partial<AcademicSettings>) => {
    setState((s) => ({ ...s, academicSettings: { ...s.academicSettings, ...patch } }));
  }, []);
  const setAcademicStructure = useCallback((patch: Partial<AcademicStructure>) => {
    setState((s) => ({ ...s, academicStructure: { ...s.academicStructure, ...patch } }));
  }, []);
  const setAttendance = useCallback((patch: Partial<AttendanceSettings>) => {
    setState((s) => ({ ...s, attendance: { ...s.attendance, ...patch } }));
  }, []);
  const setExamination = useCallback((patch: Partial<ExaminationSettings>) => {
    setState((s) => ({ ...s, examination: { ...s.examination, ...patch } }));
  }, []);
  const setFinance = useCallback((patch: Partial<FinanceSettings>) => {
    setState((s) => ({ ...s, finance: { ...s.finance, ...patch } }));
  }, []);
  const setCommunication = useCallback((patch: Partial<CommunicationSettings>) => {
    setState((s) => ({ ...s, communication: { ...s.communication, ...patch } }));
  }, []);
  const setSecurity = useCallback((patch: Partial<SecuritySettings>) => {
    setState((s) => ({ ...s, security: { ...s.security, ...patch } }));
  }, []);

  const value = useMemo<SchoolSettingsContextValue>(
    () => ({
      state,
      setSchoolProfile,
      setBranding,
      setAcademicSettings,
      setAcademicStructure,
      setAttendance,
      setExamination,
      setFinance,
      setCommunication,
      setSecurity,
      refresh,
      saveSection,
    }),
    [
      state,
      setSchoolProfile,
      setBranding,
      setAcademicSettings,
      setAcademicStructure,
      setAttendance,
      setExamination,
      setFinance,
      setCommunication,
      setSecurity,
      refresh,
      saveSection,
    ]
  );

  return <SchoolSettingsContext.Provider value={value}>{children}</SchoolSettingsContext.Provider>;
}

export const useSchoolSettings = () => {
  const ctx = useContext(SchoolSettingsContext);
  if (!ctx) {
    throw new Error('useSchoolSettings must be used within a SchoolSettingsProvider');
  }
  return ctx;
};

