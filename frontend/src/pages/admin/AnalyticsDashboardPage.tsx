import React, { useState, useMemo } from 'react';
import { Download, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMeals } from '../../contexts/MealContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  exportBookingsToCSV,
  exportFeedbackToCSV,
  getDailyBookingTrends,
  getMealTypeDistribution,
  getBookingStatusDistribution,
  getRatingDistribution,
  getWeeklyTrends,
  getPeakBookingHours,
  getAverageRatingTrends
} from '../../services/analyticsUtils';

const AnalyticsDashboardPage: React.FC = () => {
  const { bookings } = useMeals();
  const { feedbacks } = useFeedback();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // Color palettes for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const STATUS_COLORS = {
    booked: '#3B82F6',
    consumed: '#10B981',
    cancelled: '#EF4444'
  };

  // Analytics data
  const dailyTrends = useMemo(() => getDailyBookingTrends(bookings, 7), [bookings]);
  const weeklyTrends = useMemo(() => getWeeklyTrends(bookings, 4), [bookings]);
  const mealTypeData = useMemo(() => getMealTypeDistribution(bookings), [bookings]);
  const statusData = useMemo(() => getBookingStatusDistribution(bookings), [bookings]);
  const ratingData = useMemo(() => getRatingDistribution(feedbacks), [feedbacks]);
  const peakHoursData = useMemo(() => getPeakBookingHours(bookings), [bookings]);
  const ratingTrends = useMemo(() => getAverageRatingTrends(feedbacks, 7), [feedbacks]);

  const tooltipColorClass = (name: string | undefined) => {
    const key = (name || '').toLowerCase();
    switch (key) {
      case 'total bookings':
      case 'booked':
      case 'breakfast':
        return 'text-blue-500';
      case 'consumed':
      case 'lunch':
        return 'text-emerald-500';
      case 'average rating':
      case 'rating':
        return 'text-amber-500';
      case 'cancelled':
        return 'text-red-500';
      case 'bookings':
        return 'text-violet-500';
      case 'count':
        return 'text-pink-500';
      case 'dinner':
        return 'text-indigo-500';
      default:
        return 'text-gray-700';
    }
  };

  // Custom tooltip for charts
  interface TooltipPayloadEntry {
    name: string;
    value: number | string;
    color?: string;
    dataKey?: string;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-700">{label}</p>
          {payload.map((entry: TooltipPayloadEntry, index: number) => (
            <p
              key={index}
              className={`text-sm ${tooltipColorClass(entry.name)}`}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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

  return (
    <AdminLayout
      title="Analytics Dashboard"
      subtitle="Detailed insights and performance metrics"
    >
      <div className="space-y-6">
        {/* Header with Export Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Real-time insights and performance metrics</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => exportBookingsToCSV(bookings)}
              className="flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export Bookings</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => exportFeedbackToCSV(feedbacks)}
              className="flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export Feedback</span>
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'daily'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Weekly View
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Trends */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2" size={20} />
                Booking Trends
              </CardTitle>
              <CardDescription>
                {viewMode === 'daily' ? 'Last 7 days' : 'Last 4 weeks'} booking activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={viewMode === 'daily' ? dailyTrends : weeklyTrends}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey={viewMode === 'daily' ? 'date' : 'week'} style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    name="Total Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="consumed"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorConsumed)"
                    name="Consumed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rating Trends */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Rating Trends</CardTitle>
              <CardDescription>Average ratings over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ratingTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis domain={[0, 5]} style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Average Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Meal Type Distribution */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Meal Type Distribution</CardTitle>
              <CardDescription>Breakdown by breakfast, lunch, and dinner</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mealTypeData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Booking Status Distribution */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
              <CardDescription>Current status of all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="status" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Bookings" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Peak Booking Hours */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Peak Booking Hours
              </CardTitle>
              <CardDescription>Most active booking times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" fill="#8B5CF6" name="Bookings" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>Number of ratings by star rating</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="rating" type="category" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" fill="#EC4899" name="Count" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboardPage;
