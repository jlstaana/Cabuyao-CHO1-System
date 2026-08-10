import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      setPendingEmail(data.email);

      toast.success('Verification code sent. Please check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Email might be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setVerifying(true);
    try {
      await api.post('/auth/register/verify', { email: pendingEmail, code });
      toast.success('Account verified! You can now log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid code. Your account remains pending.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/register/resend-code', { email: pendingEmail });

      toast.success('A new verification code was sent.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleContinueVerification = async (event) => {
    event.preventDefault();
    setResending(true);
    try {
      await api.post('/auth/register/resend-code', { email: recoveryEmail });
      setPendingEmail(recoveryEmail);

      setShowRecovery(false);
      toast.success('Verification code sent. Please check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'No pending account found for that email.');
    } finally {
      setResending(false);
    }
  };

  if (pendingEmail) {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-bg text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text">Verify Your Account</h1>
          <p className="text-text-muted mt-2 text-sm">
            Enter the 6-digit code sent to {pendingEmail}. <br/>
            <span className="font-medium text-amber-600">Note: Please check your spam or junk folder if you don't see it in your inbox.</span>
          </p>
        </div>
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Verification Code</label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength="6"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-text outline-none transition-all focus:border-sky-500 focus:bg-surface focus:ring-2 focus:ring-sky-500/20"
              placeholder="000000"
              required
            />
          </div>

          <button
            disabled={verifying || code.length !== 6}
            className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg dark:shadow-none shadow-sky-200 disabled:opacity-70"
          >
            {verifying ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>
        <div className="mt-5 flex flex-col items-center gap-3 text-sm text-text-muted">
          <button type="button" onClick={handleResend} disabled={resending} className="font-semibold text-primary-text hover:underline disabled:opacity-60">
            {resending ? 'Sending new code...' : 'Resend verification code'}
          </button>
          <button type="button" onClick={() => setPendingEmail('')} className="text-text-muted hover:text-text-muted">
            Back to registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-bg text-primary-text">
          <UserPlus size={24} />
        </div>
        <h1 className="text-2xl font-bold text-text">Create Account</h1>
        <p className="text-text-muted mt-2 text-sm">Register for Cabuyao CHO Services</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
          <input 
            {...register('name', { required: true })} 
            placeholder="e.g. Juan Dela Cruz"
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Email Address</label>
          <input 
            type="email"
            {...register('email', { required: true })} 
            placeholder="e.g. juandelacruz@gmail.com"
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-text-muted mb-1">Date of Birth</label>
             <input type="date" {...register('dob', { required: true })} className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-background focus:bg-surface" />
          </div>
          <div>
             <label className="block text-sm font-medium text-text-muted mb-1">Contact No.</label>
             <input {...register('contact_no', { required: true })} placeholder="e.g. 09171234567" className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-background focus:bg-surface" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              {...register('password', { required: true, minLength: 8 })} 
              placeholder="e.g. password123 (Min. 8 chars)"
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-muted">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button 
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg dark:shadow-none shadow-sky-200 disabled:opacity-70 mt-2"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-text-muted">
        Already have an account? <Link to="/login" className="text-primary-text font-semibold hover:underline">Log in</Link>
      </p>
      <div className="mt-5 border-t border-border pt-5">
        {!showRecovery ? (
          <button
            type="button"
            onClick={() => setShowRecovery(true)}
            className="w-full text-sm font-semibold text-primary-text hover:underline"
          >
            Already registered but need to verify?
          </button>
        ) : (
          <form onSubmit={handleContinueVerification} className="space-y-3">
            <p className="text-center text-sm text-text-muted">
              Enter your email and we will send a new verification code.
            </p>
            <input
              type="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
              placeholder="username"
              required
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-background"
              >
                Cancel
              </button>
              <button
                disabled={resending}
                className="flex-1 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:shadow-none shadow-sky-200 transition-colors hover:bg-sky-600 disabled:opacity-70"
              >
                {resending ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

