import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Eager load layout shells for immediate rendering without layout shift
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages for web optimization and code-splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const ManageUsers = lazy(() => import('./pages/dashboard/ManageUsers'));
const Consultations = lazy(() => import('./pages/dashboard/Consultations'));
const Prescriptions = lazy(() => import('./pages/dashboard/Prescriptions'));

// Loading fallback spinner
const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/users" element={<ManageUsers />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
