import React, { useState } from 'react';
import { Coffee, Utensils, UtensilsCrossed, Save, Plus, X, Edit2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useMeals } from '../../contexts/MealContext';
import toast from 'react-hot-toast';
import { WeeklyMenuItem } from '../../types';

const MenuManagementPage: React.FC = () => {
  const { weeklyMenu, updateWeeklyMenu } = useMeals();
  
  // Initialize with default values if weeklyMenu is not available
  const [selectedDay, setSelectedDay] = useState<WeeklyMenuItem['day']>('monday');
  const [editMode, setEditMode] = useState(false);
  const [menuItems, setMenuItems] = useState<{
    breakfast: string[];
    lunch: string[];
    dinner: string[];
  }>({
    breakfast: [],
    lunch: [],
    dinner: []
  });
  
  // Handle day selection
  const handleDaySelect = (day: WeeklyMenuItem['day']) => {
    if (!weeklyMenu) {
      setSelectedDay(day);
      setMenuItems({
        breakfast: [],
        lunch: [],
        dinner: []
      });
      return;
    }

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
  };
  
  // Toggle edit mode
  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  // Handle menu item change
  const handleMenuItemChange = (
    type: 'breakfast' | 'lunch' | 'dinner', 
    index: number, 
    value: string
  ) => {
    const updatedItems = { ...menuItems };
    updatedItems[type] = [...updatedItems[type]];
    updatedItems[type][index] = value;
    setMenuItems(updatedItems);
  };
  
  // Add new menu item
  const handleAddMenuItem = (type: 'breakfast' | 'lunch' | 'dinner') => {
    const updatedItems = { ...menuItems };
    updatedItems[type] = [...updatedItems[type], ''];
    setMenuItems(updatedItems);
  };
  
  // Remove menu item
  const handleRemoveMenuItem = (type: 'breakfast' | 'lunch' | 'dinner', index: number) => {
    const updatedItems = { ...menuItems };
    updatedItems[type] = updatedItems[type].filter((_, i) => i !== index);
    setMenuItems(updatedItems);
  };
  
  // Save menu changes
  const handleSaveMenu = () => {
    if (!weeklyMenu) {
      toast.error('No menu data available');
      return;
    }

    // Update the menu directly
    const newMenu = weeklyMenu.map(menu => {
      if (menu.day === selectedDay) {
        return {
          ...menu,
          breakfast: menuItems.breakfast,
          lunch: menuItems.lunch,
          dinner: menuItems.dinner
        };
      }
      return menu;
    });

    // Update the menu through the context
    updateWeeklyMenu(newMenu).then(() => {
      toast.success('Menu updated successfully!');
    }).catch(_error => {
      toast.error('Failed to update menu');
    });

    // In a real app, you would make an API call to update the menu
    // For now, just show success message
    toast.success('Menu updated successfully!');
    setEditMode(false);
  };
  
  // Format day name with capitalization
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Day Selection */}
        <div className="col-span-1 md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Select Day</CardTitle>
              <CardDescription>
                Choose a day to view or edit menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <button
                    key={day}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedDay === day
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => handleDaySelect(day as WeeklyMenuItem['day'])}
                  >
                    {formatDayName(day)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Menu Display/Edit */}
        <div className="col-span-1 md:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>
                {formatDayName(selectedDay)} Menu
              </CardTitle>
              <CardDescription>
                {editMode ? 'Edit menu items for each meal' : 'View menu items for each meal'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-8">
                {/* Breakfast */}
                <div>
                  <div className="flex items-center mb-3">
                    <Coffee size={20} className="text-amber-600 mr-2" />
                    <h3 className="text-lg font-medium">Breakfast</h3>
                  </div>
                  
                  {editMode ? (
                    <div className="space-y-2">
                      {menuItems.breakfast.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleMenuItemChange('breakfast', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMenuItem('breakfast', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMenuItem('breakfast')}
                        className="flex items-center mt-2"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Item
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {menuItems.breakfast.map((item, index) => (
                        <li key={index} className="flex items-center py-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Lunch */}
                <div>
                  <div className="flex items-center mb-3">
                    <Utensils size={20} className="text-emerald-600 mr-2" />
                    <h3 className="text-lg font-medium">Lunch</h3>
                  </div>
                  
                  {editMode ? (
                    <div className="space-y-2">
                      {menuItems.lunch.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleMenuItemChange('lunch', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMenuItem('lunch', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMenuItem('lunch')}
                        className="flex items-center mt-2"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Item
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {menuItems.lunch.map((item, index) => (
                        <li key={index} className="flex items-center py-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Dinner */}
                <div>
                  <div className="flex items-center mb-3">
                    <UtensilsCrossed size={20} className="text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium">Dinner</h3>
                  </div>
                  
                  {editMode ? (
                    <div className="space-y-2">
                      {menuItems.dinner.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleMenuItemChange('dinner', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMenuItem('dinner', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMenuItem('dinner')}
                        className="flex items-center mt-2"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Item
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {menuItems.dinner.map((item, index) => (
                        <li key={index} className="flex items-center py-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
            
            {editMode && (
              <CardFooter>
                <div className="flex justify-end space-x-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveMenu}
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