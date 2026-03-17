import { API_URL, getAuthHeaders } from './api';

/**
 * Generates optimized weekly menus based on various factors
 */

export interface MenuPlannerParams {
  budgetPerMeal?: number;
  dietaryPreferences?: string[];
  seasonalPreference?: boolean;
  optimizeFor?: 'nutrition' | 'cost' | 'satisfaction';
  excludeIngredients?: string[];
}

export interface GeneratedMenu {
  day: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  estimatedCost?: number;
  nutritionScore?: number;
}

export interface MenuPlanResponse {
  menus: GeneratedMenu[];
  insights: {
    totalEstimatedCost: number;
    avgNutritionScore: number;
    recommendations: string[];
  };
}

export const aiMenuPlannerService = {
  /**
   * Generate weekly menu using AI
   */
  async generateWeeklyMenu(params: MenuPlannerParams): Promise<MenuPlanResponse> {
    try {
      const response = await fetch(`${API_URL}/api/ai/menu-planner`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate menu');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating menu:', error);
      throw error;
    }
  },

  /**
   * Get current seasonal ingredients
   */
  getSeasonalIngredients(): string[] {
    const month = new Date().getMonth();
    
    // Simple seasonal mapping for Indian context
    if (month >= 2 && month <= 5) {
      // Summer (March-June)
      return ['cucumber', 'watermelon', 'mango', 'tomatoes', 'capsicum', 'bottle gourd'];
    } else if (month >= 6 && month <= 9) {
      // Monsoon (July-October)
      return ['corn', 'leafy greens', 'ridge gourd', 'bitter gourd', 'snake gourd'];
    } else {
      // Winter (November-February)
      return ['carrots', 'cauliflower', 'peas', 'beans', 'spinach', 'radish'];
    }
  },

  /**
   * Get popular dietary preferences
   */
  getCommonDietaryPreferences(): string[] {
    return [
      'Vegetarian',
      'Non-Vegetarian',
      'Vegan',
      'Jain (No onion/garlic)',
      'Gluten-Free',
      'High-Protein',
    ];
  },
};
