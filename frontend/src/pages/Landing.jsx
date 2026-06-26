import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import CHOLogo from '../components/CHOLogo';
import landingTeleconsultBg from '../assets/landing-teleconsult-bg.png';
import landingTeleconsultMobile from '../assets/landing-teleconsult-mobile.png';
import landingEPrescriptionBg from '../assets/landing-eprescription-bg.png';

const backgroundSlides = [
  landingTeleconsultBg,
  landingTeleconsultMobile,
  landingEPrescriptionBg,
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-50 flex flex-col">
      <SEO title="Home" description="Welcome to the Cabuyao City Health Office Portal" />
      <div className="absolute inset-0 min-h-screen pointer-events-none">
        {backgroundSlides.map((slide, index) => (
          <img
            key={slide}
            src={slide}
            alt=""
            aria-hidden="true"
            className="landing-bg-slide"
            style={{ animationDelay: `${index * 6}s` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/35 md:via-white/80 md:to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/80 via-white/10 to-white/95" />
      </div>
      <nav className="container relative z-10 mx-auto px-6 py-4 flex justify-between items-center">
        <CHOLogo />
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 font-medium hover:text-sky-600 transition-colors">Login</Link>
          <Link to="/register" className="bg-sky-500 text-white px-5 py-2 rounded-full font-medium shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all transform hover:-translate-y-0.5">Register</Link>
        </div>
      </nav>
      <main className="container relative z-10 mx-auto flex min-h-[calc(100vh-72px)] flex-col items-center justify-between px-6 pt-20 pb-16 md:flex-row">
        <div className="md:w-1/2 space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
            Modern Healthcare <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">at Your Fingertips.</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
            Access teleconsultations, digital prescriptions, and secure health records seamlessly through the Cabuyao City Health Office Portal.
          </p>
          <div className="max-w-xl rounded-lg border border-sky-200/80 bg-white/80 p-5 shadow-lg shadow-sky-100/60 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Assessment Access
            </p>
            <ul className="mt-3 space-y-2 text-base leading-relaxed text-slate-700">
              <li>All websites must be publicly accessible at all times to allow for proper assessment.</li>
              <li>Relevant pages must remain publicly accessible at all times for reviewers and evaluators.</li>
            </ul>
          </div>
          <div className="flex gap-4">
            <Link to="/register" className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-xl">Get Started</Link>
          </div>
        </div>
        <div className="hidden md:block md:w-1/2" aria-hidden="true" />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
