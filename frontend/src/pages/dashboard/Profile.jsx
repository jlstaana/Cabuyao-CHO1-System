import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import { User, Clock, Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import PageTitle from '../../components/PageTitle';

export default function Profile() {
  const { user, fetchUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    contact_no: '', dob: '', address: '',
    specialization: '', license_no: '',
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

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="Profile Settings" />
      <div className="mb-8">
        <PageTitle icon={User} title="Account Profile" description="Manage your personal information and system preferences." iconClassName="bg-sky-50 text-sky-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Avatar Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold text-3xl mb-4 shadow-inner">
              {user?.name?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 mb-4">{user?.email}</p>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{user?.role}</span>
          </div>

          <button
            onClick={() => setShowPwdModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 hover:border-sky-300 transition-all font-medium shadow-sm"
          >
            <Key size={16} /> Change Password
          </button>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-semibold text-lg flex items-center gap-2"><User size={20} className="text-sky-500" /> Personal Details</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input value={profile.name || user?.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input defaultValue={user?.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none" />
                </div>
              </div>

              {user?.role === 'Patient' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                      <input value={profile.contact_no} onChange={e => setProfile({ ...profile, contact_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                      <input type="date" value={profile.dob} onChange={e => setProfile({ ...profile, dob: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                    <textarea value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" rows="3" />
                  </div>
                </>
              )}

              {user?.role === 'Doctor' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                      <input value={profile.specialization} onChange={e => setProfile({ ...profile, specialization: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. General Practice" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Clock size={16} /> License Number</label>
                      <input value={profile.license_no} onChange={e => setProfile({ ...profile, license_no: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Key size={20} className="text-sky-500" /> Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input type="password" required value={pwdForm.current_password} onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input type="password" required value={pwdForm.password} onChange={e => setPwdForm({ ...pwdForm, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input type="password" required value={pwdForm.password_confirmation} onChange={e => setPwdForm({ ...pwdForm, password_confirmation: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPwdModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
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
