// src/pages/Elections/ElectionCard.tsx
import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ELECTION_TYPES } from "../utils/constants";
import {
    Calendar,
    Vote,
    Eye,
    Clock,
    CheckCircle,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
    election_type: "CSG" | "SBO";
    description?: string;
    voting_start: string;
    voting_end: string;
    course?: { code: string; name: string };
}

interface ElectionCardProps {
    election: Election;
    onVote: (id: number) => void;
    onView: (id: number) => void;
}

interface StatusInfo {
    label: string;
    color: string;
    icon: LucideIcon;
}

const ElectionCard: React.FC<ElectionCardProps> = ({
    election,
    onVote,
    onView,
}) => {
    const getElectionTypeInfo = () => {
        const typeInfo =
            ELECTION_TYPES[
                election.election_type as keyof typeof ELECTION_TYPES
            ];
        return typeInfo || ELECTION_TYPES.CSG;
    };

    const getStatus = (): StatusInfo => {
        const now = new Date();
        const start = new Date(election.voting_start);
        const end = new Date(election.voting_end);

        if (now < start)
            return {
                label: "Upcoming",
                color: "bg-yellow-100 text-yellow-800",
                icon: Clock,
            };
        if (now > end)
            return {
                label: "Ended",
                color: "bg-gray-100 text-gray-800",
                icon: CheckCircle,
            };
        return {
            label: "Ongoing",
            color: "bg-green-100 text-green-800",
            icon: TrendingUp,
        };
    };

    const typeInfo = getElectionTypeInfo();
    const status = getStatus();
    const StatusIcon = status.icon;

    return (
        <Card className="group border-0 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className={`h-1.5 ${typeInfo.color}`} />
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={status.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-xs bg-gray-50"
                            >
                                {election.election_type}
                            </Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                            {election.title}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-2">
                    {election.description || "No description provided"}
                </p>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                            {new Date(
                                election.voting_start,
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(election.voting_end).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs">
                        <span className="font-medium mr-2">Type:</span>
                        <span>{typeInfo.name}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-2 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => onView(election.election_id)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                    </Button>
                    {status.label === "Ongoing" && (
                        <Button
                            className="flex-1 bg-green-600 text-white hover:bg-green-700 rounded-xl shadow-md"
                            onClick={() => onVote(election.election_id)}
                        >
                            <Vote className="w-4 h-4 mr-2" />
                            Vote Now
                        </Button>
                    )}
                    {(status.label === "Ended" ||
                        status.label === "Ongoing") && (
                        <Button
                            variant="secondary"
                            className="flex-1 rounded-xl"
                            onClick={() => onView(election.election_id)}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {status.label === "Ongoing" ? "Live" : "Results"}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ElectionCard;
