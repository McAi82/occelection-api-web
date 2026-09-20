// resources/js/pages/Candidates/CandidatePartylistManager.tsx
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
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { partylistAPI, Partylist } from "../api/partylists";
import { useAuth } from "../contexts/AuthContext";
import {
    Building2,
    Users,
    UserPlus,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Plus,
    Crown,
    UserMinus,
    Search,
    Mail,
    GraduationCap,
} from "lucide-react";

const CandidatePartylistManager: React.FC = () => {
    const { user } = useAuth();
    const [partylists, setPartylists] = useState<Partylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newPartylist, setNewPartylist] = useState({
        name: "",
        description: "",
    });

    useEffect(() => {
        fetchMyPartylists();
    }, []);

    const fetchMyPartylists = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await partylistAPI.getMyPartylists();
            const data = response.data?.data || response.data || [];
            setPartylists(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Failed to fetch partylists:", err);
            setError(
                err.response?.data?.message || "Failed to load partylists",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePartylist = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        setSuccess("");

        if (!newPartylist.name.trim()) {
            setError("Partylist name is required");
            setCreating(false);
            return;
        }

        try {
            await partylistAPI.create(newPartylist);
            setSuccess("Partylist created successfully!");
            setIsCreateDialogOpen(false);
            setNewPartylist({ name: "", description: "" });
            fetchMyPartylists();
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to create partylist",
            );
        } finally {
            setCreating(false);
        }
    };

    const handleRemoveMember = async (
        membershipId: number,
        memberName: string,
    ) => {
        if (!confirm(`Remove ${memberName} from this partylist?`)) return;

        try {
            await partylistAPI.removeMember(membershipId);
            setSuccess(`${memberName} has been removed from the partylist`);
            fetchMyPartylists();
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to remove member",
            );
        }
    };

    const filteredPartylists = partylists.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden bg-blue-600 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative px-6 py-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="w-5 h-5 text-yellow-300" />
                                <Badge className="bg-white/20 text-white border-0">
                                    Partylist Manager
                                </Badge>
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                My Partylists
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Manage your partylist members and information
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-white text-blue-600 hover:bg-gray-100"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Partylist
                        </Button>
                    </div>
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

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search partylists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl bg-gray-50"
                    />
                </div>
            </div>

            {/* Partylists */}
            {filteredPartylists.length === 0 ? (
                <Card className="border-0 shadow-lg rounded-xl">
                    <CardContent className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Partylists Yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                            You haven't created or joined any partylist.
                        </p>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Partylist
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredPartylists.map((partylist) => (
                        <Card
                            key={partylist.partylist_id}
                            className="border-0 shadow-lg rounded-xl overflow-hidden"
                        >
                            <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {partylist.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {partylist.active_memberships
                                                ?.length || 0}{" "}
                                            members
                                        </p>
                                    </div>
                                </div>
                                {partylist.created_by_user_id ===
                                    user?.user_id && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-0">
                                        <Crown className="w-3 h-3 mr-1" />
                                        Creator
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-6">
                                {partylist.description && (
                                    <p className="text-sm text-gray-600 mb-4">
                                        {partylist.description}
                                    </p>
                                )}

                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Members
                                </h4>

                                {partylist.active_memberships &&
                                partylist.active_memberships.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {partylist.active_memberships.map(
                                            (membership) => (
                                                <div
                                                    key={
                                                        membership.membership_id
                                                    }
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                                                >
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage
                                                            src={
                                                                membership
                                                                    .candidate
                                                                    .user
                                                                    .face_reference_photo ||
                                                                undefined
                                                            }
                                                        />
                                                        <AvatarFallback className="bg-blue-500 text-white">
                                                            {membership
                                                                .candidate
                                                                .user
                                                                .first_name?.[0]}
                                                            {membership
                                                                .candidate
                                                                .user
                                                                .last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-900 truncate">
                                                            {
                                                                membership
                                                                    .candidate
                                                                    .user
                                                                    .first_name
                                                            }{" "}
                                                            {
                                                                membership
                                                                    .candidate
                                                                    .user
                                                                    .last_name
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {membership.candidate
                                                                .position
                                                                ?.title ||
                                                                "Member"}
                                                        </p>
                                                    </div>
                                                    {partylist.created_by_user_id ===
                                                        user?.user_id &&
                                                        membership.candidate
                                                            .user.user_id !==
                                                            user?.user_id && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() =>
                                                                    handleRemoveMember(
                                                                        membership.membership_id,
                                                                        `${membership.candidate.user.first_name} ${membership.candidate.user.last_name}`,
                                                                    )
                                                                }
                                                            >
                                                                <UserMinus className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No members yet
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            >
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Create New Partylist
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleCreatePartylist}
                        className="space-y-4 mt-2"
                    >
                        <div className="space-y-2">
                            <Label>Partylist Name *</Label>
                            <Input
                                value={newPartylist.name}
                                onChange={(e) =>
                                    setNewPartylist({
                                        ...newPartylist,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Enter partylist name"
                                required
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newPartylist.description}
                                onChange={(e) =>
                                    setNewPartylist({
                                        ...newPartylist,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Describe your partylist..."
                                rows={3}
                                className="rounded-xl resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateDialogOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating}
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Create Partylist
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CandidatePartylistManager;