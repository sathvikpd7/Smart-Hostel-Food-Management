/**
 * AI-Powered Meal Recommendation Engine
 * Provides personalized meal recommendations based on user history and preferences
 */

import { Meal, MealBooking, Feedback, User } from '../types';

export interface DietaryPreference {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  nutFree?: boolean;
  spicyPreferred?: boolean;
  preferences?: string[]; // Custom preferences
  dislikes?: string[]; // Foods to avoid
}

export interface RecommendationScore {
  mealId: string;
  meal: Meal;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface MealPattern {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  frequency: number;
  averageRating: number;
  lastBooked?: string;
}

/**
 * Generate personalized meal recommendations for a user
 */
export function generateRecommendations(
  availableMeals: Meal[],
  userBookings: MealBooking[],
  userFeedbacks: Feedback[],
  dietaryPreferences?: DietaryPreference,
  topN: number = 5
): RecommendationScore[] {
  const recommendations: RecommendationScore[] = [];

  // Analyze user patterns
  const mealPatterns = analyzeMealPatterns(userBookings, userFeedbacks);
  const favoriteIngredients = extractFavoriteIngredients(userBookings, userFeedbacks);
  const dislikedIngredients = extractDislikedIngredients(userFeedbacks);

  // Score each available meal
  for (const meal of availableMeals) {
    const score = calculateMealScore(
      meal,
      mealPatterns,
      favoriteIngredients,
      dislikedIngredients,
      dietaryPreferences,
      userBookings,
      userFeedbacks
    );

    if (score.score > 0) {
      recommendations.push(score);
    }
  }

  // Sort by score (highest first) and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Analyze user's meal booking patterns
 */
function analyzeMealPatterns(
  bookings: MealBooking[],
  feedbacks: Feedback[]
): Map<string, MealPattern> {
  const patterns = new Map<string, MealPattern>();

  // Group by meal type
  const typeGroups: Record<string, MealBooking[]> = {
    breakfast: [],
    lunch: [],
    dinner: []
  };

  bookings.forEach(booking => {
    if (typeGroups[booking.type]) {
      typeGroups[booking.type].push(booking);
    }
  });

  // Calculate patterns for each meal type
  for (const [type, typeBookings] of Object.entries(typeGroups)) {
    if (typeBookings.length === 0) continue;

    // Get feedbacks for these bookings
    const typeFeedbacks = feedbacks.filter(f =>
      typeBookings.some(b => b.mealId === f.mealId)
    );

    const averageRating = typeFeedbacks.length > 0
      ? typeFeedbacks.reduce((sum, f) => sum + f.rating, 0) / typeFeedbacks.length
      : 3;

    const lastBooked = typeBookings
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

    patterns.set(type, {
      mealType: type as 'breakfast' | 'lunch' | 'dinner',
      frequency: typeBookings.length,
      averageRating,
      lastBooked
    });
  }

  return patterns;
}

/**
 * Extract favorite ingredients based on high-rated meals
 */
function extractFavoriteIngredients(
  bookings: MealBooking[],
  feedbacks: Feedback[]
): string[] {
  const favorites: Map<string, number> = new Map();

  // Get highly rated feedbacks (4-5 stars)
  const highRatedFeedbacks = feedbacks.filter(f => f.rating >= 4);

  highRatedFeedbacks.forEach(feedback => {
    // Extract keywords from positive feedback
    if (feedback.comment) {
      const keywords = extractKeywords(feedback.comment);
      keywords.forEach(keyword => {
        favorites.set(keyword, (favorites.get(keyword) || 0) + 1);
      });
    }

    // Extract from sentiment keywords if available
    if (feedback.sentiment?.keywords) {
      feedback.sentiment.keywords.forEach(keyword => {
        favorites.set(keyword, (favorites.get(keyword) || 0) + 1);
      });
    }
  });

  // Return top favorites
  return Array.from(favorites.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

/**
 * Extract disliked ingredients based on low-rated meals
 */
function extractDislikedIngredients(feedbacks: Feedback[]): string[] {
  const dislikes: Map<string, number> = new Map();

  // Get low rated feedbacks (1-2 stars)
  const lowRatedFeedbacks = feedbacks.filter(f => f.rating <= 2);

  lowRatedFeedbacks.forEach(feedback => {
    if (feedback.comment) {
      const keywords = extractKeywords(feedback.comment);
      keywords.forEach(keyword => {
        dislikes.set(keyword, (dislikes.get(keyword) || 0) + 1);
      });
    }

    if (feedback.sentiment?.keywords) {
      feedback.sentiment.keywords.forEach(keyword => {
        dislikes.set(keyword, (dislikes.get(keyword) || 0) + 1);
      });
    }
  });

  return Array.from(dislikes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const normalized = text.toLowerCase();

  // Common food-related keywords
  const foodKeywords = [
    'rice', 'bread', 'roti', 'dal', 'curry', 'chicken', 'paneer',
    'vegetables', 'salad', 'soup', 'pasta', 'noodles', 'biryani',
    'idli', 'dosa', 'sambar', 'chutney', 'paratha', 'poha',
    'upma', 'sandwich', 'egg', 'fish', 'mutton', 'prawn',
    'mushroom', 'potato', 'tomato', 'onion', 'garlic', 'ginger',
    'spicy', 'mild', 'sweet', 'tangy', 'crispy', 'soft', 'hot'
  ];

  foodKeywords.forEach(keyword => {
    if (normalized.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords;
}

/**
 * Calculate recommendation score for a meal
 */
function calculateMealScore(
  meal: Meal,
  patterns: Map<string, MealPattern>,
  favorites: string[],
  dislikes: string[],
  dietaryPreferences: DietaryPreference | undefined,
  bookings: MealBooking[],
  feedbacks: Feedback[]
): RecommendationScore {
  let score = 50; // Base score
  const reasons: string[] = [];

  // 1. Meal type preference (based on past bookings)
  const typePattern = patterns.get(meal.type);
  if (typePattern) {
    if (typePattern.frequency > 5) {
      score += 15;
      reasons.push(`You frequently book ${meal.type}`);
    }
    if (typePattern.averageRating >= 4) {
      score += 10;
      reasons.push(`High satisfaction with ${meal.type}`);
    }
  }

  // 2. Check dietary preferences
  if (dietaryPreferences) {
    const mealText = `${meal.name || ''} ${meal.menuItems.join(' ')} ${meal.description}`.toLowerCase();

    // Vegetarian check
    if (dietaryPreferences.vegetarian) {
      const nonVegKeywords = ['chicken', 'mutton', 'fish', 'egg', 'meat', 'prawn', 'lamb', 'beef', 'pork'];
      const hasNonVeg = nonVegKeywords.some(kw => mealText.includes(kw));
      if (hasNonVeg) {
        score -= 40;
        reasons.push('Contains non-vegetarian items');
      } else {
        score += 15;
        reasons.push('Vegetarian option');
      }
    }

    // Vegan check
    if (dietaryPreferences.vegan) {
      const nonVeganKeywords = ['milk', 'butter', 'ghee', 'cheese', 'paneer', 'curd', 'yogurt', 'egg'];
      const hasNonVegan = nonVeganKeywords.some(kw => mealText.includes(kw));
      if (hasNonVegan) {
        score -= 35;
        reasons.push('Contains dairy/animal products');
      } else {
        score += 10;
        reasons.push('Vegan friendly');
      }
    }

    // Spicy preference
    if (dietaryPreferences.spicyPreferred !== undefined) {
      const spicyKeywords = ['spicy', 'chili', 'hot', 'pepper', 'masala'];
      const isSpicy = spicyKeywords.some(kw => mealText.includes(kw));
      
      if (dietaryPreferences.spicyPreferred && isSpicy) {
        score += 10;
        reasons.push('Matches your spicy preference');
      } else if (!dietaryPreferences.spicyPreferred && isSpicy) {
        score -= 15;
        reasons.push('Might be too spicy');
      }
    }

    // Custom dislikes
    if (dietaryPreferences.dislikes && dietaryPreferences.dislikes.length > 0) {
      const hasDisliked = dietaryPreferences.dislikes.some(dislike =>
        mealText.includes(dislike.toLowerCase())
      );
      if (hasDisliked) {
        score -= 30;
        reasons.push('Contains ingredients you dislike');
      }
    }
  }

  // 3. Favorite ingredients
  const mealTextLower = `${meal.name || ''} ${meal.menuItems.join(' ')} ${meal.description}`.toLowerCase();
  let favoriteMatches = 0;
  favorites.forEach(fav => {
    if (mealTextLower.includes(fav.toLowerCase())) {
      favoriteMatches++;
    }
  });
  if (favoriteMatches > 0) {
    score += favoriteMatches * 8;
    reasons.push(`Contains ${favoriteMatches} of your favorite ingredients`);
  }

  // 4. Disliked ingredients
  let dislikeMatches = 0;
  dislikes.forEach(dislike => {
    if (mealTextLower.includes(dislike.toLowerCase())) {
      dislikeMatches++;
    }
  });
  if (dislikeMatches > 0) {
    score -= dislikeMatches * 12;
    reasons.push(`Contains ingredients you previously disliked`);
  }

  // 5. Variety bonus (haven't had recently)
  const recentBookings = bookings
    .filter(b => b.mealId === meal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (recentBookings.length === 0) {
    score += 12;
    reasons.push('New meal - try something different!');
  } else {
    const daysSinceLastBooking = Math.floor(
      (new Date().getTime() - new Date(recentBookings[0].date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastBooking > 14) {
      score += 8;
      reasons.push(`Haven't tried this in ${daysSinceLastBooking} days`);
    } else if (daysSinceLastBooking < 3) {
      score -= 10;
      reasons.push('Recently consumed');
    }
  }

  // 6. Global feedback score
  const mealFeedbacks = feedbacks.filter(f => f.mealId === meal.id);
  if (mealFeedbacks.length > 0) {
    const avgRating = mealFeedbacks.reduce((sum, f) => sum + f.rating, 0) / mealFeedbacks.length;
    
    if (avgRating >= 4) {
      score += 12;
      reasons.push(`Highly rated (${avgRating.toFixed(1)}/5)`);
    } else if (avgRating >= 3.5) {
      score += 5;
      reasons.push(`Good ratings (${avgRating.toFixed(1)}/5)`);
    } else if (avgRating < 2.5) {
      score -= 10;
      reasons.push('Lower ratings from others');
    }
  }

  // 7. Time-based recommendations
  const currentHour = new Date().getHours();
  if (meal.type === 'breakfast' && currentHour >= 6 && currentHour < 10) {
    score += 5;
    reasons.push('Perfect timing for breakfast');
  } else if (meal.type === 'lunch' && currentHour >= 11 && currentHour < 14) {
    score += 5;
    reasons.push('Perfect timing for lunch');
  } else if (meal.type === 'dinner' && currentHour >= 17 && currentHour < 22) {
    score += 5;
    reasons.push('Perfect timing for dinner');
  }

  // Calculate confidence (0-1)
  const dataPoints = bookings.length + feedbacks.length;
  const confidence = Math.min(1, dataPoints / 20); // Max confidence at 20+ interactions

  // Normalize score to 0-100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    mealId: meal.id,
    meal,
    score: finalScore,
    reasons: reasons.slice(0, 3), // Top 3 reasons
    confidence
  };
}

/**
 * Get similar meals based on a reference meal
 */
export function getSimilarMeals(
  referenceMeal: Meal,
  availableMeals: Meal[],
  limit: number = 3
): Meal[] {
  const similarities: Array<{ meal: Meal; score: number }> = [];

  availableMeals.forEach(meal => {
    if (meal.id === referenceMeal.id) return;

    let score = 0;

    // Same meal type
    if (meal.type === referenceMeal.type) {
      score += 30;
    }

    // Similar menu items
    const refItems = referenceMeal.menuItems.map(i => i.toLowerCase());
    const mealItems = meal.menuItems.map(i => i.toLowerCase());
    
    refItems.forEach(item => {
      if (mealItems.some(mi => mi.includes(item) || item.includes(mi))) {
        score += 15;
      }
    });

    // Similar description keywords
    const refDesc = (referenceMeal.description || '').toLowerCase().split(' ');
    const mealDesc = (meal.description || '').toLowerCase().split(' ');
    
    const commonWords = refDesc.filter(word => 
      word.length > 3 && mealDesc.includes(word)
    );
    score += commonWords.length * 5;

    if (score > 20) {
      similarities.push({ meal, score });
    }
  });

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.meal);
}

/**
 * Get recommendation badge/label
 */
export function getRecommendationBadge(score: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (score >= 80) {
    return { label: 'Highly Recommended', color: 'green', icon: '⭐' };
  } else if (score >= 65) {
    return { label: 'Recommended', color: 'blue', icon: '👍' };
  } else if (score >= 50) {
    return { label: 'Good Match', color: 'teal', icon: '✓' };
  } else {
    return { label: 'Available', color: 'gray', icon: '○' };
  }
}

/**
 * Get explanation for recommendation
 */
export function getRecommendationExplanation(reasons: string[]): string {
  if (reasons.length === 0) return 'Based on available options';
  if (reasons.length === 1) return reasons[0];
  if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
  return `${reasons[0]}, ${reasons[1]}, and more`;
}
