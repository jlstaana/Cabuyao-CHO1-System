import { Outlet } from 'react-router-dom';
import CHOLogo from '../components/CHOLogo';
import landingTeleconsultBg from '../assets/landing-teleconsult-bg.png';
import landingTeleconsultMobile from '../assets/landing-teleconsult-mobile.png';
import landingEPrescriptionBg from '../assets/landing-eprescription-bg.png';

const authSlides = [
  landingTeleconsultBg,
  landingTeleconsultMobile,
  landingEPrescriptionBg,
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-32px)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80 lg:min-h-[calc(100vh-48px)] lg:grid-cols-2">
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

        <section className="flex min-h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 lg:hidden">
            <CHOLogo />
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
