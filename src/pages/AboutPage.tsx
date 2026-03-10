import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, QrCode, Smartphone, BarChart, Bell, Shield, Calendar, Users, Coffee } from 'lucide-react';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-50 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium mb-8 transition-colors"
                    >
                        <div className="p-2 bg-white rounded-full shadow-sm border border-slate-200 group-hover:border-indigo-200 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Home
                    </button>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Smart Hostel</span>
                    </h1>
                    <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
                        A modern, efficient, and transparent solution for managing hostel mess operations, bridging the gap between students and administration.
                    </p>
                </div>

                {/* Main Content */}
                <div className="space-y-16">
                    {/* Project Overview */}
                    <section className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <Globe className="w-6 h-6 text-indigo-600" />
                            Project Overview
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-4">
                            <p>
                                The <strong>Smart Hostel Food Management System</strong> addresses the key challenges faced by hostel administrations: food wastage, manual tracking errors, and long queues. By digitizing the entire process, we create a ecosystem where every meal is accounted for and student satisfaction is prioritized.
                            </p>
                            <p>
                                Designed with simplicity and power in mind, the platform serves two main roles: <strong>Students</strong> who need quick, hassle-free access to meals, and <strong>Administrators</strong> who need real-time data to make cost-saving decisions.
                            </p>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                            <Coffee className="w-6 h-6 text-indigo-600" />
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    step: "01",
                                    title: "Book Meal",
                                    desc: "Students log in and select their preferred meals for the upcoming days from the digital menu.",
                                    color: "bg-blue-50 text-blue-600"
                                },
                                {
                                    step: "02",
                                    title: "Get QR Code",
                                    desc: "A unique, secure QR code is generated instantly for each confirmed booking.",
                                    color: "bg-indigo-50 text-indigo-600"
                                },
                                {
                                    step: "03",
                                    title: "Eco Scan",
                                    desc: "Staff scan the code at the counter. The system validates it in real-time, preventing duplication.",
                                    color: "bg-violet-50 text-violet-600"
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 text-9xl font-bold opacity-5 -mr-4 -mt-4 ${item.color.replace('bg-', 'text-')}`}>
                                        {item.step}
                                    </div>
                                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center font-bold text-lg mb-6 relative z-10`}>
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-3 relative z-10">{item.title}</h3>
                                    <p className="text-slate-600 relative z-10">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Key Features */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                            <Shield className="w-6 h-6 text-indigo-600" />
                            Key Features
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <Smartphone className="w-5 h-5 text-indigo-600" />,
                                    title: "Mobile-First Booking",
                                    desc: "Accessible from any device, allowing students to plan their meals on the go."
                                },
                                {
                                    icon: <QrCode className="w-5 h-5 text-indigo-600" />,
                                    title: "Instant Verification",
                                    desc: "Sub-second response time for scanning to ensure lines move quickly during rush hour."
                                },
                                {
                                    icon: <BarChart className="w-5 h-5 text-indigo-600" />,
                                    title: "Insightful Analytics",
                                    desc: "Detailed reports on consumption patterns help reduce food procurement costs."
                                },
                                {
                                    icon: <Calendar className="w-5 h-5 text-indigo-600" />,
                                    title: "Smart Scheduling",
                                    desc: "Automated cut-off times for bookings to give kitchen staff precise preparation numbers."
                                },
                                {
                                    icon: <Bell className="w-5 h-5 text-indigo-600" />,
                                    title: "User Feedback",
                                    desc: "Integrated feedback loop allowing students to rate meals, ensuring quality control."
                                },
                                {
                                    icon: <Users className="w-5 h-5 text-indigo-600" />,
                                    title: "Role Management",
                                    desc: "Secure separate dashboards for students and administrative staff."
                                }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="shrink-0 w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Bottom spacer instead of button */}
                <div className="h-20"></div>
            </div>
        </div>
    );
};

export default AboutPage;
