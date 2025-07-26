import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card.js';
import toastImport from 'react-hot-toast';
const toast = toastImport as any;

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roomNumber: ''
  });
  
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      roomNumber: ''
    };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await register(name, email, password, roomNumber);
      
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      // Error is already handled in AuthContext
      toast.error('Registration failed. Please try again.');
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
            <CardTitle>Create a new account</CardTitle>
            <CardDescription>
              Fill in your details to register
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
                  label="Full Name"
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="John Doe"
                  error={!!errors.name}
                  errorText={errors.name}
                  leftIcon={<User size={18} />}
                  fullWidth
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  error={!!errors.email}
                  errorText={errors.email}
                  leftIcon={<Mail size={18} />}
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
                  autoComplete="new-password"
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  error={!!errors.confirmPassword}
                  errorText={errors.confirmPassword}
                  leftIcon={<Lock size={18} />}
                  fullWidth
                  autoComplete="new-password"
                />
                
                <Input
                  label="Room Number"
                  type="text"
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNumber(e.target.value)}
                  placeholder="A-101"
                  error={!!errors.roomNumber}
                  errorText={errors.roomNumber}
                  leftIcon={<Home size={18} />}
                  fullWidth
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" fullWidth isLoading={loading}>
                Register
              </Button>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">Already have an account? </span>
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;