import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';

// Public pages
import { Home } from '@/pages/Home';
import { About } from '@/pages/About';
import { Features } from '@/pages/Features';
import { Pricing } from '@/pages/Pricing';
import { Contact } from '@/pages/Contact';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { RegistrationSuccess } from '@/pages/RegistrationSuccess';

// User dashboard pages
import { Dashboard } from '@/pages/Dashboard';
import { QBank } from '@/pages/Qbank';
import { Notes } from '@/pages/Notes';
import { Recall } from '@/pages/Recall';
import { MockExam } from '@/pages/MockExam';
import { MockExamSession } from '@/pages/MockExamSession';
import { MockExamResult } from '@/pages/MockExamResult';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminSubjects } from '@/pages/admin/AdminSubjects';
import { AdminQuestions } from '@/pages/admin/AdminQuestions';
import { AdminImportBatches } from '@/pages/admin/AdminImportBatches';
import { AdminMockTests } from '@/pages/admin/AdminMockTests';
import { AdminMockTestDetail } from '@/pages/admin/AdminMockTestDetail';
import { AdminCourses } from '@/pages/admin/AdminCourses';

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="grow">{children}</main>
    <Footer />
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return children;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

// Blocks right-click context menu across the entire app
const NoContextMenu = () => {
  useEffect(() => {
    const block = (e) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, []);
  return null;
};

export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <NoContextMenu />
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

        {/* Auth */}
        {/* Pre-registration launch: no Log In button links here any more, but the route
            stays reachable by direct URL so the team can still get into /admin, and so
            the 401 handler and ProtectedRoute have somewhere to redirect to. */}
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />

        {/* User dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qbank" element={<QBank />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/recall" element={<Recall />} />
          <Route path="/mock-exam" element={<MockExam />} />
          <Route path="/mock-exam/:testId/attempt/:attemptId" element={<MockExamSession />} />
          <Route path="/mock-exam/:testId/result/:attemptId"  element={<MockExamResult />} />
        </Route>

        {/* Admin panel — requires role=admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/questions" element={<AdminQuestions />} />
          <Route path="/admin/import-batches" element={<AdminImportBatches />} />
          <Route path="/admin/mock-tests" element={<AdminMockTests />} />
          <Route path="/admin/mock-tests/:id" element={<AdminMockTestDetail />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
