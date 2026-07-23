import { useState } from 'react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { KeyRound, LockKeyhole, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const login = useAuthStore(state => state.login);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submitLogin = async (email, password) => {
    await login(email.trim().toLowerCase(), password);
    toast.success('Logged in successfully!');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await submitLogin(data.email, data.password);
    } catch (error) {
      let message;
      if (!error.response) {
        message = 'Network Error: Cannot connect to server';
      } else {
        message = error.response.data?.errors?.email?.[0]
          || error.response.data?.message
          || 'Invalid credentials';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });

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

    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <div>        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-bg text-primary-text">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text">Reset Password</h1>
          <p className="text-text-muted mt-2 text-sm">Enter your email and we will send a reset code.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
              placeholder="username"
              required
            />
          </div>
          <button disabled={loading} className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg dark:shadow-none shadow-sky-200 disabled:opacity-70">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
        <button type="button" onClick={() => setMode('login')} className="mt-5 w-full text-sm font-semibold text-primary-text hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div>        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-bg text-emerald-600">
            <LockKeyhole size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text">Set New Password</h1>
          <p className="text-text-muted mt-2 text-sm">
            Enter the code sent to {resetEmail}. <br/>
            <span className="font-medium text-amber-600">Note: Please check your spam or junk folder if you don't see it in your inbox.</span>
          </p>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reset Code</label>
            <input
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength="6"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] text-text outline-none transition-all focus:border-sky-500 focus:bg-surface focus:ring-2 focus:ring-sky-500/20"
              placeholder="000000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
                required
                minLength="8"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={resetPasswordConfirmation}
                onChange={(event) => setResetPasswordConfirmation(event.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
                required
                minLength="8"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button disabled={loading || resetCode.length !== 6} className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg dark:shadow-none shadow-sky-200 disabled:opacity-70">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <div className="mt-5 flex flex-col items-center gap-3 text-sm">
          <button type="button" onClick={handleForgotPassword} disabled={loading} className="font-semibold text-primary-text hover:underline disabled:opacity-60">
            Resend reset code
          </button>
          <button type="button" onClick={() => setMode('login')} className="text-text-muted hover:text-slate-700">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-bg text-primary-text">
          <LogIn size={24} />
        </div>
        <h1 className="text-2xl font-bold text-text">Welcome Back</h1>
        <p className="text-text-muted mt-2 text-sm">Sign in to your Cabuyao CHO account</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input 
            {...register('email', { required: true })} 
            className="w-full px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
            placeholder="username"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <button type="button" onClick={() => setMode('forgot')} className="text-xs font-semibold text-primary-text hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              {...register('password', { required: true })} 
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all bg-background focus:bg-surface"
              placeholder="password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button 
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-lg dark:shadow-none shadow-sky-200 disabled:opacity-70 mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-text-muted">
        Don't have an account? <Link to="/register" className="text-primary-text font-semibold hover:underline">Register here</Link>
      </p>
    </div>
  );
}
