import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useMeals } from '../../contexts/MealContext.js';
import StudentLayout from '../../components/layout/StudentLayout.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.js';
import QRCodeDisplay from '../../components/student/QRCodeDisplay.js';
import Button from '../../components/ui/Button.js';
import { Meal, MealBooking } from '../../types/index.js';

type FilterStatus = 'all' | 'booked' | 'consumed' | 'cancelled';

const BookingHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { getBookingsByUser, meals } = useMeals();
  
  const [bookings, setBookings] = useState<MealBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<MealBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedBooking, setSelectedBooking] = useState<MealBooking | null>(null);
  
  // Load bookings on component mount
  useEffect(() => {
    if (user) {
      const userBookings = getBookingsByUser(user.id);
      
      // Sort by date (newest first)
      userBookings.sort((a: MealBooking, b: MealBooking) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setBookings(userBookings);
      setFilteredBookings(userBookings);
    }
  }, [user, getBookingsByUser]);
  
  // Apply filters when filter status changes
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === filterStatus));
    }
  }, [filterStatus, bookings]);
  
  // Handle filter change
  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
  };
  
  // Get status icon based on booking status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked':
        return <Clock size={16} className="text-blue-500" />;
      case 'consumed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };
  
  // Get status class based on booking status
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'consumed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // View QR code for a booking
  const handleViewQR = (booking: MealBooking) => {
    setSelectedBooking(booking);
  };
  
  // Close QR code modal
  const handleCloseModal = () => {
    setSelectedBooking(null);
  };
  
  return (
    <StudentLayout
      title="Booking History"
      subtitle="Review your meal bookings and their status"
    >
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle>Your Meal Bookings</CardTitle>
            
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <span className="text-sm text-gray-500 mr-1 hidden sm:inline">
                <Filter size={16} className="inline mr-1" />
                Filter:
              </span>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={filterStatus === 'all' ? 'primary' : 'outline'}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </Button>
                
                <Button
                  size="sm"
                  variant={filterStatus === 'booked' ? 'primary' : 'outline'}
                  onClick={() => handleFilterChange('booked')}
                >
                  Booked
                </Button>
                
                <Button
                  size="sm"
                  variant={filterStatus === 'consumed' ? 'primary' : 'outline'}
                  onClick={() => handleFilterChange('consumed')}
                >
                  Consumed
                </Button>
                
                <Button
                  size="sm"
                  variant={filterStatus === 'cancelled' ? 'primary' : 'outline'}
                  onClick={() => handleFilterChange('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3">Booking Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map(booking => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {format(parseISO(booking.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 capitalize">{booking.type}</td>
                      <td className="px-4 py-3">
                        {format(parseISO(booking.createdAt), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center w-fit ${getStatusClass(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {booking.status === 'booked' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleViewQR(booking)}
                          >
                            View QR
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No bookings found. 
                      {filterStatus !== 'all' && (
                        <span> Try changing the filter.</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* QR Code Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4">
              <QRCodeDisplay 
                booking={selectedBooking} 
                meal={meals.find(m => m.id === selectedBooking?.mealId)}
              />
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={handleCloseModal}
                  variant="outline"
                  fullWidth
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default BookingHistoryPage;