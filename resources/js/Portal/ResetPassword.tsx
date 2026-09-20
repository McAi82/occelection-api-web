// js/Portal/ResetPassword.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { authAPI } from "../api/auth";
import {
    Lock,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import occLogo from "../assets/occlogo.jpg";

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get("token");
        const emailParam = params.get("email");
        if (tokenParam && emailParam) {
            setToken(tokenParam);
            setEmail(emailParam);
        } else {
            setError("Invalid or missing reset link. Please request a new password reset.");
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await authAPI.resetPassword({
                email,
                token,
                password,
                password_confirmation: confirmPassword,
            });
            const message = response.data?.message || "Password reset successfully! Redirecting to login...";
            setSuccess(message);
            setTimeout(() => navigate("/"), 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to reset password. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <Card className="max-w-md w-full shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full overflow-hidden shadow-md mb-4">
                        <img src={occLogo} alt="OCC Logo" className="w-full h-full object-cover" />
                    </div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <p className="text-gray-600 mt-2">Enter your new password below.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {success && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-600">{success}</AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    required
                                    disabled={loading}
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Password must be at least 8 characters</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="confirm_password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 pr-10"
                                    required
                                    disabled={loading}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !token}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting password...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                        <div className="text-center text-sm">
                            <Link to="/" className="text-blue-600 hover:underline inline-flex items-center">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPassword;