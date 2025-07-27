import React, { useState, useEffect } from 'react';
import { Coffee, Utensils, UtensilsCrossed, Save, Plus, X, Edit2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import { useMeals } from '../../contexts/MealContext.js';
import { toast } from 'react-hot-toast';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof days[number];

const MenuManagementPage: React.FC = () => {
  const { weeklyMenu, updateWeeklyMenu } = useMeals();
  const [selectedDay, setSelectedDay] = useState<Day>('monday');
  const [editMode, setEditMode] = useState(false);
  const [menuItems, setMenuItems] = useState({
    breakfast: [] as string[],
    lunch: [] as string[],
    dinner: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize menu items when weeklyMenu or selectedDay changes
  useEffect(() => {
    if (weeklyMenu) {
      const dayMenu = weeklyMenu.find(m => m.day === selectedDay);
      if (dayMenu) {
        setMenuItems({
          breakfast: [...dayMenu.breakfast],
          lunch: [...dayMenu.lunch],
          dinner: [...dayMenu.dinner]
        });
      }
    }
  }, [selectedDay, weeklyMenu]);

  const handleDaySelect = (day: Day) => {
    setSelectedDay(day);
    setEditMode(false);
  };

  const handleMenuItemChange = (
    type: 'breakfast' | 'lunch' | 'dinner',
    index: number,
    value: string
  ) => {
    setMenuItems(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const handleAddMenuItem = (type: 'breakfast' | 'lunch' | 'dinner') => {
    setMenuItems(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const handleRemoveMenuItem = (type: 'breakfast' | 'lunch' | 'dinner', index: number) => {
    setMenuItems(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSaveMenu = async () => {
    if (!weeklyMenu) {
      toast.error('No menu data available');
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedMenu = weeklyMenu.map(menu => 
        menu.day === selectedDay 
          ? { ...menu, ...menuItems }
          : menu
      );

      await updateWeeklyMenu(updatedMenu);
      toast.success('Menu updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update menu:', error);
      toast.error('Failed to update menu');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <AdminLayout
      title="Menu Management"
      subtitle="Update and manage the weekly meal menu"
      actionButton={
        editMode ? (
          <Button
            onClick={handleSaveMenu}
            className="flex items-center"
            disabled={isLoading}
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        ) : (
          <Button
            onClick={() => setEditMode(true)}
            variant="outline"
            className="flex items-center"
          >
            <Edit2 size={18} className="mr-2" />
            Edit Menu
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Weekly Timetable View */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Menu Timetable</CardTitle>
            <CardDescription>
              {editMode ? 'Edit the weekly menu items' : 'View the weekly menu schedule'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakfast</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinner</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {days.map(day => {
                    const dayMenu = weeklyMenu?.find(m => m.day === day) || {
                      breakfast: [],
                      lunch: [],
                      dinner: []
                    };
                    
                    return (
                      <tr 
                        key={day}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedDay === day ? 'bg-blue-50' : ''}`}
                        onClick={() => handleDaySelect(day)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {formatDayName(day)}
                        </td>
                        <td className="px-6 py-4">
                          {editMode && selectedDay === day ? (
                            <div className="space-y-2">
                              {menuItems.breakfast.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleMenuItemChange('breakfast', index, e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                  />
                                  <button
                                    onClick={() => handleRemoveMenuItem('breakfast', index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddMenuItem('breakfast')}
                                className="text-blue-500 text-sm flex items-center mt-1"
                              >
                                <Plus size={14} className="mr-1" /> Add item
                              </button>
                            </div>
                          ) : (
                            <ul className="space-y-1">
                              {dayMenu.breakfast.map((item, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editMode && selectedDay === day ? (
                            <div className="space-y-2">
                              {menuItems.lunch.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleMenuItemChange('lunch', index, e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                  />
                                  <button
                                    onClick={() => handleRemoveMenuItem('lunch', index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddMenuItem('lunch')}
                                className="text-blue-500 text-sm flex items-center mt-1"
                              >
                                <Plus size={14} className="mr-1" /> Add item
                              </button>
                            </div>
                          ) : (
                            <ul className="space-y-1">
                              {dayMenu.lunch.map((item, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editMode && selectedDay === day ? (
                            <div className="space-y-2">
                              {menuItems.dinner.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleMenuItemChange('dinner', index, e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                  />
                                  <button
                                    onClick={() => handleRemoveMenuItem('dinner', index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddMenuItem('dinner')}
                                className="text-blue-500 text-sm flex items-center mt-1"
                              >
                                <Plus size={14} className="mr-1" /> Add item
                              </button>
                            </div>
                          ) : (
                            <ul className="space-y-1">
                              {dayMenu.dinner.map((item, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          {editMode && (
            <CardFooter className="bg-gray-50 px-6 py-3">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMenu}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default MenuManagementPage;