// resources/js/App.tsx
import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { QueryProvider } from "./providers/QueryProvider";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RootLayout from "./components/layouts/RootLayout";
import MainLayout from "./components/layouts/MainLayout";

// ===== PUBLIC PAGES =====
import Portal from "./Portal/Portal";
import DownloadApp from "./common/DownloadApp";
import ForgotPassword from "./Portal/ForgotPassword";
import ResetPassword from "./Portal/ResetPassword";

// ===== ADMIN PAGES =====
import AdminDashboard from "./Dashboard/AdminDashboard";
import ManageElections from "./Admin/ManageElections";
import ManageCandidates from "./Admin/ManageCandidates";
import VoterManagement from "./Admin/VoterManagement";
import ImportVoters from "./Admin/ImportVoters";
import Reports from "./Admin/Reports";
import CampaignScheduleManager from "./Admin/CampaignScheduleManager";
import LiveCommentsModeration from "./Admin/LiveCommentsModeration";
import ManageCandidacyApplications from "./Admin/ManageCandidacyApplications";
import CreateUser from "./Admin/CreateUser";
import UserList from "./Admin/UserList";
import AdminRecords from "./Admin/ElectionRecords";
import FaceRegistration from "./Admin/FaceRegistration";
import ManagePositions from "./Admin/ManagePositions";
import CandidacyRecords from "./Admin/CandidacyRecords";

// ===== MONITORING PAGES =====
import PositionsOverview from "./Monitoring/PositionsOverview";
import MonitoringDashboard from "./Monitoring/MonitoringDashboard";
import MonitoringResults from "./Monitoring/MonitoringResults";
import MonitoringTurnout from "./Monitoring/MonitoringTurnout";
import MonitoringAudit from "./Monitoring/MonitoringAudit";

// ===== DASHBOARD PAGES =====
import VoterDashboard from "./Dashboard/VoterDashboard";
import CandidateDashboard from "./Dashboard/CandidateDashboard";
import ComelecDashboard from "./Dashboard/ComelecDashboard";
import VoterApplications from "./Dashboard/VoterApplications";

// ===== SCHEDULE =====
import ScheduleRequestManagement from "./pages/ScheduleRequestManagement";
import CandidateScheduleRequestForm from "./components/CandidateScheduleRequestForm";

// ===== ELECTIONS =====
import ElectionsList from "./Elections/ElectionsList";
import ElectionDetails from "./Elections/ElectionDetails";
import LiveResults from "./Elections/LiveResults";
import Winners from "./Elections/Winners";

// ===== CANDIDATES =====
import CandidatesList from "./Candidates/CandidatesList";
import CandidateProfile from "./Candidates/CandidateProfile";
import CandidateComparison from "./Candidates/CandidateComparison";

// ===== PARTYLIST =====
import PartylistList from "./Partylist/PartylistList";
import PartylistDetail from "./Partylist/PartylistDetail";
import PartylistRequestManager from "./components/PartylistRequestManager";

// ===== TIMELINE =====
import Timeline from "./pages/Timeline";
import CandidateTimeline from "./pages/CandidateTimeline";

// ===== CANDIDACY =====
import ApplyCandidacy from "./Candidacy/ApplyCandidacy";

// ===== PROFILE & FEEDBACK =====
import ProfileSettings from "./Profile/ProfileSettings";
import FeedbackPage from "./Feedback/FeedbackPage";

// ===== NOTIFICATIONS =====
import NotificationsPage from "./Notifications/NotificationsPage";
import { useAuth } from "./contexts/AuthContext";

// ===== DASHBOARD WRAPPER =====
const DashboardWrapper: React.FC = () => {
    const { user } = useAuth();
    if (user?.role === "admin") return <AdminDashboard />;
    if (user?.role === "comelec") return <ComelecDashboard />;
    if (user?.role === "candidate") return <CandidateDashboard />;
    return <VoterDashboard />;
};

function App(): React.ReactElement {
    return (
        <Router>
            <QueryProvider>
                <AuthProvider>
                    <NotificationProvider>
                        <Routes>
                            {/* ===== PUBLIC ROUTES ===== */}
                            <Route element={<RootLayout />}>
                                <Route path="/" element={<Portal />} />
                                <Route
                                    path="/download-app"
                                    element={<DownloadApp />}
                                />
                                <Route
                                    path="/forgot-password"
                                    element={<ForgotPassword />}
                                />
                                <Route
                                    path="/reset-password"
                                    element={<ResetPassword />}
                                />
                            </Route>

                            {/* ===== PROTECTED ROUTES ===== */}
                            <Route element={<MainLayout />}>
                                {/* Dashboard */}
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <DashboardWrapper />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Admin Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/dashboard"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <AdminDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/elections"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <ManageElections />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/positions"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <ManagePositions />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/candidacy-records"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <CandidacyRecords />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/voters"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <VoterManagement />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/import-voters"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <ImportVoters />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/users/list"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <UserList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/users/create"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <CreateUser />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/face-registration"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <FaceRegistration />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/applications"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <ManageCandidacyApplications />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/schedule-requests"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <ScheduleRequestManagement userRole="admin" />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/reports"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <Reports />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/records"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <AdminRecords />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/monitoring/live-dashboard"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <MonitoringDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/monitoring/results"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <MonitoringResults />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/monitoring/turnout"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <MonitoringTurnout />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/monitoring/audit"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <MonitoringAudit />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/campaign-schedule"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <CampaignScheduleManager />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/admin/candidates"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin"]}
                                        >
                                            <ManageCandidates />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* COMELEC Routes */}
                                <Route
                                    path="/comelec/candidates"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["comelec"]}
                                        >
                                            <ManageCandidates />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/comelec/campaign-schedule"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["comelec"]}
                                        >
                                            <CampaignScheduleManager />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/comelec/schedule-requests"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["comelec"]}
                                        >
                                            <ScheduleRequestManagement userRole="comelec" />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/monitoring/positions"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin", "comelec"]}
                                        >
                                            <PositionsOverview />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Candidate */}
                                <Route
                                    path="/candidate/schedule-request"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["candidate"]}
                                        >
                                            <CandidateScheduleRequestForm />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Common */}
                                <Route
                                    path="/elections"
                                    element={
                                        <ProtectedRoute>
                                            <ElectionsList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/elections/:id"
                                    element={
                                        <ProtectedRoute>
                                            <ElectionDetails />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/elections/:id/live-results"
                                    element={
                                        <ProtectedRoute>
                                            <LiveResults />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/elections/:id/winners"
                                    element={
                                        <ProtectedRoute>
                                            <Winners />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/candidates"
                                    element={
                                        <ProtectedRoute>
                                            <CandidatesList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/candidates/:id"
                                    element={
                                        <ProtectedRoute>
                                            <CandidateProfile />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/candidate-comparison"
                                    element={
                                        <ProtectedRoute>
                                            <CandidateComparison />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/candidate/partylist-requests"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["candidate"]}
                                        >
                                            <PartylistRequestManager />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/partylists"
                                    element={
                                        <ProtectedRoute>
                                            <PartylistList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/partylists/:id"
                                    element={
                                        <ProtectedRoute>
                                            <PartylistDetail />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/timeline"
                                    element={
                                        <ProtectedRoute>
                                            <Timeline />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/candidate-timeline/:candidateId"
                                    element={
                                        <ProtectedRoute>
                                            <CandidateTimeline />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/apply-candidacy/:electionId"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["voter", "candidate"]}
                                        >
                                            <ApplyCandidacy />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/my-applications"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["voter", "candidate"]}
                                        >
                                            <VoterApplications />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <ProfileSettings />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/feedback"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={[
                                                "voter",
                                                "candidate",
                                                "admin",
                                                "comelec",
                                            ]}
                                        >
                                            <FeedbackPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/moderate/comments"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin", "comelec"]}
                                        >
                                            <LiveCommentsModeration />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Monitoring (both roles) */}
                                <Route
                                    path="/monitoring/live-dashboard"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin", "comelec"]}
                                        >
                                            <MonitoringDashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/monitoring/results"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin", "comelec"]}
                                        >
                                            <MonitoringResults />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/monitoring/turnout"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin", "comelec"]}
                                        >
                                            <MonitoringTurnout />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/monitoring/audit"
                                    element={
                                        <ProtectedRoute
                                            allowedRoles={["admin", "comelec"]}
                                        >
                                            <MonitoringAudit />
                                        </ProtectedRoute>
                                    }
                                />

                                <Route
                                    path="/download-app"
                                    element={
                                        <ProtectedRoute>
                                            <DownloadApp />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/notifications"
                                    element={
                                        <ProtectedRoute>
                                            <NotificationsPage />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>

                            <Route
                                path="*"
                                element={<Navigate to="/dashboard" replace />}
                            />
                        </Routes>
                    </NotificationProvider>
                </AuthProvider>
            </QueryProvider>
        </Router>
    );
}

export default App;