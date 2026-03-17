import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Coffee, Utensils, UtensilsCrossed, Save, Plus, X, Edit2, Calendar } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useMeals } from '../../contexts/MealContext';
import toast from 'react-hot-toast';
import { WeeklyMenuItem } from '../../types';
import AIMenuPlanner from '../../components/admin/AIMenuPlanner';

// Memoized Meal Section Component
interface MealSectionProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  items: string[];
  editMode: boolean;
  saving: boolean;
  onItemChange: (type: 'breakfast' | 'lunch' | 'dinner', index: number, value: string) => void;
  onAddItem: (type: 'breakfast' | 'lunch' | 'dinner') => void;
  onRemoveItem: (type: 'breakfast' | 'lunch' | 'dinner', index: number) => void;
}

const MealSection: React.FC<MealSectionProps> = memo(({
  mealType,
  title,
  icon,
  iconColor,
  items,
  editMode,
  saving,
  onItemChange,
  onAddItem,
  onRemoveItem
}) => {
  const getBorderColor = () => {
    switch (mealType) {
      case 'breakfast': return 'border-amber-200';
      case 'lunch': return 'border-emerald-200';
      case 'dinner': return 'border-blue-200';
    }
  };

  const getBgColor = () => {
    switch (mealType) {
      case 'breakfast': return 'bg-amber-50';
      case 'lunch': return 'bg-emerald-50';
      case 'dinner': return 'bg-blue-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBorderColor()} ${getBgColor()}`}>
      <div className="flex items-center mb-4">
        <span className={iconColor}>{icon}</span>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      
      {editMode ? (
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 italic mb-2">No items added yet. Click "Add Item" to start.</p>
          )}
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
              <span className="text-gray-400 text-sm font-medium min-w-[24px]">
                {index + 1}.
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => onItemChange(mealType, index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
                aria-label={`${title} item ${index + 1}`}
                placeholder={`Enter ${title.toLowerCase()} item`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(mealType, index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={saving}
                aria-label={`Remove ${title} item ${index + 1}`}
              >
                <X size={18} />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddItem(mealType)}
            className="flex items-center mt-3 hover:bg-white"
            disabled={saving}
          >
            <Plus size={16} className="mr-1" />
            Add Item
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.length === 0 ? (
            <li className="text-sm text-gray-500 italic">No items available</li>
          ) : (
            items.map((item, index) => (
              <li key={index} className="flex items-start py-1.5 bg-white px-3 rounded-md">
                <span className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${
                  mealType === 'breakfast' ? 'bg-amber-500' :
                  mealType === 'lunch' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}></span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
});

MealSection.displayName = 'MealSection';

const MenuManagementPage: React.FC = () => {
  const { weeklyMenu, loading, error, updateWeeklyMenu } = useMeals();
  
  const initialDay = useMemo(() => weeklyMenu?.[0]?.day ?? 'monday', [weeklyMenu]);
  const [selectedDay, setSelectedDay] = useState<WeeklyMenuItem['day']>(initialDay);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState({
    breakfast: weeklyMenu?.[0]?.breakfast ? [...weeklyMenu[0].breakfast] : [],
    lunch: weeklyMenu?.[0]?.lunch ? [...weeklyMenu[0].lunch] : [],
    dinner: weeklyMenu?.[0]?.dinner ? [...weeklyMenu[0].dinner] : []
  });

  // Sync local state when weeklyMenu changes (e.g., after load)
  useEffect(() => {
    const dayMenu = weeklyMenu.find(m => m.day === selectedDay) ?? weeklyMenu[0];
    if (dayMenu) {
      setSelectedDay(dayMenu.day);
      setMenuItems({
        breakfast: [...dayMenu.breakfast],
        lunch: [...dayMenu.lunch],
        dinner: [...dayMenu.dinner]
      });
      setEditMode(false);
    }
  }, [weeklyMenu, selectedDay]);
  
  // Handle day selection
  const handleDaySelect = useCallback((day: WeeklyMenuItem['day']) => {
    const dayMenu = weeklyMenu.find(m => m.day === day);
    
    if (dayMenu) {
      setSelectedDay(day);
      setMenuItems({
        breakfast: [...dayMenu.breakfast],
        lunch: [...dayMenu.lunch],
        dinner: [...dayMenu.dinner]
      });
      setEditMode(false);
    }
  }, [weeklyMenu]);
  
  // Toggle edit mode
  const handleToggleEditMode = useCallback(() => {
    setEditMode(!editMode);
  }, [editMode]);
  
  // Handle menu item change
  const handleMenuItemChange = useCallback((
    type: 'breakfast' | 'lunch' | 'dinner', 
    index: number, 
    value: string
  ) => {
    setMenuItems(prev => ({
      ...prev,
      [type]: prev[type].map((it, i) => (i === index ? value : it))
    }));
  }, []);
  
  // Add new menu item
  const handleAddMenuItem = useCallback((type: 'breakfast' | 'lunch' | 'dinner') => {
    setMenuItems(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  }, []);
  
  // Remove menu item
  const handleRemoveMenuItem = useCallback((type: 'breakfast' | 'lunch' | 'dinner', index: number) => {
    setMenuItems(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  }, []);
  
  // Keyboard navigation for day selection
  const handleDayKeyDown = useCallback((e: React.KeyboardEvent, currentDay: WeeklyMenuItem['day']) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = weeklyMenu.findIndex(m => m.day === currentDay);
      let nextIndex: number;
      
      if (e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % weeklyMenu.length;
      } else {
        nextIndex = (currentIndex - 1 + weeklyMenu.length) % weeklyMenu.length;
      }
      
      const nextDay = weeklyMenu[nextIndex];
      if (nextDay) {
        handleDaySelect(nextDay.day);
        // Focus the next button
        setTimeout(() => {
          const buttons = document.querySelectorAll('[data-day-button]');
          (buttons[nextIndex] as HTMLButtonElement)?.focus();
        }, 0);
      }
    }
  }, [weeklyMenu, handleDaySelect]);
  
  // Save menu changes
  const handleSaveMenu = useCallback(() => {
    // sanitize items: trim and remove empties
    const sanitize = (arr: string[]) => arr.map(i => i.trim()).filter(Boolean);
    const updatedForDay = {
      breakfast: sanitize(menuItems.breakfast),
      lunch: sanitize(menuItems.lunch),
      dinner: sanitize(menuItems.dinner)
    };

    const newWeeklyMenu = weeklyMenu.map(m =>
      m.day === selectedDay ? { ...m, ...updatedForDay } : m
    );

    setSaving(true);
    updateWeeklyMenu(newWeeklyMenu)
      .then(() => {
        toast.success('Menu updated successfully!');
        setEditMode(false);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : 'Failed to update menu');
      })
      .finally(() => setSaving(false));
  }, [weeklyMenu, selectedDay, menuItems, updateWeeklyMenu]);
  
  // Format day name with capitalization
  const formatDayName = useCallback((day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }, []);

  // Handle applying AI-generated menu
  const handleApplyAIMenu = useCallback((generatedMenus: any[]) => {
    if (!generatedMenus || generatedMenus.length === 0) return;

    // Map AI-generated menus to weekly menu format
    const dayMapping: { [key: string]: string } = {
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday'
    };

    const updatedWeeklyMenu = weeklyMenu.map(menu => {
      const generatedMenu = generatedMenus.find(m => 
        dayMapping[m.day]?.toLowerCase() === menu.day.toLowerCase()
      );
      
      if (generatedMenu) {
        return {
          ...menu,
          breakfast: generatedMenu.breakfast || menu.breakfast,
          lunch: generatedMenu.lunch || menu.lunch,
          dinner: generatedMenu.dinner || menu.dinner
        };
      }
      return menu;
    });

    setSaving(true);
    updateWeeklyMenu(updatedWeeklyMenu)
      .then(() => {
        toast.success('AI-generated menu applied successfully! 🎉');
        // Refresh current day's menu
        const updatedDay = updatedWeeklyMenu.find(m => m.day === selectedDay);
        if (updatedDay) {
          setMenuItems({
            breakfast: [...updatedDay.breakfast],
            lunch: [...updatedDay.lunch],
            dinner: [...updatedDay.dinner]
          });
        }
      })
      .catch((e) => {
        toast.error('Failed to apply AI menu: ' + (e instanceof Error ? e.message : 'Unknown error'));
      })
      .finally(() => setSaving(false));
  }, [weeklyMenu, selectedDay, updateWeeklyMenu]);
  
  return (
    <AdminLayout
      title="Menu Management"
      subtitle="Update and manage the weekly meal menu"
      actionButton={
        editMode ? (
          <Button
            onClick={handleSaveMenu}
            isLoading={saving}
            disabled={saving}
            className="flex items-center"
          >
            <Save size={18} className="mr-2" />
            Save Changes
          </Button>
        ) : (
          <Button
            onClick={handleToggleEditMode}
            variant="outline"
            className="flex items-center"
          >
            <Edit2 size={18} className="mr-2" />
            Edit Menu
          </Button>
        )
      }
    >
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* AI Menu Planner */}
      <AIMenuPlanner onApplyMenu={handleApplyAIMenu} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Day Selection */}
        <div className="col-span-1 md:col-span-3">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Select Day
              </CardTitle>
              <CardDescription>
                Choose a day to view or edit menu
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {weeklyMenu.length === 0 && (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">No weekly menu available.</div>
                )}
                {weeklyMenu.map(menu => (
                  <button
                    key={menu.day}
                    data-day-button
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                      selectedDay === menu.day
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                    }`}
                    onClick={() => handleDaySelect(menu.day)}
                    onKeyDown={(e) => handleDayKeyDown(e, menu.day)}
                    disabled={loading || saving}
                    aria-label={`Select ${formatDayName(menu.day)} menu`}
                  >
                    {formatDayName(menu.day)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Menu Display/Edit */}
        <div className="col-span-1 md:col-span-9">
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {formatDayName(selectedDay)} Menu
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {editMode ? '✏️ Edit menu items for each meal' : '👁️ View menu items for each meal'}
                  </CardDescription>
                </div>
                {!editMode && (
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    {menuItems.breakfast.length + menuItems.lunch.length + menuItems.dinner.length} items
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-6">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500">Loading menu...</p>
                    </div>
                  </div>
                )}
                
                {/* Breakfast */}
                <MealSection
                  mealType="breakfast"
                  title="Breakfast"
                  icon={<Coffee size={20} className="mr-2" />}
                  iconColor="text-amber-600"
                  items={menuItems.breakfast}
                  editMode={editMode}
                  saving={saving}
                  onItemChange={handleMenuItemChange}
                  onAddItem={handleAddMenuItem}
                  onRemoveItem={handleRemoveMenuItem}
                />
                
                {/* Lunch */}
                <MealSection
                  mealType="lunch"
                  title="Lunch"
                  icon={<Utensils size={20} className="mr-2" />}
                  iconColor="text-emerald-600"
                  items={menuItems.lunch}
                  editMode={editMode}
                  saving={saving}
                  onItemChange={handleMenuItemChange}
                  onAddItem={handleAddMenuItem}
                  onRemoveItem={handleRemoveMenuItem}
                />
                
                {/* Dinner */}
                <MealSection
                  mealType="dinner"
                  title="Dinner"
                  icon={<UtensilsCrossed size={20} className="mr-2" />}
                  iconColor="text-blue-600"
                  items={menuItems.dinner}
                  editMode={editMode}
                  saving={saving}
                  onItemChange={handleMenuItemChange}
                  onAddItem={handleAddMenuItem}
                  onRemoveItem={handleRemoveMenuItem}
                />
              </div>
            </CardContent>
            
            {editMode && (
              <CardFooter>
                <div className="flex justify-end space-x-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveMenu}
                    isLoading={saving}
                    disabled={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MenuManagementPage;