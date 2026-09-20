// resources/js/pages/DownloadApp.tsx
import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Smartphone,
    Download,
    Shield,
    Zap,
    CheckCircle,
    ArrowLeft,
    Sparkles,
    Bell,
    Fingerprint,
    Vote,
    BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DownloadApp: React.FC = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Vote,
            title: "Vote Anywhere",
            description: "Cast your vote from anywhere on campus or at home",
        },
        {
            icon: Fingerprint,
            title: "Biometric Login",
            description: "Secure face recognition for quick and safe access",
        },
        {
            icon: Bell,
            title: "Real-time Updates",
            description: "Get notified about election results and announcements",
        },
        {
            icon: BarChart3,
            title: "Live Results",
            description: "Watch election results update in real-time",
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your vote is encrypted and completely anonymous",
        },
        {
            icon: Zap,
            title: "Fast & Reliable",
            description: "Optimized for the best mobile voting experience",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {/* Hero Section */}
                <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                    <CardContent className="relative p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                <Smartphone className="w-12 h-12 text-blue-600" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                    <Badge className="bg-white/20 text-white border-0">
                                        Mobile App
                                    </Badge>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                    OCC Election App
                                </h1>
                                <p className="text-blue-100 text-lg mb-6">
                                    Vote securely from your mobile device with
                                    face recognition and real-time results
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                    <Button className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg px-6 py-6">
                                        <Download className="w-5 h-5 mr-2" />
                                        Download for Android
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-6"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Download for iOS
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </div>

                {/* Features Grid */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        App Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <Card
                                    key={idx}
                                    className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <CardContent className="p-5">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                                            <Icon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Requirements */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            System Requirements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-blue-600" />
                                    Android
                                </h4>
                                <ul className="space-y-1.5 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Android 8.0 or higher
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Camera for face recognition
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        50 MB free storage
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-blue-600" />
                                    iOS
                                </h4>
                                <ul className="space-y-1.5 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        iOS 13.0 or higher
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Face ID or camera access
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        50 MB free storage
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* How to Install */}
                <Card className="bg-blue-50 border border-blue-200 shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">
                            How to Install
                        </h3>
                        <ol className="space-y-3 text-sm text-blue-800">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    1
                                </span>
                                <span>
                                    Click the download button for your device
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    2
                                </span>
                                <span>
                                    Allow installation from unknown sources
                                    (if prompted)
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    3
                                </span>
                                <span>
                                    Open the app and log in with your student
                                    credentials
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    4
                                </span>
                                <span>
                                    Register your face for secure biometric
                                    login
                                </span>
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DownloadApp;