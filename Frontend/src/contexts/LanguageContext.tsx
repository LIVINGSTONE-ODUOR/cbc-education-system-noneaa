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

  // AttendanceInsights.tsx
  monthlyAttendanceStats: { en: 'Monthly Attendance Statistics', sw: 'Takwimu za Mahudhurio kwa Mwezi' },
  monthlyAttendanceStatsDesc: {
    en: 'Present, late, absent, and excused days by month',
    sw: 'Siku za kuwepo, kuchelewa, kutokuwepo, na ruhusa kwa mwezi',
  },
  noAttendanceRecordsTerm: { en: 'No attendance records yet this term.', sw: 'Hakuna rekodi za mahudhurio bado muhula huu.' },
  attendanceTrends: { en: 'Attendance Trends', sw: 'Mwelekeo wa Mahudhurio' },
  attendanceTrendsDesc: { en: 'Attendance rate by month, in order', sw: 'Kiwango cha mahudhurio kwa mwezi, kwa mpangilio' },
  attendanceTrendMinMonths: {
    en: 'At least two months of records are needed to show a trend.',
    sw: 'Angalau miezi miwili ya rekodi inahitajika kuonyesha mwelekeo.',
  },
  present: { en: 'Present', sw: 'Yupo' },
  late: { en: 'Late', sw: 'Amechelewa' },
  excused: { en: 'Excused', sw: 'Ruhusa' },
  absent: { en: 'Absent', sw: 'Hayupo' },
  attendanceRate: { en: 'Attendance rate', sw: 'Kiwango cha mahudhurio' },
  failedToLoadAttendanceStats: { en: 'Failed to load attendance statistics', sw: 'Imeshindwa kupakia takwimu za mahudhurio' },

  // AssignmentReminders.tsx
  reminders: { en: 'Reminders', sw: 'Vikumbusho' },
  remindersDesc: { en: 'Assignments due soon or overdue', sw: 'Kazi zinazokaribia au zilizochelewa' },
  failedToLoadReminders: { en: 'Failed to load reminders', sw: 'Imeshindwa kupakia vikumbusho' },
  allCaughtUpPrefix: {
    en: "You're all caught up — nothing due in the next",
    sw: 'Umekamilisha kila kitu — hakuna kazi inayokaribia ndani ya',
  },
  generalSubject: { en: 'General', sw: 'Jumla' },
  overdue: { en: 'Overdue', sw: 'Imechelewa' },
  dueToday: { en: 'Due today', sw: 'Inatakiwa Leo' },
  dueInPrefix: { en: 'Due in', sw: 'Inatakiwa baada ya' },
  day: { en: 'day', sw: 'siku' },
  days: { en: 'days', sw: 'siku' },

  // ClassRankMovement.tsx
  classRank: { en: 'Class Rank', sw: 'Nafasi Darasani' },
  classRankDesc: { en: 'Your position compared to the previous exam.', sw: 'Nafasi yako ikilinganishwa na mtihani uliopita.' },
  loadingEllipsis: { en: 'Loading...', sw: 'Inapakia...' },
  noRankedExamsYet: { en: 'No ranked exam results yet.', sw: 'Hakuna matokeo ya mtihani yenye nafasi bado.' },
  ofClassSize: { en: 'of', sw: 'kati ya' },
  latestExam: { en: 'Latest exam', sw: 'Mtihani wa Hivi Karibuni' },
  noPreviousRankedExam: { en: 'No previous ranked exam to compare.', sw: 'Hakuna mtihani wa awali wenye nafasi wa kulinganisha.' },
  upPlacePrefix: { en: 'Up', sw: 'Amepanda' },
  downPlacePrefix: { en: 'Down', sw: 'Ameshuka' },
  place: { en: 'place', sw: 'nafasi' },
  places: { en: 'places', sw: 'nafasi' },
  sincePrefix: { en: 'since', sw: 'tangu' },
  lastExam: { en: 'last exam', sw: 'mtihani uliopita' },
  unchangedSince: { en: 'Unchanged since', sw: 'Haijabadilika tangu' },

  // ClassResources.tsx
  learningMaterialsNotes: { en: 'Learning Materials & Notes', sw: 'Vifaa vya Kujifunza na Maelezo' },
  learningMaterialsNotesDesc: {
    en: 'Notes and study material shared by your teachers',
    sw: 'Maelezo na vifaa vya masomo vilivyoshirikiwa na walimu wako',
  },
  noLearningMaterialsYet: {
    en: "Your teachers haven't published any learning materials or notes yet. Check back later.",
    sw: 'Walimu wako bado hawajachapisha vifaa vya kujifunza au maelezo yoyote. Rejea baadaye.',
  },
  classResources: { en: 'Class Resources', sw: 'Rasilimali za Darasa' },
  classResourcesDesc: { en: 'PDFs, videos, and links shared for your class', sw: 'PDF, video, na viungo vilivyoshirikiwa kwa darasa lako' },
  noClassResourcesYet: {
    en: 'No class resources have been shared yet. Anything your teachers add will show up here.',
    sw: 'Hakuna rasilimali za darasa zilizoshirikiwa bado. Chochote walimu wako watakachoongeza kitaonekana hapa.',
  },

  // CreditsPointsSystem.tsx
  creditsPoints: { en: 'Credits & Points', sw: 'Alama na Pointi' },
  creditsPointsDesc: { en: 'Earned from attendance and assignment activity.', sw: 'Zilizopatikana kutokana na mahudhurio na shughuli za kazi.' },
  couldNotLoadPoints: { en: 'Could not load your points right now.', sw: 'Imeshindwa kupakia pointi zako kwa sasa.' },
  points: { en: 'points', sw: 'pointi' },
  levelWord: { en: 'level', sw: 'kiwango' },
  levelBronze: { en: 'Bronze', sw: 'Shaba' },
  levelSilver: { en: 'Silver', sw: 'Fedha' },
  levelGold: { en: 'Gold', sw: 'Dhahabu' },
  levelPlatinum: { en: 'Platinum', sw: 'Platinamu' },
  toReach: { en: 'to', sw: 'hadi' },
  reachedTopLevel: { en: "You've reached the top level.", sw: 'Umefikia kiwango cha juu kabisa.' },
  attendanceLabel: { en: 'Attendance', sw: 'Mahudhurio' },
  presentLower: { en: 'present', sw: 'wapo' },
  lateLower: { en: 'late', sw: 'wamechelewa' },
  assignmentsLabel: { en: 'Assignments', sw: 'Kazi' },
  onTimeLower: { en: 'on time', sw: 'kwa wakati' },
  extracurricularNote: {
    en: "Extracurricular activity points aren't tracked yet — ask your school admin if you'd like that added.",
    sw: 'Pointi za shughuli za ziada bado hazifuatiliwi — muulize msimamizi wa shule ikiwa ungependa ziongezwe.',
  },

  // DeviceSessionHistory.tsx
  deviceSessionHistory: { en: 'Device & Session History', sw: 'Historia ya Vifaa na Vipindi' },
  deviceSessionHistoryDesc: { en: 'Everywhere your account is currently signed in.', sw: 'Kila mahali akaunti yako imeingia sasa.' },
  failedToLoadSessions: { en: 'Failed to load your session history', sw: 'Imeshindwa kupakia historia ya vipindi vyako' },
  failedToSignOutDevice: { en: 'Failed to sign out that device', sw: 'Imeshindwa kutoka kwenye kifaa hicho' },
  noActiveSessions: { en: 'No active sessions found.', sw: 'Hakuna vipindi hai vilivyopatikana.' },
  thisDevice: { en: 'This device', sw: 'Kifaa hiki' },
  unknownIp: { en: 'Unknown IP', sw: 'IP Isiyojulikana' },
  signedInAt: { en: 'Signed in', sw: 'Aliingia' },
  signingOutEllipsis: { en: 'Signing out...', sw: 'Inatoka...' },
  signOutButton: { en: 'Sign Out', sw: 'Toka' },
  unknownDevice: { en: 'Unknown device', sw: 'Kifaa Kisichojulikana' },
  dontRecognizeDevice: {
    en: "Don't recognize a device? Sign it out here, then change your password above.",
    sw: 'Hutambui kifaa? Kitoe hapa, kisha badilisha nenosiri lako hapo juu.',
  },

  // LearningHeatmap.tsx
  learningHeatmap: { en: 'Learning Heatmap', sw: 'Ramani ya Joto ya Kujifunza' },
  learningHeatmapDesc: {
    en: 'Your strong and weak topics at a glance, exam by exam',
    sw: 'Mada zako zenye nguvu na dhaifu kwa muhtasari, mtihani kwa mtihani',
  },
  noHeatmapDataYet: {
    en: 'No exam results yet — the heatmap will appear once your marks are recorded.',
    sw: 'Hakuna matokeo ya mtihani bado — ramani ya joto itaonekana mara alama zako zikirekodiwa.',
  },
  subjectHeader: { en: 'Subject', sw: 'Somo' },
  examFallback: { en: 'Exam', sw: 'Mtihani' },
  avgHeader: { en: 'Avg', sw: 'Wastani' },
  absentWord: { en: 'Absent', sw: 'Hayupo' },
  noRecordWord: { en: 'No record', sw: 'Hakuna Rekodi' },
  noDataBand: { en: 'No data', sw: 'Hakuna Data' },
  belowExpectation: { en: 'Below Expectation', sw: 'Chini ya Matarajio' },
  approachingExpectation: { en: 'Approaching Expectation', sw: 'Inakaribia Matarajio' },
  meetingExpectation: { en: 'Meeting Expectation', sw: 'Inakidhi Matarajio' },
  strongBand: { en: 'Strong', sw: 'Imara' },
  exceedingExpectation: { en: 'Exceeding Expectation', sw: 'Inazidi Matarajio' },
  noDataAbsentLegend: { en: 'No data / absent', sw: 'Hakuna data / Hayupo' },
  strongestTopic: { en: 'Strongest topic:', sw: 'Mada Yenye Nguvu Zaidi:' },
  avgSuffix: { en: 'avg', sw: 'wastani' },
  needsMostAttention: { en: 'Needs the most attention:', sw: 'Inahitaji Umakini Zaidi:' },

  // LeaveRequests.tsx
  leaveRequests: { en: 'Leave Requests', sw: 'Maombi ya Ruhusa' },
  leaveRequestsDesc: { en: 'Request and track time off from school', sw: 'Omba na fuatilia likizo kutoka shuleni' },
  leaveRequestsNotAvailable: {
    en: "Leave requests aren't available yet. Contact your class teacher or the school office directly for now.",
    sw: 'Maombi ya ruhusa hayapatikani bado. Wasiliana na mwalimu wako wa darasa au ofisi ya shule moja kwa moja kwa sasa.',
  },

  // LostAndFound.tsx
  lostAndFound: { en: 'Lost & Found', sw: 'Vitu Vilivyopotea' },
  lostAndFoundDesc: {
    en: 'Lost something on campus, or found something? Post it here.',
    sw: 'Umepoteza kitu shuleni, au umepata kitu? Chapisha hapa.',
  },
  newPost: { en: 'New post', sw: 'Chapisho Jipya' },
  newLostFoundPost: { en: 'New Lost & Found post', sw: 'Chapisho Jipya la Vitu Vilivyopotea' },
  iLabel: { en: 'I...', sw: 'Nime...' },
  lostAnItem: { en: 'Lost an item', sw: 'Poteza kitu' },
  foundAnItem: { en: 'Found an item', sw: 'Pata kitu' },
  itemLabel: { en: 'Item', sw: 'Kitu' },
  itemPlaceholder: { en: 'e.g. Blue water bottle', sw: 'k.m. Chupa ya maji ya buluu' },
  descriptionLabel: { en: 'Description', sw: 'Maelezo' },
  descriptionPlaceholder: { en: 'Any details that help identify it', sw: 'Maelezo yoyote yatakayosaidia kukitambua' },
  lastSeenWhere: { en: 'Last seen where?', sw: 'Uliona wapi mara ya mwisho?' },
  whereFoundIt: { en: 'Where did you find it?', sw: 'Ulipata wapi?' },
  locationPlaceholder: { en: 'e.g. Library, 2nd floor', sw: 'k.m. Maktaba, ghorofa ya 2' },
  howReachYou: { en: 'How should people reach you?', sw: 'Watu wakuwasiliane vipi?' },
  contactPlaceholder: { en: 'e.g. Ask for John in 9B, or an email', sw: 'k.m. Uliza John darasa la 9B, au barua pepe' },
  cancel: { en: 'Cancel', sw: 'Ghairi' },
  postingEllipsis: { en: 'Posting...', sw: 'Inachapisha...' },
  postButton: { en: 'Post', sw: 'Chapisha' },
  allFilter: { en: 'All', sw: 'Zote' },
  lostFilter: { en: 'Lost', sw: 'Zilizopotea' },
  foundFilter: { en: 'Found', sw: 'Zilizopatikana' },
  showingResolved: { en: 'Showing resolved', sw: 'Inaonyesha zilizotatuliwa' },
  showResolvedBtn: { en: 'Show resolved', sw: 'Onyesha zilizotatuliwa' },
  couldNotLoadLostFound: { en: 'Could not load the Lost & Found board.', sw: 'Imeshindwa kupakia ubao wa Vitu Vilivyopotea.' },
  nothingPostedYet: {
    en: 'Nothing posted yet. Lost or found something? Be the first to post.',
    sw: 'Hakuna kilichochapishwa bado. Umepoteza au kupata kitu? Kuwa wa kwanza kuchapisha.',
  },
  resolved: { en: 'Resolved', sw: 'Imetatuliwa' },
  contactLabel: { en: 'Contact', sw: 'Wasiliana' },
  postedByPrefix: { en: 'Posted by', sw: 'Imechapishwa na' },
  markResolvedTitle: { en: 'Mark resolved', sw: 'Weka Kama Imetatuliwa' },
  deleteTitle: { en: 'Delete', sw: 'Futa' },
  visibleFooter: {
    en: 'Visible to everyone at your school. Resolve or delete only your own posts.',
    sw: 'Inaonekana kwa kila mtu shuleni kwako. Tatua au futa machapisho yako mwenyewe pekee.',
  },
  couldNotPostBoard: { en: 'Could not post to the Lost & Found board.', sw: 'Imeshindwa kuchapisha kwenye ubao wa Vitu Vilivyopotea.' },
  couldNotMarkResolved: { en: 'Could not mark this as resolved.', sw: 'Imeshindwa kuweka hii kama imetatuliwa.' },
  couldNotDeletePost: { en: 'Could not delete this post.', sw: 'Imeshindwa kufuta chapisho hili.' },
  deleteConfirm: { en: 'Delete this post?', sw: 'Futa chapisho hili?' },

  // TeacherComments.tsx
  teacherComments: { en: 'Teacher Comments', sw: 'Maoni ya Walimu' },
  teacherCommentsDesc: { en: 'Feedback your teachers have left for you', sw: 'Maoni ambayo walimu wako wamekuachia' },
  failedToLoadTeacherComments: { en: 'Failed to load teacher comments', sw: 'Imeshindwa kupakia maoni ya walimu' },
  noTeacherCommentsYet: { en: 'No teacher comments yet.', sw: 'Hakuna maoni ya walimu bado.' },
  teacherFallback: { en: 'Teacher', sw: 'Mwalimu' },

  // StudyStreakTracker.tsx
  studyStreak: { en: 'Study Streak', sw: 'Mfuatano wa Masomo' },
  studyStreakDesc: {
    en: "Consecutive school days you've shown up and engaged.",
    sw: 'Siku mfululizo za shule ulizohudhuria na kushiriki.',
  },
  couldNotLoadStreak: { en: 'Could not load your streak right now.', sw: 'Imeshindwa kupakia mfuatano wako kwa sasa.' },
  inARow: { en: 'in a row', sw: 'mfululizo' },
  bestStreakPrefix: { en: 'Best streak:', sw: 'Mfuatano Bora:' },
  streakMsgZero: { en: 'Show up tomorrow to start a new streak.', sw: 'Hudhuria kesho kuanza mfuatano mpya.' },
  streakMsgOne: { en: 'Nice start — keep it going tomorrow.', sw: 'Mwanzo mzuri — endelea kesho.' },
  streakMsgBuilding: { en: "You're building momentum.", sw: 'Unajenga kasi.' },
  streakMsgConsistent: { en: "Great consistency — don't break it now.", sw: 'Uthabiti mzuri — usiukatize sasa.' },
  streakMsgOutstanding: { en: "Outstanding streak — you're on fire!", sw: 'Mfuatano wa kipekee — umewaka moto!' },

  // CampusMap.tsx (missing keys)
  couldNotLoadCampusMap: { en: 'Could not load the campus map right now.', sw: 'Imeshindwa kupakia ramani ya shule kwa sasa.' },
  unassignedArea: { en: 'Other areas', sw: 'Maeneo Mengine' },
  campusMapDesc: { en: 'Find classrooms, labs, and offices around the school', sw: 'Tafuta madarasa, maabara, na ofisi shuleni' },
  searchRoomPlaceholder: { en: 'Search by room or building...', sw: 'Tafuta kwa chumba au jengo...' },
  noLocationsMatchSearch: { en: 'No locations match your search.', sw: 'Hakuna eneo linalolingana na utafutaji wako.' },
  noCampusMapYet: { en: 'The campus map has not been set up yet.', sw: 'Ramani ya shule bado haijawekwa.' },
  floorLabel: { en: 'Floor', sw: 'Ghorofa' },
  roomLabel: { en: 'Room', sw: 'Chumba' },
  maintainedByTeachers: { en: 'Maintained by school staff.', sw: 'Inasimamiwa na wafanyakazi wa shule.' },

  // DigitalNotebook.tsx (missing keys)
  untitledNote: { en: 'Untitled note', sw: 'Daftari lisilo na Jina' },
  digitalNotebook: { en: 'Digital Notebook', sw: 'Daftari la Kidijitali' },
  digitalNotebookDesc: { en: 'Personal notes and reminders, saved on this device', sw: 'Maelezo binafsi na vikumbusho, vilivyohifadhiwa kwenye kifaa hiki' },
  newNoteButton: { en: 'New note', sw: 'Daftari Jipya' },
  editNoteTitle: { en: 'Edit note', sw: 'Hariri Daftari' },
  titleLabel: { en: 'Title', sw: 'Kichwa' },
  titlePlaceholder: { en: 'e.g. Chemistry revision', sw: 'k.m. Marudio ya Kemia' },
  noteLabel: { en: 'Note', sw: 'Daftari' },
  notePlaceholder: { en: 'Write your note here...', sw: 'Andika daftari lako hapa...' },
  reminderDateOptional: { en: 'Reminder date (optional)', sw: 'Tarehe ya Kikumbusho (si lazima)' },
  cancelButton: { en: 'Cancel', sw: 'Ghairi' },
  saveChangesButton: { en: 'Save changes', sw: 'Hifadhi Mabadiliko' },
  addNoteButton: { en: 'Add note', sw: 'Ongeza Daftari' },
  noNotesYet: { en: "You don't have any notes yet.", sw: 'Huna daftari lolote bado.' },
  dueWord: { en: 'Due', sw: 'Inatakiwa' },
  upcomingReminders: { en: 'Upcoming reminders', sw: 'Vikumbusho Vinavyokuja' },
  notesWord: { en: 'Notes', sw: 'Madaftari' },
  notesSavedOnDevice: { en: 'note(s) saved on this device', sw: 'daftari zilizohifadhiwa kwenye kifaa hiki' },

  // ExamCountdownTimer.tsx (missing keys)
  examUnderway: { en: '{exam} is underway', sw: '{exam} inaendelea sasa' },
  examBeginsToday: { en: '{exam} begins today', sw: '{exam} inaanza leo' },
  examBeginsTomorrow: { en: '{exam} begins tomorrow', sw: '{exam} inaanza kesho' },
  examBeginsInDays: { en: '{exam} begins in {n} days', sw: '{exam} inaanza baada ya siku {n}' },
  examCountdown: { en: 'Exam Countdown', sw: 'Muda Uliobaki wa Mtihani' },
  examCountdownDesc: { en: 'Time remaining until your next exam', sw: 'Muda uliobaki hadi mtihani wako unaofuata' },
  loadingWord: { en: 'Loading...', sw: 'Inapakia...' },
  noExamsScheduledYet: { en: 'No upcoming exams are scheduled yet.', sw: 'Hakuna mtihani unaokuja uliopangwa bado.' },
  daysLeftWord: { en: 'days left', sw: 'siku zilizobaki' },
  startsWord: { en: 'starts', sw: 'inaanza' },
  alsoComingUp: { en: 'Also coming up', sw: 'Pia Inakuja' },
  daysWord: { en: 'days', sw: 'siku' },

  // ExamRevisionPlanner.tsx (missing keys)
  examRevisionPlanner: { en: 'Exam Revision Planner', sw: 'Mpangilio wa Marudio ya Mtihani' },
  revisionScheduleFor: { en: 'Revision schedule for {exam}', sw: 'Ratiba ya marudio kwa ajili ya {exam}' },
  revisionScheduleGeneric: { en: 'Revision schedule', sw: 'Ratiba ya Marudio' },
  noUpcomingExamsPlan: {
    en: 'No upcoming exams are scheduled yet — a revision plan will appear once one is.',
    sw: 'Hakuna mtihani unaokuja uliopangwa bado — mpango wa marudio utaonekana mara mtihani utakapopangwa.',
  },
  notEnoughHistoryForPlan: {
    en: 'Not enough exam history yet to build a personalized revision plan.',
    sw: 'Bado hakuna historia ya kutosha ya mtihani kuunda mpango binafsi wa marudio.',
  },
  examTodayGoodLuck: { en: '{exam} is today — good luck!', sw: '{exam} ni leo — bahati njema!' },
  daysUntilExamLabel: { en: '{n} days until {exam}. ', sw: 'Siku {n} kabla ya {exam}. ' },
  showingFirstDays: { en: 'Showing the first {n} days.', sw: 'Inaonyesha siku {n} za kwanza.' },
  revisionDaysPlanned: { en: 'revision days planned', sw: 'siku za marudio zilizopangwa' },
  restLightReview: { en: 'Rest / light review', sw: 'Pumzika / Marudio Mepesi' },
  revisionPlannerFooter: {
    en: 'Plan covers the next {n} days and is weighted toward your weaker subjects.',
    sw: 'Mpango unahusisha siku {n} zijazo na umeegemea zaidi kwenye masomo yako dhaifu.',
  },

  // ExportToCalendar.tsx (missing keys)
  assignmentDuePrefix: { en: '{title} due', sw: '{title} inatakiwa' },
  subjectPrefix: { en: 'Subject: {name}', sw: 'Somo: {name}' },
  failedToLoadDeadlines: { en: 'Failed to load upcoming deadlines', sw: 'Imeshindwa kupakia muda wa mwisho unaokuja' },
  examPrefix: { en: 'Exam: {name}', sw: 'Mtihani: {name}' },
  timePrefix: { en: 'Time: {time}', sw: 'Muda: {time}' },
  exportToCalendar: { en: 'Export to Calendar', sw: 'Hamisha kwenye Kalenda' },
  exportToCalendarDesc: { en: 'Exams, assignments, and events, ready for your calendar app', sw: 'Mitihani, kazi, na matukio, tayari kwa programu yako ya kalenda' },
  nothingUpcomingToExport: { en: 'Nothing upcoming to export right now.', sw: 'Hakuna kinachokuja cha kuhamisha kwa sasa.' },
  upcomingItemsCount: { en: 'upcoming items', sw: 'matukio yanayokuja' },
  exportAllIcs: { en: 'Export all (.ics)', sw: 'Hamisha Zote (.ics)' },
  googleCalendarButton: { en: 'Google Calendar', sw: 'Kalenda ya Google' },
  exportToCalendarFooter: { en: 'Download .ics files to import into any calendar app.', sw: 'Pakua faili za .ics kuziweka kwenye programu yoyote ya kalenda.' },

  // GradeHistory.tsx (missing keys)
  gradeHistory: { en: 'Grade History', sw: 'Historia ya Alama' },
  gradeHistoryDesc: { en: 'Your exam results over time', sw: 'Matokeo yako ya mtihani kwa muda' },
  noExamsRecordedYet: { en: 'No exams have been recorded for you yet.', sw: 'Hakuna mtihani uliorekodiwa kwa ajili yako bado.' },
  examColumn: { en: 'Exam', sw: 'Mtihani' },
  termColumn: { en: 'Term', sw: 'Muhula' },
  dateColumn: { en: 'Date', sw: 'Tarehe' },
  averageColumn: { en: 'Average', sw: 'Wastani' },
  overallGradeColumn: { en: 'Overall Grade', sw: 'Daraja la Jumla' },
  classPositionColumn: { en: 'Class Position', sw: 'Nafasi Darasani' },
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
