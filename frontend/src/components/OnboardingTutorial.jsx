import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  HelpCircle,
  LockKeyhole,
  Menu,
  MousePointerClick,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { buildNavGroups } from '../utils/navigation';

const roleNavSteps = {
  Patient: [
    {
      selector: '[data-tour="nav-vitals"]',
      title: 'Record Vital Signs',
      icon: HeartPulse,
      body: 'Log your latest blood pressure, temperature, and pulse here so your CHO1 doctor can review them before your teleconsult.',
      action: 'Click this when you need to add a new vital sign record.',
    },
    {
      selector: '[data-tour="nav-medical-images"]',
      title: 'Upload Medical Images',
      icon: FileText,
      body: 'Upload your lab results, X-rays, or photos of your condition for your doctor to evaluate.',
      action: 'Keep uploads related to your teleconsultation or health record.',
    },
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'Request Teleconsult',
      icon: Stethoscope,
      body: 'Book a virtual appointment with a Cabuyao CHO1 doctor from the comfort of your home.',
      action: 'After submitting, return here to check your appointment status.',
    },
    {
      selector: '[data-tour="nav-consultation-history"]',
      title: 'Consultation History',
      icon: ClipboardList,
      body: 'Review the notes, diagnoses, and records from all your past CHO1 teleconsultations.',
      action: 'Use this to look up past medical advice from your doctors.',
    },
    {
      selector: '[data-tour="nav-prescriptions"]',
      title: 'My Prescriptions',
      icon: Pill,
      body: 'Download and view the official digital prescriptions issued by your CHO1 doctor.',
      action: 'Always follow the prescribed dosage, frequency, and instructions.',
    },
  ],
  Doctor: [
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'Consultation Queue',
      icon: Stethoscope,
      body: 'Review incoming CHO1 teleconsult requests, accept patient appointments, and start video calls.',
      action: 'Use this workspace to manage your daily appointments.',
    },
    {
      selector: '[data-tour="nav-patient-records"]',
      title: 'Patient Records',
      icon: ClipboardList,
      body: 'Access the secure CHO1 database to review patient medical histories, vital signs, and past visit notes.',
      action: 'Always review patient histories before finalizing clinical decisions.',
    },
    {
      selector: '[data-tour="nav-prescriptions"]',
      title: 'Create E-Prescription',
      icon: Pill,
      body: 'Issue digital prescriptions directly to patients after completing a teleconsultation.',
      action: 'Use the medicine database as a reference when writing prescriptions.',
    },
    {
      selector: '[data-tour="nav-medicines"]',
      title: 'Medicine Database',
      icon: FileText,
      body: 'Reference the official Cabuyao CHO1 medicine catalog when prescribing treatments to patients.',
      action: 'Search the catalog to select the correct dosage and medicine forms.',
    },
  ],
  Admin: [
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'View Patient Records',
      icon: ClipboardList,
      body: 'Monitor ongoing teleconsultations and oversee the delivery of telehealth services.',
      action: 'Access this for official CHO1 record audits and monitoring.',
    },
    {
      selector: '[data-tour="nav-users"]',
      title: 'Manage Users',
      icon: Users,
      body: 'Control system access. Create accounts for CHO1 doctors and staff, and assign visiting doctor privileges.',
      action: 'Ensure users are assigned the correct roles before sharing credentials.',
    },
    {
      selector: '[data-tour="nav-medicines"]',
      title: 'Medicine List',
      icon: Pill,
      body: 'Maintain the official list of medicines available for doctors to prescribe in the CHO1 system.',
      action: 'Keep the medication entries accurate and deactivate unavailable ones.',
    },
    {
      selector: '[data-tour="nav-analytics"]',
      title: 'Analytics & Reports',
      icon: ShieldCheck,
      body: 'Track CHO1 telehealth metrics, including consultation volumes and user activity, to optimize clinic operations.',
      action: 'Review these reports for data-driven clinic management.',
    },
  ],
  Staff: [
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'Consultations',
      icon: Stethoscope,
      body: 'Assist with scheduling and monitor the daily queue of CHO1 teleconsultations.',
      action: 'Use this to help coordinate patients and doctors effectively.',
    },
    {
      selector: '[data-tour="nav-prescriptions"]',
      title: 'E-Prescriptions',
      icon: Pill,
      body: 'Help manage and verify digital prescriptions issued by CHO1 doctors.',
      action: 'Only update clinical details if your authorized workflow allows it.',
    },
    {
      selector: '[data-tour="nav-medicines"]',
      title: 'Medicine List',
      icon: FileText,
      body: 'View the CHO1 medicine database used by doctors for their e-prescriptions.',
      action: 'Keep medication names, descriptions, and categories clean.',
    },
    {
      selector: '[data-tour="nav-users"]',
      title: 'Manage Users',
      icon: Users,
      body: 'Assist the Admin in managing accounts for CHO1 clinic staff and visiting doctors.',
      action: 'Verify account requests before granting system access.',
    },
  ],
};

const universalSteps = [
  {
    selector: '[data-tour="topbar"]',
    title: 'The CHO1 System top bar',
    icon: Sparkles,
    body: 'The top bar gives you quick access to teleconsult notifications, your profile, and system help.',
    action: 'When you need to jump to notifications or settings, look here.',
  },
  {
    selector: '[data-tour="sidebar-toggle"]',
    title: 'Toggle the main menu',
    icon: Menu,
    body: 'Need more screen space for medical records? Use this to hide or show the main menu.',
    action: 'Collapse the menu when viewing complex health charts.',
  },
  {
    selector: '[data-tour="sidebar"]',
    title: 'Navigate the CHO1 System',
    icon: MousePointerClick,
    body: 'This is where you will find your patients, consultations, and medical records depending on your access level.',
    action: 'Click any item to open that module.',
  },
  {
    selector: '[data-tour="role-badge"]',
    title: 'Your security clearance',
    icon: ShieldCheck,
    body: 'Security is key in healthcare. This badge confirms your access level in the CHO1 system.',
    action: 'Contact an Admin if you are missing access to specific clinic tools.',
  },
  {
    selector: '[data-tour="nav-dashboard"]',
    title: 'Start from the Dashboard',
    icon: Sparkles,
    body: 'The CHO1 Dashboard gives you a bird\'s-eye view of your active teleconsults and clinic tasks.',
    action: 'Return here to reset your bearings and see your overview.',
  },
  {
    selector: '[data-tour="main-content"]',
    title: 'Your central workspace',
    icon: ClipboardList,
    body: 'This is your main workspace where you will review patient records, write e-prescriptions, and manage health data.',
    action: 'Forms, patient tables, and reports will all load right here.',
  },
  {
    selector: '[data-tour="notifications"]',
    title: 'Telehealth Notifications',
    icon: Bell,
    body: 'Stay updated on incoming teleconsult requests, schedule changes, and newly issued prescriptions.',
    action: 'Always check the bell icon for unread patient updates.',
  },
  {
    selector: '[data-tour="profile"]',
    title: 'Your Account Profile',
    icon: UserCircle,
    body: 'Update your CHO1 credentials, personal details, and security settings here.',
    action: 'Be sure to keep your contact information up-to-date.',
  },
  {
    selector: '[data-tour="help"]',
    title: 'Need a refresher?',
    icon: HelpCircle,
    body: 'Need a refresher on how the CHO1 System works? Click here to restart this tutorial.',
    action: 'You can replay this guide anytime without affecting your account.',
  },
  {
    selector: '[data-tour="logout"]',
    title: 'Securely Sign Out',
    icon: LockKeyhole,
    body: 'Always sign out when leaving your workstation to protect patient privacy and health records.',
    action: 'This is especially critical when using shared clinic computers.',
  },
];

const pageGuides = {
  '/dashboard': {
    title: 'Dashboard Content',
    steps: [
      ['[data-tour="page-title"]', 'Workspace Title', Sparkles, 'Confirms which CHO1 workspace you are currently in.', 'Read this first so you know your context.'],
      ['[data-tour="page-stats"]', 'Telehealth Metrics', ClipboardList, 'A quick overview of today\'s teleconsults, active prescriptions, and patient metrics.', 'Scan these metrics to plan your daily tasks.'],
      ['[data-tour="page-list"]', 'Active Queue', Stethoscope, 'Your active queue. Check here for pending appointments or recent health records.', 'Click on pending items to continue the workflow.'],
      ['[data-tour="page-actions"]', 'Quick Actions', MousePointerClick, 'One-click shortcuts to start a teleconsult or access the medicine database.', 'Use these shortcuts to bypass the side menu.'],
    ],
  },
  '/consultations': {
    title: 'Consultations Page',
    steps: [
      ['[data-tour="page-title"]', 'Teleconsult Hub', Stethoscope, 'Your hub for managing Cabuyao CHO1 teleconsultations.', 'Start here to confirm you are in the correct schedule view.'],
      ['[data-tour="page-primary-action"]', 'Main Action', MousePointerClick, 'Click here to book a new appointment or set your clinic availability.', 'Use this button to initiate a new telehealth session.'],
      ['[data-tour="page-list"]', 'Appointment Queue', ClipboardList, 'The queue of patient appointments, complete with status and assigned doctors.', 'Review the status of each appointment before opening it.'],
      ['[data-tour="page-form"]', 'Clinical Forms', FileText, 'Fill out patient symptoms or clinical notes accurately for the health record.', 'Always double-check patient details before saving clinical notes.'],
    ],
  },
  '/prescriptions': {
    title: 'Prescriptions Page',
    steps: [
      ['[data-tour="page-title"]', 'Digital Prescriptions', Pill, 'The central hub for CHO1 digital prescriptions.', 'Patients can view instructions; doctors can manage issued medication.'],
      ['[data-tour="page-list"]', 'Prescription Log', FileText, 'A complete log of prescribed medications, dosages, and doctor instructions.', 'Click a record to view or download the full prescription details.'],
      ['[data-tour="page-form"]', 'Prescription Editor', Pill, 'Select from the CHO1 medicine catalog and add specific dosing instructions for the patient.', 'Ensure instructions are clear and accurate before saving.'],
    ],
  },
  '/profile': {
    title: 'Profile Page',
    steps: [
      ['[data-tour="page-title"]', 'Account Details', UserCircle, 'Manage your personal CHO1 account and system profile information.', 'Review your details to ensure they are accurate.'],
      ['[data-tour="page-form"]', 'Update Information', FileText, 'Use the form fields to review or update your allowed profile details.', 'Keep your clinic contact information current.'],
      ['[data-tour="page-primary-action"]', 'Security Settings', LockKeyhole, 'Click here to securely change your password.', 'Update your password immediately if your temporary credentials were shared.'],
    ],
  },
  '/medicines': {
    title: 'Medicine Database',
    steps: [
      ['[data-tour="page-title"]', 'CHO1 Medicine Catalog', Pill, 'The official Cabuyao CHO1 medicine registry used for all e-prescriptions.', 'Use this as your primary reference when prescribing medication.'],
      ['[data-tour="page-search"]', 'Find Medication', MousePointerClick, 'Quickly find a specific drug or category in the registry.', 'Searching is much faster than scrolling the entire list.'],
      ['[data-tour="page-list"]', 'Catalog Entries', ClipboardList, 'Review the available dosage forms and clinical notes for each medication.', 'Do not prescribe medications marked as inactive.'],
      ['[data-tour="page-primary-action"]', 'Add to Catalog', FileText, 'Register a new medication into the CHO1 catalog.', 'Ensure all added descriptions are factual and clinically accurate.'],
    ],
  },
  '/notifications': {
    title: 'Notifications Page',
    steps: [
      ['[data-tour="page-title"]', 'Update Center', Bell, 'All your teleconsultation and prescription updates gathered in one place.', 'Check here to catch up on any missed alerts.'],
      ['[data-tour="page-filters"]', 'Filter Alerts', MousePointerClick, 'Narrow down the list to see only prescriptions, consults, or unread system alerts.', 'Use filters to quickly find specific patient updates.'],
      ['[data-tour="page-list"]', 'Alert Details', ClipboardList, 'Click any notification to mark it as read and open the associated medical record.', 'Click the item to navigate directly to the task.'],
    ],
  },
  '/vitals': {
    title: 'Vital Signs Page',
    steps: [
      ['[data-tour="page-title"]', 'Health Measurements', HeartPulse, 'The dashboard for patient health metrics and vital signs.', 'Doctors use these baselines to make informed clinical decisions.'],
      ['[data-tour="page-form"]', 'Log New Vitals', FileText, 'Enter measurements such as blood pressure, heart rate, temperature, and oxygen levels.', 'Please enter accurate values to ensure proper care.'],
      ['[data-tour="page-list"]', 'Vitals History', ClipboardList, 'Track changes in your health metrics over time.', 'Doctors review this history during your teleconsult.'],
    ],
  },
  '/medical-images': {
    title: 'Medical Images Page',
    steps: [
      ['[data-tour="page-title"]', 'Patient Uploads', FileText, 'The secure portal for uploading X-rays, lab results, and medical photos.', 'Only upload files directly related to your teleconsultation.'],
      ['[data-tour="page-form"]', 'Upload New File', FileText, 'Select a file, add a clear description, and submit it for your doctor to review.', 'Ensure images are clear and readable before uploading.'],
      ['[data-tour="page-list"]', 'File Gallery', ClipboardList, 'A gallery of all uploaded documents and medical images.', 'Doctors can view or download these files during the appointment.'],
    ],
  },
  '/consultation-history': {
    title: 'Consultation History',
    steps: [
      ['[data-tour="page-title"]', 'Appointment Records', ClipboardList, 'Your complete archive of past and upcoming CHO1 teleconsultations.', 'Use this to review past medical advice and follow-up schedules.'],
      ['[data-tour="page-search"]', 'Search Records', MousePointerClick, 'Search by doctor name, diagnosis, or filter by the appointment status.', 'Quickly find a specific past consultation.'],
      ['[data-tour="page-list"]', 'History Log', FileText, 'Each entry displays the consultation details, status, and related notes.', 'Click on an entry to view the full clinical record.'],
    ],
  },
  '/patient-records': {
    title: 'Patient Records',
    steps: [
      ['[data-tour="page-title"]', 'Clinical Records', ClipboardList, 'The central database for patient histories, past consults, uploaded images, and vitals.', 'Always confirm the patient\'s identity before reviewing their record.'],
      ['[data-tour="page-search"]', 'Patient Lookup', MousePointerClick, 'Search the CHO1 database to find a patient by name or address.', 'Use the search bar to locate patients efficiently.'],
      ['[data-tour="page-list"]', 'Patient Files', Users, 'Expand a patient\'s card to access their complete medical history and allowed actions.', 'Only open records when required for care or administration.'],
      ['[data-tour="page-form"]', 'Update Record', FileText, 'Authorized staff can update patient demographics and record details.', 'Ensure all updates are accurate and factual.'],
    ],
  },
  '/users': {
    title: 'Account Management',
    steps: [
      ['[data-tour="page-title"]', 'System Access Control', Users, 'Control access to the CHO1 teleconsultation system.', 'Changes made here directly affect system security and privacy.'],
      ['[data-tour="page-primary-action"]', 'Onboard User', Users, 'Onboard new doctors, clinic staff, or grant temporary access to visiting physicians.', 'Double-check assigned roles before sharing login credentials.'],
      ['[data-tour="page-search"]', 'Find User', MousePointerClick, 'Search for a specific doctor or staff member quickly.', 'Search for the account before making any modifications.'],
      ['[data-tour="page-list"]', 'Account Registry', ClipboardList, 'Review account roles and statuses. Archive users who no longer need access.', 'Ensure you archive the correct account to prevent access issues.'],
    ],
  },
  '/analytics': {
    title: 'Analytics & Reports',
    steps: [
      ['[data-tour="page-title"]', 'Clinic Analytics', ShieldCheck, 'Comprehensive reports on CHO1 telehealth system activity and operations.', 'Use these insights to optimize clinic workflows and staffing.'],
      ['[data-tour="page-filters"]', 'Report Parameters', MousePointerClick, 'Adjust the date range and category to customize your data view.', 'Set your parameters before generating or exporting a report.'],
      ['[data-tour="page-stats"]', 'Data Visualization', ClipboardList, 'Charts and metrics showing teleconsult volumes, active prescriptions, and medicine usage.', 'Review these figures to understand overall clinic performance.'],
      ['[data-tour="page-primary-action"]', 'Export Data', FileText, 'Download or print the current report for your official records.', 'Ensure your filters are correct before exporting.'],
    ],
  },
  '/room': {
    title: 'Teleconsultation Room',
    steps: [
      ['[data-tour="page-video"]', 'Secure Video Feed', Stethoscope, 'Your private, secure video feed for the CHO1 teleconsultation.', 'This space is for the active face-to-face appointment.'],
      ['[data-tour="page-primary-action"]', 'Join Call', MousePointerClick, 'Click here to start your camera and microphone for the appointment.', 'Ensure you are in a quiet, private area before joining.'],
      ['[data-tour="page-actions"]', 'Call Controls', Bell, 'Mute your mic, turn off your camera, or securely end the health consultation.', 'Only click "End Call" when the clinical session is fully completed.'],
      ['[data-tour="page-form"]', 'Live Vitals Panel', HeartPulse, 'Real-time vital signs shared between the patient and the CHO1 doctor.', 'Doctors use these live metrics to support their diagnosis.'],
      ['[data-tour="page-chat"]', 'Secure Chat', FileText, 'Use this secure text chat for sending links, spelling out medicine names, or quick notes.', 'Keep chat messages directly related to the consultation.'],
      ['[data-tour="page-list"]', 'Medical Documents', ClipboardList, 'Instantly review patient-uploaded lab results and X-rays during the call.', 'Open these files to view the patient\'s supporting health documents.'],
      ['[data-tour="page-prescription"]', 'Finalize E-Prescription', Pill, 'Doctors finalize their clinical diagnosis and issue the e-prescription before ending the call.', 'Double-check medication dosages before submitting the prescription.'],
    ],
  },
};

function normalizePath(pathname = '') {
  if (pathname.startsWith('/room/')) return '/room';
  return pathname;
}

function makePageStep([selector, title, icon, body, action], pageTitle, path) {
  return { selector, title, icon, body, action, section: pageTitle, path };
}

function buildSteps(role) {
  const navGroups = buildNavGroups(role);
  const accessiblePaths = navGroups.flatMap(group => group.links.map(link => link.path));
  
  const paths = [...accessiblePaths, '/profile', '/notifications'];
  const allSteps = [];

  universalSteps.forEach(step => {
    if (role === 'Patient' && step.selector === '[data-tour="role-badge"]') return;
    allSteps.push({ ...step, path: '/dashboard', section: 'System Basics' });
  });

  const navSteps = roleNavSteps[role] || roleNavSteps.Staff;
  
  navSteps.forEach(step => {
    const match = step.selector.match(/nav-([^"]+)/);
    if (match) {
      const implicitPath = `/${match[1]}`;
      if (accessiblePaths.includes(implicitPath)) {
         allSteps.push({ ...step, path: '/dashboard', section: 'Navigation Menu' });
      }
    } else {
      allSteps.push({ ...step, path: '/dashboard', section: 'Navigation Menu' });
    }
  });

  paths.forEach(path => {
    const guide = pageGuides[path];
    if (guide) {
      guide.steps.forEach(stepArr => {
        allSteps.push(makePageStep(stepArr, guide.title, path));
      });
    }
  });

  return allSteps;
}

function getPlacement(rect) {
  const margin = 18;
  const cardWidth = Math.min(360, window.innerWidth - 32);
  const placeRight = rect.right + cardWidth + margin < window.innerWidth;
  const placeLeft = rect.left - cardWidth - margin > 0;
  const top = Math.min(Math.max(rect.top, 16), window.innerHeight - 280);

  if (placeRight) return { top, left: rect.right + margin };
  if (placeLeft) return { top, left: rect.left - cardWidth - margin };
  return {
    top: rect.bottom + 260 < window.innerHeight ? rect.bottom + margin : Math.max(16, rect.top - 260),
    left: Math.min(Math.max(16, rect.left), window.innerWidth - cardWidth - 16),
  };
}

export default function OnboardingTutorial({ user, pathname, navigate, open, forced = false, onClose, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const steps = useMemo(() => buildSteps(user?.role), [user?.role]);
  const activeStep = steps[stepIndex];
  const Icon = activeStep?.icon || HelpCircle;
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!open || !activeStep) return undefined;

    let attempts = 0;
    let timeoutId;

    const updateTarget = () => {
      const candidates = Array.from(document.querySelectorAll(activeStep.selector));
      const target = candidates.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!target) {
        setTargetRect(null);
        if (attempts < 10) {
          attempts++;
          timeoutId = setTimeout(updateTarget, 100);
        }
        return;
      }

      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      timeoutId = window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        });
      }, 180);
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [activeStep, open]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setStepIndex(0);
  }

  useEffect(() => {
    if (open && activeStep?.path && activeStep.path !== normalizePath(pathname)) {
      navigate(activeStep.path);
    }
  }, [activeStep, pathname, navigate, open]);

  if (!open || !user || !activeStep) return null;

  const finish = async () => {
    setSaving(true);
    try {
      await onComplete?.();
      setStepIndex(0);
    } finally {
      setSaving(false);
    }
  };

  const closeReplay = () => {
    setStepIndex(0);
    onClose?.();
  };

  const goBack = () => setStepIndex((current) => Math.max(0, current - 1));
  const goNext = () => setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  const highlight = targetRect ? {
    top: targetRect.top - 8,
    left: targetRect.left - 8,
    width: targetRect.width + 16,
    height: targetRect.height + 16,
  } : null;
  const cardPosition = targetRect ? getPlacement(targetRect) : {
    top: Math.max(24, window.innerHeight / 2 - 160),
    left: Math.max(16, window.innerWidth / 2 - 180),
  };

  return (
    <div className="fixed inset-0 z-50">
      {!highlight && <div className="absolute inset-0 bg-slate-950/70" />}

      {highlight && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-sky-300 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.68),0_0_0_8px_rgba(125,211,252,0.25)] transition-all duration-200"
          style={highlight}
        />
      )}

      <div
        className="absolute w-[calc(100vw-32px)] max-w-[360px] rounded-2xl bg-surface shadow-2xl transition-all duration-200"
        style={cardPosition}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Icon size={23} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-primary-text">
                {isLastStep ? 'Last Step' : `Step: ${stepIndex + 1}`} · {activeStep.section || 'System guide'}
              </p>
              <h2 className="text-lg font-bold leading-tight text-text">{activeStep.title}</h2>
            </div>
          </div>

          {!forced && (
            <button
              type="button"
              onClick={closeReplay}
              className="rounded-full p-2 text-text-light transition-colors hover:bg-surface-hover hover:text-text-muted"
              aria-label="Close tutorial"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-6 text-text-muted">{activeStep.body}</p>
          <div className="mt-4 rounded-xl border border-sky-100 bg-primary-bg p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-text">What to do</p>
            <p className="mt-1 text-sm leading-5 text-sky-900">{activeStep.action}</p>
          </div>

          {!targetRect && (
            <div className="mt-3 rounded-xl border border-warning-border bg-warning-bg p-3 text-sm text-amber-800">
              This part may be hidden on your screen. Open the menu or return to the dashboard, then continue.
            </div>
          )}

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-hover/50">
            <div className="h-full bg-sky-600 transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-wait disabled:opacity-70"
              >
                <CheckCircle2 size={16} />
                {saving ? 'Saving...' : 'Finish'}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

