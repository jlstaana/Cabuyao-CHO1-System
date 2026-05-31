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

const roleNavSteps = {
  Patient: [
    {
      selector: '[data-tour="nav-vitals"]',
      title: 'Record Vital Signs',
      icon: HeartPulse,
      body: 'Use this before or during care requests to save blood pressure, temperature, pulse, respiration, oxygen level, height, and weight.',
      action: 'Click this when you need to add a new vital sign record.',
    },
    {
      selector: '[data-tour="nav-medical-images"]',
      title: 'Upload Medical Images',
      icon: FileText,
      body: 'This is where patients can attach lab results, referral slips, wound photos, or other files a doctor may need to review.',
      action: 'Keep uploads related to your consultation or health record.',
    },
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'Request Teleconsult',
      icon: Stethoscope,
      body: 'Start here when you want to request a teleconsultation. The page will guide you through symptoms, schedule, and consultation details.',
      action: 'After submitting, return here to check the request status.',
    },
    {
      selector: '[data-tour="nav-consultation-history"]',
      title: 'Consultation History',
      icon: ClipboardList,
      body: 'Completed and previous consultations are kept here so patients can review what happened and follow up when needed.',
      action: 'Use this when checking old appointments or care notes.',
    },
    {
      selector: '[data-tour="nav-prescriptions"]',
      title: 'My Prescriptions',
      icon: Pill,
      body: 'After a doctor creates an e-prescription, patients can view and download it here.',
      action: 'Always follow the doctor-written dosage, frequency, duration, and instructions.',
    },
  ],
  Doctor: [
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'Consultation Queue',
      icon: Stethoscope,
      body: 'This is the doctor workspace for reviewing incoming requests, patient symptoms, vitals, images, and appointment status.',
      action: 'Use it to accept, schedule, update, or enter active consultations.',
    },
    {
      selector: '[data-tour="nav-patient-records"]',
      title: 'Patient Records',
      icon: ClipboardList,
      body: 'Open this when you need patient history, previous visits, vital signs, uploaded files, and supporting care context.',
      action: 'Review records before finalizing clinical decisions.',
    },
    {
      selector: '[data-tour="nav-prescriptions"]',
      title: 'Create E-Prescription',
      icon: Pill,
      body: 'Doctors create prescriptions here after reviewing a consultation. Medicine, dosage, frequency, duration, and instructions are entered per patient.',
      action: 'Use the medicine database as reference, then write patient-specific instructions.',
    },
    {
      selector: '[data-tour="nav-medicines"]',
      title: 'Medicine Database',
      icon: FileText,
      body: 'This is a reference list for e-prescriptions, not office inventory. It contains medicine names, dosage forms, categories, and dosing notes.',
      action: 'Search here when choosing medicines for a prescription.',
    },
  ],
  Admin: [
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'View Patient Records',
      icon: ClipboardList,
      body: 'Admins can review patient-related consultation records for authorized monitoring and administrative support.',
      action: 'Use this for official CHO record workflows only.',
    },
    {
      selector: '[data-tour="nav-users"]',
      title: 'Manage Users',
      icon: Users,
      body: 'Create doctor and staff accounts, reactivate users, and archive accounts that should no longer access the system.',
      action: 'Give users the correct role before sharing credentials.',
    },
    {
      selector: '[data-tour="nav-medicines"]',
      title: 'Medicine List',
      icon: Pill,
      body: 'Maintain the medicine reference catalog doctors use when creating e-prescriptions.',
      action: 'Keep entries accurate and deactivate medicines that should not be selected.',
    },
    {
      selector: '[data-tour="nav-analytics"]',
      title: 'Analytics & Reports',
      icon: ShieldCheck,
      body: 'Use reports to review consultation volume, prescription activity, patient counts, and operational trends.',
      action: 'This helps admins monitor CHO telehealth activity.',
    },
  ],
  Staff: [
    {
      selector: '[data-tour="nav-consultations"]',
      title: 'Consultations',
      icon: Stethoscope,
      body: 'Staff can monitor requests, schedules, and consultation progress to support the clinic workflow.',
      action: 'Use this to keep patient and doctor coordination moving.',
    },
    {
      selector: '[data-tour="nav-prescriptions"]',
      title: 'E-Prescriptions',
      icon: Pill,
      body: 'This page supports prescription-related workflows and lets staff review authorized e-prescription information.',
      action: 'Do not change clinical details unless the workflow allows it.',
    },
    {
      selector: '[data-tour="nav-medicines"]',
      title: 'Medicine List',
      icon: FileText,
      body: 'This is the medicine reference database for prescriptions. It is not a stock or pharmacy inventory screen.',
      action: 'Keep names, forms, and descriptions clean for doctors.',
    },
    {
      selector: '[data-tour="nav-users"]',
      title: 'Manage Users',
      icon: Users,
      body: 'Staff can support assigned user account tasks depending on permissions.',
      action: 'Verify requests before making access changes.',
    },
  ],
};

const universalSteps = [
  {
    selector: '[data-tour="topbar"]',
    title: 'This top bar stays with you',
    icon: Sparkles,
    body: 'The top bar gives you the system logo, menu controls, notifications, tutorial help, and your profile shortcut.',
    action: 'When you feel lost, look here first.',
  },
  {
    selector: '[data-tour="sidebar-toggle"]',
    title: 'Open or collapse the menu',
    icon: Menu,
    body: 'This button controls the side menu. On smaller screens it opens the navigation drawer.',
    action: 'Use it whenever the menu is hidden or taking too much space.',
  },
  {
    selector: '[data-tour="sidebar"]',
    title: 'The sidebar is your map',
    icon: MousePointerClick,
    body: 'Every major part of the system is reached from this side menu. The choices change depending on your role.',
    action: 'Click a menu item to move to that part of the system.',
  },
  {
    selector: '[data-tour="role-badge"]',
    title: 'Your role controls access',
    icon: ShieldCheck,
    body: 'This badge shows the role you are currently using. Patients, doctors, staff, and admins see different tools.',
    action: 'If something is missing, your account role may not have permission for it.',
  },
  {
    selector: '[data-tour="nav-dashboard"]',
    title: 'Start from the dashboard',
    icon: Sparkles,
    body: 'The dashboard gives a quick overview of your current work, recent activity, and shortcuts.',
    action: 'Return here when you need to reset your bearings.',
  },
  {
    selector: '[data-tour="main-content"]',
    title: 'Pages open in this workspace',
    icon: ClipboardList,
    body: 'When you click a menu item, the page content changes here while the top bar and sidebar remain available.',
    action: 'Forms, tables, consultation details, and reports will appear in this main area.',
  },
  {
    selector: '[data-tour="notifications"]',
    title: 'Check notifications',
    icon: Bell,
    body: 'The bell shows unread consultation and prescription activity. A red badge means there are items you have not opened yet.',
    action: 'Open notifications after logging in or returning from a break.',
  },
  {
    selector: '[data-tour="profile"]',
    title: 'Open your profile',
    icon: UserCircle,
    body: 'Your profile is where you review account details and update your password.',
    action: 'First-time users should check their profile after the tour.',
  },
  {
    selector: '[data-tour="help"]',
    title: 'Replay this guide anytime',
    icon: HelpCircle,
    body: 'This help button starts the walkthrough again. It is useful for new users or anyone who needs a refresher.',
    action: 'You can rerun this guide without changing your account status.',
  },
  {
    selector: '[data-tour="logout"]',
    title: 'Sign out when finished',
    icon: LockKeyhole,
    body: 'Use Sign Out before leaving a shared or public device so patient information stays protected.',
    action: 'This is especially important for clinic workstations.',
  },
];

const pageGuides = {
  '/dashboard': {
    title: 'Dashboard Content',
    steps: [
      ['[data-tour="page-title"]', 'Page heading', Sparkles, 'The heading tells you which dashboard view you are currently using and summarizes what the page is for.', 'Read this first so you know where you are.'],
      ['[data-tour="page-stats"]', 'Summary cards', ClipboardList, 'These cards show the most important counts for your role, such as consultations, patients, prescriptions, or scheduled work.', 'Scan these cards at the start of your session.'],
      ['[data-tour="page-list"]', 'Recent or queued work', Stethoscope, 'This area shows work that may need attention, such as consultation queues or recent activity.', 'Open items here when you need to continue a workflow.'],
      ['[data-tour="page-actions"]', 'Quick actions', MousePointerClick, 'Quick actions are shortcuts to common pages so users do not need to hunt through the sidebar.', 'Use these when you already know what task you want to do.'],
    ],
  },
  '/consultations': {
    title: 'Consultations Page',
    steps: [
      ['[data-tour="page-title"]', 'Consultation purpose', Stethoscope, 'This heading explains whether the page is for requesting, reviewing, scheduling, or monitoring consultations for your role.', 'Start here to confirm you are on the correct consultation workspace.'],
      ['[data-tour="page-primary-action"]', 'Main consultation action', MousePointerClick, 'The primary button starts the most common consultation task, such as requesting a teleconsultation or setting availability.', 'Use this button when beginning a new consultation workflow.'],
      ['[data-tour="page-list"]', 'Consultation list', ClipboardList, 'Consultation cards or tables show patient, doctor, schedule, status, and available actions.', 'Review status before opening or updating any consultation.'],
      ['[data-tour="page-form"]', 'Consultation forms', FileText, 'When a modal or form opens, enter complete symptoms, schedule details, vitals, notes, or review information.', 'Save only after checking the patient and schedule details.'],
    ],
  },
  '/prescriptions': {
    title: 'Prescriptions Page',
    steps: [
      ['[data-tour="page-title"]', 'Prescription workspace', Pill, 'This page is where e-prescriptions are viewed, downloaded, created, or updated depending on your role.', 'Patients should read instructions carefully; doctors should confirm details before saving.'],
      ['[data-tour="page-list"]', 'Prescription records', FileText, 'Each record can show the consultation, patient, doctor, medicines, dosage, frequency, duration, and instructions.', 'Open or download the prescription when you need the full details.'],
      ['[data-tour="page-form"]', 'Prescription editor', Pill, 'Doctors use this form to select medicines and write patient-specific dosage instructions.', 'Use the medicine database as reference, then write the exact patient instructions.'],
    ],
  },
  '/profile': {
    title: 'Profile Page',
    steps: [
      ['[data-tour="page-title"]', 'Account profile', UserCircle, 'This page contains your personal account details and system profile information.', 'First-time users should review this page after the guided tour.'],
      ['[data-tour="page-form"]', 'Profile details form', FileText, 'Use the form fields to review or update information allowed for your account.', 'Keep contact and profile details current.'],
      ['[data-tour="page-primary-action"]', 'Change password', LockKeyhole, 'This button opens the password change form.', 'Use a strong password and update it immediately if credentials were shared during account creation.'],
    ],
  },
  '/medicines': {
    title: 'Medicine Database',
    steps: [
      ['[data-tour="page-title"]', 'Medicine reference catalog', Pill, 'This page lists medicines used for e-prescriptions. It is not pharmacy stock inventory.', 'Use this as a reference while preparing prescriptions.'],
      ['[data-tour="page-search"]', 'Search medicines', MousePointerClick, 'Search by medicine name or category to find entries quickly.', 'This is faster than scrolling through the whole catalog.'],
      ['[data-tour="page-list"]', 'Medicine list', ClipboardList, 'The list shows medicine name, category, dosage form, notes, and active status.', 'Inactive medicines should not be selected for new prescriptions.'],
      ['[data-tour="page-primary-action"]', 'Add medicine', FileText, 'Authorized users can add medicine reference entries for future e-prescriptions.', 'Keep descriptions factual and clinically useful.'],
    ],
  },
  '/notifications': {
    title: 'Notifications Page',
    steps: [
      ['[data-tour="page-title"]', 'Notification center', Bell, 'This page collects consultation and prescription updates so users can catch up quickly.', 'Check unread items first.'],
      ['[data-tour="page-filters"]', 'Notification filters', MousePointerClick, 'Filters help narrow the list by unread, consultation, prescription, account, or system items.', 'Use filters when the list is long.'],
      ['[data-tour="page-list"]', 'Notification list', ClipboardList, 'Click a notification to mark it read and open the related page.', 'Use Open details to continue the task.'],
    ],
  },
  '/vitals': {
    title: 'Vital Signs Page',
    steps: [
      ['[data-tour="page-title"]', 'Vital signs', HeartPulse, 'Patients record health measurements here so doctors can review important baseline information.', 'Record accurate values before a consultation when possible.'],
      ['[data-tour="page-form"]', 'Vital signs form', FileText, 'Enter measurements such as blood pressure, heart rate, temperature, oxygen, respiration, height, and weight.', 'Double-check units and values before saving.'],
      ['[data-tour="page-list"]', 'Vital sign history', ClipboardList, 'Previous entries appear here so users can track changes over time.', 'Doctors may use this history during consultation review.'],
    ],
  },
  '/medical-images': {
    title: 'Medical Images Page',
    steps: [
      ['[data-tour="page-title"]', 'Medical image uploads', FileText, 'Patients upload X-rays, lab results, and other medical documents here.', 'Upload only relevant health files.'],
      ['[data-tour="page-form"]', 'Upload form', FileText, 'Choose the file, add a clear label or note, and submit it for doctor review.', 'Use readable images and avoid duplicate uploads.'],
      ['[data-tour="page-list"]', 'Uploaded files', ClipboardList, 'Uploaded images and documents are listed here for review or download.', 'Check that the latest file appears after upload.'],
    ],
  },
  '/consultation-history': {
    title: 'Consultation History',
    steps: [
      ['[data-tour="page-title"]', 'History page', ClipboardList, 'This page keeps previous and upcoming consultation records in one place.', 'Use it when reviewing past care.'],
      ['[data-tour="page-search"]', 'Search and filter', MousePointerClick, 'Search by doctor, diagnosis, date, or filter by consultation status.', 'Filter first if you are looking for one specific appointment.'],
      ['[data-tour="page-list"]', 'History list', FileText, 'Each entry shows consultation details, status, and related actions.', 'Open the matching record when you need full details.'],
    ],
  },
  '/patient-records': {
    title: 'Patient Records',
    steps: [
      ['[data-tour="page-title"]', 'Patient records', ClipboardList, 'Doctors and authorized users review patient history, consultations, images, vitals, and notes here.', 'Confirm patient identity before reading or editing records.'],
      ['[data-tour="page-search"]', 'Find a patient', MousePointerClick, 'Use search to locate a patient by name or address.', 'Search before scrolling through many records.'],
      ['[data-tour="page-list"]', 'Record list', Users, 'Patient cards expand to show history, consultation details, and actions allowed by your role.', 'Expand a record only when needed for care or administration.'],
      ['[data-tour="page-form"]', 'Record update form', FileText, 'Authorized users can update permitted patient record fields in modal forms.', 'Write clear, factual updates.'],
    ],
  },
  '/users': {
    title: 'Account Management',
    steps: [
      ['[data-tour="page-title"]', 'User management', Users, 'Admins and staff manage authorized accounts from this page.', 'Use this page carefully because access changes affect system security.'],
      ['[data-tour="page-primary-action"]', 'Create account', Users, 'This button opens the account creation form for doctors, staff, or visiting access.', 'Assign the correct role and share temporary credentials securely.'],
      ['[data-tour="page-search"]', 'Search users', MousePointerClick, 'Search by name or email to find accounts quickly.', 'Use search before archiving or reactivating an account.'],
      ['[data-tour="page-list"]', 'User table', ClipboardList, 'The table shows account status, role, and available management actions.', 'Avoid archiving the wrong account by checking the row first.'],
    ],
  },
  '/analytics': {
    title: 'Analytics & Reports',
    steps: [
      ['[data-tour="page-title"]', 'Reports overview', ShieldCheck, 'This page summarizes system activity for monitoring and reporting.', 'Use it to understand service trends, not individual diagnosis decisions.'],
      ['[data-tour="page-filters"]', 'Report filters', MousePointerClick, 'Filters change the date range and category used by the report.', 'Adjust filters before exporting or printing.'],
      ['[data-tour="page-stats"]', 'Analytics cards and charts', ClipboardList, 'Cards, charts, and tables show consultation volume, statuses, top medicines, and logs.', 'Review the numbers before making administrative decisions.'],
      ['[data-tour="page-primary-action"]', 'Export report', FileText, 'Export or print actions generate a copy of the current report view.', 'Set filters first so the export matches your intended report.'],
    ],
  },
  '/room': {
    title: 'Teleconsultation Room',
    steps: [
      ['[data-tour="page-video"]', 'Video consultation area', Stethoscope, 'This is the live call area for teleconsultations. The session status and participant label appear at the top.', 'Use this space for the active patient-doctor consultation.'],
      ['[data-tour="page-primary-action"]', 'Join camera', MousePointerClick, 'This button starts or joins the camera session.', 'Check your camera and microphone before discussing health details.'],
      ['[data-tour="page-actions"]', 'Call controls', Bell, 'These buttons control microphone, camera, and ending the call.', 'Mute or disable camera when needed, and end the call only when the session is finished.'],
      ['[data-tour="page-form"]', 'Live vitals panel', HeartPulse, 'Patients can submit live vital signs here, while doctors can review submitted values.', 'Keep values accurate because they support care decisions.'],
      ['[data-tour="page-chat"]', 'Session chat', FileText, 'Use chat for short notes, clarifications, and written instructions during the consultation.', 'Keep messages clear and related to the consultation.'],
      ['[data-tour="page-list"]', 'Medical images panel', ClipboardList, 'Patients can access medical image upload from here, and doctors can review session-related files.', 'Use this when lab results or images are needed for care.'],
      ['[data-tour="page-prescription"]', 'Diagnosis and e-prescription', Pill, 'Doctors complete diagnosis notes and add prescription items here before closing the consultation.', 'Confirm medicine, dosage, frequency, duration, and instructions before completing.'],
    ],
  },
};

const rolePages = {
  Patient: ['/dashboard', '/vitals', '/medical-images', '/consultations', '/consultation-history', '/prescriptions'],
  Doctor: ['/dashboard', '/consultations', '/patient-records', '/prescriptions', '/medicines'],
  Admin: ['/dashboard', '/consultations', '/users', '/medicines', '/analytics'],
  Staff: ['/dashboard', '/consultations', '/prescriptions', '/medicines', '/users']
};

function normalizePath(pathname = '') {
  if (pathname.startsWith('/room/')) return '/room';
  return pathname;
}

function makePageStep([selector, title, icon, body, action], pageTitle, path) {
  return { selector, title, icon, body, action, section: pageTitle, path };
}

function buildSteps(role) {
  const paths = [...(rolePages[role] || rolePages.Staff), '/profile', '/notifications'];
  const allSteps = [];

  universalSteps.forEach(step => allSteps.push({ ...step, path: '/dashboard', section: 'System Basics' }));

  const navSteps = roleNavSteps[role] || roleNavSteps.Staff;
  navSteps.forEach(step => allSteps.push({ ...step, path: '/dashboard', section: 'Navigation Menu' }));

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

  useEffect(() => {
    if (!open) setStepIndex(0);
  }, [open]);

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
      <div className="absolute inset-0 bg-slate-950/70" />

      {highlight && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-sky-300 bg-white/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.68),0_0_0_8px_rgba(125,211,252,0.25)] transition-all duration-200"
          style={highlight}
        />
      )}

      <div
        className="absolute w-[calc(100vw-32px)] max-w-[360px] rounded-2xl bg-white shadow-2xl transition-all duration-200"
        style={cardPosition}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
              <Icon size={23} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                {isLastStep ? 'Last Step' : `Step: ${stepIndex + 1}`} · {activeStep.section || 'System guide'}
              </p>
              <h2 className="text-lg font-bold leading-tight text-slate-900">{activeStep.title}</h2>
            </div>
          </div>

          {!forced && (
            <button
              type="button"
              onClick={closeReplay}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close tutorial"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-6 text-slate-700">{activeStep.body}</p>
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">What to do</p>
            <p className="mt-1 text-sm leading-5 text-sky-900">{activeStep.action}</p>
          </div>

          {!targetRect && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              This part may be hidden on your screen. Open the menu or return to the dashboard, then continue.
            </div>
          )}

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-sky-600 transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
