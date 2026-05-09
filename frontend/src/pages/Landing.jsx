import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <SEO title="Home" description="Welcome to the Cabuyao City Health Office Portal" />
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-sky-600 tracking-tighter">Cabuyao<span className="text-slate-800">CHO</span></h1>
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 font-medium hover:text-sky-600 transition-colors">Login</Link>
          <Link to="/register" className="bg-sky-500 text-white px-5 py-2 rounded-full font-medium shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all transform hover:-translate-y-0.5">Register</Link>
        </div>
      </nav>
      <main className="container mx-auto px-6 pt-24 pb-12 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
            Modern Healthcare <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">at Your Fingertips.</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
            Access teleconsultations, digital prescriptions, and secure health records seamlessly through the Cabuyao City Health Office Portal.
          </p>
          <div className="flex gap-4">
            <Link to="/register" className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-xl">Get Started</Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-200 to-indigo-200 rounded-[3rem] rotate-3 scale-105 opacity-50 blur-2xl"></div>
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl relative border border-white/50 backdrop-blur-sm">
             <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-sky-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-sm font-semibold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">Doctor Available</div>
             </div>
             <div className="space-y-4">
                <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                <div className="h-4 bg-slate-100 rounded-full w-5/6"></div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
