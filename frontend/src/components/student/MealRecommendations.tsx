import React from 'react';
import { Sparkles, TrendingUp, Star, Clock, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { RecommendationScore } from '../../services/mealRecommendation';
import { Meal } from '../../types';

interface MealRecommendationsProps {
  recommendations: RecommendationScore[];
  onSelectMeal: (meal: Meal) => void;
  loading?: boolean;
  showEmptyState?: boolean;
}

const MealRecommendations: React.FC<MealRecommendationsProps> = ({
  recommendations,
  onSelectMeal,
  loading = false,
  showEmptyState = false
}) => {
  if (loading) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 font-medium">Generating personalized recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    if (!showEmptyState) return null;
    return (
      <Card className="mb-6 bg-gray-50 border-gray-200">
        <CardContent className="py-6 text-center">
          <div className="text-sm text-gray-600">
            No recommendations yet. Add feedback or make a booking to personalize suggestions.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (score >= 65) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (score >= 50) return 'bg-teal-100 text-teal-700 border-teal-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getBadgeIcon = (score: number) => {
    if (score >= 80) return '⭐';
    if (score >= 65) return '👍';
    if (score >= 50) return '✓';
    return '○';
  };

  const getBadgeLabel = (score: number) => {
    if (score >= 80) return 'Highly Recommended';
    if (score >= 65) return 'Recommended';
    if (score >= 50) return 'Good Match';
    return 'Available';
  };

  const percentWidthClasses = [
    'w-[0%]', 'w-[5%]', 'w-[10%]', 'w-[15%]', 'w-[20%]',
    'w-[25%]', 'w-[30%]', 'w-[35%]', 'w-[40%]', 'w-[45%]',
    'w-[50%]', 'w-[55%]', 'w-[60%]', 'w-[65%]', 'w-[70%]',
    'w-[75%]', 'w-[80%]', 'w-[85%]', 'w-[90%]', 'w-[95%]',
    'w-[100%]'
  ];

  const getPercentWidthClass = (percentage: number) => {
    const normalized = Math.min(100, Math.max(0, Math.round(percentage / 5) * 5));
    return percentWidthClasses[normalized / 5];
  };

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const topRecommendation = recommendations[0];
  const otherRecommendations = recommendations.slice(1, 4);

  return (
    <div className="mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Personalized For You</h2>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
          AI Powered
        </span>
      </div>

      {/* Top Recommendation - Featured Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-shadow border-none">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur">
                <TrendingUp size={20} />
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  {topRecommendation.meal.name || formatMealType(topRecommendation.meal.type)}
                </CardTitle>
                <p className="text-white/80 text-sm mt-1">
                  {formatMealType(topRecommendation.meal.type)} • {topRecommendation.meal.time}
                </p>
              </div>
            </div>
            <div className="bg-white/90 px-3 py-1 rounded-full flex items-center gap-1">
              <span className="text-xl">{getBadgeIcon(topRecommendation.score)}</span>
              <span className="font-bold text-blue-700">{Math.round(topRecommendation.score)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Menu Items */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {topRecommendation.meal.menuItems.slice(0, 4).map((item, index) => (
                <span
                  key={index}
                  className="text-xs bg-white/20 backdrop-blur px-2 py-1 rounded-full text-white"
                >
                  {item}
                </span>
              ))}
              {topRecommendation.meal.menuItems.length > 4 && (
                <span className="text-xs bg-white/20 backdrop-blur px-2 py-1 rounded-full text-white">
                  +{topRecommendation.meal.menuItems.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Reasons */}
          {topRecommendation.reasons.length > 0 && (
            <div className="mb-4 space-y-1">
              {topRecommendation.reasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-white/90">
                  <ChefHat size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => onSelectMeal(topRecommendation.meal)}
            className="w-full bg-white text-blue-700 hover:bg-white/90 font-semibold"
          >
            Book This Meal
          </Button>
        </CardContent>
      </Card>

      {/* Other Recommendations - Compact Cards */}
      {otherRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {otherRecommendations.map((rec, index) => (
            <Card
              key={rec.mealId}
              className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-blue-300"
            >
              <CardContent className="p-4">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => onSelectMeal(rec.meal)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">
                        {rec.meal.name || formatMealType(rec.meal.type)}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatMealType(rec.meal.type)} • {rec.meal.time}
                      </p>
                    </div>
                    <span className={`text-lg flex-shrink-0 ml-2`}>
                      {getBadgeIcon(rec.score)}
                    </span>
                  </div>

                  {/* Match Score */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Match Score</span>
                      <span className="font-semibold text-blue-600">{Math.round(rec.score)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all ${getPercentWidthClass(rec.score)}`}
                      />
                    </div>
                  </div>

                  {/* Top Reason */}
                  {rec.reasons.length > 0 && (
                    <p className="text-xs text-gray-600 line-clamp-2 italic">
                      {rec.reasons[0]}
                    </p>
                  )}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-3">
        <Clock size={12} />
        <span>Recommendations update based on your preferences and feedback</span>
      </div>
    </div>
  );
};

export default MealRecommendations;
