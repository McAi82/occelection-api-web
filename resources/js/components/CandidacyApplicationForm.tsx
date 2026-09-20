// resources/js/components/CandidacyApplicationForm.tsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { candidacyAPI } from "../api/candidacy";
import { electionAPI } from "../api/elections";
import {
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    User,
    GraduationCap,
    Phone,
    MapPin,
    Users,
    Award,
    Info,
    Upload,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
    election_type: string;
    positions?: Array<{
        position_id: number;
        title: string;
        category?: string;
    }>;
}

interface CandidacyApplicationFormProps {
    electionId?: number;
    electionTitle?: string;
    electionType?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CandidacyApplicationForm: React.FC<CandidacyApplicationFormProps> = ({
    electionId,
    electionTitle,
    electionType,
    onSuccess,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [elections, setElections] = useState<Election[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        election_id: electionId?.toString() || "",
        selectedPosition: "",
        course: "",
        currentYear: "",
        age: "",
        studentNo: "",
        noUnitLoad: "",
        cellphone: "",
        socialMedia: "",
        presentAddress: "",
        presentAddress2: "",
        positionCSG: false,
        positionSC: false,
        department: "",
        partyIndependent: false,
        partyOther: false,
        politicalParty: "",
        platform: "",
        qualifications: "",
        aff1Org: "",
        aff1Pos: "",
        aff1Date: "",
        aff2Org: "",
        aff2Pos: "",
        aff2Date: "",
        aff3Org: "",
        aff3Pos: "",
        aff3Date: "",
    });

    useEffect(() => {
        if (!electionId) {
            fetchElections();
        }
    }, []);

    useEffect(() => {
        if (formData.election_id) {
            fetchPositions(formData.election_id);
        }
    }, [formData.election_id]);

    const fetchElections = async () => {
        try {
            const response = await electionAPI.getAll();
            const data = Array.isArray(response.data) ? response.data : [];
            setElections(data);
        } catch (error) {
            console.error("Failed to fetch elections:", error);
        }
    };

    const fetchPositions = async (electionId: string) => {
        try {
            const response = await electionAPI.getById(electionId);
            const data = response.data;
            const positionsData = data?.positions || data?.data?.positions || [];
            setPositions(positionsData);
        } catch (error) {
            console.error("Failed to fetch positions:", error);
            setPositions([]);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (!formData.election_id) {
            setError("Please select an election");
            setLoading(false);
            return;
        }

        if (!formData.selectedPosition) {
            setError("Please select a position");
            setLoading(false);
            return;
        }

        if (!formData.platform.trim()) {
            setError("Please provide your campaign platform");
            setLoading(false);
            return;
        }

        try {
            await candidacyAPI.apply({
                election_id: parseInt(formData.election_id),
                form_data: formData,
            });
            setSuccess(
                "Application submitted successfully! You will be notified once it's reviewed.",
            );
            if (onSuccess) {
                setTimeout(onSuccess, 2000);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Failed to submit application. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Election & Position */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Election Details
                </h3>

                {!electionId && (
                    <div className="space-y-2">
                        <Label>Select Election *</Label>
                        <Select
                            value={formData.election_id}
                            onValueChange={(value) =>
                                handleChange("election_id", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an election" />
                            </SelectTrigger>
                            <SelectContent>
                                {elections.map((election) => (
                                    <SelectItem
                                        key={election.election_id}
                                        value={election.election_id.toString()}
                                    >
                                        {election.title} (
                                        {election.election_type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {electionId && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-gray-500">Election</p>
                        <p className="font-semibold text-gray-900">
                            {electionTitle}
                        </p>
                        <Badge className="mt-1">{electionType}</Badge>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Position Applied For *</Label>
                    <Select
                        value={formData.selectedPosition}
                        onValueChange={(value) =>
                            handleChange("selectedPosition", value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a position" />
                        </SelectTrigger>
                        <SelectContent>
                            {positions.map((position) => (
                                <SelectItem
                                    key={position.position_id}
                                    value={position.title}
                                >
                                    {position.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Course *</Label>
                        <Input
                            value={formData.course}
                            onChange={(e) =>
                                handleChange("course", e.target.value)
                            }
                            placeholder="e.g., BSIT"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Current Year Level *</Label>
                        <Select
                            value={formData.currentYear}
                            onValueChange={(value) =>
                                handleChange("currentYear", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1st Year</SelectItem>
                                <SelectItem value="2">2nd Year</SelectItem>
                                <SelectItem value="3">3rd Year</SelectItem>
                                <SelectItem value="4">4th Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Age *</Label>
                        <Input
                            type="number"
                            value={formData.age}
                            onChange={(e) =>
                                handleChange("age", e.target.value)
                            }
                            placeholder="Enter age"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Student Number *</Label>
                        <Input
                            value={formData.studentNo}
                            onChange={(e) =>
                                handleChange("studentNo", e.target.value)
                            }
                            placeholder="Enter student number"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Number of Units Load *</Label>
                        <Input
                            type="number"
                            value={formData.noUnitLoad}
                            onChange={(e) =>
                                handleChange("noUnitLoad", e.target.value)
                            }
                            placeholder="Enter number of units"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Cellphone Number *</Label>
                        <Input
                            value={formData.cellphone}
                            onChange={(e) =>
                                handleChange("cellphone", e.target.value)
                            }
                            placeholder="09XXXXXXXXX"
                            required
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Social Media Account</Label>
                        <Input
                            value={formData.socialMedia}
                            onChange={(e) =>
                                handleChange("socialMedia", e.target.value)
                            }
                            placeholder="Facebook profile link"
                        />
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Present Address
                </h3>
                <div className="space-y-2">
                    <Input
                        value={formData.presentAddress}
                        onChange={(e) =>
                            handleChange("presentAddress", e.target.value)
                        }
                        placeholder="Street, Barangay, City/Municipality"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Input
                        value={formData.presentAddress2}
                        onChange={(e) =>
                            handleChange("presentAddress2", e.target.value)
                        }
                        placeholder="Additional address (optional)"
                    />
                </div>
            </div>

            {/* Position Organization */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Organization
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={formData.positionCSG}
                            onCheckedChange={(checked) =>
                                handleChange("positionCSG", checked)
                            }
                        />
                        <span className="text-sm">Central Student Government</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={formData.positionSC}
                            onCheckedChange={(checked) =>
                                handleChange("positionSC", checked)
                            }
                        />
                        <span className="text-sm">Student Council</span>
                    </label>
                    <div className="space-y-2">
                        <Label>Department (if applicable)</Label>
                        <Input
                            value={formData.department}
                            onChange={(e) =>
                                handleChange("department", e.target.value)
                            }
                            placeholder="Enter department"
                        />
                    </div>
                </div>
            </div>

            {/* Political Party */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900">
                    Political Party Affiliation
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={formData.partyIndependent}
                            onCheckedChange={(checked) =>
                                handleChange("partyIndependent", checked)
                            }
                        />
                        <span className="text-sm">Independent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={formData.partyOther}
                            onCheckedChange={(checked) =>
                                handleChange("partyOther", checked)
                            }
                        />
                        <span className="text-sm">Other Political Party</span>
                    </label>
                    {formData.partyOther && (
                        <Input
                            value={formData.politicalParty}
                            onChange={(e) =>
                                handleChange("politicalParty", e.target.value)
                            }
                            placeholder="Enter political party name"
                        />
                    )}
                </div>
            </div>

            {/* Affiliations */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900">
                    Present Affiliations
                </h3>
                {[1, 2, 3].map((n) => (
                    <div key={n} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                            value={formData[`aff${n}Org` as keyof typeof formData] as string}
                            onChange={(e) =>
                                handleChange(`aff${n}Org`, e.target.value)
                            }
                            placeholder={`Organization ${n}`}
                        />
                        <Input
                            value={formData[`aff${n}Pos` as keyof typeof formData] as string}
                            onChange={(e) =>
                                handleChange(`aff${n}Pos`, e.target.value)
                            }
                            placeholder="Position"
                        />
                        <Input
                            value={formData[`aff${n}Date` as keyof typeof formData] as string}
                            onChange={(e) =>
                                handleChange(`aff${n}Date`, e.target.value)
                            }
                            placeholder="Date"
                        />
                    </div>
                ))}
            </div>

            {/* Platform & Qualifications */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Campaign Platform & Qualifications
                </h3>
                <div className="space-y-2">
                    <Label>Campaign Platform *</Label>
                    <Textarea
                        value={formData.platform}
                        onChange={(e) =>
                            handleChange("platform", e.target.value)
                        }
                        placeholder="Describe your platform and goals..."
                        rows={4}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Qualifications & Achievements *</Label>
                    <Textarea
                        value={formData.qualifications}
                        onChange={(e) =>
                            handleChange("qualifications", e.target.value)
                        }
                        placeholder="List your qualifications, achievements, and experience..."
                        rows={4}
                        required
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Submit Application
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default CandidacyApplicationForm;