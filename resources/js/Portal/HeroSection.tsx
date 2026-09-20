// js/Portal/HeroSection.tsx
import React from "react";
import { Button } from "../components/ui/button";
import { ChevronRight, Shield, ArrowRight, PlayCircle, Smartphone, Download, Sparkles } from "lucide-react";

interface HeroSectionProps {
    onVoteNowClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onVoteNowClick }) => {
    const scrollToFeatures = (): void => {
        document
            .getElementById("features")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDownloadApp = (): void => {
        window.open("/download-app", "_blank");
    };

    return (
        <section id="home" className="relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-blue-50"></div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

            <div className="relative container mx-auto px-4 py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div>
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm border border-blue-100 mb-6 animate-fade-in-up">
                            <Shield className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                                Secure & Transparent Elections
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up animation-delay-100">
                            Shape the Future of
                            <span className="text-blue-600 block sm:inline">
                                {" "}
                                OCC
                            </span>
                        </h1>

                        <p className="text-lg lg:text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200">
                            A secure, transparent, and accessible voting
                            platform for Opol Community College students. Vote
                            from anywhere, anytime using our mobile application.
                        </p>

                        <div className="flex flex-wrap gap-4 animate-fade-in-up animation-delay-300">
                            <Button
                                size="lg"
                                onClick={scrollToFeatures}
                                variant="outline"
                                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700"
                            >
                                Explore Features
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                                size="lg"
                                onClick={onVoteNowClick}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                Vote Now
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Modern Card */}
                    <div className="relative animate-fade-in-up animation-delay-200">
                        <div className="absolute -inset-4 bg-blue-600 rounded-3xl blur-2xl opacity-20"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                            <div className="bg-blue-600 p-4">
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                    <span className="text-sm font-medium">
                                        Demo Preview
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Current Election
                                        </p>
                                        <p className="font-semibold text-gray-900">
                                            2026 Student Government Elections
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 rounded-full">
                                        <span className="text-xs font-medium text-green-700">
                                            Active
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        "President",
                                        "Vice President",
                                        "Secretary",
                                        "Treasurer",
                                    ].map((position, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                        >
                                            <span className="text-sm font-medium text-gray-700">
                                                {position}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-xs text-gray-500">
                                                    3 candidates
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <PlayCircle className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-700">
                                            Election ends in 5 days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge - With Enhanced Animations */}
                        <div
                            className="absolute -bottom-10 -right-0 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] group animate-bounce-slow overflow-hidden border-2 border-blue-200/50"
                            onClick={handleDownloadApp}
                        >
                            {/* Animated shimmer background */}
                            <div className="absolute inset-0 bg-blue-100/30 -translate-x-full animate-shimmer"></div>
                            
                            {/* Animated pulse ring */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/20 animate-pulse-ring"></div>

                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 relative z-10">
                                <Smartphone className="w-5 h-5 text-white" />
                                <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-300 animate-sparkle" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                    📱 Mobile App Available
                                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                                </p>
                                <p className="text-xs text-blue-600 font-medium group-hover:text-blue-700 transition-colors mt-0.5 flex items-center gap-1">
                                    Click here to download
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform group-hover:scale-110" />
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center group-hover:bg-blue-600/20 transition-colors relative z-10 animate-pulse-soft">
                                <Download className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
                            </div>

                            {/* Animated corner accent */}
                            <div className="absolute top-0 right-0 w-10 h-10 bg-blue-500/10 rounded-tr-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add animation styles */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
                .animation-delay-100 {
                    animation-delay: 0.1s;
                    opacity: 0;
                }
                .animation-delay-200 {
                    animation-delay: 0.2s;
                    opacity: 0;
                }
                .animation-delay-300 {
                    animation-delay: 0.3s;
                    opacity: 0;
                }
                .animation-delay-400 {
                    animation-delay: 0.4s;
                    opacity: 0;
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(200%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite;
                }

                @keyframes pulse-ring {
                    0% {
                        transform: scale(1);
                        opacity: 0.6;
                    }
                    100% {
                        transform: scale(1.08);
                        opacity: 0;
                    }
                }
                .animate-pulse-ring {
                    animation: pulse-ring 2s ease-out infinite;
                }

                @keyframes sparkle {
                    0%, 100% {
                        transform: scale(0.8) rotate(0deg);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.3) rotate(180deg);
                        opacity: 1;
                    }
                }
                .animate-sparkle {
                    animation: sparkle 1.5s ease-in-out infinite;
                }

                @keyframes pulse-soft {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
                .animate-pulse-soft {
                    animation: pulse-soft 2s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
};

export default HeroSection;