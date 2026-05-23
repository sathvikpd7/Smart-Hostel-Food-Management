import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ChevronRight, ChefHat, CheckCircle, ArrowLeft } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const { login, loading, error } = useAuth();

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'admin') {
        window.location.href = '/admin.html#/admin/dashboard';
      } else {
        navigate('/dashboard');
      }
    } catch {
      toast.error('Invalid email or password. Please try again.');
    }
  };

  const features = [
    { text: 'Dynamic meal booking & ahead scheduling' },
    { text: 'Secure touchless QR entry tickets' },
    { text: 'Real-time ingredient waste trackers' },
    { text: 'Certified dietitian calories logger' },
  ];

  return (
    <div className="min-h-screen flex text-stone-850 bg-stone-50/60 antialiased">
      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#fcfcfb] border-r border-stone-200/80 flex-col justify-between p-14">
        {/* Logo row */}
        <div className="relative z-10 flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl shadow-sm">
            <ChefHat className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-stone-950 font-black text-lg leading-none block">CampusBite</span>
            <span className="text-emerald-700 text-[9px] font-extrabold uppercase tracking-widest leading-none block mt-1.5">Hostel Mess Dining</span>
          </div>
        </div>

        {/* Hero copy + features */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-[2.6rem] font-black text-stone-950 leading-[1.1] tracking-tight">
              Eat fresh. <br />
              <span className="text-emerald-700">Schedule easily.</span>
            </h2>
            <p className="mt-4 text-stone-500 text-sm font-medium leading-relaxed max-w-sm">
              Log in to secure your daily hostel meals, check ingredients, and help our campus cooks reduce recipe waste.
            </p>
          </div>
          <ul className="space-y-4">
            {features.map(({ text }) => (
              <li key={text} className="flex items-center space-x-3 text-stone-600 font-bold text-xs uppercase tracking-wide">
                <div className="w-6 h-6 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer pill info */}
        <div className="relative z-10 text-[10px] font-bold text-stone-400 tracking-wider uppercase">
          © 2026 CampusBite Dining Systems
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 overflow-y-auto">
        {/* Back button */}
        <div className="w-full max-w-sm mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-xs text-stone-400 hover:text-emerald-700 transition-colors font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Home
          </button>
        </div>

        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center shadow-sm mb-3 text-white">
            <ChefHat className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-stone-950">CampusBite</h1>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Hostel Mess Dining</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-stone-950 tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-stone-500 text-xs font-semibold">Sign in to your account to continue</p>
          </div>

          {/* Server-level error */}
          {error && (
            <div
              className="mb-5 flex items-start space-x-2.5 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs"
              role="alert"
              aria-live="polite"
            >
              <span className="mt-0.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                  <Mail size={15} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-xs bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-stone-200 hover:border-stone-300 text-stone-850 font-medium'}`}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-[10px] text-red-600 font-semibold">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                  <Lock size={15} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-xs bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-stone-200 hover:border-stone-300 text-stone-855 font-medium'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-[10px] text-red-600 font-semibold">{errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-700/30 cursor-pointer"
              />
              <span className="text-xs font-semibold text-stone-500">Remember me for 30 days</span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800
                active:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-lg transition-all text-xs shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center space-x-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider whitespace-nowrap">New to CampusBite?</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Register link */}
          <Link
            to="/register"
            className="w-full flex items-center justify-center space-x-2 border border-stone-200
              hover:border-emerald-700 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 font-bold
              py-2.5 px-4 rounded-lg transition-all text-xs shadow-sm bg-white"
          >
            <span>Create a free account</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;