// src/pages/Portal/Portal.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import LoginModal from "./LoginModal";
import { Button } from "../components/ui/button";
import {
    LogIn,
    Loader2,
    Menu,
    X,
    Sparkles,
    ChevronDown,
} from "lucide-react";
import occLogo from "../assets/occlogo.jpg";

const Portal: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    const scrollToHome = (): void => {
        document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToFeatures = (): void => {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToHowItWorks = (): void => {
        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, loading, navigate]);

    const handleLogin = async (
        email: string,
        password: string,
    ): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        setLoginError("");
        try {
            const result = await login(email, password);
            if (result.success) {
                setIsLoginOpen(false);
                return { success: true };
            } else {
                setLoginError(result.error || "Login failed. Please check your credentials.");
                return { success: false, error: result.error };
            }
        } catch (err) {
            const errorMsg = "An error occurred. Please try again.";
            setLoginError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = (): void => {
        setIsLoginOpen(false);
        setLoginError("");
    };

    const handleOpenLogin = (): void => {
        setIsLoginOpen(true);
        setLoginError("");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading election portal...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-blue-50">
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-20">
                        <div className="flex items-center space-x-3">
                            <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-100">
                                <img src={occLogo} alt="OCC Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 text-lg lg:text-xl">OCC Vote</span>
                                <span className="hidden lg:inline text-xs text-gray-500 ml-2 font-normal">Election System</span>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a onClick={scrollToHome} className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer">Home</a>
                            <a onClick={scrollToFeatures} className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer">Features</a>
                            <a onClick={scrollToHowItWorks} className="text-gray-700 hover:text-blue-600 transition-colors font-medium cursor-pointer">How It Works</a>
                        </div>

                        <div className="hidden md:flex items-center space-x-4">
                            <Button onClick={handleOpenLogin} className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300 px-6">
                                <LogIn className="w-4 h-4 mr-2" /> Get Started
                            </Button>
                        </div>

                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100 animate-in slide-in-from-top duration-300">
                        <div className="container mx-auto px-4 py-4 space-y-3">
                            <a onClick={scrollToHome} className="block py-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Home</a>
                            <a onClick={scrollToFeatures} className="block py-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">Features</a>
                            <a onClick={scrollToHowItWorks} className="block py-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">How It Works</a>
                            <Button onClick={() => { setIsLoginOpen(true); setLoginError(""); setMobileMenuOpen(false); }} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                                <LogIn className="w-4 h-4 mr-2" /> Get Started
                            </Button>
                        </div>
                    </div>
                )}
            </nav>

            <main className="pt-16">
                <HeroSection onVoteNowClick={handleOpenLogin} />
                <FeaturesSection />

                <section id="how-it-works" className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4 mr-2" /> Simple Process
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How Voting Works</h2>
                            <p className="text-lg text-gray-600">Four simple steps to cast your vote securely</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { step: "01", title: "Login", desc: "Login using your email and student id as password" },
                                { step: "02", title: "Config", desc: "Complete facial recognition setup and Change your Password" },
                                { step: "03", title: "Research", desc: "Review candidate profiles and platforms" },
                                { step: "04", title: "Vote", desc: "Cast your ballot securely via mobile app" },
                            ].map((item, idx) => (
                                <div key={idx} className="text-center group">
                                    <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-gray-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Ready to Make Your Voice Heard?</h2>
                            <p className="text-lg text-gray-600 mb-8">Join thousands of students in shaping the future of Opol Community College</p>
                            <Button size="lg" onClick={() => setIsLoginOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8">
                                Start Voting Now <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-gray-900 text-white pt-10 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg">
                                    <img src={occLogo} alt="OCC Logo" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-bold text-lg">OCC Election System</span>
                            </div>
                            <p className="text-gray-400 text-sm">Empowering students through transparent and secure democratic elections.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="flex space-x-5 text-sm text-gray-400">
                                <li><a onClick={scrollToHome} className="hover:text-white transition-colors cursor-pointer">Home</a></li>
                                <li><a onClick={scrollToFeatures} className="hover:text-white transition-colors cursor-pointer">Features</a></li>
                                <li><a onClick={scrollToHowItWorks} className="hover:text-white transition-colors cursor-pointer">How It Works</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2026 Opol Community College. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={handleCloseModal}
                onLogin={handleLogin}
                isLoading={isLoading}
                error={loginError}
            />
        </div>
    );
};

export default Portal;