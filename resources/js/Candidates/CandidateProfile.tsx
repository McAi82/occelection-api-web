// js/Candidates/CandidateProfile.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { candidateAPI } from "../api/candidates";
import {
    Building2,
    GraduationCap,
    Target,
    Mail,
    Users,
    CheckCircle,
    Clock,
    ArrowLeft,
    Loader2,
    Calendar,
    UserCheck,
    Star,
} from "lucide-react";

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course: string | { course_code: string; course_name: string };
    year_level: number;
    face_reference_photo?: string;
}

interface Position {
    position_id: number;
    title: string;
}

interface Partylist {
    partylist_id: number;
    name: string;
}

interface Candidate {
    candidate_id: number;
    user_id: number;
    position_id: number;
    partylist_id?: number;
    platform?: string;
    qualifications?: string;
    photo_url?: string;
    is_approved: boolean;
    user?: User;
    position?: Position;
    partylist?: Partylist;
}

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `${path}`;
};

const getCourseDisplay = (user?: User): string => {
    if (!user) return "Not assigned";
    if (
        user.course &&
        typeof user.course === "object" &&
        "course_code" in user.course
    ) {
        return `${(user.course as { course_code: string }).course_code} - ${(user.course as { course_name: string }).course_name}`;
    }
    if (typeof user.course === "string") return user.course;
    return "Not assigned";
};

const CandidateProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) fetchCandidate();
    }, [id]);

    const fetchCandidate = async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await candidateAPI.getById(id!);
            setCandidate(response.data || null);
        } catch (error: any) {
            console.error("Failed to fetch candidate:", error);
            setError(
                error.response?.status === 404
                    ? "Candidate not found"
                    : "Failed to load candidate profile",
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="text-red-600 mb-4">
                    {error || "Candidate not found"}
                </div>
                <Button
                    onClick={() => navigate("/candidates")}
                    className="rounded-xl"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Candidates
                </Button>
            </div>
        );
    }

    const courseDisplay = getCourseDisplay(candidate.user);
    const userFullName =
        `${candidate.user?.first_name || ""} ${candidate.user?.last_name || ""}`.trim();
    const profilePhoto = getImageUrl(candidate.user?.face_reference_photo);
    const achievementPhoto = getImageUrl(candidate.photo_url);

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-4">
            <button
                onClick={() => navigate("/candidates")}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group mb-2"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Candidates</span>
            </button>

            <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-blue-600"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                <CardContent className="relative p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <Avatar className="w-32 h-32 ring-4 ring-white/30 shadow-xl">
                            <AvatarImage src={profilePhoto || undefined} />
                            <AvatarFallback className="bg-blue-500 text-white text-3xl font-bold">
                                {candidate.user?.first_name?.[0]}
                                {candidate.user?.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left flex-1">
                            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap mb-2">
                                <h1 className="text-3xl font-bold text-white">
                                    {userFullName}
                                </h1>
                                {candidate.is_approved ? (
                                    <Badge className="bg-green-500 text-white border-0 px-3 py-1">
                                        <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                        Approved
                                    </Badge>
                                ) : (
                                    <Badge className="bg-yellow-500 text-white border-0 px-3 py-1">
                                        <Clock className="w-3 h-3 mr-1" />{" "}
                                        Pending
                                    </Badge>
                                )}
                            </div>
                            <p className="text-blue-100 text-xl mb-2">
                                Running for {candidate.position?.title}
                            </p>
                            {candidate.partylist && (
                                <div className="flex items-center justify-center md:justify-start gap-2 text-blue-100">
                                    <Building2 className="w-4 h-4" />
                                    <span>{candidate.partylist.name}</span>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-0"
                                >
                                    {courseDisplay}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-0"
                                >
                                    Year {candidate.user?.year_level || "N/A"}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-0"
                                >
                                    ID: {candidate.user?.student_id}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>

            <Tabs defaultValue="platform" className="space-y-5">
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
                    <TabsTrigger
                        value="platform"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Target className="w-4 h-4 mr-2" /> Platform
                    </TabsTrigger>
                    <TabsTrigger
                        value="qualifications"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <GraduationCap className="w-4 h-4 mr-2" />{" "}
                        Qualifications
                    </TabsTrigger>
                    <TabsTrigger
                        value="info"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Users className="w-4 h-4 mr-2" /> Information
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="platform">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-blue-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Target className="w-4 h-4 text-white" />
                                </div>
                                Campaign Platform
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {candidate.platform}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="qualifications">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-green-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                Qualifications & Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {candidate.qualifications}
                            </p>
                            {achievementPhoto && (
                                <div className="mt-6 pt-4 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-500" />{" "}
                                        Achievement Proof
                                    </h4>
                                    <img
                                        src={achievementPhoto}
                                        alt="Achievement"
                                        className="max-w-full rounded-xl border max-h-80 object-cover shadow-md"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="info">
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-purple-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                Candidate Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Email
                                            </p>
                                            <p className="text-gray-800 font-medium">
                                                {candidate.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <GraduationCap className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Student ID
                                            </p>
                                            <p className="text-gray-800 font-medium">
                                                {candidate.user?.student_id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Building2 className="w-5 h-5 text-purple-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Course
                                            </p>
                                            <p className="text-gray-800 font-medium">
                                                {courseDisplay}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Calendar className="w-5 h-5 text-orange-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Year Level
                                            </p>
                                            <p className="text-gray-800 font-medium">
                                                Year{" "}
                                                {candidate.user?.year_level ||
                                                    "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    {candidate.partylist && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Building2 className="w-5 h-5 text-indigo-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Partylist
                                                </p>
                                                <p className="text-gray-800 font-medium">
                                                    {candidate.partylist.name}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <UserCheck className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Status
                                            </p>
                                            <p className="text-gray-800 font-medium">
                                                {candidate.is_approved
                                                    ? "Approved Candidate"
                                                    : "Pending Approval"}
                                            </p>
                                        </div>
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

export default CandidateProfile;