import React, { useState } from 'react';
import { User as UserIcon, Mail, Home, Key, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { userApi } from '../../services/userApi';
import toastImport from 'react-hot-toast';
const toast = toastImport as any;

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Update profile information
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setIsUpdating(true);
      const updated = await userApi.updateUser(user.id, {
        name: name.trim(),
        roomNumber: roomNumber.trim(),
      });
      setUser(updated);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Change password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend endpoint available in this project for password change.
    // Keep UI but inform user.
    toast.error('Password change is not available in this demo');
  };
  
  return (
    <StudentLayout
      title="Your Profile"
      subtitle="Manage your account information"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Information */}
        <div className="col-span-1 md:col-span-7">
          <Card className="hover:shadow-sm transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                  {(user?.name || user?.email || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <form onSubmit={handleUpdateProfile}>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    leftIcon={<UserIcon size={18} />}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNumber(e.target.value)}
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
          <Card className="hover:shadow-sm transition-shadow">
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    leftIcon={<Key size={18} />}
                    fullWidth
                  />
                  
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    helperText="Minimum 6 characters"
                    leftIcon={<Key size={18} />}
                    fullWidth
                  />
                  
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    leftIcon={<Key size={18} />}
                    fullWidth
                    error={newPassword !== confirmPassword && confirmPassword !== ''}
                    errorText="Passwords do not match"
                  />
                  <p className="text-xs text-gray-500">Password change is not available in this demo build.</p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isChangingPassword}
                  disabled
                >
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProfilePage;