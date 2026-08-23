import {
  Home, HeartPulse, Folder, Stethoscope, Clock, FileText, ClipboardList, Pill, Users, BarChart2, ShieldCheck
} from 'lucide-react';

export function buildNavGroups(role) {
  // ── Patient ──────────────────────────────────────────────────────────────
  if (role === 'Patient') {
    return [
      {
        label: 'My Health',
        links: [
          { path: '/dashboard',            label: 'Overview',            icon: Home },
          { path: '/medical-images',       label: 'Medical Documents',      icon: Folder },
        ],
      },
      {
        label: 'Consultations',
        links: [
          { path: '/consultations',        label: 'Request Teleconsult',   icon: Stethoscope },
          { path: '/consultation-history', label: 'Consultation History',  icon: Clock },
        ],
      },
      {
        label: 'Prescriptions',
        links: [
          { path: '/prescriptions',        label: 'My Prescriptions',      icon: FileText },
        ],
      },
    ];
  }

  // ── Doctor ───────────────────────────────────────────────────────────────
  if (role === 'Doctor') {
    return [
      {
        label: 'Dashboard',
        links: [
          { path: '/dashboard',     label: 'Overview',               icon: Home },
        ],
      },
      {
        label: 'Consultations',
        links: [
          { path: '/consultations',  label: 'Consultation Queue',      icon: Stethoscope },
          { path: '/patient-records', label: 'Patient Records',        icon: ClipboardList },
        ],
      },
      {
        label: 'Prescriptions',
        links: [
          { path: '/prescriptions', label: 'Create E-Prescription',   icon: FileText },
          { path: '/medicines',     label: 'Medicine Database',       icon: Pill },
        ],
      },
    ];
  }

  // ── Admin / Health Officer ────────────────────────────────────────────────
  if (role === 'Admin') {
    return [
      {
        label: 'Overview',
        links: [
          { path: '/dashboard',     label: 'Dashboard',              icon: Home },
        ],
      },
      {
        label: 'Patient Records',
        links: [
          { path: '/consultations', label: 'View Patient Records',   icon: ClipboardList },
        ],
      },
      {
        label: 'Account Management',
        links: [
          { path: '/users',         label: 'Manage Users',           icon: Users },
        ],
      },
      {
        label: 'Medicine Database',
        links: [
          { path: '/medicines',     label: 'Medicine List',          icon: Pill },
        ],
      },
      {
        label: 'Reports & Logs',
        links: [
          { path: '/analytics',      label: 'Analytics & Reports',  icon: BarChart2   },
          { path: '/activity-logs',  label: 'Activity Logs',        icon: ShieldCheck },
        ],
      },
    ];
  }

  // ── Staff (fallback) ─────────────────────────────────────────────────────
  return [
    {
      label: 'Menu',
      links: [
        { path: '/dashboard',     label: 'Overview',          icon: Home },
        { path: '/consultations', label: 'Consultations',     icon: Stethoscope },
        { path: '/prescriptions', label: 'E-Prescriptions',  icon: FileText },
        { path: '/medicines',     label: 'Medicine List',     icon: Pill },
        { path: '/users',         label: 'Manage Users',      icon: Users },
        { path: '/activity-logs', label: 'Activity Logs',       icon: ShieldCheck },
      ],
    },
  ];
}
