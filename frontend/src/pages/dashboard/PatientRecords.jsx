import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Users, Search, ChevronDown, ChevronUp,
  Calendar, Clock, FileText, Video, ImagePlus,
  AlertCircle, HeartPulse, Phone,
  MapPin, User, ClipboardList, Download, FileImage,
} from 'lucide-react';
import PageTitle from '../../components/PageTitle';

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
  Completed:  'bg-emerald-100 text-emerald-700',
  Scheduled:  'bg-sky-100 text-sky-700',
  Pending:    'bg-amber-100 text-amber-700',
  Cancelled:  'bg-slate-100 text-slate-500',
};

const IMAGE_STATUS_STYLE = {
  Reviewed:       'bg-emerald-100 text-emerald-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
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

  // All hooks must run before any conditional return
  useEffect(() => {
    if (user?.role !== 'Doctor') {
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

  // Guard: Doctor only
  if (user?.role !== 'Doctor') {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
        This page is only accessible to doctors.
      </div>
    );
  }

  const getTab = (id) => activeTab[id] || 'overview';
  const setTab = (id, tab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <SEO title="Patient Records" description="View and manage patient records for your consultations" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageTitle icon={Users} title="Patient Records" description="View medical history, vitals, images, and consultations for your patients." iconClassName="bg-indigo-50 text-indigo-600" />
        <div className="text-right">
          <p className="text-2xl font-black text-sky-600">{patients.length}</p>
          <p className="text-xs text-slate-400 font-medium">Assigned Patients</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patient by name or address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white transition-all"
        />
      </div>

      {/* Patient list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-40 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-64" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-14 text-center">
            <Users size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600">No patients found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search.</p>
          </div>
        ) : (
          filtered.map((patient) => {
            const isOpen = expandedId === patient.id;
            const tab = getTab(patient.id);

            return (
              <div key={patient.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                {/* Patient row header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : patient.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-inner">
                    {patient.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">{patient.name}</p>
                      <span className="text-xs text-slate-400">·</span>
                    <p className="text-sm text-slate-500">{calcAge(patient.dob)} yrs · {patient.blood_type}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={11} /> Last visit: {patient.last_visit}</span>
                      <span className="flex items-center gap-1"><ClipboardList size={11} /> {patient.total_consultations} consultation{patient.total_consultations !== 1 ? 's' : ''}</span>
                      {patient.images.length > 0 && (
                        <span className="flex items-center gap-1"><ImagePlus size={11} /> {patient.images.length} image{patient.images.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Next scheduled status */}
                  {patient.consultations.some(c => c.status === 'Scheduled') && (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 flex-shrink-0">
                      <Clock size={11} /> Upcoming
                    </span>
                  )}

                  {isOpen
                    ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" />
                    : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
                  }
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-slate-100">

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
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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

                          {/* Quick action buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setTab(patient.id, 'consultations')}
                              className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 rounded-xl text-sm font-medium hover:bg-sky-100 transition-colors"
                            >
                              <ClipboardList size={15} /> View Consultations
                            </button>
                            <button
                              onClick={() => setTab(patient.id, 'vitals')}
                              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
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
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
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
                            <p className="text-slate-400 text-sm text-center py-8">No consultation records yet.</p>
                          ) : patient.consultations.map((c) => (
                            <div key={c.id} className="rounded-xl border border-slate-100 p-4 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar size={14} className="text-slate-400" />
                                  <span className="font-semibold text-slate-800">{c.date}</span>
                                  <span className="text-slate-400">·</span>
                                  <Clock size={14} className="text-slate-400" />
                                  <span className="text-slate-600">{c.time}</span>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status] || STATUS_STYLE.Pending}`}>
                                  {c.status}
                                </span>
                              </div>
                              {c.diagnosis && (
                                <p className="text-sm font-semibold text-slate-800">Dx: {c.diagnosis}</p>
                              )}
                              {c.notes && (
                                <p className="text-sm text-slate-500 leading-relaxed">{c.notes}</p>
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
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
                          <p className="text-xs text-slate-400 font-medium">Latest recorded vital signs</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            <VitalBadge label="Blood Pressure" value={patient.vitals.blood_pressure} unit="mmHg"  color="bg-sky-50 text-sky-700" />
                            <VitalBadge label="Heart Rate"     value={patient.vitals.heart_rate}     unit="bpm"   color="bg-rose-50 text-rose-700" />
                            <VitalBadge label="Temperature"    value={patient.vitals.temperature}    unit="°C"    color="bg-amber-50 text-amber-700" />
                            <VitalBadge label="SpO₂"           value={patient.vitals.oxygen}         unit="%"     color="bg-indigo-50 text-indigo-700" />
                            <VitalBadge label="Weight"         value={patient.vitals.weight}         unit="kg"    color="bg-emerald-50 text-emerald-700" />
                          </div>
                          {/* Abnormal flags */}
                          {parseInt(patient.vitals.heart_rate) > 100 && (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                              <AlertCircle size={16} /> Heart rate elevated — consider further assessment.
                            </div>
                          )}
                          {parseInt(patient.vitals.oxygen) < 95 && (
                            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                              <AlertCircle size={16} /> SpO₂ below normal — oxygen supplementation may be needed.
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Images tab ────────────────────────────────────── */}
                      {tab === 'images' && (
                        <div className="space-y-3">
                          {patient.images.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                              <ImagePlus size={28} className="mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No medical images uploaded by this patient.</p>
                            </div>
                          ) : patient.images.map((img) => (
                            <div key={img.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                {isImageType(img.mimeType) ? <FileImage size={18} className="text-indigo-500" /> : <FileText size={18} className="text-indigo-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{img.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{img.type} · {img.fileType?.toUpperCase()} · {img.date}</p>
                                {img.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{img.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${IMAGE_STATUS_STYLE[img.status] || 'bg-slate-100 text-slate-500'}`}>
                                  {img.status}
                                </span>
                                <button type="button" onClick={() => handleDownload(img)} className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Download file">
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
    </div>
  );
}
