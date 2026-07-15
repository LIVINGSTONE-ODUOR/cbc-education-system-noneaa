import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type LanguageCode = 'en' | 'sw';

const LANGUAGE_KEY = 'app-language';

// Central translation dictionary. Add keys here as more of the UI is translated.
const TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  dashboard: { en: 'Dashboard', sw: 'Dashibodi' },
  academics: { en: 'Academics', sw: 'Masomo' },
  marks: { en: 'Marks', sw: 'Alama' },
  attendance: { en: 'Attendance', sw: 'Mahudhurio' },
  communication: { en: 'Communication', sw: 'Mawasiliano' },
  studyGroups: { en: 'Study Groups', sw: 'Vikundi vya Masomo' },
  notebook: { en: 'Notebook', sw: 'Daftari' },
  lostFound: { en: 'Lost & Found', sw: 'Vitu Vilivyopotea' },
  campusMap: { en: 'Campus Map', sw: 'Ramani ya Shule' },
  portfolio: { en: 'Portfolio', sw: 'Mafanikio Yangu' },
  signOut: { en: 'Sign out', sw: 'Ondoka' },
  accountSettings: { en: 'Account & Settings', sw: 'Akaunti na Mipangilio' },
  student: { en: 'student', sw: 'mwanafunzi' },

  // Settings page
  languageSettings: { en: 'Language Settings', sw: 'Mipangilio ya Lugha' },
  languageSettingsDesc: { en: 'Choose your preferred display language.', sw: 'Chagua lugha unayopendelea kutumia.' },
  language: { en: 'Language', sw: 'Lugha' },
  english: { en: 'English', sw: 'Kiingereza' },
  kiswahili: { en: 'Kiswahili', sw: 'Kiswahili' },
  preferenceSaved: { en: 'Your preference is saved on this device.', sw: 'Chaguo lako limehifadhiwa kwenye kifaa hiki.' },

  viewAttendance: { en: 'View Attendance', sw: 'Angalia Mahudhurio' },
  viewMarks: { en: 'View Marks', sw: 'Angalia Alama' },
  viewAssignments: { en: 'View Assignments', sw: 'Angalia Kazi za Nyumbani' },

  // OfflineAccess.tsx
  offlineAccess: { en: 'Offline Access', sw: 'Ufikiaji Nje ya Mtandao' },
  offlineAccessDesc: {
    en: 'Install the app and keep viewing your timetable and notes without internet.',
    sw: 'Sakinisha programu ili uendelee kuona ratiba yako na maelezo yako bila intaneti.',
  },
  connectionStatus: { en: 'Connection status', sw: 'Hali ya Muunganisho' },
  onlineSyncing: { en: 'Online — data is syncing normally.', sw: 'Mtandaoni — data inasawazishwa kawaida.' },
  offlineLastSaved: {
    en: "Offline — you're viewing your last saved data.",
    sw: 'Nje ya mtandao — unaona data yako ya mwisho iliyohifadhiwa.',
  },
  online: { en: 'Online', sw: 'Mtandaoni' },
  offline: { en: 'Offline', sw: 'Nje ya Mtandao' },
  installAsApp: { en: 'Install as an app', sw: 'Sakinisha kama Programu' },
  alreadyInstalled: { en: 'Already installed on this device.', sw: 'Tayari imesakinishwa kwenye kifaa hiki.' },
  addToHomeScreenPrompt: {
    en: 'Add NONEAA to your home screen for faster, offline-ready access.',
    sw: 'Ongeza NONEAA kwenye skrini yako ya nyumbani kwa ufikiaji wa haraka, tayari kwa matumizi nje ya mtandao.',
  },
  openInChromeEdge: {
    en: 'Open this site in Chrome or Edge to install it, or use "Add to Home Screen" on mobile.',
    sw: 'Fungua tovuti hii kwa Chrome au Edge kuisakinisha, au tumia "Ongeza kwenye Skrini ya Nyumbani" kwenye simu.',
  },
  installed: { en: 'Installed', sw: 'Imesakinishwa' },
  installApp: { en: 'Install App', sw: 'Sakinisha Programu' },
  availableOfflineOnce: {
    en: 'Available offline once loaded at least once:',
    sw: 'Inapatikana nje ya mtandao mara ikisha pakiwa angalau mara moja:',
  },
  offlineTimetable: { en: 'Your class timetable', sw: 'Ratiba yako ya darasa' },
  offlineNotebookNote: {
    en: 'Personal notes and reminders (Digital Notebook — always saved on this device)',
    sw: 'Maelezo binafsi na vikumbusho (Daftari la Kidijitali — huhifadhiwa kila mara kwenye kifaa hiki)',
  },
  offlineAppItself: {
    en: "The app itself, so you're not staring at a browser error screen",
    sw: 'Programu yenyewe, ili usiangalie skrini ya hitilafu ya kivinjari',
  },
};

export type TranslationKey = keyof typeof TRANSLATIONS;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved === 'sw' ? 'sw' : 'en';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, fallback?: string) => {
      const entry = TRANSLATIONS[key as TranslationKey];
      if (!entry) return fallback ?? key;
      return entry[language] ?? entry.en;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
