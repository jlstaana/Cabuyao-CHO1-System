import { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import api from '../../utils/api';
import { KeyRound, LockKeyhole, LogIn } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const login = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState('');
  const [devResetCode, setDevResetCode] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
    } catch (error) {
      const message = error.response?.data?.errors?.email?.[0]
        || error.response?.data?.message
        || 'Invalid credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: resetEmail });
      setDevResetCode(response.data.reset_code || '');
      setMode('reset');
      toast.success('Password reset code sent. Please check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (resetPassword !== resetPasswordConfirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail,
        code: resetCode,
        password: resetPassword,
        password_confirmation: resetPasswordConfirmation,
      });
      toast.success('Password reset successfully. You can now sign in.');
      setMode('login');
      setResetCode('');
      setResetPassword('');
      setResetPasswordConfirmation('');
      setDevResetCode('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <div>
        <SEO title="Forgot Password" description="Reset your Cabuyao CHO account password" />
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-slate-500 mt-2 text-sm">Enter your email and we will send a reset code.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
              placeholder="you@example.com"
              required
            />
          </div>
          <button disabled={loading} className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200 disabled:opacity-70">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
        <button type="button" onClick={() => setMode('login')} className="mt-5 w-full text-sm font-semibold text-sky-600 hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div>
        <SEO title="Set New Password" description="Set a new Cabuyao CHO account password" />
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <LockKeyhole size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-slate-500 mt-2 text-sm">Enter the code sent to {resetEmail}.</p>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reset Code</label>
            <input
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength="6"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-slate-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
              placeholder="000000"
              required
            />
          </div>
          {devResetCode && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Development code: <span className="font-bold tracking-widest">{devResetCode}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
              required
              minLength="8"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={resetPasswordConfirmation}
              onChange={(event) => setResetPasswordConfirmation(event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
              required
              minLength="8"
            />
          </div>
          <button disabled={loading || resetCode.length !== 6} className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200 disabled:opacity-70">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <div className="mt-5 flex flex-col items-center gap-3 text-sm">
          <button type="button" onClick={handleForgotPassword} disabled={loading} className="font-semibold text-sky-600 hover:underline disabled:opacity-60">
            Resend reset code
          </button>
          <button type="button" onClick={() => setMode('login')} className="text-slate-500 hover:text-slate-700">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO title="Login" description="Sign in to your Cabuyao CHO account" />
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <LogIn size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-slate-500 mt-2 text-sm">Sign in to your Cabuyao CHO account</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input 
            {...register('email', { required: true })} 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <button type="button" onClick={() => setMode('forgot')} className="text-xs font-semibold text-sky-600 hover:underline">
              Forgot password?
            </button>
          </div>
          <input 
            type="password"
            {...register('password', { required: true })} 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-slate-50 focus:bg-white"
            placeholder="••••••••"
          />
        </div>
        <button 
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200 disabled:opacity-70 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-slate-600">
        Don't have an account? <Link to="/register" className="text-sky-600 font-semibold hover:underline">Register here</Link>
      </p>
    </div>
  );
}
