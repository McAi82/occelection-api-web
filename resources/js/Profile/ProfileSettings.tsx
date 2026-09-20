// js/Profile/ProfileSettings.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../api/auth";
import {
    CheckCircle,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    User,
    Shield,
    Info,
    Sparkles,
    Lock,
    Mail,
    GraduationCap,
    IdCard,
    Calendar,
    Trophy,
} from "lucide-react";

interface PasswordData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `http://localhost:8000${path}`;
};

const ProfileSettings: React.FC = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const [passwordData, setPasswordData] = useState<PasswordData>({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        if (user?.face_reference_photo) {
            const imageUrl = getImageUrl(user.face_reference_photo);
            setProfilePicture(imageUrl);
        }
    }, [user]);

    const handlePasswordChange = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError("New passwords do not match");
            setLoading(false);
            return;
        }

        if (passwordData.new_password.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }

        try {
            await authAPI.changePassword(passwordData);
            setSuccess("Password changed successfully!");
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to change password",
            );
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (): string => {
        if (!user) return "U";
        return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
    };

    const getCourseDisplay = (): string => {
        if (
            user?.course &&
            typeof user.course === "object" &&
            "course_code" in user.course
        ) {
            return `${user.course.course_code} - ${user.course.course_name}`;
        }
        if (typeof user?.course === "string") return user.course;
        return "Not assigned";
    };

    const getRoleBadge = (): { label: string; color: string; bg: string } => {
        switch (user?.role) {
            case "admin":
                return {
                    label: "Administrator",
                    color: "bg-purple-600",
                    bg: "bg-purple-100 text-purple-700",
                };
            case "comelec":
                return {
                    label: "COMELEC Officer",
                    color: "bg-blue-600",
                    bg: "bg-blue-100 text-blue-700",
                };
            case "candidate":
                return {
                    label: "Candidate",
                    color: "bg-green-600",
                    bg: "bg-green-100 text-green-700",
                };
            default:
                return {
                    label: "Student Voter",
                    color: "bg-gray-600",
                    bg: "bg-gray-100 text-gray-700",
                };
        }
    };

    const roleInfo = getRoleBadge();

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl mb-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-white/80 text-sm font-medium">
                            Account Settings
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Profile Settings
                    </h1>
                    <p className="text-blue-100 mt-1">
                        Manage your account and security preferences
                    </p>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <TabsList className="bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger
                        value="profile"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <User className="w-4 h-4 mr-2" /> Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Lock className="w-4 h-4 mr-2" /> Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />{" "}
                                Personal Information
                            </CardTitle>
                        </div>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group">
                                    <Avatar className="w-28 h-28 ring-4 ring-blue-100 shadow-xl">
                                        <AvatarImage
                                            src={profilePicture || undefined}
                                        />
                                        <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <User className="w-4 h-4" />
                                        <span>First Name</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        {user?.first_name}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <User className="w-4 h-4" />
                                        <span>Last Name</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        {user?.last_name}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <IdCard className="w-4 h-4" />
                                        <span>Student ID</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        {user?.student_id}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Mail className="w-4 h-4" />
                                        <span>Email Address</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        {user?.email}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <GraduationCap className="w-4 h-4" />
                                        <span>Course</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        {getCourseDisplay()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>Year Level</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">
                                        Year {user?.year_level}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Shield className="w-4 h-4" />
                                        <span>Role</span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.bg}`}
                                    >
                                        {roleInfo.label}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Trophy className="w-4 h-4" />
                                        <span>Account Status</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                        <CheckCircle className="w-3 h-3" />{" "}
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-800">
                                            Profile Information
                                        </h4>
                                        <p className="text-sm text-blue-700">
                                            Your personal information is managed
                                            by the school administration. Please
                                            contact the registrar's office if
                                            you need to update any information.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-600" />{" "}
                                Change Password
                            </CardTitle>
                        </div>
                        <CardContent className="p-6">
                            <form
                                onSubmit={handlePasswordChange}
                                className="space-y-5"
                            >
                                {success && (
                                    <Alert className="bg-green-50 border-green-200 rounded-xl">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-600">
                                            {success}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {error && (
                                    <Alert
                                        variant="destructive"
                                        className="rounded-xl"
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-gray-700 font-medium"
                                    >
                                        Current Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            type={
                                                showCurrentPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                passwordData.current_password
                                            }
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    current_password:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                            className="pr-10 rounded-xl border-2 focus:border-blue-500"
                                            placeholder="Enter your current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCurrentPassword(
                                                    !showCurrentPassword,
                                                )
                                            }
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="new_password"
                                        className="text-gray-700 font-medium"
                                    >
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new_password"
                                            type={
                                                showNewPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={passwordData.new_password}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    new_password:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                            className="pr-10 rounded-xl border-2 focus:border-blue-500"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNewPassword(
                                                    !showNewPassword,
                                                )
                                            }
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Password must be at least 8 characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="confirm_password"
                                        className="text-gray-700 font-medium"
                                    >
                                        Confirm New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm_password"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                passwordData.confirm_password
                                            }
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    confirm_password:
                                                        e.target.value,
                                                })
                                            }
                                            required
                                            className="pr-10 rounded-xl border-2 focus:border-blue-500"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword,
                                                )
                                            }
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                                Changing Password...
                                            </>
                                        ) : (
                                            "Update Password"
                                        )}
                                    </Button>
                                </div>
                            </form>

                            <div className="mt-6 pt-6 border-t">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-600" />{" "}
                                        Password Guidelines
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{" "}
                                            Use at least 8 characters
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{" "}
                                            Include uppercase and lowercase
                                            letters
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{" "}
                                            Include numbers and special
                                            characters
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{" "}
                                            Avoid common words or personal
                                            information
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>{" "}
                                            Don't reuse passwords from other
                                            accounts
                                        </li>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProfileSettings;