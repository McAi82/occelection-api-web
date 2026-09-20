// resources/js/pages/Candidacy/ApplyCandidacy.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import CandidacyApplicationForm from "../components/CandidacyApplicationForm";
import { electionAPI } from "../api/elections";

interface Election {
    election_id: number;
    title: string;
    election_type: string;
    description?: string;
    voting_start: string;
    voting_end: string;
    is_active?: boolean;
    course_id?: number;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
    positions?: Array<{
        position_id: number;
        title: string;
        category?: string;
        order_in_ballot: number;
        max_winners: number;
    }>;
    partylists?: Array<{
        partylist_id: number;
        name: string;
        description?: string;
        logo_url?: string;
        candidates_count?: number;
    }>;
    status?: string;
    is_ongoing?: boolean;
}

const ApplyCandidacy: React.FC = () => {
    const { electionId } = useParams<{ electionId: string }>();
    const navigate = useNavigate();
    const [election, setElection] = useState<Election | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (electionId) {
            fetchElection(electionId);
        } else {
            setError("No election selected");
            setLoading(false);
        }
    }, [electionId]);

    const fetchElection = async (id: string) => {
        setLoading(true);
        setError("");
        try {
            const response = await electionAPI.getById(parseInt(id));
            
            let electionData = null;
            if (response.data) {
                if (response.data.data) {
                    electionData = response.data.data;
                } else {
                    electionData = response.data;
                }
            }
            
            if (electionData) {
                setElection(electionData);
            } else {
                setError("Election not found");
            }
        } catch (err: any) {
            console.error("Failed to fetch election:", err);
            const errorMessage = err.response?.data?.message || "Failed to load election. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        setTimeout(() => {
            window.close();
        }, 2000);
    };

    const handleCancel = () => {
        window.close();
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !election) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Election Not Found</h2>
                <p className="text-gray-500 mb-4">{error || "The election you're trying to apply for does not exist."}</p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={() => window.close()} variant="outline">Close</Button>
                    <Button onClick={() => navigate("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={handleCancel}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Close
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Apply for Candidacy</h1>
                    <p className="text-sm text-gray-500">{election.title}</p>
                </div>
                <span className="ml-auto text-sm text-gray-400">
                    {new Date(election.voting_start).toLocaleDateString()} - {new Date(election.voting_end).toLocaleDateString()}
                </span>
            </div>

            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <CandidacyApplicationForm
                        electionId={election.election_id}
                        electionTitle={election.title}
                        electionType={election.election_type}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default ApplyCandidacy;