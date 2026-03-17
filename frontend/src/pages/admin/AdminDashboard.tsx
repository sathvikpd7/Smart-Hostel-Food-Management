import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, Utensils, CheckCircle2, Activity, ChevronRight, TrendingUp, BarChart3, Wifi } from 'lucide-react';
import { API_URL, getAuthHeaders } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { useSSE } from '../../hooks/useSSE';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { User, MealBooking, Feedback } from '../../types';
import SentimentDashboard from '../../components/admin/SentimentDashboard';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { sseClient } from '../../services/sseClient';

const AdminDashboard: React.FC = () => {
  const { bookings } = useMeals();
  const { feedbacks } = useFeedback();
  const { user } = useAuth();
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [consumedMeals, setConsumedMeals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string>('');

  const [sseConnected, setSseConnected] = useState(false);

  const fetchStudentCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch student count');
      }
      const responseData = await response.json();
      const users: User[] = responseData.data || [];
      const studentCount = users.filter((user: User) => user.role === 'student').length;
      setTotalStudents(studentCount);
    } catch (error) {
      console.error('Error fetching student count:', error);
      setTotalStudents(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentCount();
  }, [fetchStudentCount]);

  // Update booking statistics whenever bookings change
  useEffect(() => {
    // Today's date
    const today = format(new Date(), 'yyyy-MM-dd');

    // Count today's bookings (all statuses for today)
    const todayCount = bookings.filter((booking: MealBooking) => {
      return booking.date === today && booking.status !== 'cancelled';
    }).length;
    setTodayBookings(todayCount);

    // Count total active bookings (excluding cancelled)
    const activeBookings = bookings.filter((booking: MealBooking) => booking.status !== 'cancelled').length;
    setTotalBookings(activeBookings);

    // Count consumed meals
    const consumed = bookings.filter((booking: MealBooking) => booking.status === 'consumed').length;
    setConsumedMeals(consumed);
  }, [bookings]); // Re-run whenever bookings change

  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) return '0.0';
    const sum = feedbacks.reduce((acc: number, feedback: Feedback) => acc + feedback.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a: MealBooking, b: MealBooking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [bookings]);

  // Track SSE connection status for the live indicator
  useEffect(() => {
    const check = () => setSseConnected(sseClient.isConnected);
    // Check immediately and then every 3 seconds
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  // SSE-driven refresh: re-fetch student count when a user is created or deleted
  useSSE({
    'connected': () => setSseConnected(true),
    'user-created': () => { fetchStudentCount(); },
    'user-deleted': () => { fetchStudentCount(); },
  });

  const recentFeedbacks = useMemo(() => {
    return [...feedbacks]
      .sort((a: Feedback, b: Feedback) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [feedbacks]);

  const handleGenerateAiSummary = async () => {
    setAiSummaryError('');
    setAiSummary('');

    const payloadFeedbacks = [...feedbacks]
      .filter(f => f.comment || typeof f.rating === 'number')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30)
      .map(f => ({
        rating: f.rating,
        comment: f.comment || '',
        date: f.date
      }));

    if (payloadFeedbacks.length === 0) {
      setAiSummaryError('Not enough feedback data to summarize.');
      return;
    }

    try {
      setAiSummaryLoading(true);
      const response = await fetch(`${API_URL}/api/ai/feedback-summary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedbacks: payloadFeedbacks })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary || '');
    } catch (error) {
      setAiSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Check if user is authenticated and has admin role
  if (!user || user.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
      </div>
    </div>;
  }

  if (loading) {
    return <LoadingScreen message="Loading dashboard analytics..." />;
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview of the hostel food management system"
    >
      <div className="space-y-6">
        {/* Header with Analytics Link */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-500 text-sm">Quick insights and recent activity</p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sseConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                title={sseConnected ? 'Live updates connected' : 'Connecting to live updates…'}
              >
                <Wifi size={10} />
                {sseConnected ? 'Live' : 'Connecting…'}
              </span>
            </div>
          </div>
          <Link to="/admin/analytics">
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <BarChart3 size={18} />
              <span>View Analytics</span>
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Students</p>
                  <h3 className="text-3xl font-bold text-gray-900">{totalStudents}</h3>
                  <p className="text-xs text-green-600 mt-2 flex items-center">
                    <TrendingUp size={12} className="mr-1" />
                    Active users
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg text-white shadow-md">
                  <Users size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
                  <h3 className="text-3xl font-bold text-gray-900">{totalBookings}</h3>
                  <p className="text-xs text-gray-500 mt-2">Active bookings</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-lg text-white shadow-md">
                  <Utensils size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-emerald-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Today's Bookings</p>
                  <h3 className="text-3xl font-bold text-gray-900">{todayBookings}</h3>
                  <p className="text-xs text-gray-500 mt-2">{format(new Date(), 'MMM dd, yyyy')}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg text-white shadow-md">
                  <Utensils size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Meals Consumed</p>
                  <h3 className="text-3xl font-bold text-gray-900">{consumedMeals}</h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {totalBookings > 0
                      ? `${Math.round((consumedMeals / totalBookings) * 100)}% rate`
                      : '0% rate'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-lg text-white shadow-md">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                  <h3 className="text-3xl font-bold text-gray-900">{averageRating}/5</h3>
                  <p className="text-xs text-gray-500 mt-2">{feedbacks.length} reviews</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg text-white shadow-md">
                  <Activity size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Recent Bookings */}
          <div className="col-span-1 md:col-span-7">
            <Card className="hover:shadow-sm transition-shadow duration-200">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest meal bookings across the hostel</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-xs text-gray-600 uppercase border-b">
                        <th className="px-4 py-3 text-left">Student</th>
                        <th className="px-4 py-3 text-left">Meal Type</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking: MealBooking) => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50 transition-colors">
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
                            <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'booked'
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
            <Card className="hover:shadow-sm transition-shadow duration-200">
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
                        ? `${Math.round((bookings.filter((b: MealBooking) => b.status === 'cancelled').length / totalBookings) * 100)}%`
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
            <Card className="hover:shadow-sm transition-shadow duration-200">
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Latest student meal ratings</CardDescription>
              </CardHeader>

              <CardContent>
                {feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {recentFeedbacks.map((feedback: Feedback) => (
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
                    ))}
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

        {/* AI Sentiment Analysis Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">AI summary and sentiment insights</div>
            <Button
              variant="outline"
              onClick={handleGenerateAiSummary}
              disabled={aiSummaryLoading}
            >
              {aiSummaryLoading ? 'Generating…' : 'Generate Summary'}
            </Button>
          </div>
          <SentimentDashboard
            feedbacks={feedbacks}
            aiSummary={aiSummary}
            aiSummaryLoading={aiSummaryLoading}
            aiSummaryError={aiSummaryError}
            onGenerateAiSummary={handleGenerateAiSummary}
            showAiGenerateButton={false}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
