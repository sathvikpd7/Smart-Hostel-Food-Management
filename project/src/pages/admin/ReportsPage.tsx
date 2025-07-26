import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, TrendingUp, MessageSquare } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import { useMeals } from '../../contexts/MealContext.js';
import { useFeedback } from '../../contexts/FeedbackContext.js';
import { format, subDays, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';

type DateRangeType = '7days' | '30days' | '90days' | 'custom';
type MealFilterType = 'all' | 'breakfast' | 'lunch' | 'dinner';

type ExportDataRow = {
  'Student ID': string;
  'Meal Type': 'breakfast' | 'lunch' | 'dinner';
  'Date': string;
  'Status': 'consumed' | 'cancelled' | 'booked';
  'Created At': string;
};

type RatingCounts = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

const ReportsPage: React.FC = () => {
  const { bookings } = useMeals();
  const { feedbacks } = useFeedback();
  
  // State for filters
  const [dateRange, setDateRange] = useState<DateRangeType>('30days');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [mealTypeFilter, setMealTypeFilter] = useState<MealFilterType>('all');
  
  // State for calculated data
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    consumed: 0,
    cancelled: 0,
    consumptionRate: 0,
    cancellationRate: 0
  });
  
  const [mealTypeDistribution, setMealTypeDistribution] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0
  });
  
  const [dailyBookings, setDailyBookings] = useState<{date: string, count: number}[]>([]);
  
  const [feedbackStats, setFeedbackStats] = useState({
    averageRating: 0,
    totalFeedbacks: 0,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });
  
  // Update date range based on preset selection
  useEffect(() => {
    const today = new Date();
    
    switch (dateRange) {
      case '7days':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '30days':
        setStartDate(format(subDays(today, 30), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '90days':
        setStartDate(format(subDays(today, 90), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      // For 'custom', we don't automatically update the dates
    }
  }, [dateRange]);
  
  // Calculate statistics when filters change
  useEffect(() => {
    // Filter bookings based on date range and meal type
    const filteredBookings = bookings.filter((booking: any) => {
      const bookingDate = booking.date;
      const isInDateRange = bookingDate >= startDate && bookingDate <= endDate;
      const matchesMealType = mealTypeFilter === 'all' || booking.type === mealTypeFilter;
      
      return isInDateRange && matchesMealType;
    });
    
    // Calculate booking statistics
    const totalBookings = filteredBookings.length;
    const consumedBookings = filteredBookings.filter((b: any) => b.status === 'consumed').length;
    const cancelledBookings = filteredBookings.filter((b: any) => b.status === 'cancelled').length;
    
    setBookingStats({
      total: totalBookings,
      consumed: consumedBookings,
      cancelled: cancelledBookings,
      consumptionRate: totalBookings > 0 ? Math.round((consumedBookings / totalBookings) * 100) : 0,
      cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0
    });
    
    // Calculate meal type distribution
    const breakfastCount = filteredBookings.filter((b: any) => b.type === 'breakfast').length;
    const lunchCount = filteredBookings.filter((b: any) => b.type === 'lunch').length;
    const dinnerCount = filteredBookings.filter((b: any) => b.type === 'dinner').length;
    
    setMealTypeDistribution({
      breakfast: breakfastCount,
      lunch: lunchCount,
      dinner: dinnerCount
    });
    
    // Calculate daily bookings for trend chart
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = differenceInDays(end, start) + 1;
    
    // Initialize array with all dates in range
    const dailyCounts: {date: string, count: number}[] = [];
    
    // Create a day-by-day array for the chart
    for (let i = 0; i < dayCount; i++) {
      const currentDate = format(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), 'yyyy-MM-dd');
      const count = filteredBookings.filter((b: any) => b.date === currentDate).length;
      dailyCounts.push({ date: currentDate, count });
    }
    
    setDailyBookings(dailyCounts);
    
    // Filter feedbacks based on date range
    const filteredFeedbacks = feedbacks.filter((feedback: any) => {
      const feedbackDate = feedback.date.split('T')[0]; // Extract date part
      return feedbackDate >= startDate && feedbackDate <= endDate;
    });
    
    // Calculate feedback statistics
    const totalFeedbacks = filteredFeedbacks.length;
    let ratingSum = 0;
    const ratingCounts: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    filteredFeedbacks.forEach((feedback: any) => {
      ratingSum += feedback.rating;
      ratingCounts[feedback.rating as keyof RatingCounts]++;
    });
    
    setFeedbackStats({
      averageRating: totalFeedbacks > 0 ? parseFloat((ratingSum / totalFeedbacks).toFixed(1)) : 0,
      totalFeedbacks,
      ratingDistribution: ratingCounts
    });
    
  }, [bookings, feedbacks, startDate, endDate, mealTypeFilter]);
  
  // Handle export reports
  const handleExportReport = () => {
    try {
      // Prepare data for export
      const exportData: ExportDataRow[] = bookings.filter((booking: any) => {
        const bookingDate = booking.date;
        const isInDateRange = bookingDate >= startDate && bookingDate <= endDate;
        const matchesMealType = mealTypeFilter === 'all' || booking.type === mealTypeFilter;
        
        return isInDateRange && matchesMealType;
      }).map((booking: any) => ({
        'Student ID': booking.userId,
        'Meal Type': booking.type,
        'Date': booking.date,
        'Status': booking.status,
        'Created At': booking.createdAt
      }));

      if (exportData.length === 0) {
        toast.error('No data to export for the selected filters');
        return;
      }

      // Convert to CSV
      const headers = Object.keys(exportData[0]) as Array<keyof ExportDataRow>;
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => 
            JSON.stringify(row[header])
          ).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `meal_bookings_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };
  
  // Render bar chart for rating distribution
  const renderRatingBars = () => {
    const maxCount = Math.max(
      feedbackStats.ratingDistribution[1],
      feedbackStats.ratingDistribution[2],
      feedbackStats.ratingDistribution[3],
      feedbackStats.ratingDistribution[4],
      feedbackStats.ratingDistribution[5]
    );
    
    return (
      <div className="pt-4">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = feedbackStats.ratingDistribution[rating as keyof typeof feedbackStats.ratingDistribution];
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={rating} className="mb-3">
              <div className="flex items-center mb-1">
                <span className="w-5 text-sm text-gray-700">{rating}</span>
                <div className="w-full bg-gray-200 rounded-full h-4 ml-2">
                  <div 
                    className="bg-amber-500 h-4 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm text-gray-700 w-8 text-right">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render simple bar chart for daily bookings
  const renderDailyBookingChart = () => {
    const maxCount = Math.max(...dailyBookings.map(day => day.count), 1);
    
    return (
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="flex items-end space-x-2" style={{ minWidth: `${dailyBookings.length * 20}px` }}>
          {dailyBookings.map((day, index) => {
            const height = (day.count / maxCount) * 120;
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-6 bg-emerald-500 rounded-t"
                  style={{ height: `${Math.max(height, 4)}px` }}
                ></div>
                {dailyBookings.length <= 14 && (
                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                    {format(new Date(day.date), 'MM/dd')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <AdminLayout
      title="Reports & Analytics"
      subtitle="Monitor system performance and gather insights"
      actionButton={
        <Button
          onClick={handleExportReport}
          className="flex items-center"
        >
          <Download size={18} className="mr-2" />
          Export Report
        </Button>
      }
    >
      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-sm text-gray-500 mb-2">Date Range</p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={dateRange === '7days' ? 'primary' : 'outline'}
                  onClick={() => setDateRange('7days')}
                >
                  7 Days
                </Button>
                <Button
                  size="sm"
                  variant={dateRange === '30days' ? 'primary' : 'outline'}
                  onClick={() => setDateRange('30days')}
                >
                  30 Days
                </Button>
                <Button
                  size="sm"
                  variant={dateRange === '90days' ? 'primary' : 'outline'}
                  onClick={() => setDateRange('90days')}
                >
                  90 Days
                </Button>
                <Button
                  size="sm"
                  variant={dateRange === 'custom' ? 'primary' : 'outline'}
                  onClick={() => setDateRange('custom')}
                >
                  Custom
                </Button>
              </div>
            </div>
            
            {dateRange === 'custom' && (
              <div className="flex space-x-2">
                <Input
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                />
              </div>
            )}
            
            <div className="ml-auto">
              <p className="text-sm text-gray-500 mb-2">Meal Type</p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={mealTypeFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setMealTypeFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={mealTypeFilter === 'breakfast' ? 'primary' : 'outline'}
                  onClick={() => setMealTypeFilter('breakfast')}
                >
                  Breakfast
                </Button>
                <Button
                  size="sm"
                  variant={mealTypeFilter === 'lunch' ? 'primary' : 'outline'}
                  onClick={() => setMealTypeFilter('lunch')}
                >
                  Lunch
                </Button>
                <Button
                  size="sm"
                  variant={mealTypeFilter === 'dinner' ? 'primary' : 'outline'}
                  onClick={() => setMealTypeFilter('dinner')}
                >
                  Dinner
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="col-span-1 md:col-span-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
                  <h3 className="text-3xl font-bold text-gray-900">{bookingStats.total}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
                  <Calendar size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Consumption Rate</p>
                  <h3 className="text-3xl font-bold text-gray-900">{bookingStats.consumptionRate}%</h3>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700">
                  <TrendingUp size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cancellation Rate</p>
                  <h3 className="text-3xl font-bold text-gray-900">{bookingStats.cancellationRate}%</h3>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-red-700">
                  <Filter size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg. Rating</p>
                  <h3 className="text-3xl font-bold text-gray-900">{feedbackStats.averageRating}/5</h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg text-amber-700">
                  <MessageSquare size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Main Content - Charts and Data */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Booking Trends */}
        <div className="col-span-1 md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
              <CardDescription>
                Daily booking count for the selected period
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {dailyBookings.length > 0 ? (
                renderDailyBookingChart()
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <p className="text-gray-500">No booking data available for the selected period</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="text-sm text-gray-500 border-t pt-4">
              <div className="w-full flex justify-between">
                <span>Total: {bookingStats.total} bookings</span>
                <span>Period: {startDate} to {endDate}</span>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Meal Type Distribution */}
        <div className="col-span-1 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Meal Distribution</CardTitle>
              <CardDescription>
                Breakdown by meal type
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="py-2 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Breakfast</span>
                    <span className="text-sm text-gray-600">{mealTypeDistribution.breakfast} meals</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full" 
                      style={{ 
                        width: bookingStats.total > 0 
                          ? `${(mealTypeDistribution.breakfast / bookingStats.total) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Lunch</span>
                    <span className="text-sm text-gray-600">{mealTypeDistribution.lunch} meals</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full" 
                      style={{ 
                        width: bookingStats.total > 0 
                          ? `${(mealTypeDistribution.lunch / bookingStats.total) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Dinner</span>
                    <span className="text-sm text-gray-600">{mealTypeDistribution.dinner} meals</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ 
                        width: bookingStats.total > 0 
                          ? `${(mealTypeDistribution.dinner / bookingStats.total) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-xs text-gray-600">Breakfast</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-xs text-gray-600">Lunch</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs text-gray-600">Dinner</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Booking Status */}
        <div className="col-span-1 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
              <CardDescription>
                Breakdown by booking outcome
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-center mt-2">
                <div className="relative w-40 h-40">
                  {/* Simple donut chart */}
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    {/* Background circle */}
                    <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f3f4f6" strokeWidth="3"></circle>
                    
                    {/* Display pie segments only if there's data */}
                    {bookingStats.total > 0 && (
                      <>
                        {/* Consumed segment */}
                        <circle 
                          cx="18" cy="18" r="15.91549430918954" fill="transparent"
                          stroke="#10b981" strokeWidth="3"
                          strokeDasharray={`${(bookingStats.consumed / bookingStats.total) * 100} 100`}
                          strokeDashoffset="25"
                        ></circle>
                        
                        {/* Cancelled segment */}
                        <circle 
                          cx="18" cy="18" r="15.91549430918954" fill="transparent"
                          stroke="#ef4444" strokeWidth="3"
                          strokeDasharray={`${(bookingStats.cancelled / bookingStats.total) * 100} 100`}
                          strokeDashoffset={`${100 - (bookingStats.consumed / bookingStats.total) * 100 + 25}`}
                        ></circle>
                        
                        {/* Booked segment */}
                        <circle 
                          cx="18" cy="18" r="15.91549430918954" fill="transparent"
                          stroke="#3b82f6" strokeWidth="3"
                          strokeDasharray={`${((bookingStats.total - bookingStats.consumed - bookingStats.cancelled) / bookingStats.total) * 100} 100`}
                          strokeDashoffset={`${100 - (bookingStats.consumed / bookingStats.total) * 100 - (bookingStats.cancelled / bookingStats.total) * 100 + 25}`}
                        ></circle>
                      </>
                    )}
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{bookingStats.total}</span>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Booked</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {bookingStats.total - bookingStats.consumed - bookingStats.cancelled}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({bookingStats.total > 0 
                        ? Math.round(((bookingStats.total - bookingStats.consumed - bookingStats.cancelled) / bookingStats.total) * 100) 
                        : 0}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-sm">Consumed</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{bookingStats.consumed}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({bookingStats.consumptionRate}%)
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Cancelled</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{bookingStats.cancelled}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({bookingStats.cancellationRate}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Feedback Analysis */}
        <div className="col-span-1 md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Analysis</CardTitle>
              <CardDescription>
                Student feedback and ratings for the selected period
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="col-span-1 md:col-span-5">
                  <div className="text-center py-4">
                    <div className="text-5xl font-bold text-amber-500 mb-2">
                      {feedbackStats.averageRating}
                    </div>
                    <div className="flex justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className="text-amber-400 text-2xl">
                          {star <= Math.round(feedbackStats.averageRating) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Based on {feedbackStats.totalFeedbacks} reviews
                    </p>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-7">
                  <div className="h-full flex flex-col justify-center">
                    {renderRatingBars()}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-3">Recent Comments</h4>
                
                {feedbacks.length > 0 ? (
                  <div className="space-y-3">
                    {feedbacks
                      .filter((f: any) => f.comment)
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 3)
                      .map((feedback: any) => (
                        <div key={feedback.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <span className="text-amber-500 mr-1">★</span>
                              <span className="text-sm">{feedback.rating}/5</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {format(new Date(feedback.date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">"{feedback.comment}"</p>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No feedback comments available for the selected period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Metrics */}
        <div className="col-span-1 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key indicators and statistics
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Booking Efficiency</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Bookings per Day</span>
                    <span className="text-sm font-medium">
                      {dailyBookings.length > 0 
                        ? (bookingStats.total / dailyBookings.length).toFixed(1) 
                        : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Most Popular Meal</span>
                    <span className="text-sm font-medium capitalize">
                      {Object.entries(mealTypeDistribution)
                        .sort((a, b) => b[1] - a[1])[0][0]}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Feedback Quality</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Feedback Rate</span>
                    <span className="text-sm font-medium">
                      {bookingStats.consumed > 0 
                        ? `${Math.round((feedbackStats.totalFeedbacks / bookingStats.consumed) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Positive Ratings (4-5★)</span>
                    <span className="text-sm font-medium">
                      {feedbackStats.totalFeedbacks > 0 
                        ? `${Math.round(((feedbackStats.ratingDistribution[4] + feedbackStats.ratingDistribution[5]) / feedbackStats.totalFeedbacks) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Negative Ratings (1-2★)</span>
                    <span className="text-sm font-medium">
                      {feedbackStats.totalFeedbacks > 0 
                        ? `${Math.round(((feedbackStats.ratingDistribution[1] + feedbackStats.ratingDistribution[2]) / feedbackStats.totalFeedbacks) * 100)}%` 
                        : '0%'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Time Analysis</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Report Period</span>
                    <span className="text-sm font-medium">
                      {differenceInDays(new Date(endDate), new Date(startDate)) + 1} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Last Updated</span>
                    <span className="text-sm font-medium">
                      {format(new Date(), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                fullWidth
                variant="outline"
                onClick={handleExportReport}
                className="flex items-center justify-center"
              >
                <Download size={16} className="mr-2" />
                Export Detailed Metrics
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;