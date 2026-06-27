import { Link } from 'react-router-dom';
import { Clock, ExternalLink, HeartPulse, MapPin, Phone, ShieldCheck } from 'lucide-react';

const choImageUrl = 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?cb_client=maps_sv.tactile.gps&h=300&panoid=49-fPsmDpzFK2lmfKnjRZQ&pitch=0&thumbfov=100&w=480&yaw=89.954445';

export default function Footer({ className = '' }) {
  return (
    <footer className={`border-t border-border bg-slate-950 text-text-light opacity-60 ${className}`}>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-7 lg:grid-cols-[1.15fr_1fr_0.9fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/30">
            <div className="relative h-24 md:h-28">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-900 via-slate-900 to-emerald-900" />
              <img
                src={choImageUrl}
                alt="City Health Office-1 Cabuyao"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/10 px-3 py-1 text-xs font-semibold text-sky-100 backdrop-blur">
                  <HeartPulse size={14} />
                  CHO-1 Cabuyao
                </div>
                <h2 className="text-xl font-bold text-white">Cabuyao City Health Office</h2>
                <p className="mt-1 text-sm text-slate-200">Telehealth services, patient records, and digital care coordination.</p>
              </div>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-text-light">
            A local digital health portal built to support secure consultations, prescriptions, records, and public health workflows for Cabuyao residents.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Office Details</h3>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-sky-400" />
              <div>
                <p className="font-semibold text-slate-100">City Health Office-1</p>
                <p className="mt-1 leading-relaxed text-text-light">F.B. Bailon St., Brgy. Sala, Cabuyao City, 4025 Laguna, Philippines</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-sky-400" />
              <div>
                <p className="font-semibold text-slate-100">Contact Numbers</p>
                <p className="mt-1 text-text-light">(049) 531-1153</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="mt-0.5 shrink-0 text-sky-400" />
              <div>
                <p className="font-semibold text-slate-100">Service Access</p>
                <p className="mt-1 text-text-light">Online portal access is available for registered patients and authorized CHO staff.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Portal</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            <Link to="/" className="font-medium text-text-light opacity-60 transition-colors hover:text-sky-300">Home</Link>
            <Link to="/login" className="font-medium text-text-light opacity-60 transition-colors hover:text-sky-300">Login</Link>
            <Link to="/register" className="font-medium text-text-light opacity-60 transition-colors hover:text-sky-300">Register</Link>
            <Link to="/dashboard" className="font-medium text-text-light opacity-60 transition-colors hover:text-sky-300">Dashboard</Link>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-surface/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck size={17} className="text-emerald-400" />
              Secure Health Records
            </div>
            <p className="mt-2 text-sm leading-6 text-text-light">
              Patient information is handled through authenticated access for privacy-focused care delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-3">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-xs text-text-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Cabuyao City Health Office. All rights reserved.</span>
          <a
            href="https://www.google.com/maps/search/?api=1&query=City+Health+Office-1+F.B.+Bailon+St+Cabuyao"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-text-light transition-colors hover:text-sky-300"
          >
            View CHO-1 Cabuyao on Map
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}
