import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SchoolSettingsProvider } from "@/contexts/SchoolSettingsContext";

import AIAssistant from "@/components/ai-assistant/AIAssistant";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import GlobalSkeletonLoader from "@/components/GlobalSkeletonLoader";
import NavigationSpinner from "@/components/NavigationSpinner";
import ContactPage from './pages/website-pages/Contact';

// Public Pages
import HomePage from "@/pages/website-pages/HomePage";
import AboutPage from "@/pages/website-pages/AboutPage";
import SupportPage from "@/pages/website-pages/SupportPage";
import PrivacyPage from "@/pages/website-pages/PrivacyPage";
import CBEStandardsPage from "@/pages/website-pages/CBEStandardsPage";
import TermsPage from "@/pages/website-pages/TermsPage";
import SecurityPage from "@/pages/website-pages/SecurityPage";
import LoginPage from "@/pages/auth/LoginPage";
import GetStartedPage from "@/pages/website-pages/signup";
import NoneaaPlatformPage from "@/pages/website-pages/Platform";
import ClientsPage from '@/pages/website-pages/ClientsPage';
import Feature from "@/pages/website-pages/Features";
import TeamMembersPage from '@/pages/website-pages/TeamPage';
import CareersPage from '@/pages/website-pages/CareersPage';
import PricingPage from '@/pages/website-pages/PricingPage';
import TestimonialsPage from '@/pages/website-pages/TestimonialsPage';
import DemoPage from '@/pages/website-pages/DemoPage';
import GettingStartedPage from '@/pages/website-pages/GettingStartedPage';
import CurriculumPage from '@/pages/website-pages/CurriculumPage';
import ProgressTrackingPage from '@/pages/website-pages/ProgressTrackingPage';
import AssessmentToolsPage from '@/pages/website-pages/AssessmentToolsPage';
import CBEMethodologyPage from '@/pages/website-pages/CBEMethodologyPage';
import TeacherResourcesPage from '@/pages/website-pages/TeacherResourcesPage';
import GlobalStandardsPage from '@/pages/website-pages/GlobalStandardsPage';

// Admin Registration
import AdminRegistrationPage from "@/pages/admin-registration";

// Student Pages
import LearningMaterials from "@/pages/student/LearningMaterials";
import Grade1 from "@/pages/student/Grade1";
import Grade2 from "@/pages/student/Grade2";
import StudentPortal from "./pages/Student-Portal/Student";

// Teacher Pages
import TeachingResources from "@/pages/teacher/TeachingResources";
import Teacher from "./pages/teacher/TeacherProfile";
import AdminStaff from "./pages/teacher/StaffList";
import StaffManagement from "./pages/teacher/StaffManagement";
import TeacherPortal from "./pages/Teacher-Portal/Teacher-Portal";

// Layouts
import DashboardLayout from "@/components/layout/DashboardLayout";

// School Admin Pages
import SchoolManagement from "./pages/SchoolManagement/schoolmanagement";
import DashboardWidgets from "./pages/school-admin/learners/DashboardWidgets";
import TeachersListPage from "@/pages/auth/school-admin/teachers/TeachersList";
import AddTeacherPage from "@/pages/auth/school-admin/teachers/AddTeacher";
import StudentManagement from "@/pages/auth/school-admin/learners/Learners";  // ✅ Keep only one
import AddLearnerPage from "./pages/auth/school-admin/learners/AddLearner";
import BulkImportPage from "@/pages/auth/school-admin/learners/BulkImportPage";
import FeeManagement from "./pages/school-admin/learners/FeesManagent/FeeManagement";
import Assessments from "./pages/school-admin/Assessment";
import AdminAttendance from "./pages/teacher/StaffAttendance";
import Calendar from "./pages/Calendar/Calendar";
import Classes from "./pages/ClassesManagement/ClassManagement";
import Student from "./pages/auth/school-admin/learners/LearnerProfile";
import StudentClasses from "./pages/auth/school-admin/learners/StudentClasses";
import ParentManagement from "./pages/auth/school-admin/parents/parents";
import EducationalResourcesPage from "./pages/website-pages/Educationalresourcespage";
import SystemStatusPage from "@/pages/website-pages/SystemStatusPage";
import ReportIncidentPage from "@/pages/website-pages/ReportIncidentPage";
import UserManagement from "./pages/Users/UserManagement";
import ModernDashboard from "@/components/ModernDashboard";

// Parent Portal
import ParentPortal from "./pages/Parent-Portal/Parent-Portal";

// Department Pages
import DepartmentsPage from "@/pages/auth/school-admin/teachers/departments/DepartmentsPage";

// Placeholder Pages
import AdminCurriculumPage from "@/pages/auth/school-admin/Curriculum";
import ReportsPage from "@/pages/auth/school-admin/Reports";
import SettingsPage from "./pages/auth/school-admin/Settings/Settings";
import ProfileSettings from "./pages/auth/school-admin/Settings/ProfileSettings";

import NotFound from "./pages/website-pages/NotFound";
import BlogPage from "./pages/website-pages/BlogPage";
import BlogPostPage from "./pages/website-pages/BlogPostPage";
import OwnerLoginPage from "./pages/website-pages/OwnerLoginPage";
import BlogAdminPage from "./pages/website-pages/BlogAdminPage";
import { BlogProvider } from "@/contexts/BlogContext";

const queryClient = new QueryClient();

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { isAuthenticated, isLoading, user, showLoginSkeleton, isSkeletonFading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (showLoginSkeleton) {
    return <GlobalSkeletonLoader fading={isSkeletonFading} />;
  }

  // Redirect if role doesn't match
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "school_admin" || user?.role === "super_admin") {
      return <Navigate to="/school-admin/dashboard" replace />;
    } else if (user?.role === "student") {
      return <Navigate to="/student/learning-materials" replace />;
    } else if (user?.role === "teacher") {
      return <Navigate to="/teacher/resources" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

// ─── Admin Route ──────────────────────────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, showLoginSkeleton, isSkeletonFading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "school_admin" && user?.role !== "super_admin")) {
    return <Navigate to="/login" replace />;
  }

  if (showLoginSkeleton) {
    return <GlobalSkeletonLoader fading={isSkeletonFading} />;
  }

  return <>{children}</>;
}

// ─── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* ── Public Routes ── */}
      <Route path="/explore" element={<HomePage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/resources" element={<EducationalResourcesPage />} />
      <Route path="/analytics" element={<NoneaaPlatformPage />} />
      <Route path="/company/client" element={<ClientsPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/status" element={<SystemStatusPage />} />
      <Route path="/status/report-incident" element={<ReportIncidentPage />} />
      <Route path="/company/our-team" element={<TeamMembersPage />} />
      <Route path="/cbe-standards" element={<CBEStandardsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/get-started" element={<GetStartedPage />} />
      <Route path="/signup" element={<GetStartedPage />} />
      <Route path="/admin-register" element={<AdminRegistrationPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/features" element={<Feature />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:id" element={<BlogPostPage />} />
      <Route path="/owner/login" element={<OwnerLoginPage />} />
      <Route path="/owner/blog-admin" element={<BlogAdminPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/testimonials" element={<TestimonialsPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/getting-started" element={<GettingStartedPage />} />
      <Route path="/curriculum" element={<CurriculumPage />} />
      <Route path="/progress" element={<ProgressTrackingPage />} />
      <Route path="/assessments" element={<AssessmentToolsPage />} />
      <Route path="/methodology" element={<CBEMethodologyPage />} />
      <Route path="/teacher/resources" element={<TeacherResourcesPage />} />
      <Route path="/standards" element={<GlobalStandardsPage />} />

      {/* ── Demo Routes ── */}
      <Route path="/dashboard-demo" element={<ModernDashboard />} />

      {/* ── Student Routes ── */}
      <Route
        path="/student/learning-materials"
        element={
          <ProtectedRoute requiredRole="student">
            <LearningMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/grade/1"
        element={
          <ProtectedRoute requiredRole="student">
            <Grade1 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/grade/2"
        element={
          <ProtectedRoute requiredRole="student">
            <Grade2 />
          </ProtectedRoute>
        }
      />

      {/* ── Teacher Routes ── */}
      <Route
        path="/teacher/resources"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeachingResources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/portal"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherPortal />
          </ProtectedRoute>
        }
      />

      {/* ── Student Routes (Standalone Portal) ── */}
      <Route
        path="/student/portal"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentPortal />
          </ProtectedRoute>
        }
      />

      {/* ── Parent Routes (Standalone Portal) ── */}
      <Route
        path="/parent/portal"
        element={
          <ProtectedRoute requiredRole="parent">
            <ParentPortal />
          </ProtectedRoute>
        }
      />

      {/* ── Admin Login (redirects to unified login) ── */}
      <Route path="/admin-login" element={<Navigate to="/login" replace />} />

      {/* ── School Admin Routes (Protected) ── */}
      <Route
        path="/school-admin/*"
        element={
          <AdminRoute>
            <DashboardLayout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardWidgets />} />

                {/* ── Teachers ── */}
                <Route path="teachers" element={<TeachersListPage />} />
                <Route path="teachers/add" element={<AddTeacherPage />} />
                <Route path="teachers/departments" element={<DepartmentsPage />} />
                <Route path="teacher-profile" element={<Teacher />} />
                <Route path="teacher-list" element={<AdminStaff />} />
                <Route path="staff-manage" element={<StaffManagement />} />
                <Route path="classes" element={<Classes />} />

                {/* ── Learners ── */}
                <Route path="learners" element={<StudentManagement />} />
                <Route path="learners/add" element={<AddLearnerPage />} />
                <Route path="learners/bulk-import" element={<BulkImportPage />} />
                <Route path="learners/profile" element={<Student />} />
                <Route path="learners/classes" element={<StudentClasses />} />

                {/* ── Other Admin Pages ── */}
                <Route path="curriculum" element={<AdminCurriculumPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/profile" element={<ProfileSettings />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="demo" element={<ModernDashboard />} />
                <Route path="fee-management" element={<FeeManagement onBack={() => window.history.back()} />} />
                <Route path="assessments" element={<Assessments />} />
                <Route path="staff-attendance" element={<AdminAttendance />} />
                <Route path="parents" element={<ParentManagement />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="schoolmanagement" element={<SchoolManagement/>} />

                {/* ── Fallback ── */}
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </AdminRoute>
        }
      />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BlogProvider>
          <SchoolSettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <NavigationSpinner />
                <AppRoutes />
                <AIAssistant />
                <CookieBanner />
              </BrowserRouter>
            </TooltipProvider>
          </SchoolSettingsProvider>
        </BlogProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);


export default App;