import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  initialRating?: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  initialRating = 0, 
  onChange,
  size = 'md',
  interactive = true
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  const handleClick = (selectedRating: number) => {
    if (!interactive) return;
    
    setRating(selectedRating);
    onChange(selectedRating);
  };
  
  const handleMouseEnter = (hoveredRating: number) => {
    if (!interactive) return;
    
    setHoverRating(hoveredRating);
  };
  
  const handleMouseLeave = () => {
    if (!interactive) return;
    
    setHoverRating(0);
  };
  
  const renderStar = (starNumber: number) => {
    const isActive = (hoverRating || rating) >= starNumber;
    
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };
    
    return (
      <Star
        key={starNumber}
        className={`
          ${sizeClasses[size]} 
          ${isActive ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          transition-all duration-150
          ${interactive ? 'cursor-pointer hover:scale-110' : ''}
        `}
        onClick={() => handleClick(starNumber)}
        onMouseEnter={() => handleMouseEnter(starNumber)}
        onMouseLeave={handleMouseLeave}
      />
    );
  };
  
  return (
    <div className="inline-flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map(starNumber => renderStar(starNumber))}
    </div>
  );
};

export default StarRating;