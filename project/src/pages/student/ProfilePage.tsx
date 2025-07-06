import React, { useState } from 'react';
import { User, Mail, Home, Key, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Update profile information
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };
  
  // Change password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsChangingPassword(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
    }, 1000);
  };
  
  return (
    <StudentLayout
      title="Your Profile"
      subtitle="Manage your account information"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Information */}
        <div className="col-span-1 md:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleUpdateProfile}>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<User size={18} />}
                    fullWidth
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    helperText="Email address cannot be changed"
                    leftIcon={<Mail size={18} />}
                    fullWidth
                  />
                  
                  <Input
                    label="Room Number"
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    leftIcon={<Home size={18} />}
                    fullWidth
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isUpdating}
                >
                  <Save size={18} className="mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        {/* Change Password */}
        <div className="col-span-1 md:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password securely
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleChangePassword}>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    leftIcon={<Key size={18} />}
                    fullWidth
                  />
                  
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    helperText="Minimum 6 characters"
                    leftIcon={<Key size={18} />}
                    fullWidth
                  />
                  
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Key size={18} />}
                    fullWidth
                    error={newPassword !== confirmPassword && confirmPassword !== ''}
                    errorText="Passwords do not match"
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isChangingPassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          {/* Account Statistics */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Account Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-medium">Student</span>
                </div>
                
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Joined Date</span>
                  <span className="font-medium">May 15, 2023</span>
                </div>
                
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-gray-600">Total Meals Booked</span>
                  <span className="font-medium">42</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login</span>
                  <span className="font-medium">Today at 8:45 AM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProfilePage;