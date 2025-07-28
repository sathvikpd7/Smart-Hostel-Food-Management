import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card.js';
import Button from '../ui/Button.js';
import { Download, Share2 } from 'lucide-react';
import { Meal, MealBooking } from '../../types/index.js';
import { format, parseISO } from 'date-fns';

interface QRCodeDisplayProps {
  booking: MealBooking;
  meal: Meal | undefined;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ booking, meal }) => {
  if (!meal) {
    return null;
  }
  const handleDownload = () => {
    const svg = document.getElementById('qr-code')?.outerHTML;
    if (!svg) return;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-qr-${booking.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Meal QR Code',
          text: `QR Code for ${meal.type} on ${meal.date}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Web Share API not supported in your browser');
    }
  };
  
  // Format meal type with capitalization
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  return (
    <Card>
      <CardHeader className="bg-blue-50 py-3">
        <CardTitle className="text-center text-blue-800">
          {formatMealType(meal.type)} QR Code
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center py-6">
        <p className="text-sm text-gray-500 mb-4">
          {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
        </p>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCode 
            id="qr-code"
            value={booking.qrCode} 
            size={180}
            level="H"
            style={{ margin: 'auto' }}
          />
        </div>
        
        <p className="mt-4 text-sm text-gray-700 text-center">
          Present this QR code to the dining hall staff when attending your meal.
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          onClick={handleDownload}
          className="flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleShare}
          className="flex items-center"
        >
          <Share2 size={16} className="mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeDisplay;