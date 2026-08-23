import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Users, Search, ChevronDown, ChevronUp,
  Calendar, Clock, FileText, Video, ImagePlus,
  AlertCircle, HeartPulse, Phone,
  MapPin, User, ClipboardList, Download, FileImage,
  Edit, Save, Archive,
} from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import Modal from '../../components/Modal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return 'N/A';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'N/A';
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
}

function isImageType(mimeType = '') {
  return mimeType.startsWith('image/');
}

function fileLabel(file) {
  return file.document_type || file.file_type?.toUpperCase() || 'Medical File';
}

function buildPatientRecords(patientsData) {
  return patientsData.map((patient) => {
    const rawConsultations = patient.consultations || [];
    const formattedConsultations = rawConsultations.map(c => ({
      id: c.id,
      date: formatDate(c.scheduled_at || c.created_at),
      time: formatTime(c.scheduled_at || c.created_at),
      raw_date: c.scheduled_at,
      status: c.status,
      diagnosis: c.form?.diagnosis,
      notes: c.form?.notes,
      prescription_id: c.prescription?.id,
    })).sort((a, b) => b.id - a.id);

    let vitals = {};
    const cWithVitals = [...rawConsultations].reverse().find(c => c.vital_signs || c.vitalSigns);
    if (cWithVitals) vitals = cWithVitals.vital_signs || cWithVitals.vitalSigns;

    const rawImages = patient.medical_images || patient.medicalImages || [];
    const images = rawImages.map(image => ({
      id: image.id,
      name: image.original_name || image.file_path?.split('/').pop() || `Medical file #${image.id}`,
      type: fileLabel(image),
      mimeType: image.mime_type || '',
      fileType: image.file_type || '',
      notes: image.notes,
      date: formatDate(image.created_at),
      status: 'Uploaded',
    }));

    return {
      id: patient.id,
      name: patient.user?.name || 'Unknown Patient',
      dob: patient.dob,
      contact: patient.contact_no || 'N/A',
      address: patient.address || 'N/A',
      category: patient.category || '',
      medical_history: patient.record?.medical_history || '',
      blood_type: 'N/A',
      allergies: 'N/A',
      last_visit: formattedConsultations[0]?.date || 'N/A',
      total_consultations: formattedConsultations.length,
      consultations: formattedConsultations,
      vitals,
      images
    };
  });
}

const STATUS_CONFIG = {
  Completed:  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Scheduled:  { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  Pending:    { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Cancelled:  { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

const isUpcoming = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (d.getTime() + 15 * 60 * 1000) > now.getTime();
};

const IMAGE_STATUS_CONFIG = {
  Reviewed:       { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Pending Review': { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Uploaded:       { bg: 'bg-slate-50 text-text-muted border-slate-200', dot: 'bg-slate-400' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-text-light mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-text-light uppercase tracking-wide">{label}</p>
        <p className="text-sm text-text-muted font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  const isIndigo = color?.includes('indigo');
  const isEmerald = color?.includes('emerald');
  const isRose = color?.includes('rose');
  const isAmber = color?.includes('amber');
  const isFuchsia = color?.includes('fuchsia');
  const isSlate = color?.includes('slate');

  const bgGradient = isIndigo ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                     isEmerald ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                     isRose ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                     isAmber ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                     isFuchsia ? 'bg-gradient-to-br from-fuchsia-600 to-purple-700' :
                     isSlate ? 'bg-gradient-to-br from-slate-600 to-slate-800' :
                     'bg-gradient-to-br from-sky-500 to-blue-600';

  return (
    <div data-tour="page-stats" className={`p-5 rounded-2xl border border-transparent ${bgGradient}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-white/80">{label}</span>
        <div className="p-2 rounded-xl bg-white/20 text-white">
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-black mt-1 text-white">{value}</p>
      {sub && <p className="text-[10px] mt-1 text-white/70 uppercase tracking-wide">{sub}</p>}
    </div>
  );
}

function VitalBadge({ label, value, unit, color }) {
  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-lg font-black leading-none">{value || '—'}</p>
      <p className="text-[10px] font-medium mt-0.5 opacity-70">{unit}</p>
      <p className="text-[10px] font-semibold mt-1 opacity-80">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PatientRecords() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // per patient
  const [editModal, setEditModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', dob: '', contact_no: '', address: '', category: '', medical_history: '' });
  const [archiveReason, setArchiveReason] = useState('');

  // All hooks must run before any conditional return
  useEffect(() => {
    if (!['Doctor', 'Admin', 'Staff'].includes(user?.role)) {
      return;
    }
    let isActive = true;
    api.get('/patients')
      .then((res) => {
        if (isActive) setPatients(buildPatientRecords(res.data || []));
      })
      .catch(() => {
        if (isActive) setPatients([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, [user]);

  // Guard: clinical/admin roles only
  if (!['Doctor', 'Admin', 'Staff'].includes(user?.role)) {
    return (
      <div className="p-8 text-center text-text-muted bg-surface rounded-2xl shadow-sm border border-border">
        This page is only accessible to doctors, health officers, and admins.
      </div>
    );
  }

  const canEditRecords = ['Admin', 'Staff'].includes(user?.role);
  const getTab = (id) => activeTab[id] || 'overview';
  const setTab = (id, tab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));
  const openEdit = (patient) => {
    setSelected(patient);
    setEditForm({
      name: patient.name || '',
      dob: patient.dob ? String(patient.dob).slice(0, 10) : '',
      contact_no: patient.contact === 'N/A' ? '' : patient.contact || '',
      address: patient.address === 'N/A' ? '' : patient.address || '',
      category: patient.category || '',
      medical_history: patient.medical_history || '',
    });
    setEditModal(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/patients/${selected.id}/record`, editForm);
      const updated = response.data?.patient;
      setPatients((rows) => rows.map((patient) => patient.id === selected.id ? {
        ...patient,
        name: updated?.user?.name || editForm.name,
        dob: updated?.dob || editForm.dob,
        contact: updated?.contact_no || 'N/A',
        address: updated?.address || 'N/A',
        category: updated?.category || '',
        medical_history: updated?.record?.medical_history || '',
      } : patient));
      toast.success(response.data?.message || 'Patient record updated successfully.');
      setEditModal(false);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      toast.error(firstError || err.response?.data?.message || 'Validation error. Changes were rejected.');
    }
  };

  const openArchive = (patient) => {
    setSelected(patient);
    setArchiveReason('');
    setArchiveModal(true);
  };

  const handleArchiveRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/patients/${selected.id}/archive`, { reason: archiveReason });
      setPatients((rows) => rows.filter((patient) => patient.id !== selected.id));
      setExpandedId((current) => current === selected.id ? null : current);
      toast.success(response.data?.message || 'Patient record archived successfully.');
      setArchiveModal(false);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      toast.error(firstError || err.response?.data?.message || 'Archive not allowed.');
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await api.get(`/medical-images/${file.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: file.mimeType || 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter) {
      const selectedDateStr = new Date(dateFilter).toLocaleDateString();
      matchesDate = p.consultations.some(c => c.date === selectedDateStr);
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle icon={Users} title="Patient Records" description={canEditRecords ? 'Open patient records, update permitted information, and review history.' : 'View medical history, patient documents, and consultations for your patients.'} iconClassName="bg-brand-bg text-indigo-600" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Patients" 
          value={patients.length} 
          icon={Users} 
          color="sky" 
          sub="Registered in system" 
        />
        <StatCard 
          label="Old Patients" 
          value={patients.filter(p => p.total_consultations > 1).length} 
          icon={HeartPulse} 
          color="emerald" 
          sub="> 1 consultation" 
        />
        <StatCard 
          label="New Patients" 
          value={patients.filter(p => p.total_consultations <= 1).length} 
          icon={User} 
          color="indigo" 
          sub="≤ 1 consultation" 
        />
        <StatCard 
          label="Upcoming" 
          value={patients.filter(p => p.consultations.some(c => c.status === 'Scheduled' && isUpcoming(c.raw_date))).length} 
          icon={Clock} 
          color="amber" 
          sub="Scheduled consultations" 
        />
      </div>

      {/* Search and Filters */}
      <div data-tour="page-search" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by name or address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-surface transition-all"
          />
        </div>
        <div className="relative sm:w-48">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-surface transition-all text-sm text-text"
          />
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-text-muted">
          Showing <span className="font-semibold text-text">{filtered.length}</span> of <span className="font-semibold text-text">{patients.length}</span> patients
        </p>
      )}

      {/* Patient list */}
      <div data-tour="page-list" className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-5 animate-pulse">
              <div className="h-5 bg-surface-hover rounded w-40 mb-3" />
              <div className="h-4 bg-surface-hover/50 rounded w-64" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-14 text-center">
            <Users size={36} className="mx-auto mb-3 text-text-light opacity-60" />
            <p className="font-semibold text-text-muted">No patients found</p>
            <p className="text-sm text-text-light mt-1">Try adjusting your search.</p>
          </div>
        ) : (
          filtered.map((patient) => {
            const isOpen = expandedId === patient.id;
            const tab = getTab(patient.id);

            return (
              <div key={patient.id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md dark:hover:shadow-none transition-shadow">

                {/* Patient row header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : patient.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-brand-bg text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-inner">
                    {patient.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-text">{patient.name}</p>
                      <span className="text-xs text-text-light"> | </span>
                      <p className="text-sm text-text-muted">{calcAge(patient.dob)} yrs</p>
                      <span className="text-xs text-text-light"> | </span>
                      <span className="flex items-center gap-1 text-sm text-text-muted"><HeartPulse size={13} className="text-text-light" /> {patient.blood_type}</span>
                      <span className="text-xs text-text-light"> | </span>
                      <span className="flex items-center gap-1 text-sm text-text-muted"><Phone size={13} className="text-text-light" /> {patient.contact || 'N/A'}</span>
                      <span className="text-xs text-text-light"> | </span>
                      <span className="flex items-center gap-1 text-sm text-text-muted"><MapPin size={13} className="text-text-light" /> {patient.address}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-light flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={11} /> Last visit: {patient.last_visit}</span>
                      <span className="flex items-center gap-1"><ClipboardList size={11} /> {patient.total_consultations} consultation{patient.total_consultations !== 1 ? 's' : ''}</span>
                      {patient.images.length > 0 && (
                        <span className="flex items-center gap-1"><ImagePlus size={11} /> {patient.images.length} image{patient.images.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Next scheduled status */}
                  {patient.consultations.some(c => c.status === 'Scheduled' && isUpcoming(c.raw_date)) && (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary-hover text-primary-text flex-shrink-0">
                      <Clock size={11} /> Upcoming
                    </span>
                  )}

                  {isOpen
                    ? <ChevronUp size={18} className="text-text-light flex-shrink-0" />
                    : <ChevronDown size={18} className="text-text-light flex-shrink-0" />
                  }
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-border">

                    {/* Tab nav */}
                    <div className="flex gap-1 px-5 pt-4 overflow-x-auto">
                      {[
                        { key: 'overview',      label: 'Overview',         icon: User },
                        { key: 'consultations', label: 'Consultations',    icon: ClipboardList },
                        { key: 'images',        label: `Images (${patient.images.length})`, icon: ImagePlus },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setTab(patient.id, key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                            tab === key
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-text-muted hover:bg-surface-hover hover:text-text-muted'
                          }`}
                        >
                          <Icon size={14} /> {label}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">

                      {/* ── Overview tab ────────────────────────────────── */}
                      {tab === 'overview' && (
                        <div className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InfoChip icon={User}     label="Full Name"    value={patient.name} />
                            <InfoChip icon={Calendar} label="Date of Birth" value={`${formatDate(patient.dob)} (${calcAge(patient.dob)} years old)`} />
                            <InfoChip icon={Phone}    label="Contact No."  value={patient.contact} />
                            <InfoChip icon={MapPin}   label="Address"      value={patient.address} />
                            <InfoChip icon={HeartPulse} label="Blood Type" value={patient.blood_type} />
                            <InfoChip icon={AlertCircle} label="Allergies" value={patient.allergies} />
                            <InfoChip icon={ClipboardList} label="Category" value={patient.category || 'General'} />
                          </div>
                          {patient.medical_history && (
                            <div className="rounded-xl border border-border bg-background px-4 py-3">
                              <p className="text-[10px] font-semibold text-text-light uppercase tracking-wide">Medical History</p>
                              <p className="mt-1 text-sm text-text-muted whitespace-pre-wrap">{patient.medical_history}</p>
                            </div>
                          )}

                          {/* Quick action buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                            {canEditRecords && (
                              <>
                                <button
                                  onClick={() => openEdit(patient)}
                                  className="flex items-center gap-2 px-4 py-2 bg-brand-bg text-brand-text rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                                >
                                  <Edit size={15} /> Edit Record
                                </button>
                                <button
                                  onClick={() => openArchive(patient)}
                                  className="flex items-center gap-2 px-4 py-2 bg-danger-bg text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
                                >
                                  <Archive size={15} /> Archive
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setTab(patient.id, 'consultations')}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
                            >
                              <ClipboardList size={15} /> View Consultations
                            </button>
                            
                            {patient.consultations.some(c => c.status === 'Scheduled' && isUpcoming(c.raw_date)) && (
                              <Link
                                to={`/room/${patient.consultations.find(c => c.status === 'Scheduled' && isUpcoming(c.raw_date)).id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm"
                              >
                                <Video size={15} /> Join Teleconsultation
                              </Link>
                            )}
                            <Link
                              to="/prescriptions"
                              className="flex items-center gap-2 px-4 py-2 bg-success-bg text-success-text rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                            >
                              <FileText size={15} /> Create Prescription
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* ── Consultations tab ────────────────────────────── */}
                      {tab === 'consultations' && (
                        <div className="space-y-3">
                          {patient.consultations.length === 0 ? (
                            <p className="text-text-light text-sm text-center py-8">No consultation records yet.</p>
                          ) : patient.consultations.map((c) => (
                            <div key={c.id} className="rounded-xl border border-border p-4 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar size={14} className="text-text-light" />
                                  <span className="font-semibold text-text">{c.date}</span>
                                  <span className="text-text-light"> | </span>
                                  <Clock size={14} className="text-text-light" />
                                  <span className="text-text-muted">{c.time}</span>
                                </div>
                                {(() => {
                                  const style = STATUS_CONFIG[c.status] || STATUS_CONFIG.Scheduled;
                                  return (
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${style.bg}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                      {c.status}
                                    </span>
                                  );
                                })()}
                              </div>
                              {c.diagnosis && (
                                <p className="text-sm font-semibold text-text">Dx: {c.diagnosis}</p>
                              )}
                              {c.notes && (
                                <p className="text-sm text-text-muted leading-relaxed">{c.notes}</p>
                              )}
                              <div className="flex gap-2 pt-1">
                                {c.status === 'Scheduled' && (
                                  <Link
                                    to={`/room/${c.id}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-colors"
                                  >
                                    <Video size={13} /> Join Call
                                  </Link>
                                )}
                                {c.prescription_id && (
                                  <Link
                                    to="/prescriptions"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-success-bg text-success-text rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                                  >
                                    <FileText size={13} /> View Prescription
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ── Images tab ────────────────────────────────────── */}
                      {tab === 'images' && (
                        <div className="space-y-3">
                          {patient.images.length === 0 ? (
                            <div className="text-center py-10 text-text-light">
                              <ImagePlus size={28} className="mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No medical images uploaded by this patient.</p>
                            </div>
                          ) : patient.images.map((img) => (
                            <div key={img.id} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-background transition-colors">
                              <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center flex-shrink-0">
                                {isImageType(img.mimeType) ? <FileImage size={18} className="text-indigo-500" /> : <FileText size={18} className="text-indigo-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text truncate">{img.name}</p>
                                <p className="text-xs text-text-light mt-0.5">{img.type}  |  {img.fileType?.toUpperCase()}  |  {img.date}</p>
                                {img.notes && <p className="text-xs text-text-light mt-0.5 truncate">{img.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {(() => {
                                  const style = IMAGE_STATUS_CONFIG[img.status] || IMAGE_STATUS_CONFIG.Uploaded;
                                  return (
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-sm ${style.bg}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                      {img.status}
                                    </span>
                                  );
                                })()}
                                <button type="button" onClick={() => handleDownload(img)} className="p-2 rounded-lg text-text-light hover:text-primary-text hover:bg-primary-bg transition-colors" title="Download file">
                                  <Download size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Update Patient Record">
        {selected && (
          <form data-tour="page-form" onSubmit={handleUpdateRecord} className="space-y-4">
            <div className="rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text">
              Edit permitted patient information. Invalid changes are rejected and the previous record is kept.
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Date of Birth</label>
                <input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Contact No.</label>
                <input value={editForm.contact_no} onChange={(e) => setEditForm({ ...editForm, contact_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Address</label>
              <textarea rows={2} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none bg-surface">
                <option value="">General</option>
                <option value="Pediatric">Pediatric</option>
                <option value="Adult">Adult</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="PhilHealth YAKAP">PhilHealth YAKAP</option>
                <option value="PhilHealth GAMOT">PhilHealth GAMOT</option>
                <option value="Maternal">Maternal</option>
                <option value="TB-DOTS">TB-DOTS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Medical History</label>
              <textarea rows={4} value={editForm.medical_history} onChange={(e) => setEditForm({ ...editForm, medical_history: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setEditModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-indigo-500 text-white font-semibold hover:bg-indigo-600 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-200">
                <Save size={16} /> Submit Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={archiveModal} onClose={() => setArchiveModal(false)} title="Archive Patient Record">
        {selected && (
          <form onSubmit={handleArchiveRecord} className="space-y-4">
            <div className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-rose-700">
              Provide a reason before archiving {selected.name}. Records with active consultation requests or schedules cannot be archived.
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Archive Reason</label>
              <textarea
                required
                rows={4}
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="Enter the reason for archiving this patient record"
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-rose-500/20 outline-none resize-none"
              />
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setArchiveModal(false)} className="px-5 py-2.5 text-text-muted font-medium hover:bg-surface-hover rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-rose-500 text-white font-semibold hover:bg-rose-600 rounded-xl flex items-center gap-2 shadow-md shadow-rose-200">
                <Archive size={16} /> Confirm Archive
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

