import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import SEO from '../../components/SEO';
import { User, Shield, Activity, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <SEO title="Profile Settings" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account Profile</h1>
        <p className="text-slate-500">Manage your personal information and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold text-3xl mb-4 shadow-inner">
                 {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-500 mb-4">{user.email}</p>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{user.role}</span>
           </div>
        </div>

        <div className="lg:col-span-2">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><User size={20} className="text-sky-500"/> Personal Details</h3>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <input defaultValue={user.name} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input defaultValue={user.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none" />
                    </div>
                 </div>
                 
                 {user.role === 'Patient' && (
                   <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Home Address</label>
                        <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" rows="3"></textarea>
                    </div>
                   </>
                 )}

                 {user.role === 'Doctor' && (
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Clock size={16}/> Availability Schedule</label>
                      <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none" placeholder="e.g. Mon-Fri, 9AM - 5PM" />
                   </div>
                 )}

                 <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-sky-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200 disabled:opacity-70">
                       {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
}
