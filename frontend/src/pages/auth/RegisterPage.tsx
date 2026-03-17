import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Home, ChevronRight, Utensils, ShieldCheck, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

/* ─── password strength helpers ─── */
const passwordChecks = [
  { label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p: string) => /[a-zA-Z]/.test(p) },
];

const strengthLabel = (score: number) => {
  if (score === 0) return { label: '', color: '' };
  if (score === 1) return { label: 'Weak', color: 'bg-red-400' };
  if (score === 2) return { label: 'Fair', color: 'bg-yellow-400' };
  return { label: 'Strong', color: 'bg-emerald-500' };
};

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '', roomNumber: '' });

  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  /* password strength score (0-3) */
  const strengthScore = useMemo(() => passwordChecks.filter(c => c.test(password)).length, [password]);
  const strength = strengthLabel(strengthScore);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const validateForm = () => {
    let isValid = true;
    const e = { name: '', email: '', password: '', confirmPassword: '', roomNumber: '' };

    if (!name.trim()) { e.name = 'Full name is required'; isValid = false; }
    if (!email) { e.email = 'Email is required'; isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { e.email = 'Enter a valid email address'; isValid = false; }
    if (!password) { e.password = 'Password is required'; isValid = false; }
    else if (password.length < 6) { e.password = 'Password must be at least 6 characters'; isValid = false; }
    if (password !== confirmPassword) { e.confirmPassword = 'Passwords do not match'; isValid = false; }
    if (!roomNumber.trim()) { e.roomNumber = 'Room number is required'; isValid = false; }

    setErrors(e);
    return isValid;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    try {
      const newUser = await register(name, email, password, roomNumber);
      toast.success('Account created! Redirecting…');
      if (newUser.role === 'admin') {
        window.location.href = '/admin.html#/admin/dashboard';
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  /* Reusable text-input row */
  const Field = ({
    id, label, type, value, onChange, placeholder, autoComplete, icon: Icon, error: fieldError, showToggle, onToggle, shown,
  }: {
    id: string; label: string; type: string; value: string;
    onChange: (v: string) => void; placeholder: string;
    autoComplete?: string; icon: React.ElementType; error: string;
    showToggle?: boolean; onToggle?: () => void; shown?: boolean;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Icon size={16} />
        </span>
        <input
          id={id}
          type={showToggle ? (shown ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={loading}
          className={`w-full pl-9 ${showToggle ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border text-sm bg-white
            transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${fieldError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400'}`}
        />
        {showToggle && (
          <button type="button" onClick={onToggle}
            aria-label={shown ? 'Hide' : 'Show'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors">
            {shown ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {fieldError && <p className="mt-1.5 text-xs text-red-600">{fieldError}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-600 to-blue-500 flex-col justify-between p-14">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-[480px] h-[480px] bg-indigo-400/25 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
            <Utensils className="text-white" size={24} />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none block">Smart Hostel</span>
            <span className="text-blue-200 text-xs font-medium tracking-widest uppercase">Food Management</span>
          </div>
        </div>

        {/* Steps visual */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-[2.4rem] font-extrabold text-white leading-tight">
              Join in<br />
              <span className="text-blue-200">three easy steps.</span>
            </h2>
            <p className="mt-4 text-blue-100 leading-relaxed max-w-xs text-sm">
              Create your account, verify your room, and start booking meals —&nbsp;all in under two minutes.
            </p>
          </div>

          <ol className="space-y-4">
            {[
              { n: '1', title: 'Fill in your details', desc: 'Name, email and room number' },
              { n: '2', title: 'Secure your account', desc: 'Choose a strong password' },
              { n: '3', title: 'Start enjoying meals', desc: 'Book & scan your QR code' },
            ].map(step => (
              <li key={step.n} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {step.n}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{step.title}</p>
                  <p className="text-blue-200 text-xs">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Stat pill row */}
        <div className="relative z-10 flex space-x-3">
          {[
            { val: '2 min', label: 'avg. sign-up time' },
            { val: '100%', label: 'free to join' },
          ].map(stat => (
            <div key={stat.label} className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 text-center">
              <p className="text-white font-bold text-xl">{stat.val}</p>
              <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-gray-50 overflow-y-auto">

        {/* Back button */}
        <div className="w-full max-w-sm mb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Home
          </button>
        </div>

        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-7">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md mb-2">
            <Utensils className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Smart Hostel</h1>
          <p className="text-xs text-gray-500">Food Management System</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h2>
            <p className="mt-1.5 text-gray-500 text-sm">Fill in your details below to get started</p>
          </div>

          {/* Server error */}
          {error && (
            <div className="mb-5 flex items-start space-x-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-sm" role="alert">
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <Field id="reg-name" label="Full name" type="text" value={name}
              onChange={setName} placeholder="Jane Doe" icon={User} error={errors.name} />

            <Field id="reg-email" label="Email address" type="email" value={email}
              onChange={setEmail} placeholder="you@example.com" autoComplete="email"
              icon={Mail} error={errors.email} />

            <Field id="reg-room" label="Room number" type="text" value={roomNumber}
              onChange={setRoomNumber} placeholder="A-101" icon={Home} error={errors.roomNumber} />

            {/* Password with strength meter */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:opacity-60 ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400'}`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex space-x-1 h-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strengthScore ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`text-xs font-medium ${strengthScore === 1 ? 'text-red-500' : strengthScore === 2 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                      {strength.label} password
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {passwordChecks.map(c => (
                      <li key={c.label} className={`flex items-center space-x-1.5 text-xs ${c.test(password) ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {c.test(password) ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        <span>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:opacity-60 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : passwordsMatch ? 'border-emerald-400' : 'border-gray-300 hover:border-gray-400'}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>}
              {passwordsMatch && !errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 size={11} />
                  <span>Passwords match</span>
                </p>
              )}
            </div>

            {/* Submit */}
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
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center space-x-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">Already have an account?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center space-x-2 border border-gray-300
              hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium
              py-2.5 px-4 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>Sign in instead</span>
            <ChevronRight size={15} />
          </Link>

          <p className="mt-5 text-center text-xs text-gray-400 flex items-center justify-center space-x-1">
            <ShieldCheck size={12} />
            <span>Your password is hashed and never stored in plain text</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;