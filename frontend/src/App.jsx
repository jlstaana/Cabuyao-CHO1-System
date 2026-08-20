import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import useThemeStore from './store/useThemeStore';

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
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const TeleconsultationRoom = lazy(() => import('./pages/dashboard/TeleconsultationRoom'));
const Medicines = lazy(() => import('./pages/dashboard/Medicines'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const MedicalImages = lazy(() => import('./pages/dashboard/MedicalImages'));
const ConsultationHistory = lazy(() => import('./pages/dashboard/ConsultationHistory'));
const PatientRecords = lazy(() => import('./pages/dashboard/PatientRecords'));
const ActivityLogs = lazy(() => import('./pages/dashboard/ActivityLogs'));

// Loading fallback spinner
const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
  </div>
);

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

            {/* Standalone Room Route for Full-Screen Experience */}
            <Route path="/room/:id" element={<TeleconsultationRoom />} />

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/users" element={<ManageUsers />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/medical-images" element={<MedicalImages />} />
              <Route path="/consultation-history" element={<ConsultationHistory />} />
              <Route path="/patient-records" element={<PatientRecords />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
