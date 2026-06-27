import { Link } from 'react-router-dom';
import choLogo from '../assets/CHO1-Logo.png';

export default function CHOLogo({ to = '/', light = false, compact = false }) {
  return (
    <Link to={to} className="flex items-center gap-3">
      <span className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border shadow-sm ${
        light
          ? 'border-white/30 bg-surface'
          : 'border-sky-100 bg-surface'
      }`}>
        <img
          src={choLogo}
          alt="CHO-I Cabuyao logo"
          className="h-full w-full object-contain p-0.5"
        />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-lg font-black tracking-tight ${light ? 'text-white' : 'text-text'}`}>
            CHO-I
          </span>
          <span className={`block text-xs font-semibold uppercase tracking-wider ${light ? 'text-sky-100' : 'text-primary-text'}`}>
            Cabuyao
          </span>
        </span>
      )}
    </Link>
  );
}
