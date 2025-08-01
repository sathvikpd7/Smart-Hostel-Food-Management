import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import toastImport from 'react-hot-toast';
const toast = toastImport as any;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const { login, loading, error } = useAuth();

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
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
      await login(email, password);
      
      // Navigate based on user role will happen automatically with protected routes
      toast.success('Login successful!');
    } catch (err) {
      // Error is already handled in AuthContext
      toast.error('Login failed. Please check your credentials.');
    }
  };

  // Demo credentials info
  const loginAsStudent = () => {
    setEmail('student@example.com');
    setPassword('password');
  };

  const loginAsAdmin = async () => {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    setEmail(adminEmail);
    setPassword(adminPassword);
    try {
      await login(adminEmail, adminPassword);
      toast.success('Login successful!');
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-blue-900">Smart Hostel</h1>
        <h2 className="mt-2 text-center text-xl font-semibold text-gray-700">Food Management System</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="sm:rounded-lg">
          <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent>
              {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  error={!!errors.email}
                  errorText={errors.email}
                  leftIcon={<User size={18} />}
                  fullWidth
                  autoComplete="email"
                />
                
                <Input
                  label="Password"
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={!!errors.password}
                  errorText={errors.password}
                  leftIcon={<Lock size={18} />}
                  fullWidth
                  autoComplete="current-password"
                />
              </div>
              
              <div className="mt-4 text-right">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" fullWidth isLoading={loading}>
                Log in
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  Register
                </Link>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center mb-4">Demo credentials</p>
                <div className="grid grid-cols-2 gap-4">
      
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loginAsAdmin}
                    size="sm"
                  >
                    Admin Demo
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;