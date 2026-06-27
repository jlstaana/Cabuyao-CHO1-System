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

function buildPatientRecords(consultations) {
  const grouped = new Map();

  consultations.forEach((consultation) => {
    const patient = consultation.patient;
    if (!patient?.id) return;
    const existing = grouped.get(patient.id) || {
      id: patient.id,
      name: patient.user?.name || 'Unknown Patient',
      dob: patient.dob,
      contact: patient.contact_no || 'N/A',
      address: patient.address || 'N/A',
      medical_history: patient.record?.medical_history || '',
      blood_type: 'N/A',
      allergies: 'N/A',
      last_visit: 'N/A',
      total_consultations: 0,
      consultations: [],
      vitals: {},
      images: [],
    };

    existing.consultations.push({
      id: consultation.id,
      date: formatDate(consultation.scheduled_at || consultation.created_at),
      time: formatTime(consultation.scheduled_at || consultation.created_at),
      status: consultation.status,
      diagnosis: consultation.form?.diagnosis,
      notes: consultation.form?.notes,
      prescription_id: consultation.prescription?.id,
    });

    if (consultation.vital_signs || consultation.vitalSigns) {
      existing.vitals = consultation.vital_signs || consultation.vitalSigns;
    }

    const medicalImages = consultation.medical_images || consultation.medicalImages || [];
    existing.images.push(...medicalImages.map((image) => ({
      id: image.id,
      name: image.original_name || image.file_path?.split('/').pop() || `Medical file #${image.id}`,
      type: fileLabel(image),
      mimeType: image.mime_type || '',
      fileType: image.file_type || '',
      notes: image.notes,
      date: formatDate(image.created_at),
      status: 'Uploaded',
    })));

    existing.total_consultations = existing.consultations.length;
    existing.last_visit = existing.consultations[0]?.date || 'N/A';
    grouped.set(patient.id, existing);
  });

  return Array.from(grouped.values()).map((patient) => ({
    ...patient,
    consultations: patient.consultations.sort((a, b) => b.id - a.id),
  }));
}

const STATUS_STYLE = {
  Completed:  'bg-emerald-100 text-success-text',
  Scheduled:  'bg-primary-hover text-primary-text',
  Pending:    'bg-amber-100 text-warning-text',
  Cancelled:  'bg-surface-hover/50 text-text-muted',
};

const IMAGE_STATUS_STYLE = {
  Reviewed:       'bg-emerald-100 text-success-text',
  'Pending Review': 'bg-amber-100 text-warning-text',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-text-light mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-text-light uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
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
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // per patient
  const [editModal, setEditModal] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', dob: '', contact_no: '', address: '', medical_history: '' });
  const [archiveReason, setArchiveReason] = useState('');

  // All hooks must run before any conditional return
  useEffect(() => {
    if (!['Doctor', 'Admin', 'Staff'].includes(user?.role)) {
      return;
    }
    let isActive = true;
    api.get('/consultations')
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

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle icon={Users} title="Patient Records" description={canEditRecords ? 'Open patient records, update permitted information, and review history.' : 'View medical history, vitals, images, and consultations for your patients.'} iconClassName="bg-brand-bg text-indigo-600" />
        <div className="text-right">
          <p className="text-2xl font-black text-primary-text">{patients.length}</p>
          <p className="text-xs text-text-light font-medium">Assigned Patients</p>
        </div>
      </div>

      {/* Search */}
      <div data-tour="page-search" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient by name or address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-surface transition-all"
        />
      </div>

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
                      <span className="text-xs text-text-light">·</span>
                    <p className="text-sm text-text-muted">{calcAge(patient.dob)} yrs · {patient.blood_type}</p>
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
                  {patient.consultations.some(c => c.status === 'Scheduled') && (
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
                        { key: 'vitals',        label: 'Vital Signs',      icon: HeartPulse },
                        { key: 'images',        label: `Images (${patient.images.length})`, icon: ImagePlus },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setTab(patient.id, key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                            tab === key
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-text-muted hover:bg-surface-hover hover:text-slate-700'
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
                            <InfoChip icon={Calendar} label="Date of Birth" value={`${patient.dob} (${calcAge(patient.dob)} years old)`} />
                            <InfoChip icon={Phone}    label="Contact No."  value={patient.contact} />
                            <InfoChip icon={MapPin}   label="Address"      value={patient.address} />
                            <InfoChip icon={HeartPulse} label="Blood Type" value={patient.blood_type} />
                            <InfoChip icon={AlertCircle} label="Allergies" value={patient.allergies} />
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
                            <button
                              onClick={() => setTab(patient.id, 'vitals')}
                              className="flex items-center gap-2 px-4 py-2 bg-danger-bg text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
                            >
                              <HeartPulse size={15} /> View Vitals
                            </button>
                            {patient.consultations.some(c => c.status === 'Scheduled') && (
                              <Link
                                to={`/room/${patient.consultations.find(c => c.status === 'Scheduled').id}`}
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
                                  <span className="text-text-light">·</span>
                                  <Clock size={14} className="text-text-light" />
                                  <span className="text-text-muted">{c.time}</span>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status] || STATUS_STYLE.Pending}`}>
                                  {c.status}
                                </span>
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

                      {/* ── Vitals tab ────────────────────────────────────── */}
                      {tab === 'vitals' && (
                        <div className="space-y-4">
                          <p className="text-xs text-text-light font-medium">Latest recorded vital signs</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <VitalBadge label="Blood Pressure" value={patient.vitals.blood_pressure} unit="mmHg"  color="bg-primary-bg text-primary-text" />
                            <VitalBadge label="Heart Rate"     value={patient.vitals.heart_rate}     unit="bpm"   color="bg-danger-bg text-rose-700" />
                            <VitalBadge label="Temperature"    value={patient.vitals.temperature}    unit="°C"    color="bg-warning-bg text-warning-text" />
                            <VitalBadge label="SpO₂"           value={patient.vitals.oxygen}         unit="%"     color="bg-brand-bg text-brand-text" />
                            <VitalBadge label="Weight"         value={patient.vitals.weight}         unit="kg"    color="bg-success-bg text-success-text" />
                          </div>
                          {/* Abnormal flags */}
                          {parseInt(patient.vitals.heart_rate) > 100 && (
                            <div className="flex items-center gap-2 text-sm text-warning-text bg-warning-bg border border-amber-200 rounded-xl px-4 py-2">
                              <AlertCircle size={16} /> Heart rate elevated — consider further assessment.
                            </div>
                          )}
                          {parseInt(patient.vitals.oxygen) < 95 && (
                            <div className="flex items-center gap-2 text-sm text-rose-700 bg-danger-bg border border-rose-200 rounded-xl px-4 py-2">
                              <AlertCircle size={16} /> SpO₂ below normal — oxygen supplementation may be needed.
                            </div>
                          )}
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
                                <p className="text-xs text-text-light mt-0.5">{img.type} · {img.fileType?.toUpperCase()} · {img.date}</p>
                                {img.notes && <p className="text-xs text-text-light mt-0.5 truncate">{img.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${IMAGE_STATUS_STYLE[img.status] || 'bg-surface-hover/50 text-text-muted'}`}>
                                  {img.status}
                                </span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact No.</label>
                <input value={editForm.contact_no} onChange={(e) => setEditForm({ ...editForm, contact_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea rows={2} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medical History</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Archive Reason</label>
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
