import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AIAssistant from "@/components/ai-assistant/AIAssistant";
import ScrollToTop from "@/components/ScrollToTop";
import CookieBanner from "@/components/CookieBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import GlobalSkeletonLoader from "@/components/GlobalSkeletonLoader";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import ContactPage from './pages/website-pages/Contact';

// Public Pages
import HomePage from "@/pages/website-pages/HomePage";
import AboutPage from "@/pages/website-pages/AboutPage";
import SupportPage from "@/pages/website-pages/SupportPage";
import PrivacyPage from "@/pages/website-pages/PrivacyPage";
import CBCStandardsPage from "@/pages/website-pages/CBCStandardsPage";
import TermsPage from "@/pages/website-pages/TermsPage";
import SecurityPage from "@/pages/website-pages/SecurityPage";
import LoginPage from "@/pages/auth/LoginPage";
import GetStartedPage from "@/pages/website-pages/signup";
import Analytics from "@/pages/website-pages/Platform";
import TeamMmembersPage from '@/pages/website-pages/TeamPage';
import ClientsPage from '@/pages/website-pages/ClientsPage';
import Feature from "@/pages/website-pages/Features";

// Admin Registration
import SchoolRegistration from "@/pages/admin-registration/SchoolRegistration";

// Student Pages
import LearningMaterials from "@/pages/student/LearningMaterials";
import Grade1 from "@/pages/student/Grade1";
import Grade2 from "@/pages/student/Grade2";

// Teacher Pages
import TeachingResources from "@/pages/teacher/TeachingResources";
import Teacher from "./pages/teacher/TeacherProfile";
import AdminStaff from "./pages/teacher/StaffList";
import StaffManagement from "./pages/teacher/StaffManagement";
// Layouts
import DashboardLayout from "@/components/layout/DashboardLayout";

// School Admin Pages
import  DashboardWidgets  from "./pages/school-admin/learners/DashboardWidgets";
import TeachersListPage from "@/pages/auth/school-admin/teachers/TeachersList";
import AddTeacherPage from "@/pages/auth/school-admin/teachers/AddTeacher";
import LearnersListPage from "@/pages/auth/school-admin/learners/LearnersList";
import AddLearnerPage from "@/pages/auth/school-admin/learners/AddLearner";
import StudentDetails from "./pages/school-admin/learners/AddLearner";
import FeeManagement from "./pages/school-admin/learners/FeesManagent/FeeManagement";
import Student from "./pages/school-admin/learners/LearnerProfile";
import Assessments from "./pages/school-admin/Assessment";
import AdminAttendance from "./pages/teacher/StaffAttendance";

// ✅ Student Management Page
import StudentManagement from "./pages/school-admin/learners/Learners";
import StudentClasses from "./pages/school-admin/learners/StudentClasses";

import EducationalResourcesPage from "./pages/website-pages/Educationalresourcespage";
import AdminLoginPage from '@/pages/auth/AdminLoginPage';
import UserManagement from "./pages/Users/UserManagement";
import ModernDashboard from "@/components/ModernDashboard";

// Department Pages
import DepartmentsPage from "@/pages/auth/school-admin/teachers/departments/DepartmentsPage";
import DepartmentDetailsPage from "@/pages/auth/school-admin/teachers/departments/DepartmentDetailsPage";

// Placeholder Pages
import CurriculumPage from "@/pages/auth/school-admin/Curriculum";
import ReportsPage from "@/pages/auth/school-admin/Reports";
import SettingsPage from "@/pages/auth/school-admin/Settings";

import NotFound from "./pages/website-pages/NotFound";
import EduStackPlatformPage from "@/pages/website-pages/Platform";
import TeamMembersPage from "@/pages/website-pages/TeamPage";

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
    if (user?.role === "school_admin") {
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

  if (!isAuthenticated || user?.role !== "school_admin") {
    return <Navigate to="/admin-login" replace />;
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
      <Route path="/analytics" element={<EduStackPlatformPage />} />
      <Route path="/company/client" element={<ClientsPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/company/our-team" element={<TeamMembersPage />} />
      <Route path="/cbc-standards" element={<CBCStandardsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/get-started" element={<GetStartedPage />} />
      <Route path="/signup" element={<GetStartedPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/features" element={<Feature />} />

      {/* ── Demo Routes ── */}
      <Route path="/dashboard-demo" element={<ModernDashboard />} />
      <Route path="/demo" element={<ModernDashboard />} />

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

      {/* ── Admin Registration ── */}
      <Route path="/admin/register-school" element={<SchoolRegistration />} />

      {/* ── Admin Login ── */}
      <Route path="/admin-login" element={<AdminLoginRedirect />} />

      {/* ── School Admin Routes (Protected) ── */}
      <Route
        path="/school-admin/*"
        element={
          <AdminRoute>
            <DashboardLayout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardWidgets/>} />

                {/* Teachers */}
                <Route path="teachers" element={<TeachersListPage />} />
                <Route path="teachers/add" element={<AddTeacherPage />} />
                <Route path="teachers/departments" element={<DepartmentsPage />} />
                <Route path="teachers/departments/:id" element={<DepartmentDetailsPage />} />
                <Route path="teacher-profile" element={<Teacher />} />
                 <Route path="teacher-list" element={<AdminStaff />} />
                  <Route path="staff-manage" element={<StaffManagement />} />

                {/* Learners */}
                <Route path="learners/all" element={<StudentManagement />} />
                <Route path="learners/classes" element={<StudentClasses />} />
                

                {/* ✅ Student Management — linked here */}
                <Route path="learners/manage" element={<StudentManagement />} />

                {/* Other Admin Pages */}
                <Route path="curriculum" element={<CurriculumPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="demo" element={<ModernDashboard />} />
                <Route path="learners/add" element={<StudentDetails />} />
                <Route path="learners/profile" element={<Student/>} />
                <Route path="fee-management/" element={<FeeManagement/>} />
                <Route path="assessments/" element={<Assessments/>} />
                 <Route path="staff-attendance/" element={<AdminAttendance/>} />
                {/* Fallback */}
                <Route path="" element={<Navigate to="dashboard" replace />} />
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

// ─── Admin Login Redirect Helper ──────────────────────────────────────────────
function AdminLoginRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated && user?.role === "school_admin") {
    return <Navigate to="/school-admin/dashboard" replace />;
  }

  return <AdminLoginPage />;
}

// ─── Root App ─────────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
            <AIAssistant />
            <CookieBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;