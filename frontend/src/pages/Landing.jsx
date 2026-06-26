import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  FileText,
  HeartPulse,
  ImagePlus,
  LockKeyhole,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
} from 'lucide-react';
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

const portalStats = [
  { value: 'Quick access', label: 'Request consultations with less waiting' },
  { value: 'Private', label: 'Secure handling of your medical details' },
  { value: 'Local', label: 'Supported by your Cabuyao health team' },
];

const services = [
  {
    icon: Video,
    title: 'Patient-friendly consultations',
    description: 'Describe your symptoms, upload images, and request care from CHO-I professionals online.',
  },
  {
    icon: FileText,
    title: 'Digital medication support',
    description: 'Receive prescriptions online and keep your medication history easy to review.',
  },
  {
    icon: HeartPulse,
    title: 'Health tracking made simple',
    description: 'Log vital signs and recent health information to help your care team make better recommendations.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure record access',
    description: 'Your personal health details are stored safely and shared only with authorized CHO-I staff.',
  },
];
const workflow = [
  'Create a patient account or sign in securely.',
  'Enter your symptoms, preferred schedule, and any health details.',
  'Review your consultation response, follow-up care, and prescriptions online.',
];

const roleHighlights = [
  {
    icon: Users,
    title: 'Easy online access',
    details: 'Start your request from home, and keep important care information in one place.',
  },
  {
    icon: Stethoscope,
    title: 'Clear next steps',
    details: 'Receive consultation updates, treatment advice, and prescriptions through the portal.',
  },
  {
    icon: ShieldCheck,
    title: 'Protected health data',
    details: 'Your details remain private and are only shared with authorized CHO-I clinicians.',
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <SEO title="Home" description="Welcome to the Cabuyao City Health Office Portal" />
      <div className="absolute inset-x-0 top-0 h-screen pointer-events-none">
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
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40 md:via-white/80 md:to-white/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/80 via-white/20 to-slate-50" />
      </div>

      <nav className="container relative z-10 mx-auto flex items-center justify-between px-6 py-4">
        <CHOLogo />
        <div className="flex items-center gap-3">
          <Link to="/login" className="font-medium text-slate-600 transition-colors hover:text-sky-600">Login</Link>
          <Link to="/register" className="rounded-full bg-sky-500 px-5 py-2 font-medium text-white shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-600">Register</Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="container mx-auto flex min-h-[calc(100vh-72px)] flex-col justify-center px-6 pb-16 pt-16 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-8 md:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm backdrop-blur">
              <ShieldCheck size={16} />
              Cabuyao Health Office Portal
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl font-bold leading-tight text-slate-950 md:text-6xl">
                Care that begins <br />
                <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">with your needs.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Book online consultations, share vital details, and receive follow-up care from your local CHO-I team through a secure patient portal designed for convenience and trust.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 font-medium text-white shadow-xl transition-colors hover:bg-slate-800">
                <Users size={18} />
                Get Started
              </Link>
            </div>
            <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {portalStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-2xl font-black text-sky-600">{stat.value}</p>
                  <p className="mt-1 text-sm font-medium leading-snug text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block md:w-1/2" aria-hidden="true" />
        </section>

        <section className="bg-white py-16">
          <div className="container mx-auto px-6">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-bold uppercase text-sky-600">What patients receive</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">A patient portal designed for clarity and convenience</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Use the portal to request care online, review your treatment details, and keep personal health records accessible in one trusted place.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <article key={service.title} className="rounded-lg border border-slate-100 bg-slate-50 p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <service.icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="container mx-auto grid gap-10 px-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase text-sky-600">How It Works</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">A simple path from request to follow-up</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Start your health journey online, share a symptom summary, and receive clear follow-up information from your CHO-I care team without unnecessary delays.
              </p>
            </div>
            <div className="space-y-4">
              {workflow.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-base font-medium leading-7 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="container mx-auto px-6">
            <div className="mb-8 max-w-3xl">
              <p className="text-sm font-bold uppercase text-sky-600">Why choose Cabuyao CHO-I</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Patient-first features that make care easier</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                The portal helps you start consultations with confidence, access follow-up guidance quickly, and keep your health information protected.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {roleHighlights.map((role) => (
                <article key={role.title} className="rounded-lg border border-slate-100 p-6 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <role.icon size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">{role.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{role.details}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-sky-600 py-14 text-white">
          <div className="container mx-auto grid gap-8 px-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-sky-100">Secure Digital Care</p>
              <h2 className="mt-2 text-3xl font-bold">Ready to take the next step in your care?</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-sky-50">
                Sign up today to explore telehealth services, keep your health records in one place, and receive timely guidance from Cabuyao City Health Office professionals.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-sky-700 transition-colors hover:bg-sky-50">
                <CalendarCheck size={18} />
                Register Now
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 px-6 py-3 font-semibold text-white transition-colors hover:bg-sky-500">
                <Pill size={18} />
                Access Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
