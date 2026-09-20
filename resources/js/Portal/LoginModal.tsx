// src/pages/Portal/LoginModal.tsx
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    Mail,
    Lock,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    Shield,
    ChevronRight,
    CheckCircle,
    Smartphone,
    Download,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import occLogo from "../assets/occlogo.jpg";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (
        email: string,
        password: string,
    ) => Promise<{ success: boolean; error?: string }>;
    isLoading: boolean;
    error: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
    isOpen,
    onClose,
    onLogin,
    isLoading,
    error,
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [focusedField, setFocusedField] = useState<
        "email" | "password" | null
    >(null);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLocalError("");

        if (!email.trim()) {
            setLocalError("Please enter your email address");
            return;
        }
        if (!password) {
            setLocalError("Please enter your password");
            return;
        }

        const result = await onLogin(email, password);
        if (!result.success) {
            setLocalError(
                result.error || "Login failed. Please check your credentials.",
            );
        }
    };

    const handleClose = (): void => {
        setEmail("");
        setPassword("");
        setLocalError("");
        setRememberMe(false);
        onClose();
    };

    const handleDownloadApp = (): void => {
        window.open("/download-app", "_blank");
    };

    const displayError = error || localError;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl">
                <div className="absolute top-0 left-0 right-0 h-32 bg-blue-600 opacity-10 rounded-t-2xl"></div>

                <div className="p-6 pt-8">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ring-blue-100">
                            <img
                                src={occLogo}
                                alt="OCC Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome Back
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Login to access your dashboard and participate in
                            elections
                        </DialogDescription>
                    </div>

                    {/* Mobile App Download Badge - With Enhanced Animations */}
                    <div
                        className="relative mb-6 bg-blue-50 border-2 border-blue-300/60 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.03] group animate-bounce-slow overflow-hidden"
                        onClick={handleDownloadApp}
                    >
                        {/* Animated shimmer background */}
                        <div className="absolute inset-0 bg-white/30 -translate-x-full animate-shimmer"></div>
                        
                        {/* Animated pulse ring */}
                        <div className="absolute inset-0 rounded-xl border-2 border-blue-400/20 animate-pulse-ring"></div>

                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10">
                            <Smartphone className="w-6 h-6 text-white" />
                            {/* Sparkle animation on icon */}
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-sparkle" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                📱 Mobile App Available
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                            </p>
                            <p className="text-xs text-blue-600 font-medium group-hover:text-blue-700 transition-colors mt-0.5 flex items-center gap-1">
                                Click here to download
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform group-hover:scale-110" />
                            </p>
                        </div>
                        <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center group-hover:bg-blue-600/20 transition-colors flex-shrink-0 relative z-10 animate-pulse-soft">
                            <Download className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
                        </div>

                        {/* Animated corner accent */}
                        <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-tr-xl"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {displayError && (
                            <Alert
                                variant="destructive"
                                className="border-red-200 bg-red-50 rounded-xl animate-shake"
                            >
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">
                                    <strong className="font-semibold">
                                        Login Failed!
                                    </strong>{" "}
                                    {displayError}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-gray-700 font-medium"
                            >
                                Email Address
                            </Label>
                            <div
                                className={`relative transition-all duration-200 ${focusedField === "email" ? "transform scale-[1.02]" : ""}`}
                            >
                                <div
                                    className={`absolute inset-0 bg-blue-600 rounded-lg blur opacity-0 transition-opacity duration-300 ${focusedField === "email" ? "opacity-20" : ""}`}
                                ></div>
                                <div className="relative">
                                    <Mail
                                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === "email" ? "text-blue-600" : "text-gray-400"}`}
                                    />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="student@occ.edu.ph"
                                        value={email}
                                        onFocus={() => setFocusedField("email")}
                                        onBlur={() => setFocusedField(null)}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setLocalError("");
                                        }}
                                        className={`pl-10 py-6 rounded-xl border-2 transition-all duration-200 ${focusedField === "email" ? "border-blue-500 shadow-md ring-4 ring-blue-100" : "border-gray-200 hover:border-gray-300"} ${displayError ? "border-red-500 focus:ring-red-100" : ""}`}
                                        required
                                        disabled={isLoading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label
                                    htmlFor="password"
                                    className="text-gray-700 font-medium"
                                >
                                    Password
                                </Label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div
                                className={`relative transition-all duration-200 ${focusedField === "password" ? "transform scale-[1.02]" : ""}`}
                            >
                                <div
                                    className={`absolute inset-0 bg-blue-600 rounded-lg blur opacity-0 transition-opacity duration-300 ${focusedField === "password" ? "opacity-20" : ""}`}
                                ></div>
                                <div className="relative">
                                    <Lock
                                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focusedField === "password" ? "text-blue-600" : "text-gray-400"}`}
                                    />
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="••••••••"
                                        value={password}
                                        onFocus={() =>
                                            setFocusedField("password")
                                        }
                                        onBlur={() => setFocusedField(null)}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setLocalError("");
                                        }}
                                        className={`pl-10 pr-10 py-6 rounded-xl border-2 transition-all duration-200 ${focusedField === "password" ? "border-blue-500 shadow-md ring-4 ring-blue-100" : "border-gray-200 hover:border-gray-300"} ${displayError ? "border-red-500 focus:ring-red-100" : ""}`}
                                        required
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) =>
                                            setRememberMe(e.target.checked)
                                        }
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${rememberMe ? "bg-blue-600 border-transparent" : "border-gray-300 group-hover:border-blue-400"}`}
                                    >
                                        {rememberMe && (
                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Shield className="w-3 h-3" />
                                <span>Secure Login</span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <span>Login to Account</span>
                                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400">
                            By logging in, you agree to our{" "}
                            <a
                                href="#"
                                className="text-blue-600 hover:underline"
                            >
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                                href="#"
                                className="text-blue-600 hover:underline"
                            >
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </div>

                {/* Animation styles */}
                <style>{`
                    @keyframes bounce-slow {
                        0%, 100% {
                            transform: translateY(0);
                        }
                        50% {
                            transform: translateY(-8px);
                        }
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 2.5s ease-in-out infinite;
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
                            transform: scale(1.05);
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
                            transform: scale(1.2) rotate(180deg);
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
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal;