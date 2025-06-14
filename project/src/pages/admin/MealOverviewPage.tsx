import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Calendar, Filter, Download } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useMeals } from '../../contexts/MealContext';
import { MealBooking } from '../../types';
import { toast } from 'react-hot-toast';

type FilterType = 'all' | 'breakfast' | 'lunch' | 'dinner';
type StatusFilter = 'all' | 'booked' | 'consumed' | 'cancelled';

type ExportDataRow = {
  'Student ID': string;
  'Meal Type': 'breakfast' | 'lunch' | 'dinner';
  'Date': string;
  'Status': 'consumed' | 'cancelled' | 'booked';
  'Created At': string;
};

const MealOverviewPage: React.FC = () => {
  const { bookings } = useMeals();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mealFilter, setMealFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [filteredBookings, setFilteredBookings] = useState<MealBooking[]>([]);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];
    
    // Filter by search term (room number or user ID)
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by meal type
    if (mealFilter !== 'all') {
      filtered = filtered.filter(booking => booking.type === mealFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(booking => booking.date === dateFilter);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredBookings(filtered);
  }, [bookings, searchTerm, mealFilter, statusFilter, dateFilter]);
  
  // Handle export
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData: ExportDataRow[] = filteredBookings.map(booking => ({
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
      link.setAttribute('download', `meal_bookings_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };
  
  return (
    <AdminLayout
      title="Meal Booking Overview"
      subtitle="Monitor and manage all meal bookings"
      actionButton={
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center"
        >
          <Download size={18} className="mr-2" />
          Export Data
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
            <CardTitle>All Meal Bookings</CardTitle>
            
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="w-full sm:w-auto">
                <Input
                  placeholder="Search by student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  leftIcon={<Calendar size={18} />}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="flex items-center mr-4">
              <span className="text-sm text-gray-500 mr-2">
                <Filter size={16} className="inline mr-1" />
                Meal Type:
              </span>
              
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={mealFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setMealFilter('all')}
                >
                  All
                </Button>
                
                <Button
                  size="sm"
                  variant={mealFilter === 'breakfast' ? 'primary' : 'outline'}
                  onClick={() => setMealFilter('breakfast')}
                >
                  Breakfast
                </Button>
                
                <Button
                  size="sm"
                  variant={mealFilter === 'lunch' ? 'primary' : 'outline'}
                  onClick={() => setMealFilter('lunch')}
                >
                  Lunch
                </Button>
                
                <Button
                  size="sm"
                  variant={mealFilter === 'dinner' ? 'primary' : 'outline'}
                  onClick={() => setMealFilter('dinner')}
                >
                  Dinner
                </Button>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">
                Status:
              </span>
              
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                
                <Button
                  size="sm"
                  variant={statusFilter === 'booked' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('booked')}
                >
                  Booked
                </Button>
                
                <Button
                  size="sm"
                  variant={statusFilter === 'consumed' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('consumed')}
                >
                  Consumed
                </Button>
                
                <Button
                  size="sm"
                  variant={statusFilter === 'cancelled' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Meal Type</th>
                  <th className="px-4 py-3">Booking Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {booking.userId}
                    </td>
                    <td className="px-4 py-3">
                      {booking.date}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {booking.type}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(booking.createdAt).toLocaleString()}
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
                
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No bookings found matching your filter criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default MealOverviewPage;