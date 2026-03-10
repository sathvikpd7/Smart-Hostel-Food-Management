import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ChevronRight, Utensils, ShieldCheck, Zap, Star, ArrowLeft } from 'lucide-react';

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
    { icon: Utensils, text: 'Smart meal booking & tracking' },
    { icon: ShieldCheck, text: 'Secure QR-code verification' },
    { icon: Zap, text: 'Real-time meal availability' },
    { icon: Star, text: 'Personalised meal recommendations' },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex-col justify-between p-14">
        {/* decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />

        {/* Logo row */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
            <Utensils className="text-white" size={24} />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none block">Smart Hostel</span>
            <span className="text-blue-200 text-xs font-medium tracking-widest uppercase">Food Management</span>
          </div>
        </div>

        {/* Hero copy + features */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[2.6rem] font-extrabold text-white leading-tight">
              Your meals,<br />
              <span className="text-blue-200">managed smartly.</span>
            </h2>
            <p className="mt-4 text-blue-100 leading-relaxed max-w-sm">
              Book, track and enjoy hostel meals with a few taps. Waste less, eat better, live healthier.
            </p>
          </div>
          <ul className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="text-white" size={15} />
                </div>
                <span className="text-blue-100 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>


      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50 overflow-y-auto">

        {/* Back button */}
        <div className="w-full max-w-sm mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Home
          </button>
        </div>

        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md mb-3">
            <Utensils className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Hostel</h1>
          <p className="text-sm text-gray-500">Food Management System</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Server-level error */}
          {error && (
            <div
              className="mb-5 flex items-start space-x-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-sm"
              role="alert"
              aria-live="polite"
            >
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email field */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail size={16} />
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
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400'}`}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock size={16} />
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
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600">Remember me for 30 days</span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700
                active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors
                disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center space-x-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">Don't have an account?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register link */}
          <Link
            to="/register"
            className="w-full flex items-center justify-center space-x-2 border border-gray-300
              hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium
              py-2.5 px-4 rounded-xl transition-colors text-sm focus:outline-none
              focus:ring-2 focus:ring-blue-500"
          >
            <span>Create a free account</span>
            <ChevronRight size={15} />
          </Link>

          {/* JWT trust badge */}
          <p className="mt-7 text-center text-xs text-gray-400 flex items-center justify-center space-x-1">
            <ShieldCheck size={12} />
            <span>Sessions are protected with signed JWT tokens</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;