import { format } from 'date-fns';
import { MealBooking, Feedback, User } from '../types';

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export bookings data
 */
export const exportBookingsToCSV = (bookings: MealBooking[]) => {
  const data = bookings.map(booking => ({
    BookingID: booking.id,
    UserID: booking.userId,
    MealID: booking.mealId,
    Date: booking.date,
    Type: booking.type,
    Status: booking.status,
    CreatedAt: booking.createdAt
  }));
  
  exportToCSV(data, 'bookings_report');
};

/**
 * Export feedback data
 */
export const exportFeedbackToCSV = (feedbacks: Feedback[]) => {
  const data = feedbacks.map(feedback => ({
    FeedbackID: feedback.id,
    UserID: feedback.userId,
    MealID: feedback.mealId,
    Rating: feedback.rating,
    Comment: feedback.comment || 'N/A',
    Sentiment: feedback.sentiment?.sentiment || 'N/A',
    SentimentScore: feedback.sentiment?.score || 'N/A',
    Date: feedback.date
  }));
  
  exportToCSV(data, 'feedback_report');
};

/**
 * Export users data
 */
export const exportUsersToCSV = (users: User[]) => {
  const data = users.map(user => ({
    UserID: user.id,
    Name: user.name,
    Email: user.email,
    RoomNumber: user.roomNumber,
    Role: user.role,
    Status: user.status
  }));
  
  exportToCSV(data, 'users_report');
};

/**
 * Calculate daily booking trends for the last N days
 */
export const getDailyBookingTrends = (bookings: MealBooking[], days: number = 7) => {
  const today = new Date();
  const trends: { date: string; bookings: number; consumed: number; cancelled: number }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayBookings = bookings.filter(b => b.date === dateStr);
    
    trends.push({
      date: format(date, 'MMM dd'),
      bookings: dayBookings.length,
      consumed: dayBookings.filter(b => b.status === 'consumed').length,
      cancelled: dayBookings.filter(b => b.status === 'cancelled').length
    });
  }
  
  return trends;
};

/**
 * Calculate meal type distribution
 */
export const getMealTypeDistribution = (bookings: MealBooking[]) => {
  const distribution = {
    breakfast: 0,
    lunch: 0,
    dinner: 0
  };
  
  bookings.forEach(booking => {
    if (booking.status !== 'cancelled') {
      distribution[booking.type]++;
    }
  });
  
  return [
    { name: 'Breakfast', value: distribution.breakfast },
    { name: 'Lunch', value: distribution.lunch },
    { name: 'Dinner', value: distribution.dinner }
  ];
};

/**
 * Calculate booking status distribution
 */
export const getBookingStatusDistribution = (bookings: MealBooking[]) => {
  const distribution = {
    booked: 0,
    consumed: 0,
    cancelled: 0
  };
  
  bookings.forEach(booking => {
    distribution[booking.status]++;
  });
  
  return [
    { name: 'Booked', status: 'booked', count: distribution.booked, color: '#3B82F6' },
    { name: 'Consumed', status: 'consumed', count: distribution.consumed, color: '#10B981' },
    { name: 'Cancelled', status: 'cancelled', count: distribution.cancelled, color: '#EF4444' }
  ];
};

/**
 * Calculate rating distribution
 */
export const getRatingDistribution = (feedbacks: Feedback[]) => {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };
  
  feedbacks.forEach(feedback => {
    distribution[feedback.rating]++;
  });
  
  return [
    { rating: '1 Star', count: distribution[1] },
    { rating: '2 Stars', count: distribution[2] },
    { rating: '3 Stars', count: distribution[3] },
    { rating: '4 Stars', count: distribution[4] },
    { rating: '5 Stars', count: distribution[5] }
  ];
};

/**
 * Calculate sentiment distribution
 */
export const getSentimentDistribution = (feedbacks: Feedback[]) => {
  const distribution = {
    very_positive: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    very_negative: 0
  };
  
  feedbacks.forEach(feedback => {
    if (feedback.sentiment?.sentiment) {
      distribution[feedback.sentiment.sentiment]++;
    }
  });
  
  return [
    { name: 'Very Positive', value: distribution.very_positive, color: '#10B981' },
    { name: 'Positive', value: distribution.positive, color: '#84CC16' },
    { name: 'Neutral', value: distribution.neutral, color: '#F59E0B' },
    { name: 'Negative', value: distribution.negative, color: '#F97316' },
    { name: 'Very Negative', value: distribution.very_negative, color: '#EF4444' }
  ];
};

/**
 * Calculate weekly trends for the last N weeks
 */
export const getWeeklyTrends = (bookings: MealBooking[], weeks: number = 4) => {
  const trends: { week: string; bookings: number; consumed: number }[] = [];
  const today = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    });
    
    trends.push({
      week: `Week ${weeks - i}`,
      bookings: weekBookings.length,
      consumed: weekBookings.filter(b => b.status === 'consumed').length
    });
  }
  
  return trends;
};

/**
 * Calculate peak booking hours (approximate based on meal type)
 */
export const getPeakBookingHours = (bookings: MealBooking[]) => {
  const hourlyData = [
    { hour: '7-9 AM', bookings: 0, type: 'Breakfast' },
    { hour: '12-2 PM', bookings: 0, type: 'Lunch' },
    { hour: '7-9 PM', bookings: 0, type: 'Dinner' }
  ];
  
  bookings.forEach(booking => {
    if (booking.status !== 'cancelled') {
      if (booking.type === 'breakfast') hourlyData[0].bookings++;
      else if (booking.type === 'lunch') hourlyData[1].bookings++;
      else if (booking.type === 'dinner') hourlyData[2].bookings++;
    }
  });
  
  return hourlyData;
};

/**
 * Calculate average rating over time
 */
export const getAverageRatingTrends = (feedbacks: Feedback[], days: number = 7) => {
  const today = new Date();
  const trends: { date: string; avgRating: number }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayFeedbacks = feedbacks.filter(f => f.date === dateStr);
    
    const avgRating = dayFeedbacks.length > 0
      ? dayFeedbacks.reduce((sum, f) => sum + f.rating, 0) / dayFeedbacks.length
      : 0;
    
    trends.push({
      date: format(date, 'MMM dd'),
      avgRating: parseFloat(avgRating.toFixed(2))
    });
  }
  
  return trends;
};

/**
 * Get key performance indicators
 */
export const getKPIs = (bookings: MealBooking[], feedbacks: Feedback[], students: number) => {
  const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
  const consumedMeals = bookings.filter(b => b.status === 'consumed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  
  const consumptionRate = totalBookings > 0 ? (consumedMeals / totalBookings) * 100 : 0;
  const cancellationRate = (bookings.length > 0) ? (cancelledBookings / bookings.length) * 100 : 0;
  const avgBookingsPerStudent = students > 0 ? totalBookings / students : 0;
  
  const avgRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;
  
  const feedbackRate = totalBookings > 0 ? (feedbacks.length / totalBookings) * 100 : 0;
  
  return {
    consumptionRate: parseFloat(consumptionRate.toFixed(1)),
    cancellationRate: parseFloat(cancellationRate.toFixed(1)),
    avgBookingsPerStudent: parseFloat(avgBookingsPerStudent.toFixed(1)),
    avgRating: parseFloat(avgRating.toFixed(2)),
    feedbackRate: parseFloat(feedbackRate.toFixed(1))
  };
};
