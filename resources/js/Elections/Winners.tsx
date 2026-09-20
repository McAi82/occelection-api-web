// resources/js/pages/Elections/Winners.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { electionAPI, Winner } from "../api/elections";
import {
    ArrowLeft,
    Trophy,
    Award,
    Users,
    Medal,
    Crown,
    Star,
    Sparkles,
    Building2,
    GraduationCap,
    Loader2,
    CheckCircle,
} from "lucide-react";

const MEDAL_COLORS = {
    1: "bg-yellow-500",
    2: "bg-gray-400",
    3: "bg-amber-600",
};

const MEDAL_ICONS = {
    1: Crown,
    2: Medal,
    3: Award,
};

const getImageUrl = (path?: string): string | null => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/storage")) return path;
    return `${path}`;
};

const Winners: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [winners, setWinners] = useState<Winner[]>([]);
    const [groupedWinners, setGroupedWinners] = useState<Record<string, Winner[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [electionTitle, setElectionTitle] = useState("");

    useEffect(() => {
        if (id) {
            fetchWinners();
        }
    }, [id]);

    const fetchWinners = async (): Promise<void> => {
        setLoading(true);
        setError("");
        try {
            const response = await electionAPI.getWinners(id!);
            const winnersData = response.data || [];
            setWinners(winnersData);

            const grouped: Record<string, Winner[]> = {};
            winnersData.forEach((winner) => {
                if (!grouped[winner.position_title]) {
                    grouped[winner.position_title] = [];
                }
                grouped[winner.position_title].push(winner);
            });
            setGroupedWinners(grouped);

            if (winnersData.length > 0) {
                setElectionTitle(winnersData[0].election_title || "Election Winners");
            }
        } catch (err: any) {
            console.error("Failed to fetch winners:", err);
            setError(err.response?.data?.message || "Failed to load winners");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading winners...</p>
                </div>
            </div>
        );
    }

    if (error || winners.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Winners Yet</h3>
                <p className="text-gray-500">{error || "Winners will appear here once the election has ended."}</p>
                <Button onClick={() => navigate("/elections")} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Elections
                </Button>
            </div>
        );
    }

    const totalPositions = Object.keys(groupedWinners).length;
    const totalWinners = winners.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/elections")} className="-ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
            </div>

            {/* Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-yellow-500 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-6 h-6 text-yellow-200" />
                        <Badge className="bg-white/20 text-white border-0">
                            🏆 Winners Announced
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        {electionTitle || "Election Winners"}
                    </h1>
                    <p className="text-white/80 mt-1">
                        Congratulations to all the winners! 🎉
                    </p>
                    <div className="flex gap-4 mt-4">
                        <Badge className="bg-white/20 text-white border-0">
                            <Award className="w-3 h-3 mr-1" />
                            {totalPositions} Positions
                        </Badge>
                        <Badge className="bg-white/20 text-white border-0">
                            <Users className="w-3 h-3 mr-1" />
                            {totalWinners} Winners
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Winners by Position */}
            <div className="space-y-8">
                {Object.entries(groupedWinners).map(([position, positionWinners]) => (
                    <Card key={position} className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl">{position}</span>
                                <Badge variant="secondary" className="ml-2 px-3 py-1">
                                    {positionWinners.length} Winner{positionWinners.length > 1 ? "s" : ""}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {positionWinners.map((winner, index) => {
                                    const MedalIcon = MEDAL_ICONS[index + 1 as keyof typeof MEDAL_ICONS] || Star;
                                    const medalColor = MEDAL_COLORS[index + 1 as keyof typeof MEDAL_COLORS] || "bg-blue-400";
                                    const photoUrl = getImageUrl(winner.face_reference_photo);

                                    return (
                                        <div
                                            key={winner.candidate_id}
                                            className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                        >
                                            <div className={`absolute top-0 right-0 w-16 h-16 ${medalColor} rounded-bl-2xl flex items-center justify-center shadow-lg`}>
                                                <MedalIcon className="w-7 h-7 text-white" />
                                            </div>

                                            <div className="p-6 pt-4">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="relative">
                                                        <Avatar className="w-24 h-24 ring-4 ring-yellow-200 shadow-xl group-hover:ring-yellow-300 transition-all">
                                                            <AvatarImage src={photoUrl || undefined} />
                                                            <AvatarFallback className="bg-blue-500 text-white text-2xl font-bold">
                                                                {winner.first_name?.[0]}{winner.last_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>

                                                    <h3 className="mt-3 font-bold text-xl text-gray-900">
                                                        {winner.first_name} {winner.last_name}
                                                    </h3>

                                                    {winner.partylist_name && (
                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                            <Building2 className="w-3 h-3" />
                                                            {winner.partylist_name}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                                        {winner.course} - Year {winner.year_level}
                                                    </div>

                                                    <p className="text-xs text-gray-400 mt-1 font-mono">
                                                        {winner.student_id}
                                                    </p>

                                                    <Badge className={`mt-3 ${medalColor} text-white border-0 px-4 py-1.5`}>
                                                        #{index + 1} Winner
                                                    </Badge>

                                                    <div className="w-full mt-4 pt-4 border-t">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-500">Votes</span>
                                                            <span className="font-semibold text-gray-900">{winner.votes}</span>
                                                        </div>
                                                        <Progress
                                                            value={winner.percentage}
                                                            className="h-2 mt-1"
                                                        />
                                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                            <span>{winner.percentage}%</span>
                                                            <span>of {winner.total_votes} total votes</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Summary Footer */}
            <Card className="bg-green-50 border-0 shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Congratulations to All Winners!</h4>
                                <p className="text-sm text-gray-600">
                                    {totalWinners} winners across {totalPositions} positions have been declared.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="border-2 border-green-300 hover:bg-green-50"
                            onClick={() => window.print()}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> Print Winners List
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Winners;