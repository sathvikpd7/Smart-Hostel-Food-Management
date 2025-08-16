import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Eye, KeyRound, Upload, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [students, setStudents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    roomNumber: '',
    role: 'student',
    status: 'active'
  });
  const [newPassword, setNewPassword] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'active' | 'inactive'>('active');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'room_number' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, total } = await userApi.getUsers({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchTerm,
      });
      setStudents(data);
      setTotal(total);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Selection helpers
  const allSelected = students.length > 0 && selectedIds.length === students.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : students.map(s => s.id));
  };
  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
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

  const handleRequestToggleStatus = (student: User) => {
    setSelectedStudent(student);
    if (student.role === 'admin') {
      toast.error('Cannot change status for admin users');
      return;
    }
    setPendingStatus(student.status === 'active' ? 'inactive' : 'active');
    setIsStatusModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedStudent) return;
    try {
      await userApi.updateUser(selectedStudent.id, {
        name: selectedStudent.name,
        email: selectedStudent.email,
        roomNumber: selectedStudent.roomNumber,
        status: pendingStatus,
      });
      toast.success(`Student ${pendingStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setIsStatusModalOpen(false);
      setSelectedStudent(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  
  const handleDeleteStudent = (student: User) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleOpenResetPassword = (student: User) => {
    setSelectedStudent(student);
    setResetPasswordValue('');
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedStudent) return;
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await userApi.resetPassword(selectedStudent.id, resetPasswordValue);
      toast.success('Password reset successfully');
      setIsResetModalOpen(false);
      setSelectedStudent(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reset password');
    }
  };

  const handleBulkStatus = async (status: 'active' | 'inactive') => {
    if (selectedIds.length === 0) return;
    
    // Filter out admin users from selection
    const adminIds = students
      .filter(s => selectedIds.includes(s.id) && s.role === 'admin')
      .map(s => s.id);
    
    const nonAdminIds = selectedIds.filter(id => !adminIds.includes(id));
    
    if (nonAdminIds.length === 0) {
      toast.error('Cannot change status for admin users');
      return;
    }
    
    if (adminIds.length > 0) {
      toast.warning(`Skipped ${adminIds.length} admin user(s)`);
    }
    
    if (!window.confirm(`Confirm to set ${nonAdminIds.length} user(s) to ${status}?`)) return;
    
    try {
      await Promise.all(
        nonAdminIds.map(id => {
          const s = students.find(u => u.id === id)!;
          return userApi.updateUser(id, { name: s.name, email: s.email, roomNumber: s.roomNumber, status });
        })
      );
      toast.success(`Updated ${nonAdminIds.length} user(s)`);
      setSelectedIds([]);
      fetchUsers();
    } catch {
      toast.error('Bulk update failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Confirm to delete ${selectedIds.length} user(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map(id => userApi.deleteUser(id)));
      toast.success(`Deleted ${selectedIds.length} user(s)`);
      setSelectedIds([]);
      fetchUsers();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleImportCsv = async () => {
    // Expect CSV headers: name,email,password,roomNumber,status
    try {
      const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) {
        toast.error('Paste CSV rows');
        return;
      }
      const rows = lines.map(l => l.split(',').map(p => p.trim()));
      const users = rows.map(cols => ({
        name: cols[0],
        email: cols[1],
        password: cols[2],
        roomNumber: cols[3],
        status: (cols[4] as 'active' | 'inactive') || 'active',
      }));
      await userApi.bulkImport(users);
      toast.success('CSV import complete');
      setIsImportModalOpen(false);
      setCsvText('');
      fetchUsers();
    } catch (e: any) {
      toast.error(e?.message || 'CSV import failed');
    }
  };
  
  // Handle save changes in edit modal
  const handleSaveChanges = () => {
    // In a real app, you would make an API call to update the student
    setIsEditModalOpen(false);
    toast.success('Student details updated successfully!');
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    try {
      await userApi.deleteUser(selectedStudent.id);
      toast.success('Student deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };
  
  // Add new student (would be implemented in a real app)
  const handleAddStudent = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.roomNumber) {
      toast.error('Please fill in name, email, and room number');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await userApi.createUser(newStudent, newPassword);
      toast.success('Student created successfully');
      setIsAddModalOpen(false);
      setNewStudent({ name: '', email: '', roomNumber: '', role: 'student', status: 'active' });
      setNewPassword('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create student');
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
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Student Directory</CardTitle>
            <div className="w-full md:w-auto">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={18} />}
                className="min-w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase">
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
                {students.map(student => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-2">
                        {currentUser?.role === 'admin' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestToggleStatus(student)}
                              className={student.status === 'active' ? 'text-red-600' : 'text-green-700'}
                            >
                              {student.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenResetPassword(student)}
                              className="text-gray-600 hover:text-purple-700"
                            >
                              <KeyRound size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                              className="text-gray-600 hover:text-amber-600"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student)}
                              className="text-gray-600 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                          className="text-gray-600 hover:text-blue-700"
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No students found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-between items-center py-3">
              <div className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} total</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button variant="outline" onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))} disabled={page * pageSize >= total}>Next</Button>
                <select className="ml-2 border rounded px-2 py-1" value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk actions and Import */}
          {currentUser?.role === 'admin' && (
            <div className="flex flex-wrap gap-2 mt-4 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center" onClick={() => setIsImportModalOpen(true)}>
                  <Upload size={16} className="mr-1" /> Import CSV
                </Button>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleBulkStatus('active')}>Bulk Activate</Button>
                  <Button variant="outline" onClick={() => handleBulkStatus('inactive')}>Bulk Deactivate</Button>
                  <Button variant="danger" onClick={handleBulkDelete}>Bulk Delete</Button>
                </div>
              )}
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
                
                {/* Removed mock fields (Account Created, Total Meals Booked) */}
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