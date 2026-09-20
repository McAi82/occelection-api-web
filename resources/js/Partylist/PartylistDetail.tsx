// resources/js/pages/Partylist/PartylistDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { partylistAPI, Partylist } from "../api/partylists";
import { useAuth } from "../contexts/AuthContext";
import {
    Building2,
    Users,
    Award,
    ArrowLeft,
    Calendar,
    UserCheck,
    GraduationCap,
    Mail,
    AlertCircle,
    Crown,
    Sparkles,
    Star,
} from "lucide-react";

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${path}`;
};

const PartylistDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [partylist, setPartylist] = useState<Partylist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("members");

    useEffect(() => {
        if (id) {
            fetchPartylistDetail();
        }
    }, [id]);

    const fetchPartylistDetail = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            const response = await partylistAPI.getById(parseInt(id!));
            console.log("Partylist detail response:", response.data);

            let data: Partylist | null = null;
            if (response.data?.data) {
                data = response.data.data;
            } else if (response.data) {
                data = response.data;
            }

            setPartylist(data);
        } catch (error: any) {
            console.error("Failed to fetch partylist:", error);
            setError(
                error.response?.data?.message ||
                    "Failed to load partylist details",
            );
        } finally {
            setLoading(false);
        }
    };

    const isCreator = partylist?.created_by_user_id === user?.user_id;
    const totalMembers = partylist?.active_memberships?.length || 0;

    if (loading) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" disabled className="mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Loading...
                </Button>
                <Card className="bg-blue-600">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="w-20 h-20 rounded-xl bg-white/20" />
                            <div className="flex-1">
                                <Skeleton className="h-8 w-48 bg-white/20 mb-2" />
                                <Skeleton className="h-4 w-64 bg-white/20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !partylist) {
        return (
            <div className="text-center py-12">
                <div className="flex items-center justify-center mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Partylist Not Found
                </h2>
                <p className="text-gray-500 mb-4">
                    {error ||
                        "The partylist you're looking for does not exist."}
                </p>
                <Button onClick={() => navigate("/partylists")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Partylists
                </Button>
            </div>
        );
    }

    const isHighestPosition =
        partylist?.active_memberships?.some(
            (m) =>
                m.candidate?.position?.title
                    ?.toLowerCase()
                    .includes("president") ||
                m.candidate?.position?.title
                    ?.toLowerCase()
                    .includes("governor"),
        ) || false;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate("/partylists")}
                className="mb-2 -ml-2"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Partylists
            </Button>

            {/* Header Card */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-blue-600 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <CardContent className="relative p-6">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-lg">
                                {partylist.logo_url ? (
                                    <img
                                        src={
                                            getImageUrl(partylist.logo_url) ||
                                            ""
                                        }
                                        alt={partylist.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                "none";
                                        }}
                                    />
                                ) : (
                                    <Building2 className="w-12 h-12 text-white/80" />
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <h1 className="text-3xl font-bold">
                                        {partylist.name}
                                    </h1>
                                    {isCreator && (
                                        <Badge className="bg-yellow-500 text-black border-0">
                                            <Crown className="w-3 h-3 mr-1" />
                                            Creator
                                        </Badge>
                                    )}
                                    {isHighestPosition && (
                                        <Badge className="bg-green-500 text-white border-0">
                                            <Star className="w-3 h-3 mr-1" />
                                            Highest Position
                                        </Badge>
                                    )}
                                </div>
                                {partylist.description && (
                                    <p className="text-blue-100 mt-2">
                                        {partylist.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>

            {/* Stats - Pill/Badge Style */}
            <div className="flex flex-wrap items-center gap-3 py-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">
                        Total Members
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {totalMembers}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        Positions
                    </span>
                    <span className="text-sm font-bold text-purple-800">
                        {partylist.active_memberships?.filter(
                            (m) => m.candidate?.position,
                        ).length || 0}
                    </span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        Active
                    </span>
                    <span className="text-sm font-bold text-green-800">
                        {partylist.active_memberships?.filter(
                            (m) => m.status === "approved",
                        ).length || 0}
                    </span>
                </div>
                {partylist.election && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                            Election
                        </span>
                        <span className="text-sm font-bold text-blue-800">
                            {partylist.election.title}
                        </span>
                    </div>
                )}
                {partylist.election?.election_type && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full">
                        <Badge variant="outline" className="text-xs">
                            {partylist.election.election_type}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Creator Info */}
            {partylist.creator && (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            Created By
                        </CardTitle>
                    </div>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16 ring-2 ring-blue-100">
                                <AvatarImage
                                    src={
                                        getImageUrl(
                                            partylist.creator
                                                .face_reference_photo,
                                        ) || undefined
                                    }
                                />
                                <AvatarFallback className="bg-blue-500 text-white text-xl font-bold">
                                    {partylist.creator.first_name?.[0]}
                                    {partylist.creator.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-gray-900 text-lg">
                                    {partylist.creator.first_name}{" "}
                                    {partylist.creator.last_name}
                                </p>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {partylist.creator.email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="w-3 h-3" />
                                        {partylist.creator.course
                                            ?.course_code || "N/A"}
                                    </span>
                                    {partylist.creator.year_level && (
                                        <span>
                                            Year {partylist.creator.year_level}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
            >
                <TabsList className="bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger
                        value="members"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Members ({totalMembers})
                    </TabsTrigger>
                    <TabsTrigger
                        value="election-info"
                        className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Election Info
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                    {partylist.active_memberships &&
                    partylist.active_memberships.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {partylist.active_memberships.map((membership) => {
                                const member = membership.candidate;
                                const isCreatorMember =
                                    member.user.user_id ===
                                    partylist.created_by_user_id;
                                return (
                                    <Card
                                        key={membership.membership_id}
                                        className="border-0 shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-14 h-14 ring-2 ring-blue-100">
                                                    <AvatarImage
                                                        src={
                                                            getImageUrl(
                                                                member.user
                                                                    .face_reference_photo,
                                                            ) || undefined
                                                        }
                                                    />
                                                    <AvatarFallback className="bg-blue-500 text-white text-lg font-bold">
                                                        {
                                                            member.user
                                                                .first_name?.[0]
                                                        }
                                                        {
                                                            member.user
                                                                .last_name?.[0]
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 truncate">
                                                            {
                                                                member.user
                                                                    .first_name
                                                            }{" "}
                                                            {
                                                                member.user
                                                                    .last_name
                                                            }
                                                        </p>
                                                        {isCreatorMember && (
                                                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                                <Crown className="w-2.5 h-2.5 mr-0.5" />
                                                                Creator
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {member.position && (
                                                        <p className="text-sm text-blue-600 font-medium">
                                                            {
                                                                member.position
                                                                    .title
                                                            }
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                                        <span className="flex items-center gap-0.5">
                                                            <GraduationCap className="w-3 h-3" />
                                                            {member.user.course
                                                                ?.course_code ||
                                                                "N/A"}
                                                        </span>
                                                        {member.user
                                                            .year_level && (
                                                            <span>
                                                                Year{" "}
                                                                {
                                                                    member.user
                                                                        .year_level
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500">No members yet</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="election-info">
                    {partylist.election ? (
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Election Information
                                </CardTitle>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Election Title
                                        </p>
                                        <p className="font-semibold text-gray-900">
                                            {partylist.election.title}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Election Type
                                        </p>
                                        <Badge>
                                            {partylist.election.election_type}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Voting Period
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            {new Date(
                                                partylist.election.voting_start,
                                            ).toLocaleDateString()}{" "}
                                            -{" "}
                                            {new Date(
                                                partylist.election.voting_end,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {partylist.election.course && (
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Course
                                            </p>
                                            <p className="font-semibold text-gray-900">
                                                {
                                                    partylist.election.course
                                                        .course_code
                                                }{" "}
                                                -{" "}
                                                {
                                                    partylist.election.course
                                                        .course_name
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <p className="text-gray-500">
                                    No election information available
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Info Section */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <UserCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About This Partylist
                            </h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>
                                    • This partylist was created by{" "}
                                    <strong>
                                        {partylist.creator?.first_name}{" "}
                                        {partylist.creator?.last_name}
                                    </strong>
                                </li>
                                <li>
                                    • It currently has{" "}
                                    <strong>{totalMembers}</strong> member
                                    {totalMembers !== 1 ? "s" : ""}
                                </li>
                                <li>
                                    • Members are running for various positions
                                    in the{" "}
                                    {partylist.election?.title || "election"}
                                </li>
                                {isCreator && (
                                    <li>
                                        • You are the creator of this partylist.
                                        You can manage membership requests.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PartylistDetail;