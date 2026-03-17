/**
 * PDF Export Service
 * Generates PDF reports for various types of data
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { User, MealBooking, Feedback, Meal } from '../types';

interface AttendanceReportData {
  studentName: string;
  roomNumber: string;
  totalBookings: number;
  consumed: number;
  cancelled: number;
  attendanceRate: string;
}

interface WasteAnalysisData {
  date: string;
  mealType: string;
  mealName: string;
  totalBooked: number;
  consumed: number;
  cancelled: number;
  noShow: number;
  wastePercentage: string;
}

interface FinancialReportData {
  studentName: string;
  roomNumber: string;
  totalMeals: number;
  costPerMeal: number;
  totalCost: number;
}

/**
 * Generate Attendance Report PDF
 */
export function generateAttendanceReportPDF(
  data: AttendanceReportData[],
  startDate: string,
  endDate: string
): void {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.text('Student Meal Attendance Report', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 28);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 34);
  
  // Add table
  autoTable(doc, {
    startY: 40,
    head: [['Student Name', 'Room', 'Total Bookings', 'Consumed', 'Cancelled', 'Attendance Rate']],
    body: data.map(row => [
      row.studentName,
      row.roomNumber,
      row.totalBookings.toString(),
      row.consumed.toString(),
      row.cancelled.toString(),
      row.attendanceRate
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });
  
  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 40;
  doc.setFontSize(10);
  doc.text(`Total Students: ${data.length}`, 14, finalY + 10);
  const totalBookings = data.reduce((sum, row) => sum + row.totalBookings, 0);
  const totalConsumed = data.reduce((sum, row) => sum + row.consumed, 0);
  doc.text(`Total Bookings: ${totalBookings}`, 14, finalY + 16);
  doc.text(`Total Consumed: ${totalConsumed}`, 14, finalY + 22);
  doc.text(`Overall Attendance: ${totalBookings > 0 ? ((totalConsumed / totalBookings) * 100).toFixed(1) : '0'}%`, 14, finalY + 28);
  
  // Save the PDF
  doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Generate Waste Analysis Report PDF
 */
export function generateWasteAnalysisReportPDF(
  data: WasteAnalysisData[],
  startDate: string,
  endDate: string
): void {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.text('Meal Waste Analysis Report', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 28);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 34);
  
  // Add table
  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Meal Type', 'Meal Name', 'Booked', 'Consumed', 'Cancelled', 'No-Show', 'Waste %']],
    body: data.map(row => [
      format(new Date(row.date), 'MMM dd'),
      row.mealType,
      row.mealName,
      row.totalBooked.toString(),
      row.consumed.toString(),
      row.cancelled.toString(),
      row.noShow.toString(),
      row.wastePercentage
    ]),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] },
    styles: { fontSize: 8 },
  });
  
  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 40;
  doc.setFontSize(10);
  const totalBooked = data.reduce((sum, row) => sum + row.totalBooked, 0);
  const totalConsumed = data.reduce((sum, row) => sum + row.consumed, 0);
  const totalCancelled = data.reduce((sum, row) => sum + row.cancelled, 0);
  const totalNoShow = data.reduce((sum, row) => sum + row.noShow, 0);
  const totalWaste = totalCancelled + totalNoShow;
  const wastePercentage = totalBooked > 0 ? ((totalWaste / totalBooked) * 100).toFixed(1) : '0';
  
  doc.text('Summary:', 14, finalY + 10);
  doc.text(`Total Meals Booked: ${totalBooked}`, 14, finalY + 16);
  doc.text(`Total Consumed: ${totalConsumed}`, 14, finalY + 22);
  doc.text(`Total Cancelled: ${totalCancelled}`, 14, finalY + 28);
  doc.text(`Total No-Shows: ${totalNoShow}`, 14, finalY + 34);
  doc.text(`Total Waste: ${totalWaste} (${wastePercentage}%)`, 14, finalY + 40);
  
  // Save the PDF
  doc.save(`waste-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Generate Financial Report PDF
 */
export function generateFinancialReportPDF(
  data: FinancialReportData[],
  costPerMeal: number,
  startDate: string,
  endDate: string
): void {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.text('Financial Report - Meal Costs', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 28);
  doc.text(`Cost per Meal: ₹${costPerMeal.toFixed(2)}`, 14, 34);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 40);
  
  // Add table
  autoTable(doc, {
    startY: 46,
    head: [['Student Name', 'Room', 'Total Meals', 'Cost/Meal', 'Total Cost']],
    body: data.map(row => [
      row.studentName,
      row.roomNumber,
      row.totalMeals.toString(),
      `₹${row.costPerMeal.toFixed(2)}`,
      `₹${row.totalCost.toFixed(2)}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 9 },
  });
  
  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 46;
  doc.setFontSize(10);
  const totalMeals = data.reduce((sum, row) => sum + row.totalMeals, 0);
  const totalRevenue = data.reduce((sum, row) => sum + row.totalCost, 0);
  
  doc.text('Financial Summary:', 14, finalY + 10);
  doc.text(`Total Students: ${data.length}`, 14, finalY + 16);
  doc.text(`Total Meals Consumed: ${totalMeals}`, 14, finalY + 22);
  doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 14, finalY + 28);
  doc.text(`Average per Student: ₹${data.length > 0 ? (totalRevenue / data.length).toFixed(2) : '0'}`, 14, finalY + 34);
  
  // Save the PDF
  doc.save(`financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Generate Combined Summary Report PDF
 */
export function generateSummaryReportPDF(
  users: User[],
  bookings: MealBooking[],
  meals: Meal[],
  feedbacks: Feedback[],
  startDate: string,
  endDate: string
): void {
  const doc = new jsPDF();
  
  // Filter data by date range
  const filteredBookings = bookings.filter(b => 
    b.date >= startDate && b.date <= endDate
  );
  
  const filteredFeedbacks = feedbacks.filter(f => 
    f.date >= startDate && f.date <= endDate
  );
  
  // Add header
  doc.setFontSize(20);
  doc.text('Hostel Food Management - Summary Report', 14, 20);
  
  doc.setFontSize(11);
  doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 28);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 34);
  
  // Statistics
  doc.setFontSize(14);
  doc.text('Overview Statistics', 14, 46);
  
  doc.setFontSize(10);
  const stats = [
    `Total Students: ${users.filter(u => u.role === 'student').length}`,
    `Total Bookings: ${filteredBookings.length}`,
    `Consumed Meals: ${filteredBookings.filter(b => b.status === 'consumed').length}`,
    `Cancelled Bookings: ${filteredBookings.filter(b => b.status === 'cancelled').length}`,
    `Active Bookings: ${filteredBookings.filter(b => b.status === 'booked').length}`,
    `Total Feedback: ${filteredFeedbacks.length}`,
    `Average Rating: ${filteredFeedbacks.length > 0 ? (filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / filteredFeedbacks.length).toFixed(2) : 'N/A'}`
  ];
  
  stats.forEach((stat, index) => {
    doc.text(stat, 14, 54 + (index * 6));
  });
  
  // Meal type breakdown
  const startY = 54 + (stats.length * 6) + 10;
  doc.setFontSize(14);
  doc.text('Meal Type Breakdown', 14, startY);
  
  const breakfastCount = filteredBookings.filter(b => b.type === 'breakfast').length;
  const lunchCount = filteredBookings.filter(b => b.type === 'lunch').length;
  const dinnerCount = filteredBookings.filter(b => b.type === 'dinner').length;
  
  autoTable(doc, {
    startY: startY + 6,
    head: [['Meal Type', 'Total Bookings', 'Percentage']],
    body: [
      ['Breakfast', breakfastCount.toString(), `${filteredBookings.length > 0 ? ((breakfastCount / filteredBookings.length) * 100).toFixed(1) : '0'}%`],
      ['Lunch', lunchCount.toString(), `${filteredBookings.length > 0 ? ((lunchCount / filteredBookings.length) * 100).toFixed(1) : '0'}%`],
      ['Dinner', dinnerCount.toString(), `${filteredBookings.length > 0 ? ((dinnerCount / filteredBookings.length) * 100).toFixed(1) : '0'}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Save the PDF
  doc.save(`summary-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
