import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { User } from '../../types';

interface Student extends User {
  status: 'active' | 'inactive';
}

const UserManagementPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch students from API
  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data.map((user: User) => ({
        ...user,
        status: 'active' // You might want to add a status field to your User type
      })));
    } catch (error) {
      toast.error('Failed to load students');
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle student actions
  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };
  
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };
  
  // Handle save changes in edit modal
  const handleSaveChanges = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedStudent),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      await fetchStudents(); // Refresh the list
      setIsEditModalOpen(false);
      toast.success('Student details updated successfully!');
    } catch (error) {
      toast.error('Failed to update student');
      console.error('Error updating student:', error);
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/${selectedStudent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      await fetchStudents(); // Refresh the list
      setIsDeleteModalOpen(false);
      toast.success('Student removed successfully!');
    } catch (error) {
      toast.error('Failed to delete student');
      console.error('Error deleting student:', error);
    }
  };
  
  // Add new student
  const handleAddStudent = () => {
    // This would be implemented in a separate component or modal
    toast.success('This would open a form to add a new student');
  };
  
  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage student accounts and information"
      actionButton={
        <Button
          onClick={handleAddStudent}
          className="flex items-center"
        >
          <UserPlus size={18} className="mr-2" />
          Add Student
        </Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={18} />}
                className="min-w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            className="text-gray-600 hover:text-blue-700"
                          >
                            <Eye size={16} />
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
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No students found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  <span className={`px-2 py-1 text-xs rounded-full inline-block w-fit ${
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
      
      {/* Edit Student Modal */}
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Edit Student</h2>
              
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-500 mb-1">Name</label>
                  <Input
                    value={selectedStudent.name}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      name: e.target.value
                    })}
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm text-gray-500 mb-1">Email</label>
                  <Input
                    value={selectedStudent.email}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      email: e.target.value
                    })}
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm text-gray-500 mb-1">Room Number</label>
                  <Input
                    value={selectedStudent.roomNumber}
                    onChange={(e) => setSelectedStudent({
                      ...selectedStudent,
                      roomNumber: e.target.value
                    })}
                  />
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
              <h2 className="text-xl font-bold mb-4">Delete Student</h2>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedStudent.name}? This action cannot be undone.
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
                  Delete
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