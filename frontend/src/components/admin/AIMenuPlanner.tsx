import React, { useState } from 'react';
import { Sparkles, DollarSign, Leaf, TrendingUp, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { aiMenuPlannerService, MenuPlannerParams, MenuPlanResponse } from '../../services/aiMenuPlanner';
import toast from 'react-hot-toast';

interface AIMenuPlannerProps {
  onMenuGenerated?: (menus: MenuPlanResponse) => void;
  onApplyMenu?: (menus: any[]) => void;
}

const AIMenuPlanner: React.FC<AIMenuPlannerProps> = ({ onMenuGenerated, onApplyMenu }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState<MenuPlanResponse | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [params, setParams] = useState<MenuPlannerParams>({
    budgetPerMeal: 50,
    dietaryPreferences: ['Vegetarian', 'Non-Vegetarian'],
    seasonalPreference: true,
    optimizeFor: 'satisfaction',
    excludeIngredients: [],
  });

  const [excludeInput, setExcludeInput] = useState('');

  const dietaryOptions = aiMenuPlannerService.getCommonDietaryPreferences();
  const seasonalIngredients = aiMenuPlannerService.getSeasonalIngredients();

  const handleGenerateMenu = async () => {
    if (!params.budgetPerMeal || params.budgetPerMeal < 20) {
      toast.error('Budget must be at least ₹20 per meal');
      return;
    }

    if (!params.dietaryPreferences || params.dietaryPreferences.length === 0) {
      toast.error('Please select at least one dietary preference');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiMenuPlannerService.generateWeeklyMenu(params);
      setGeneratedMenu(result);
      onMenuGenerated?.(result);
      setShowConfirmModal(true); // Show confirmation modal
      toast.success('AI Menu generated successfully! 🎉');
    } catch (error) {
      console.error('Error generating menu:', error);
      toast.error('Failed to generate menu. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDietaryToggle = (pref: string) => {
    setParams(prev => {
      const current = prev.dietaryPreferences || [];
      if (current.includes(pref)) {
        return { ...prev, dietaryPreferences: current.filter(p => p !== pref) };
      } else {
        return { ...prev, dietaryPreferences: [...current, pref] };
      }
    });
  };

  const handleAddExcludeIngredient = () => {
    if (excludeInput.trim()) {
      setParams(prev => ({
        ...prev,
        excludeIngredients: [...(prev.excludeIngredients || []), excludeInput.trim()]
      }));
      setExcludeInput('');
    }
  };

  const handleRemoveExcludeIngredient = (ingredient: string) => {
    setParams(prev => ({
      ...prev,
      excludeIngredients: (prev.excludeIngredients || []).filter(i => i !== ingredient)
    }));
  };

  const handleApplyMenu = () => {
    if (generatedMenu && onApplyMenu) {
      // Convert to the format expected by MenuManagementPage
      const formattedMenus = generatedMenu.menus.map(menu => ({
        day: menu.day,
        breakfast: menu.breakfast,
        lunch: menu.lunch,
        dinner: menu.dinner
      }));
      onApplyMenu(formattedMenus);
      toast.success('Menu applied to weekly schedule! Save to persist changes.');
      setShowConfirmModal(false);
      setShowPlanner(false);
      setGeneratedMenu(null);
    }
  };

  const handleCancelApply = () => {
    setShowConfirmModal(false);
    setGeneratedMenu(null);
  };

  if (!showPlanner) {
    return (
      <div className="mb-6">
        <Button
          onClick={() => setShowPlanner(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Menu Planner
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <CardTitle>AI Menu Planner</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlanner(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          Generate intelligent weekly menus based on preferences, budget, and student feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Budget per Meal (₹)
            </label>
            <Input
              type="number"
              value={params.budgetPerMeal}
              onChange={(e) => setParams(prev => ({ ...prev, budgetPerMeal: Number(e.target.value) }))}
              min={20}
              max={200}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: ₹40-60 per meal</p>
          </div>

          {/* Optimize For */}
          <div>
            <label htmlFor="optimize-select" className="flex items-center gap-2 text-sm font-medium mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Optimize For
            </label>
            <select
              id="optimize-select"
              value={params.optimizeFor}
              onChange={(e) => setParams(prev => ({ ...prev, optimizeFor: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="satisfaction">Student Satisfaction</option>
              <option value="nutrition">Nutritional Balance</option>
              <option value="cost">Cost Efficiency</option>
            </select>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div>
          <label className="text-sm font-medium mb-2 block">Dietary Preferences</label>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map(pref => (
              <button
                key={pref}
                onClick={() => handleDietaryToggle(pref)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${params.dietaryPreferences?.includes(pref)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Seasonal Preference */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="seasonal"
            checked={params.seasonalPreference}
            onChange={(e) => setParams(prev => ({ ...prev, seasonalPreference: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="seasonal" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <Leaf className="w-4 h-4 text-green-600" />
            Use Seasonal Ingredients
          </label>
        </div>

        {params.seasonalPreference && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-medium text-green-800 mb-1">Current Season's Ingredients:</p>
            <p className="text-xs text-green-700">{seasonalIngredients.join(', ')}</p>
          </div>
        )}

        {/* Exclude Ingredients */}
        <div>
          <label className="text-sm font-medium mb-2 block">Exclude Ingredients (Optional)</label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExcludeIngredient()}
              placeholder="e.g., peanuts, dairy"
              className="flex-1"
            />
            <Button
              onClick={handleAddExcludeIngredient}
              variant="outline"
              size="sm"
            >
              Add
            </Button>
          </div>
          {params.excludeIngredients && params.excludeIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {params.excludeIngredients.map(ingredient => (
                <span
                  key={ingredient}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                >
                  {ingredient}
                  <button
                    onClick={() => handleRemoveExcludeIngredient(ingredient)}
                    className="hover:text-red-900"
                    aria-label={`Remove ${ingredient}`}
                    title={`Remove ${ingredient}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateMenu}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating AI Menu...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Weekly Menu
            </>
          )}
        </Button>
      </CardContent>

      {/* Confirmation Modal */}
      {showConfirmModal && generatedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">AI Generated Menu</h2>
                    <p className="text-blue-100 text-sm">Review the weekly menu before applying</p>
                  </div>
                </div>
                <button
                  onClick={handleCancelApply}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Insights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">Total Weekly Cost</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₹{generatedMenu.insights.totalEstimatedCost}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Avg Nutrition Score</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {generatedMenu.insights.avgNutritionScore}/100
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {generatedMenu.insights.recommendations.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    💡 AI Recommendations:
                  </p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {generatedMenu.insights.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weekly Menu Preview */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Menu</h3>
                {generatedMenu.menus.map((menu, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900">{menu.day}</h4>
                      <div className="flex gap-3 text-sm font-medium">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          ₹{menu.estimatedCost}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          🎯 {menu.nutritionScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="font-semibold text-amber-700 mb-2 flex items-center gap-1">
                          ☀️ Breakfast
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {menu.breakfast.map((item, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-amber-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <p className="font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                          🍽️ Lunch
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {menu.lunch.map((item, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="font-semibold text-blue-700 mb-2 flex items-center gap-1">
                          🌙 Dinner
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {menu.dinner.map((item, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-blue-500">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t-2 border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Do you want to apply this menu to your weekly schedule?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCancelApply}
                    variant="outline"
                    className="px-6 py-2.5 border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    No, Cancel
                  </Button>
                  <Button
                    onClick={handleApplyMenu}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, Apply Menu
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIMenuPlanner;
