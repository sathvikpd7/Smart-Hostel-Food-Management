import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Home, ChevronRight, ChefHat, CheckCircle2, XCircle, ArrowLeft, Users } from 'lucide-react';
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
  if (score === 1) return { label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { label: 'Fair', color: 'bg-yellow-500' };
  return { label: 'Strong', color: 'bg-emerald-600' };
};

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
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
      const newUser = await register(name, email, password, roomNumber, gender || undefined);
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
      <label htmlFor={id} className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Icon size={15} />
        </span>
        <input
          id={id}
          type={showToggle ? (shown ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={loading}
          className={`w-full pl-9 ${showToggle ? 'pr-10' : 'pr-4'} py-2.5 rounded-lg border text-xs bg-white
            transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700
            disabled:opacity-60 disabled:cursor-not-allowed
            ${fieldError ? 'border-red-400 focus:ring-red-400' : 'border-stone-200 hover:border-stone-300 text-stone-850 font-medium'}`}
        />
        {showToggle && (
          <button type="button" onClick={onToggle}
            aria-label={shown ? 'Hide' : 'Show'}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition-colors">
            {shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {fieldError && <p className="mt-1.5 text-[10px] text-red-600 font-semibold">{fieldError}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex text-stone-850 bg-stone-50/60 antialiased">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#fcfcfb] border-r border-stone-200/80 flex-col justify-between p-14">
        {/* Logo */}
        <div className="relative z-10 flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl shadow-sm">
            <ChefHat className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-stone-950 font-black text-lg leading-none block">CampusBite</span>
            <span className="text-emerald-700 text-[9px] font-extrabold uppercase tracking-widest leading-none block mt-1.5">Hostel Mess Dining</span>
          </div>
        </div>

        {/* Steps visual */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-[2.4rem] font-black text-stone-950 leading-[1.1] tracking-tight">
              Join us in <br />
              <span className="text-emerald-700 font-black">three simple steps.</span>
            </h2>
            <p className="mt-4 text-stone-500 font-medium leading-relaxed max-w-xs text-sm">
              Create your account, verify your room details, and start booking fresh meals immediately.
            </p>
          </div>

          <ol className="space-y-5">
            {[
              { n: '1', title: 'Register Account', desc: 'Input your name, email and room' },
              { n: '2', title: 'Secure Password', desc: 'Configure a strong security key' },
              { n: '3', title: 'Reserve Meals', desc: 'Secure dining tickets on your terms' },
            ].map(step => (
              <li key={step.n} className="flex items-start space-x-3">
                <div className="w-7 h-7 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  {step.n}
                </div>
                <div>
                  <p className="text-stone-850 text-xs font-bold uppercase tracking-wider">{step.title}</p>
                  <p className="text-stone-400 text-xs mt-0.5 font-medium">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Stats footer row */}
        <div className="relative z-10 text-[10px] font-bold text-stone-400 tracking-wider uppercase">
          © 2026 CampusBite Dining Systems
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 overflow-y-auto">
        {/* Back button */}
        <div className="w-full max-w-sm mb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-xs text-stone-400 hover:text-emerald-700 transition-colors font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Home
          </button>
        </div>

        {/* Mobile logo */}
        <div className="flex lg:hidden flex-col items-center mb-7">
          <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center shadow-sm mb-2 text-white">
            <ChefHat className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-stone-950">CampusBite</h1>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Hostel Mess Dining</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-stone-950 tracking-tight">Create account</h2>
            <p className="mt-1.5 text-stone-500 text-xs font-semibold">Fill in your details below to get started</p>
          </div>

          {/* Server error */}
          {error && (
            <div className="mb-5 flex items-start space-x-2.5 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs" role="alert">
              <span className="mt-0.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
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

            {/* Gender selector */}
            <div>
              <label htmlFor="reg-gender" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Gender</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Users size={15} />
                </span>
                <select
                  id="reg-gender"
                  value={gender}
                  onChange={e => setGender(e.target.value as 'male' | 'female' | '')}
                  disabled={loading}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-xs bg-white
                    transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700
                    disabled:opacity-60 disabled:cursor-not-allowed
                    border-stone-200 hover:border-stone-300 text-stone-850 font-medium appearance-none"
                >
                  <option value="">Select gender (optional)</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Password with strength meter */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                  <Lock size={15} />
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-xs bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700
                    disabled:opacity-60 ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-stone-200 hover:border-stone-300 text-stone-850 font-medium'}`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-[10px] text-red-600 font-semibold">{errors.password}</p>}

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex space-x-1 h-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strengthScore ? strength.color : 'bg-stone-200'}`} />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={`text-[10px] font-bold ${strengthScore === 1 ? 'text-red-500' : strengthScore === 2 ? 'text-yellow-600' : 'text-emerald-700'}`}>
                      {strength.label} password
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {passwordChecks.map(c => (
                      <li key={c.label} className={`flex items-center space-x-1.5 text-[10px] font-semibold ${c.test(password) ? 'text-emerald-700' : 'text-stone-400'}`}>
                        {c.test(password) ? <CheckCircle2 size={11} className="text-emerald-700 fill-emerald-50" /> : <XCircle size={11} />}
                        <span>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Confirm password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                  <Lock size={15} />
                </span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-xs bg-white transition-all
                    focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700
                    disabled:opacity-60 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : passwordsMatch ? 'border-emerald-600' : 'border-stone-200 hover:border-stone-300 text-stone-850 font-medium'}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-[10px] text-red-600 font-semibold">{errors.confirmPassword}</p>}
              {passwordsMatch && !errors.confirmPassword && (
                <p className="mt-1.5 text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                  <CheckCircle2 size={11} className="fill-emerald-50" />
                  <span>Passwords match</span>
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800
                active:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-lg transition-all text-xs shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center space-x-3">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider whitespace-nowrap">Already registered?</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center space-x-2 border border-stone-200
              hover:border-emerald-700 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 font-bold
              py-2.5 px-4 rounded-lg transition-all text-xs shadow-sm bg-white"
          >
            <span>Sign in instead</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;