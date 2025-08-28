import React, { useState, useEffect } from 'react';
import { 
  Search, UserPlus, Edit, Trash2, Eye, KeyRound, Upload, 
  ChevronUp, ChevronDown, Loader2, CheckCircle2, XCircle, 
  AlertCircle, Info, Users, Shield, ShieldCheck, ToggleRight, 
  PauseCircle 
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import toastImport from 'react-hot-toast';
const toast = toastImport as any;
import { User } from '../../types/index.js';
import { userApi } from '../../services/userApi.js';
import { useAuth } from '../../contexts/AuthContext.js';

const UserManagementPage: React.FC = () => {
  // State for user management
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  
  // Pagination and sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'room_number' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form states
  const [pendingStatus, setPendingStatus] = useState<'active' | 'inactive'>('active');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [csvText, setCsvText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  // New student form
  const [newStudent, setNewStudent] = useState<Omit<User, 'id'> & { password: string }>({
    name: '',
    email: '',
    roomNumber: '',
    role: 'student',
    status: 'active',
    password: ''
  });
  const [newPassword, setNewPassword] = useState('');
  
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getUsers({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchTerm
      });
      setStudents(response.data);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Selection helpers with admin protection
  const allSelected = students.length > 0 && 
    students.every(s => selectedIds.includes(s.id) || s.role === 'admin');
    
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      const selectableIds = students
        .filter(s => s.role !== 'admin')
        .map(s => s.id);
      setSelectedIds(selectableIds);
    }
  };
  
  const toggleSelectOne = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student?.role === 'admin') return; // Prevent selecting admin users
    
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };
  
  // Check if any selected users are admins (shouldn't happen with the above protection)
  const hasAdminSelection = selectedIds.some(id => 
    students.find(s => s.id === id)?.role === 'admin'
  );
  
  // Get non-admin selected users for bulk operations
  const nonAdminSelectedIds = selectedIds.filter(id => 
    students.find(s => s.id === id)?.role !== 'admin'
  );
  
  const isBulkActionDisabled = nonAdminSelectedIds.length === 0;
  
  // Handle student actions
  const handleViewStudent = (student: User) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };
  
  const handleEditStudent = async (student: User) => {
    try {
      // Prevent changing admin status to inactive
      const existingUser = students.find(u => u.id === student.id);
      if (existingUser?.role === 'admin' && student.status !== 'active') {
        toast.error('Admin users must remain active');
        student.status = 'active'; // Force active status
      }
      await userApi.updateUser(student.id, student);
      toast.success('Student updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  // Handle opening the status toggle modal
  const handleRequestToggleStatus = (student: User) => {
    setSelectedStudent(student);
    if (student.role === 'admin') {
      toast.error('Cannot change status for admin users');
      return;
    }
    setPendingStatus(student.status === 'active' ? 'inactive' : 'active');
    setIsStatusModalOpen(true);
  };

  // Handle confirming status change
  const handleConfirmToggleStatus = async () => {
    if (!selectedStudent) return;
    
    try {
      await userApi.updateUser(selectedStudent.id, { 
        ...selectedStudent, 
        status: pendingStatus 
      });
      toast.success(`User status updated to ${pendingStatus}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setIsStatusModalOpen(false);
    }
  };

  // Handle saving changes in edit modal
  const handleSaveChanges = async () => {
    if (!selectedStudent) return;
    try {
      await userApi.updateUser(selectedStudent.id, {
        name: selectedStudent.name,
        email: selectedStudent.email,
        roomNumber: selectedStudent.roomNumber,
        role: selectedStudent.role,
        status: selectedStudent.status,
      });
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    }
  };

  // Handle deleting a user
  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    try {
      await userApi.deleteUser(selectedStudent.id);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      await fetchUsers();
    } catch (error: unknown) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Handle opening delete confirmation modal
  const handleDeleteStudent = (student: User) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  // Handle opening reset password modal
  const handleOpenResetPassword = (student: User) => {
    setSelectedStudent(student);
    setResetPasswordValue('');
    setIsResetModalOpen(true);
  };

  // Handle confirming password reset with proper error handling
  const handleRequestResetPassword = handleOpenResetPassword; // Alias for backward compatibility
  const handleConfirmResetPassword = async () => {
    if (!selectedStudent || !resetPasswordValue) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (resetPasswordValue.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await userApi.resetPassword(selectedStudent.id, resetPasswordValue);
      toast.success('Password reset successfully');
      setIsResetModalOpen(false);
      setSelectedStudent(null);
      setResetPasswordValue('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      console.error('Password reset error:', error);
      toast.error(errorMessage);
    }
  };

  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (nonAdminSelectedIds.length === 0) return;
    
    try {
      setIsBulkUpdating(true);
      await Promise.all(
        nonAdminSelectedIds.map(async (id) => {
          try {
            const user = students.find(u => u.id === id);
            if (user && user.role !== 'admin') {
              await userApi.updateUser(id, { ...user, status });
            }
          } catch (error) {
            console.error(`Failed to update user ${id}:`, error);
            throw error;
          }
        })
      );
      
      toast.success(`Updated status for ${nonAdminSelectedIds.length} user(s)`);
      setSelectedIds([]);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user statuses:', error);
      toast.error('Failed to update some users');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (nonAdminSelectedIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${nonAdminSelectedIds.length} user(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setIsBulkUpdating(true);
      await Promise.all(
        nonAdminSelectedIds.map(async (id) => {
          try {
            const user = students.find(u => u.id === id);
            if (user && user.role !== 'admin') {
              await userApi.deleteUser(id);
            }
          } catch (error) {
            console.error(`Failed to delete user ${id}:`, error);
            throw error;
          }
        })
      );
      
      toast.success(`Deleted ${nonAdminSelectedIds.length} user(s)`);
      setSelectedIds([]);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to delete users:', error);
      toast.error('Failed to delete some users');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data');
      return;
    }
    
    try {
      const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) {
        toast.error('Paste CSV rows');
        return;
      }
      
      const users = lines.map(line => {
        const [name, email, password, roomNumber, status] = line.split(',').map(field => field.trim());
        return {
          name,
          email,
          password,
          roomNumber,
          status: (status as 'active' | 'inactive') || 'active'
        };
      });
      
      await userApi.bulkImport(users);
      toast.success('Users imported successfully');
      setIsImportModalOpen(false);
      setCsvText('');
      await fetchUsers();
    } catch (error) {
      console.error('Failed to import users:', error);
      toast.error('Failed to import users');
    }
  };

  const handleAddStudent = () => {
    setNewStudent({
      name: '',
      email: '',
      roomNumber: '',
      role: 'student',
      status: 'active',
      password: ''
    });
    setNewPassword('');
    setIsAddModalOpen(true);
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.roomNumber || !newPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      const { password, ...userData } = newStudent;
      await userApi.createUser(userData, newPassword);
      
      toast.success('Student created successfully');
      setIsAddModalOpen(false);
      setNewStudent({
        name: '',
        email: '',
        roomNumber: '',
        role: 'student',
        status: 'active',
        password: ''
      });
      setNewPassword('');
      await fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create student';
      console.error('Create student error:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage student accounts and information"
      actionButton={
        currentUser?.role === 'admin' ? (
          <Button
            onClick={handleAddStudent}
            className="flex items-center"
          >
            <UserPlus size={18} className="mr-2" />
            Add Student
          </Button>
        ) : null
      }
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-800">User Management</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Manage all user accounts and permissions</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                leftIcon={<Search size={16} className="text-gray-400" />}
                className="min-w-[250px]"

              />
              {currentUser?.role === 'admin' && (
                <Button
                  onClick={handleAddStudent}
                  className="whitespace-nowrap"
                  size="sm"
                >
                  <UserPlus size={16} className="mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Name {sortBy==='name' ? (sortOrder==='asc'? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortBy('email'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Email {sortBy==='email' ? (sortOrder==='asc'? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortBy('room_number'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Room {sortBy==='room_number' ? (sortOrder==='asc'? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortBy('status'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    <div className="flex items-center gap-1">Status {sortBy==='status' ? (sortOrder==='asc'? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Users size={48} className="mb-4 opacity-30" />
                        <h3 className="text-lg font-medium text-gray-500">No users found</h3>
                        <p className="mt-1 text-sm">
                          {searchTerm 
                            ? 'Try adjusting your search or filter to find what you\'re looking for.'
                            : 'Get started by adding a new user.'
                          }
                        </p>
                        {currentUser?.role === 'admin' && !searchTerm && (
                          <Button 
                            onClick={handleAddStudent}
                            variant="outline"
                            className="mt-4"
                            size="sm"
                          >
                            <UserPlus size={16} className="mr-2" />
                            Add User
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr 
                      key={student.id} 
                      className="bg-white hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelectOne(student.id)} />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-4 py-3">
                        {student.roomNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full w-fit mt-1 ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={student.role === 'admin'}
                            title={student.role === 'admin' ? 'Cannot edit admin users' : 'Edit user'}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRequestResetPassword(student)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRequestToggleStatus(student)}
                            className={student.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            disabled={student.role === 'admin'}
                            title={student.role === 'admin' ? 'Cannot change status for admin users' : student.status === 'active' ? 'Deactivate user' : 'Activate user'}
                          >
                            {student.status === 'active' ? (
                              <PauseCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="text-red-600 hover:text-red-900"
                            disabled={student.role === 'admin'}
                            title={student.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            
          {/* Pagination */}
          <div className="bg-white px-6 py-3 flex flex-col xs:flex-row items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2 xs:mb-0">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(page * pageSize, total)}
              </span>{' '}
              of <span className="font-medium">{total}</span> users
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 pl-2 pr-8"
                value={pageSize} 
                onChange={(e) => { 
                  setPageSize(Number(e.target.value)); 
                  setPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="px-3 py-1.5"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))} 
                  disabled={page * pageSize >= total}
                  className="px-3 py-1.5"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk actions and Import */}
          {currentUser?.role === 'admin' && (
            <div className={`bg-gray-50 px-6 py-3 border-t border-gray-200 transition-all duration-200 ${selectedIds.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 h-0 py-0 overflow-hidden'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedIds.length}</span> user{selectedIds.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkStatus('active')}
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  >
                    <CheckCircle2 size={14} className="mr-1.5" />
                    Activate Selected
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkStatus('inactive')}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <PauseCircle size={14} className="mr-1.5" />
                    Deactivate Selected
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 size={14} className="mr-1.5" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {currentUser?.role === 'admin' && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsImportModalOpen(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Upload size={14} className="mr-1.5" />
                Import Users from CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* View Student Modal */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Student Details</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="font-medium">{selectedStudent.name}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="font-medium">{selectedStudent.email}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Room Number</span>
                  <span className="font-medium">{selectedStudent.roomNumber}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 text-xs rounded-full w-fit mt-1 ${
                    selectedStudent.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedStudent.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">Reset Password</h2>
              <p className="text-gray-600 mb-4">Enter a new password for {selectedStudent.name}.</p>
              <Input
                label="New Password"
                type="password"
                value={resetPasswordValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetPasswordValue(e.target.value)}
                helperText="Minimum 6 characters"
                fullWidth
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmResetPassword}>Reset</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">Import Students from CSV</h2>
              <p className="text-gray-600 mb-4">Paste rows with columns: name,email,password,roomNumber,status(optional)</p>
              <textarea
                className="w-full h-48 border rounded p-2 font-mono text-sm"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`John Doe,john@example.com,Secret1,101,active`}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                <Button onClick={handleImportCsv}>Import</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggle Confirmation Modal */}
      {isStatusModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">Confirm {pendingStatus === 'active' ? 'Activation' : 'Deactivation'}</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to {pendingStatus === 'active' ? 'activate' : 'deactivate'} {selectedStudent.name}?
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmToggleStatus}
                >
                  {pendingStatus === 'active' ? 'Activate' : 'Deactivate'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Student Modal */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Student</h2>
              
              <div className="space-y-4">
                <Input
                  label="Name"
                  type="text"
                  defaultValue={selectedStudent.name}
                  fullWidth
                />
                
                <Input
                  label="Email"
                  type="email"
                  defaultValue={selectedStudent.email}
                  fullWidth
                />
                
                <Input
                  label="Room Number"
                  type="text"
                  defaultValue={selectedStudent.roomNumber}
                  fullWidth
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={selectedStudent.status}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove {selectedStudent.name} from the system? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="danger"
                  onClick={handleConfirmDelete}
                >
                  Delete Student
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add Student</h2>

              <div className="space-y-4">
                <Input
                  label="Name"
                  type="text"
                  value={newStudent.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStudent({ ...newStudent, name: e.target.value })}
                  fullWidth
                />

                <Input
                  label="Email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStudent({ ...newStudent, email: e.target.value })}
                  fullWidth
                />

                <Input
                  label="Password"
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  helperText="Minimum 6 characters"
                  fullWidth
                />

                <Input
                  label="Room Number"
                  type="text"
                  value={newStudent.roomNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStudent({ ...newStudent, roomNumber: e.target.value })}
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newStudent.role}
                    onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value as 'student' | 'admin' })}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newStudent.status}
                    onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateStudent}>
                  Create Student
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagementPage;