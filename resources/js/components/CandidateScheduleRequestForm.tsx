// resources/js/pages/Candidates/CandidateScheduleRequestForm.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { campaignScheduleRequestAPI } from "../api/campaignScheduleRequest";
import { courseAPI } from "../api/courses";
import { useElections } from "../hooks/useElections";
import {
    Calendar,
    Clock,
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    School,
    FileText,
    Plus,
} from "lucide-react";

interface CourseSection {
    section_id: number;
    section_code: string;
    section_name: string;
    year_level: number;
    course_id: number;
    course?: {
        course_id: number;
        course_code: string;
        course_name: string;
    };
}

const CandidateScheduleRequestForm: React.FC = () => {
    const { data: elections = [] } = useElections();
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        election_id: "",
        section_id: "",
        preferred_date: "",
        preferred_start_time: "",
        preferred_end_time: "",
        message: "",
    });

    useEffect(() => {
        fetchSections();
        if (elections.length > 0 && !formData.election_id) {
            setFormData((prev) => ({
                ...prev,
                election_id: elections[0].election_id.toString(),
            }));
        }
    }, [elections]);

    const fetchSections = async () => {
        try {
            const response = await courseAPI.getAllSections();
            const data = response.data || [];
            setSections(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch sections:", err);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        if (!formData.election_id) {
            setError("Please select an election");
            setSubmitting(false);
            return;
        }
        if (!formData.section_id) {
            setError("Please select a course section");
            setSubmitting(false);
            return;
        }
        if (
            !formData.preferred_date ||
            !formData.preferred_start_time ||
            !formData.preferred_end_time
        ) {
            setError("Please fill in all schedule details");
            setSubmitting(false);
            return;
        }

        try {
            await campaignScheduleRequestAPI.create({
                election_id: parseInt(formData.election_id),
                section_id: parseInt(formData.section_id),
                preferred_date: formData.preferred_date,
                preferred_start_time: formData.preferred_start_time,
                preferred_end_time: formData.preferred_end_time,
                message: formData.message,
            });
            setSuccess(
                "Schedule request submitted successfully! Please wait for COMELEC approval.",
            );
            setFormData({
                election_id: elections[0]?.election_id?.toString() || "",
                section_id: "",
                preferred_date: "",
                preferred_start_time: "",
                preferred_end_time: "",
                message: "",
            });
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Failed to submit schedule request",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-yellow-300" />
                        <Badge className="bg-white/20 text-white border-0">
                            Schedule Request
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Request Campaign Schedule
                    </h1>
                    <p className="text-blue-100 mt-1">
                        Submit a schedule request for your campaign
                    </p>
                </div>
            </div>

            {/* Success/Error */}
            {success && (
                <Alert className="bg-green-50 border-green-200 rounded-xl">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                        {success}
                    </AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Form */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Schedule Details
                    </CardTitle>
                </div>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Election */}
                        <div className="space-y-2">
                            <Label>Election *</Label>
                            <Select
                                value={formData.election_id}
                                onValueChange={(value) =>
                                    handleChange("election_id", value)
                                }
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select election" />
                                </SelectTrigger>
                                <SelectContent>
                                    {elections.map((election: any) => (
                                        <SelectItem
                                            key={election.election_id}
                                            value={election.election_id.toString()}
                                        >
                                            {election.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="space-y-2">
                            <Label>Course Section *</Label>
                            <Select
                                value={formData.section_id}
                                onValueChange={(value) =>
                                    handleChange("section_id", value)
                                }
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select course section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((section) => (
                                        <SelectItem
                                            key={section.section_id}
                                            value={section.section_id.toString()}
                                        >
                                            {section.course?.course_code ||
                                                "Course"}{" "}
                                            - Year {section.year_level} Section{" "}
                                            {section.section_code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <Label>Preferred Date *</Label>
                            <Input
                                type="date"
                                value={formData.preferred_date}
                                onChange={(e) =>
                                    handleChange(
                                        "preferred_date",
                                        e.target.value,
                                    )
                                }
                                min={new Date().toISOString().split("T")[0]}
                                required
                                className="rounded-xl"
                            />
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time *</Label>
                                <Input
                                    type="time"
                                    value={formData.preferred_start_time}
                                    onChange={(e) =>
                                        handleChange(
                                            "preferred_start_time",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time *</Label>
                                <Input
                                    type="time"
                                    value={formData.preferred_end_time}
                                    onChange={(e) =>
                                        handleChange(
                                            "preferred_end_time",
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <Label>Message (Optional)</Label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) =>
                                    handleChange("message", e.target.value)
                                }
                                placeholder="Add any additional notes or special requests..."
                                rows={3}
                                className="rounded-xl resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Request
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200 rounded-xl">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-800">
                                About Schedule Requests
                            </h4>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>
                                    • Your request will be reviewed by
                                    COMELEC/Admin
                                </li>
                                <li>
                                    • You will be notified once your request is
                                    processed
                                </li>
                                <li>
                                    • Requests may be approved, rejected, or
                                    rescheduled
                                </li>
                                <li>
                                    • Please allow at least 2 days before your
                                    preferred date
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CandidateScheduleRequestForm;