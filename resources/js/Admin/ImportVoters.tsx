// resources/js/pages/Admin/ImportVoters.tsx
import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { adminAPI } from "../api/admin";
import { electionAPI } from "../api/elections";
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    Loader2,
    Info,
    Users,
    UserPlus,
    RefreshCw,
    XCircle,
} from "lucide-react";

interface Election {
    election_id: number;
    title: string;
}

interface ImportResult {
    message?: string;
    imported_count?: number;
    updated_count?: number;
    registered_count?: number;
    skipped_rows?: string[];
    errors?: Array<{ errors: Record<string, string[]> }>;
}

const ImportVoters: React.FC = () => {
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchElections();
    }, []);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            const electionsData = response.data;
            setElections(Array.isArray(electionsData) ? electionsData : []);
            if (electionsData && electionsData.length > 0) {
                setSelectedElection(electionsData[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setError("Failed to load elections");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const fileName = selectedFile.name;
            const validExtensions = [".xlsx", ".csv", ".xls"];
            const fileExtension = fileName
                .substring(fileName.lastIndexOf("."))
                .toLowerCase();

            if (validExtensions.includes(fileExtension)) {
                setFile(selectedFile);
                setError("");
                setResult(null);
            } else {
                setError("Please upload a valid Excel or CSV file");
                setFile(null);
            }
        }
    };

    const handleImport = async (): Promise<void> => {
        if (!selectedElection) {
            setError("Please select an election");
            return;
        }
        if (!file) {
            setError("Please select a file to upload");
            return;
        }

        setUploading(true);
        setError("");
        setResult(null);

        const formData = new FormData();
        formData.append("election_id", selectedElection);
        formData.append("file", file);

        try {
            const response = await adminAPI.importVoters(formData);
            if (response.data) {
                setResult(response.data);
            } else {
                setResult(null);
            }
        } catch (error: any) {
            console.error("Import error:", error);
            const errorMessage =
                error.response?.data?.message || "Failed to import voters";
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    /**
     * ✅ Download template in the REGISTRAR format
     * Columns: ID Number, Last Name, First Name, Middle Name, Email, Department
     */
    const downloadTemplate = (): void => {
        const headers = [
            "ID Number",
            "Last Name",
            "First Name",
            "Middle Name",
            "Email",
            "Department",
        ];

        const sampleRows = [
            "2024-1-06462,ABA,MAGEL,ACOSTA,ABAMAGEL33@GMAIL.COM,CBA",
            "2024-1-06332,ABALDE,IAN MARK,JAMIS,occ.abalde.ianmark@gmail.com,CIT",
            "2025-1-07618,ABEJO,KENT JUSHUA,FRIAS,occ.abejo.kentjushua08@gmail.com,TED",
            "2023-1-05521,ABEJO,EITH CLAIRE,BULALAHOS,eithclaire5276@gmail.com,TED",
            "2026-1-08563,ABAYON,MAE ANN,,occ.abayon.maeann2354@gmail.com,CBA",
        ];

        const csvContent = [headers.join(","), ...sampleRows].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "voter_import_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasResult = result !== null;
    const skippedRows = result?.skipped_rows ?? [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Import Voters
                </h1>
                <p className="text-gray-600">
                    Bulk import voters from the registrar's Excel or CSV file
                </p>
            </div>

            {/* Instructions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Import Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>
                            Download the template file below (registrar
                            format)
                        </li>
                        <li>
                            Fill in the student information — columns must be:{" "}
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                ID Number, Last Name, First Name, Middle Name,
                                Email, Department
                            </code>
                        </li>
                        <li>
                            <strong>Department</strong> codes are:{" "}
                            <Badge className="bg-blue-100 text-blue-700 border-0 mx-1">
                                CIT
                            </Badge>
                            <Badge className="bg-green-100 text-green-700 border-0 mx-1">
                                CBA
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-0 mx-1">
                                TED
                            </Badge>
                        </li>
                        <li>
                            <strong>Middle Name</strong> may be left blank
                            (empty, "N/A", "NULL", or "-" are all accepted)
                        </li>
                        <li>
                            <strong>Year Level</strong> is left blank —
                            students will set it in their own profile
                        </li>
                        <li>Select the election you want to register voters for</li>
                        <li>Upload the completed file</li>
                        <li>Review the import results</li>
                    </ol>
                    <Button
                        variant="outline"
                        onClick={downloadTemplate}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download Template (Registrar Format)
                    </Button>
                </CardContent>
            </Card>

            {/* Info Card: What happens on import */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 space-y-1">
                            <p className="font-semibold">
                                What happens when you import?
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                                <li>
                                    <UserPlus className="w-3 h-3 inline mr-1" />
                                    New students get an account created
                                    (default password = their Student ID)
                                </li>
                                <li>
                                    <RefreshCw className="w-3 h-3 inline mr-1" />
                                    Existing students (matched by Student ID)
                                    get their info updated
                                </li>
                                <li>
                                    <Users className="w-3 h-3 inline mr-1" />
                                    Everyone gets registered as a voter for
                                    the selected election
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Select Election
                        </label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedElection}
                            onChange={(e) =>
                                setSelectedElection(e.target.value)
                            }
                            required
                        >
                            <option value="">Choose an election...</option>
                            {elections.map((election) => (
                                <option
                                    key={election.election_id}
                                    value={election.election_id}
                                >
                                    {election.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                        <input
                            type="file"
                            accept=".xlsx,.csv,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer block"
                        >
                            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-gray-500">
                                Excel or CSV files only
                            </p>
                        </label>
                        {file && (
                            <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Selected: {file.name}
                            </div>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {hasResult && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-600">
                                <p className="font-semibold mb-2">
                                    {result.message ||
                                        "Import completed successfully."}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {result.imported_count !== undefined && (
                                        <Badge className="bg-blue-100 text-blue-700 border-0">
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            {result.imported_count} new user(s)
                                        </Badge>
                                    )}
                                    {result.updated_count !== undefined && (
                                        <Badge className="bg-yellow-100 text-yellow-700 border-0">
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            {result.updated_count} updated
                                        </Badge>
                                    )}
                                    {result.registered_count !== undefined && (
                                        <Badge className="bg-green-100 text-green-700 border-0">
                                            <Users className="w-3 h-3 mr-1" />
                                            {result.registered_count} registered
                                        </Badge>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button
                        onClick={handleImport}
                        disabled={!selectedElection || !file || uploading}
                        className="w-full bg-blue-600"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Voters
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Skipped Rows Card */}
            {skippedRows.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-700 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Skipped Rows ({skippedRows.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-yellow-800 mb-3">
                            These rows were skipped. Review the errors below
                            and fix them in your file, then re-upload.
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {skippedRows.map((rowError, index) => (
                                <div
                                    key={index}
                                    className="text-sm p-2 bg-white rounded border border-yellow-200"
                                >
                                    <p className="font-mono text-yellow-800">
                                        {rowError}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Legacy errors (from validator) */}
            {result?.errors && result.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Validation Errors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {result.errors.map((errorItem, index) => (
                                <div
                                    key={index}
                                    className="text-sm p-2 bg-white rounded border border-red-200"
                                >
                                    <p className="font-semibold text-red-700">
                                        Row {index + 1}:
                                    </p>
                                    <p className="text-red-600">
                                        {JSON.stringify(errorItem.errors)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ImportVoters;