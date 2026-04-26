import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import {Home} from '@/pages/Home';
import { About } from '@/pages/About';
import { Features } from '@/pages/Features';
import { Pricing } from '@/pages/Pricing';
import { Contact } from '@/pages/Contact';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { QBank } from '@/pages/QBank'; 
import { Notes } from '@/pages/Notes'; 

const PublicLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Add a wrapper for auth routes to redirect if already logged in
const AuthRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

          {/* Auth Routes (No Layout) */}
          <Route path="/login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          <Route path="/register" element={
            <AuthRoute>
              <Register />
            </AuthRoute>
          } />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/qbank" element={<QBank />} />
            <Route path="/notes" element={<Notes />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
