import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import SEO from '../components/SEO';
import CHOLogo from '../components/CHOLogo';
import landingTeleconsultBg from '../assets/landing-teleconsult-bg.png';
import landingTeleconsultMobile from '../assets/landing-teleconsult-mobile.png';
import landingEPrescriptionBg from '../assets/landing-eprescription-bg.png';
import useThemeStore from '../store/useThemeStore';
import { Sun, Moon } from 'lucide-react';

const authSlides = [
  landingTeleconsultBg,
  landingTeleconsultMobile,
  landingEPrescriptionBg,
];

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();

  const getSeoTitle = () => {
    if (location.pathname.includes('/login')) return 'Login';
    if (location.pathname.includes('/register')) return 'Register';
    return 'Authentication';
  };
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen bg-background p-4 lg:p-6 transition-colors duration-300">
      <SEO title={getSeoTitle()} />
      <div className="absolute top-6 right-6 lg:top-8 lg:right-10 z-50">
        <button
          onClick={toggleTheme}
          className="p-2 text-text-light hover:text-sky-500 hover:bg-surface-hover rounded-full transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-32px)] max-w-7xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-slate-200/80 dark:shadow-none lg:min-h-[calc(100vh-48px)] lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-sky-900 lg:block">
          {authSlides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt=""
              aria-hidden="true"
              className="auth-bg-slide"
              style={{ animationDelay: `${index * 6}s` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/85 via-sky-900/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-sky-950/30" />
          <div className="absolute left-8 top-8">
            <CHOLogo light />
          </div>
          <div className="absolute bottom-10 left-8 right-8 max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Cabuyao CHO-I Portal</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-white">Digital care access for local families.</h1>
            <p className="mt-4 text-base leading-7 text-sky-50/90">
              Teleconsultations, digital prescriptions, and secure records in one connected health service.
            </p>
          </div>
        </section>

        <section className="flex min-h-full flex-col relative z-10">
          <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:hidden">
            <CHOLogo light={theme === 'dark'} />
          </div>
          <div className="flex flex-1 items-center justify-center overflow-y-auto p-6 sm:p-8">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
