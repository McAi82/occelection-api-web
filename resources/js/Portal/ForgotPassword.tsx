// js/Portal/ForgotPassword.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
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
    Mail,
    Loader2,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import occLogo from "../assets/occlogo.jpg";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (!email) {
            setError("Please enter your email address");
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.forgotPassword({ email });
            const message =
                response.data?.message ||
                "Password reset link sent to your email. Please check your inbox.";
            setSuccess(message);
            setEmail("");
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to send reset link. Please try again.";
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
                        <img
                            src={occLogo}
                            alt="OCC Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                    <p className="text-gray-600 mt-2">
                        No worries! Enter your email address and we'll send you
                        a link to reset your password.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ... rest of form same as before ... */}
                        {success && (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-600">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="student@occ.edu.ph"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    className="pl-10"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending reset link...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>

                        <div className="text-center text-sm">
                            <Link
                                to="/"
                                className="text-blue-600 hover:underline inline-flex items-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                    <div className="mt-6 pt-6 border-t text-center">
                        <p className="text-xs text-gray-500">
                            Need help? Contact the COMELEC office at
                            comelec@occ.edu.ph
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;