// resources/js/pages/Admin/ImportVoters.tsx
import React, { useState, useEffect } from "react";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { adminAPI } from "../api/admin";
import { electionAPI } from "../api/elections";
import {
    Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle,
    Loader2, Info, Users, UserPlus, RefreshCw, XCircle, Clock,
} from "lucide-react";

interface Election { election_id: number; title: string; }
interface ImportResult {
    message?: string;
    imported_count?: number;
    updated_count?: number;
    registered_count?: number;
    skipped_rows?: string[];
    errors?: Array<{ errors: Record<string, string[]> }>;
    queued?: boolean;
}

const ImportVoters: React.FC = () => {
    const [elections, setElections] = useState<Election[]>([]);
    const [selectedElection, setSelectedElection] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState("");

    useEffect(() => { fetchElections(); }, []);

    const fetchElections = async (): Promise<void> => {
        try {
            const response = await electionAPI.getAll();
            const data = response.data;
            setElections(Array.isArray(data) ? data : []);
            if (data && data.length > 0) {
                setSelectedElection(data[0].election_id.toString());
            }
        } catch (error) {
            console.error("Failed to fetch elections:", error);
            setError("Failed to load elections");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const selected = e.target.files?.[0];
        if (selected) {
            const name = selected.name;
            const validExtensions = [".xlsx", ".csv", ".xls"];
            const ext = name.substring(name.lastIndexOf(".")).toLowerCase();
            if (validExtensions.includes(ext)) {
                setFile(selected);
                setError("");
                setResult(null);
            } else {
                setError("Please upload a valid Excel or CSV file");
                setFile(null);
            }
        }
    };

    const handleImport = async (): Promise<void> => {
        if (!selectedElection) { setError("Please select an election"); return; }
        if (!file) { setError("Please select a file to upload"); return; }

        setUploading(true);
        setError("");
        setResult(null);

        const formData = new FormData();
        formData.append("election_id", selectedElection);
        formData.append("file", file);

        try {
            const response = await adminAPI.importVoters(formData);
            setResult(response.data);
        } catch (error: any) {
            console.error("Import error:", error);
            setError(error.response?.data?.message || "Failed to queue import");
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = (): void => {
        const headers = ["ID Number", "Last Name", "First Name", "Middle Name", "Email", "Department"];
        const sampleRows = [
            "2024-1-06462,ABA,MAGEL,ACOSTA,ABAMAGEL33@GMAIL.COM,CBA",
            "2024-1-06332,ABALDE,IAN MARK,JAMIS,occ.abalde.ianmark@gmail.com,CIT",
            "2025-1-07618,ABEJO,KENT JUSHUA,FRIAS,occ.abejo.kentjushua08@gmail.com,TED",
            "2023-1-05521,ABEJO,EITH CLAIRE,BULALAHOS,eithclaire5276@gmail.com,TED",
            "2026-1-08563,ABAYON,MAE ANN,,occ.abayon.maeann2354@gmail.com,CBA",
        ];
        const csv = [headers.join(","), ...sampleRows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "voter_import_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const isQueued = result?.queued === true;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Import Voters</h1>
                <p className="text-gray-600">Bulk import voters from the registrar's Excel or CSV file</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Import Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>Download the template below (registrar format)</li>
                        <li>
                            Columns must be: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                ID Number, Last Name, First Name, Middle Name, Email, Department
                            </code>
                        </li>
                        <li>
                            Department codes:{" "}
                            <Badge className="bg-blue-100 text-blue-700 border-0 mx-1">CIT</Badge>
                            <Badge className="bg-green-100 text-green-700 border-0 mx-1">CBA</Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-0 mx-1">TED</Badge>
                        </li>
                        <li>Middle Name may be blank (empty, "N/A", "NULL", or "-" accepted)</li>
                        <li>Year Level is left blank — students set it in their profile</li>
                        <li>Select the election you want to register voters for</li>
                        <li>Upload the file — the import runs in the background</li>
                        <li>You'll receive a notification when it completes</li>
                    </ol>
                    <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                        <Download className="w-4 h-4" />
                        Download Template
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 space-y-1">
                            <p className="font-semibold">How background import works</p>
                            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                                <li>Your upload is queued instantly (no timeout risk)</li>
                                <li>A background worker processes the file</li>
                                <li>New students get accounts (password = Student ID)</li>
                                <li>Existing students (matched by Student ID) get updated</li>
                                <li>Everyone is registered as a voter for the selected election</li>
                                <li>You'll receive a notification when it finishes</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Election</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedElection}
                            onChange={(e) => setSelectedElection(e.target.value)}
                            required
                        >
                            <option value="">Choose an election...</option>
                            {elections.map((el) => (
                                <option key={el.election_id} value={el.election_id}>{el.title}</option>
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
                        <label htmlFor="file-upload" className="cursor-pointer block">
                            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500">Excel or CSV files only</p>
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

                    {result && isQueued && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <p className="font-semibold mb-1">Import queued!</p>
                                <p>{result.message || "Your file is being processed in the background. You will receive a notification when it completes."}</p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {result && !isQueued && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-600">
                                <p className="font-semibold mb-2">{result.message || "Import completed successfully."}</p>
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
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                        ) : (
                            <><Upload className="w-4 h-4 mr-2" />Queue Import</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {result?.skipped_rows && result.skipped_rows.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-700 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Skipped Rows ({result.skipped_rows.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {result.skipped_rows.map((rowError, index) => (
                                <div key={index} className="text-sm p-2 bg-white rounded border border-yellow-200">
                                    <p className="font-mono text-yellow-800">{rowError}</p>
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
