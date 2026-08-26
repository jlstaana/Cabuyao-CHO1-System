import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../utils/api';
import { User, Clock, Save, Key, Camera, Pencil } from 'lucide-react';
import { apiBaseUrl } from '../../utils/api';
import toast from 'react-hot-toast';
import PageTitle from '../../components/PageTitle';

export default function Profile() {
  const { user, fetchUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    contact_no: '', dob: '', address: '', category: '',
    specialization: '', license_no: '', ptr_no: '',
  });
  const [pwdForm, setPwdForm] = useState({ current_password: '', password: '', password_confirmation: '' });

  useEffect(() => {
    if (!user) return;
    if (user?.role === 'Patient') {
      api.get('/patients/profile').then(res => {
        if (res.data) {
          setProfile(p => ({
            ...p,
            name: res.data.name || p.name,
            contact_no: res.data.patient?.contact_no || '',
            dob: res.data.patient?.dob || '',
            address: res.data.patient?.address || '',
            category: res.data.patient?.category || '',
          }));
        }
      }).catch(console.error);
    }
    if (user?.role === 'Doctor') {
      api.get('/doctor/profile').then(res => {
        if (res.data) {
          setProfile(p => ({
            ...p,
            name: res.data.name || p.name,
            specialization: res.data.doctor?.specialization || '',
            license_no: res.data.doctor?.license_no || '',
            ptr_no: res.data.doctor?.ptr_no || '',
          }));
        }
      }).catch(console.error);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user.role === 'Patient') {
        await api.put('/patients/profile', profile);
      }
      if (user.role === 'Doctor') {
        await api.put('/doctor/profile', profile);
      }
      await fetchUser();
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.password !== pwdForm.password_confirmation) {
      toast.error('New passwords do not match!');
      return;
    }
    setChangingPwd(true);
    try {
      await api.post('/auth/change-password', pwdForm);
      toast.success('Password changed successfully!');
      setShowPwdModal(false);
      setPwdForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPwd(false);
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    setUploadingPic(true);
    try {
      await api.post('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchUser();
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to upload picture');
    } finally {
      setUploadingPic(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">      <div className="mb-8">
        <PageTitle icon={User} title="Account Profile" description="Manage your personal information and system preferences." iconClassName="bg-primary-bg text-primary-text" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Avatar Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center text-center">
            <div className="relative group mb-4">
              {user?.profile_picture ? (
                <img src={`${apiBaseUrl.replace('/api', '')}/storage/${user.profile_picture}`} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-inner border-2 border-slate-100" />
              ) : (
                <div className="w-24 h-24 bg-primary-hover text-primary-text rounded-full flex items-center justify-center font-bold text-3xl shadow-inner border-2 border-dashed border-sky-300">
                  {user?.name?.charAt(0)}
                </div>
              )}
              <label className={`absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full transition-opacity cursor-pointer ${uploadingPic ? 'opacity-100 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'}`}>
                <Camera size={20} className={!user?.profile_picture && !uploadingPic ? 'animate-bounce mt-2' : ''} />
                <span className="text-[10px] font-semibold mt-1 text-center px-1">{uploadingPic ? '...' : user?.profile_picture ? 'Upload' : 'Add Photo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePictureUpload} disabled={uploadingPic} />
              </label>
              {!user?.profile_picture && (
                <div className="absolute -bottom-1 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border-2 border-surface shadow-sm animate-pulse pointer-events-none md:hidden">
                  Add Photo
                </div>
              )}
              {user?.profile_picture && !uploadingPic && (
                <div className="absolute bottom-1 right-1 bg-sky-500 text-white p-1.5 rounded-full border-2 border-surface shadow-sm pointer-events-none group-hover:scale-110 group-hover:bg-sky-400 transition-all">
                  <Pencil size={12} />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-text">{user?.name}</h2>
            <p className="text-text-muted mb-4">{user?.email}</p>
            <span className="bg-surface-hover/50 text-text-muted px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{user?.role}</span>
          </div>

          <button
            data-tour="page-primary-action"
            onClick={() => setShowPwdModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-text-muted px-4 py-3 rounded-xl hover:bg-background hover:border-sky-300 transition-all font-medium shadow-sm"
          >
            <Key size={16} /> Change Password
          </button>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center gap-2"><User size={20} className="text-sky-500" /> Personal Details</h3>
            </div>
            <form data-tour="page-form" onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
                  <input value={profile.name || user?.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Email Address</label>
                  <input defaultValue={user?.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text-muted cursor-not-allowed outline-none" />
                </div>
              </div>

              {user?.role === 'Patient' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">Contact Number</label>
                      <input value={profile.contact_no} onChange={e => setProfile({ ...profile, contact_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">Date of Birth</label>
                      <input type="date" value={profile.dob} onChange={e => setProfile({ ...profile, dob: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Home Address</label>
                    <textarea value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" rows="2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Patient Classification / Category</label>
                    <select
                      value={profile.category || 'General'}
                      onChange={e => setProfile({ ...profile, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-slate-800 bg-surface dark:bg-slate-900 text-text dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none text-sm"
                    >
                      <option value="General">General (Regular Patient)</option>
                      <option value="PWD">PWD (Person With Disability)</option>
                      <option value="Senior Citizen">Senior Citizen (60+)</option>
                    </select>
                    {profile.category === 'PWD' && (
                      <div className="mt-2 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-2 max-w-md">
                          <span className="text-lg leading-none">♿</span>
                          <div>
                            <p className="font-bold">PWD Priority Verification Required</p>
                            <p className="mt-0.5 text-blue-700 dark:text-blue-300/90 leading-relaxed">
                              Upload your official <b>PWD ID Card</b> or <b>Disability Medical Certificate</b> so doctors & CHO1 staff can verify and grant priority lane access.
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/medical-images"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors shrink-0"
                        >
                          Upload PWD ID →
                        </Link>
                      </div>
                    )}
                    {profile.category === 'Senior Citizen' && (
                      <div className="mt-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-2 max-w-md">
                          <span className="text-lg leading-none">👴</span>
                          <div>
                            <p className="font-bold">Senior Citizen Priority Verification</p>
                            <p className="mt-0.5 text-amber-700 dark:text-amber-300/90 leading-relaxed">
                              Upload your official <b>OSCA Senior ID Card</b> in your files for quick on-record verification.
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/medical-images"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors shrink-0"
                        >
                          Upload Senior ID →
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              {user?.role === 'Doctor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">Specialization</label>
                      <input value={profile.specialization} onChange={e => setProfile({ ...profile, specialization: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. General Practice" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1 flex items-center gap-2"><Clock size={16} /> License Number</label>
                      <input value={profile.license_no} onChange={e => setProfile({ ...profile, license_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1 flex items-center gap-2">PTR Number</label>
                      <input value={profile.ptr_no} onChange={e => setProfile({ ...profile, ptr_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. PTR-1234567" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-sky-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200 disabled:opacity-70">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowPwdModal(false)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2"><Key size={20} className="text-sky-500" /> Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Current Password</label>
                <input type="password" required value={pwdForm.current_password} onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">New Password</label>
                <input type="password" required value={pwdForm.password} onChange={e => setPwdForm({ ...pwdForm, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Confirm New Password</label>
                <input type="password" required value={pwdForm.password_confirmation} onChange={e => setPwdForm({ ...pwdForm, password_confirmation: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPwdModal(false)} className="px-5 py-2.5 text-text-muted hover:bg-surface-hover rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={changingPwd} className="px-5 py-2.5 bg-sky-500 text-white hover:bg-sky-600 rounded-xl font-medium disabled:opacity-70">
                  {changingPwd ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

