import React, { useEffect, useState } from 'react';
import { Users, Utensils, CheckCircle2, Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { User } from '../../types';

const AdminDashboard: React.FC = () => {
  const { bookings } = useMeals();
  const { feedbacks } = useFeedback();
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [consumedMeals, setConsumedMeals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real student count
    const fetchStudentCount = async () => {
      try {
        const response = await fetch('http://localhost:3001/users');
        if (!response.ok) {
          throw new Error('Failed to fetch student count');
        }
        const users: User[] = await response.json();
        const studentCount = users.filter((user: User) => user.role === 'student').length;
        setTotalStudents(studentCount);
      } catch (error) {
        console.error('Error fetching student count:', error);
        setTotalStudents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentCount();

    // Today's date
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Count today's bookings
    const todayCount = bookings.filter(booking => booking.date === today).length;
    setTodayBookings(todayCount);
    
    // Count total bookings
    setTotalBookings(bookings.length);
    
    // Count consumed meals
    const consumed = bookings.filter(booking => booking.status === 'consumed').length;
    setConsumedMeals(consumed);
  }, [bookings]);
  
  // Calculate average rating
  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    
    const sum = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };
  
  // Recent bookings for the dashboard
  const recentBookings = bookings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview of the hostel food management system"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Stats Cards */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Students</p>
                  <h3 className="text-3xl font-bold text-gray-900">{totalStudents}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Today's Bookings</p>
                  <h3 className="text-3xl font-bold text-gray-900">{todayBookings}</h3>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700">
                  <Utensils size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Meals Consumed</p>
                  <h3 className="text-3xl font-bold text-gray-900">{consumedMeals}</h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg text-amber-700">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                  <h3 className="text-3xl font-bold text-gray-900">{calculateAverageRating()}/5</h3>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg text-purple-700">
                  <Activity size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Bookings */}
        <div className="col-span-1 md:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest meal bookings across the hostel</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b">
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Meal Type</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map(booking => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                              {booking.userId.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">Student {booking.userId}</p>
                              <p className="text-xs text-gray-500">Room A-{Math.floor(Math.random() * 100) + 100}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {booking.type}
                        </td>
                        <td className="px-4 py-3">
                          {booking.date}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'booked' 
                              ? 'bg-blue-100 text-blue-800' 
                              : booking.status === 'consumed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {recentBookings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No recent bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            
            <CardFooter>
              <Link to="/admin/meals" className="w-full">
                <Button variant="outline" fullWidth>
                  View All Bookings
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        {/* System Overview & Recent Feedback */}
        <div className="col-span-1 md:col-span-5 space-y-6">
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Current statistics and operations</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-medium">{totalBookings}</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Consumption Rate</span>
                  <span className="font-medium">
                    {totalBookings > 0 
                      ? `${Math.round((consumedMeals / totalBookings) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Cancellation Rate</span>
                  <span className="font-medium">
                    {totalBookings > 0 
                      ? `${Math.round((bookings.filter(b => b.status === 'cancelled').length / totalBookings) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Feedback Submissions</span>
                  <span className="font-medium">{feedbacks.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest student meal ratings</CardDescription>
            </CardHeader>
            
            <CardContent>
              {feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map(feedback => (
                      <div key={feedback.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">User {feedback.userId}</span>
                          <div className="flex items-center">
                            <span className="text-amber-500 mr-1">★</span>
                            <span className="text-sm font-medium">{feedback.rating}/5</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {feedback.mealId.split('-')[0]} on {feedback.mealId.split('-')[1]}
                        </p>
                        {feedback.comment && (
                          <p className="text-sm italic text-gray-700">"{feedback.comment}"</p>
                        )}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-center py-6 text-gray-500">
                  No feedback submissions yet
                </p>
              )}
            </CardContent>
            
            <CardFooter>
              <Link to="/admin/reports" className="w-full">
                <Button variant="outline" fullWidth>
                  View All Feedback
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;