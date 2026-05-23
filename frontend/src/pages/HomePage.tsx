import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Users,
  Utensils,
  CheckCircle,
  ArrowRight,
  ChefHat,
  Star,
  LayoutDashboard,
  Heart,
  Sparkles,
  TrendingDown
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');

  // Interactive Simulator State
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [bookingState, setBookingState] = useState<'idle' | 'loading' | 'success'>('idle');

  const simulatedMeals = {
    breakfast: {
      name: "Fresh Orchard Berry Parfait",
      desc: "Creamy organic yogurt layered with fresh blackberries, strawberries, house-toasted granola, and a touch of wild honey.",
      chef: "Chef Kumar",
      tags: ["Vegetarian", "Rich in Fiber"],
      ingredients: ["Organic Greek Yogurt", "Fresh Strawberries", "Wild Honey", "Ancient Grains Granola"],
      calories: "320 kcal",
      time: "07:30 AM - 09:30 AM"
    },
    lunch: {
      name: "Slow-Roasted Garden Paneer Tikka",
      desc: "Tender cottage cheese grilled with bell peppers and onions, served with whole grain flatbread and fresh mint chutney.",
      chef: "Chef Maria",
      tags: ["Signature", "Nut-Free"],
      ingredients: ["Organic Cottage Cheese", "Garden Bell Peppers", "Whole Wheat Flatbread", "Mint Chutney"],
      calories: "490 kcal",
      time: "12:30 PM - 03:00 PM"
    },
    dinner: {
      name: "Artisanal Tomato & Basil Flatbread",
      desc: "Thin-crust flatbread baked with heirloom tomato slices, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.",
      chef: "Chef Antonio",
      tags: ["Vegetarian", "Low Sodium"],
      ingredients: ["Heirloom Tomatoes", "Buffalo Mozzarella", "Fresh Sweet Basil", "Extra Virgin Olive Oil"],
      calories: "410 kcal",
      time: "07:30 PM - 10:00 PM"
    }
  };

  const handleSimulatedBook = () => {
    setBookingState('loading');
    setTimeout(() => {
      setBookingState('success');
    }, 1000);
  };

  const resetSimulator = () => {
    setBookingState('idle');
  };

  return (
    <div className="min-h-screen bg-stone-50/60 text-stone-900 font-sans antialiased selection:bg-emerald-600 selection:text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-stone-200/40 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-xl shadow-md shadow-emerald-700/10 group-hover:scale-105 transition-transform duration-300">
                <ChefHat className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-stone-950 block leading-none">
                  CampusBite
                </span>
                <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest leading-none block mt-1.5">
                  Hostel Mess Dining
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={handleLogin}
                className="text-stone-600 hover:text-stone-950 font-bold transition-colors text-sm"
              >
                Sign In
              </button>
              <button
                onClick={handleRegister}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 text-sm"
              >
                Join Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 bg-white border-b border-stone-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Text Content - Left */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left lg:col-span-7"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
                Empowering Healthy, Zero-Waste Hostel Dining
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-950 tracking-tight leading-[1.1] mb-6">
                Fresh meals. <br />
                <span className="text-emerald-700">Planned seamlessly.</span> <br />
                Served with care.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Skip long mess queues, plan your meals ahead, and help our campus chefs coordinate fresh ingredients with absolute precision. A simple system that feeds your body and protects our environment.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleRegister}
                  className="px-6 py-3.5 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  Join Your Hostel Mess
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogin}
                  className="px-6 py-3.5 bg-white text-stone-700 border border-stone-200 rounded-lg font-bold hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 text-stone-500" />
                  View Weekly Menu
                </button>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-stone-500 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Real-Time Menu Scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                  <span>Allergen & Diet Warnings</span>
                </div>
              </div>
            </motion.div>

            {/* Live Booking Simulator - Right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative w-full max-w-md mx-auto bg-white border border-stone-200 rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700">Student Portal Mockup</span>
                    <h4 className="text-sm font-black text-stone-900 mt-0.5">Meal Booking</h4>
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded">Today</span>
                </div>

                {/* Simulated Segment Controls */}
                <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-lg mb-4 text-xs font-bold text-stone-600">
                  {(['breakfast', 'lunch', 'dinner'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setSelectedMealType(tab);
                        resetSimulator();
                      }}
                      className={`py-2 rounded capitalize transition-all duration-200 ${
                        selectedMealType === tab
                          ? 'bg-white text-stone-950 shadow-sm'
                          : 'hover:text-stone-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Simulator Inner Content */}
                <div className="min-h-[220px] flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {bookingState === 'idle' && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                            {simulatedMeals[selectedMealType].name}
                          </h3>
                          <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                            {simulatedMeals[selectedMealType].tags.map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded bg-stone-100 text-stone-600 border border-stone-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-stone-500 leading-relaxed mb-4">
                          {simulatedMeals[selectedMealType].desc}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6 bg-stone-50 p-3 rounded-lg border border-stone-200/50 text-[11px] font-semibold text-stone-500">
                          <div>
                            <span className="text-[9px] block text-stone-400 font-bold uppercase tracking-wider">Chef</span>
                            <span className="text-stone-800 font-bold">{simulatedMeals[selectedMealType].chef}</span>
                          </div>
                          <div>
                            <span className="text-[9px] block text-stone-400 font-bold uppercase tracking-wider">Timing Window</span>
                            <span className="text-stone-800 font-bold">{simulatedMeals[selectedMealType].time}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleSimulatedBook}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          <Utensils className="w-3.5 h-3.5" /> Book Meal
                        </button>
                      </motion.div>
                    )}

                    {bookingState === 'loading' && (
                      <motion.div
                        key="loading"
                        className="flex flex-col items-center justify-center py-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-700 border-t-transparent mb-3"></div>
                        <p className="text-xs font-bold text-stone-500">Connecting to PostgreSQL database...</p>
                      </motion.div>
                    )}

                    {bookingState === 'success' && (
                      <motion.div
                        key="success"
                        className="flex flex-col items-center justify-center py-2"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-emerald-50 border border-emerald-200/60 p-3 rounded-lg flex items-center gap-3 mb-4 text-emerald-800 text-xs font-medium w-full">
                          <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                          <div>
                            <span className="block font-bold text-stone-900">Meal Secured!</span>
                            <span className="text-[10px] text-emerald-700">QR Code has been allocated</span>
                          </div>
                        </div>

                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl mb-4">
                          <QrCode className="w-20 h-20 text-stone-800" />
                        </div>

                        <button
                          onClick={resetSimulator}
                          className="text-[10px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider"
                        >
                          Reset Simulation
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sustainable Campus Impact Dashboard */}
      <div className="py-20 bg-stone-50 border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-emerald-700 font-extrabold tracking-wide uppercase text-xs mb-2">Sustainable Communities</h2>
            <h3 className="text-3xl font-black text-stone-900 mb-4">Clean Operations. Minimal Footprint.</h3>
            <p className="text-sm sm:text-base text-stone-500 leading-relaxed font-medium">
              By mapping out menus in advance and securing precise booking counts, campus dining halls save massive quantities of healthy food and coordinate kitchen preps cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white border border-stone-200/80 rounded-xl">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center mb-6 border border-emerald-100">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-stone-950 mb-2">Student Satisfaction</h4>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-medium">
                Skip post-lecture rushes and endless waits. Access clean timetables on your phone, see allergen disclosures, secure your ticket, and enjoy freshly cooked food instantly.
              </p>
            </div>

            <div className="p-8 bg-white border border-stone-200/80 rounded-xl">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center mb-6 border border-emerald-100">
                <ChefHat className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-stone-950 mb-2">Empowered Mess Cooks</h4>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-medium">
                Campus kitchens use real ahead-of-time booking rosters. This enables kitchen managers to order ingredients exactly to size, preventing recipe stress and daily administrative burnout.
              </p>
            </div>

            <div className="p-8 bg-white border border-stone-200/80 rounded-xl">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-center mb-6 border border-emerald-100">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h4 className="text-base font-extrabold text-stone-950 mb-2">Zero-Waste Footprint</h4>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-medium">
                Dining halls avoid bulk surplus dumping by using real-time demand lists. Mess spaces operate closely aligned with the exact counts, conserving budget resources for superior ingredients.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Week's Highlights Showcase */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="text-emerald-700 font-extrabold tracking-wide uppercase text-xs block mb-1">Local Farm Sourced</span>
              <h3 className="text-3xl font-black text-stone-950">Week's Culinary Specialties</h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm font-semibold leading-relaxed">
              Every day we highlight a specialty packed with whole ingredients and nutritional logs, curated by professional dietitians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Belgian Whole Wheat Waffles",
                desc: "Crisp waffles baked using locally milled grains, topped with fresh orchard berries, organic maple glaze, and plain yogurt.",
                chef: "Chef Kumar",
                type: "Breakfast Highlight",
                ingredients: ["Stone-milled Flour", "Wild Strawberries", "Organic Yogurt", "Pure Maple Glaze"],
                veg: true,
                rating: "4.9",
                calories: "340 kcal"
              },
              {
                title: "Traditional Creamy Paneer Tikka",
                desc: "Marinated organic paneer blocks baked with spiced dry herbs, bell peppers, and fresh cilantro, served with soft mint dipping glaze.",
                chef: "Chef Maria",
                type: "Lunch Favorite",
                ingredients: ["Organic Paneer", "Garden Bell Peppers", "Fresh Cilantro", "Spiced Yogurt Marinade"],
                veg: true,
                rating: "4.8",
                calories: "480 kcal"
              },
              {
                title: "Wok-Tossed Garden Hakka Rice",
                desc: "Long grain Basmati steam rice stir-fried over high-flame with crisp garden sweet peas, green onions, and ginger-soy glaze.",
                chef: "Chef Antonio",
                type: "Dinner Special",
                ingredients: ["Basmati Rice", "Garden Sweet Peas", "Fresh Scallions", "House Soy Infusion"],
                veg: false,
                rating: "4.7",
                calories: "420 kcal"
              }
            ].map((dish, idx) => (
              <div key={idx} className="bg-[#fcfcfb] border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-600/30 hover:shadow-md transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-extrabold uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {dish.type}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      <Star className="w-2.8 h-2.8 fill-emerald-800 text-emerald-800" />
                      <span>{dish.rating} Rated</span>
                    </div>
                  </div>

                  <h4 className="text-base font-extrabold text-stone-900 mb-2 leading-snug">{dish.title}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed mb-4 font-medium">{dish.desc}</p>
                  
                  {/* Ingredients Preview Row - Added for premium editorial feel */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {dish.ingredients.map(ing => (
                      <span key={ing} className="text-[9px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/40">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-stone-200/50 bg-stone-100/30 flex justify-between items-center text-[10px] font-bold text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5.5 h-5.5 rounded-full bg-stone-200 flex items-center justify-center text-[9px] font-black text-stone-600">
                      {dish.chef.charAt(5)}
                    </div>
                    <span>{dish.chef}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-stone-200/50 rounded uppercase">{dish.calories}</span>
                    <span className={`px-1.5 py-0.5 rounded uppercase ${dish.veg ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-stone-200 text-stone-600'}`}>
                      {dish.veg ? 'Veg' : 'Egg / Non-Veg'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Minimalist Statistics */}
      <div className="py-16 bg-stone-900 text-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Student Boarders", value: "1,200+", icon: <Users /> },
              { label: "Food Waste Avoided", value: "18.4%", icon: <TrendingDown /> },
              { label: "Scan Verification", value: "< 1 second", icon: <QrCode /> },
              { label: "Campus Satisfaction", value: "98.2%", icon: <Heart className="text-emerald-500 fill-emerald-500" /> }
            ].map((stat, idx) => (
              <div key={idx} className="p-2">
                <div className="flex justify-center mb-3 text-stone-400">
                  {React.cloneElement(stat.icon as React.ReactElement, { className: "w-5 h-5" })}
                </div>
                <div className="text-2xl md:text-3xl font-black text-white mb-1.5 tracking-tight">{stat.value}</div>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding Overview */}
      <div className="py-20 bg-stone-50 border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-emerald-700 font-extrabold tracking-wide uppercase text-xs mb-2">Easy Workflow</h2>
            <h3 className="text-3xl font-black text-stone-900">How It Works on Campus</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Plan Ahead", desc: "View the week's meal calendar directly on your device. Easily select which breakfast, lunch, or dinner you wish to book." },
              { step: "02", title: "Exact Kitchen Prep", desc: "Our mess staff aggregates the final counts in advance. They prepare ingredients strictly according to the numbers with absolute ease." },
              { step: "03", title: "Secure Scan & Eat", desc: "Scan your dynamically allocated secure QR ticket at the kitchen entry counter and enjoy your fresh, hot campus meals." }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-3xl font-black text-stone-300 mb-3">{item.step}</div>
                <h4 className="text-base font-extrabold text-stone-950 mb-2">{item.title}</h4>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-semibold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clean Administrative Call to Action */}
      <div className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-stone-950 mb-4 tracking-tight leading-tight">
              Ready to Modernize Your Hostel Dining Hall?
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto mb-8 font-semibold leading-relaxed">
              Equip your student body and kitchen cooks with the ultimate, zero-waste food booking environment today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={handleRegister}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
              >
                Register as Student
              </button>
              <button
                onClick={handleLogin}
                className="px-6 py-3 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-lg font-bold text-xs shadow-sm transition-all"
              >
                Mess Admin Log-In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-stone-50 border-t border-stone-200/80 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-700 rounded-lg text-white">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="text-lg font-black tracking-tight text-stone-900 leading-none">CampusBite</span>
              </div>
              <p className="text-stone-400 text-xs max-w-sm leading-relaxed font-semibold">
                An advanced campus dining system designed to secure bookings, support cooks, list allergens, and prevent massive kitchen food waste.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">Dining Portals</h4>
              <ul className="space-y-3 text-xs text-stone-400 font-semibold">
                <li><button onClick={handleLogin} className="hover:text-emerald-700 transition-colors">Student Log-In</button></li>
                <li><button onClick={handleRegister} className="hover:text-emerald-700 transition-colors">Create Student Account</button></li>
                <li><button onClick={handleLogin} className="hover:text-emerald-700 transition-colors">Admin Panel</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">Hostel Mission</h4>
              <ul className="space-y-3 text-xs text-stone-400 font-semibold">
                <li><button onClick={() => navigate('/about')} className="hover:text-emerald-700 transition-colors">About CampusBite</button></li>
                <li><a href="#" className="hover:text-emerald-700 transition-colors">Privacy Principles</a></li>
                <li><a href="#" className="hover:text-emerald-700 transition-colors">Institutional Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-stone-400 text-[10px] font-semibold">© 2026 CampusBite Food Systems. Designed with care for campus communities.</p>
            <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase border border-emerald-100/50">PostgreSQL Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
