// resources/js/hooks/useDashboard.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { electionAPI } from '../api/elections';
import { candidateAPI } from '../api/candidates';
import { adminAPI } from '../api/admin';
import { monitoringAPI } from '../api/monitoring';
import { queryKeys } from './queryKeys';

// ============ ADMIN DASHBOARD ============
export const useAdminDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboard', 'admin', 'stats'],
        queryFn: async () => {
            const electionsRes = await electionAPI.getAll();
            const elections = electionsRes.data || [];
            const now = new Date();
            
            const activeElections = elections.filter((e: any) => {
                const start = new Date(e.voting_start);
                const end = new Date(e.voting_end);
                return now >= start && now <= end;
            });

            return {
                totalElections: elections.length,
                activeElections: activeElections.length,
                elections: elections,
            };
        },
        staleTime: 1000 * 60 * 2,
    });
};

export const useRefreshAdminDashboard = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
    };
};

// ============ VOTER DASHBOARD ============
export const useVoterDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboard', 'voter', 'stats'],
        queryFn: async () => {
            const response = await electionAPI.getAll();
            const elections = response.data || [];
            const now = new Date();
            
            const ongoing = elections.filter((e: any) => {
                const start = new Date(e.voting_start);
                const end = new Date(e.voting_end);
                return now >= start && now <= end;
            }).length;
            
            const upcoming = elections.filter((e: any) => {
                return new Date(e.voting_start) > now;
            }).length;

            return {
                totalElections: elections.length,
                ongoingCount: ongoing,
                upcomingCount: upcoming,
                elections: elections,
            };
        },
        staleTime: 1000 * 60 * 2,
    });
};

export const useRefreshVoterDashboard = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'voter'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
    };
};

// ============ CANDIDATE DASHBOARD ============
export const useCandidateDashboardData = (userId?: number) => {
    return useQuery({
        queryKey: ['dashboard', 'candidate', userId],
        queryFn: async () => {
            // Get active election
            let activeElection = null;
            try {
                const electionRes = await electionAPI.getActive();
                activeElection = electionRes.data || null;
            } catch (e) {
                // No active election
            }

            let applications = [];
            let voteCount = 0;

            if (activeElection && userId) {
                // Get candidates for this election
                const candidatesRes = await candidateAPI.getByElection(activeElection.election_id);
                const allCandidates = candidatesRes.data || [];
                const userApplications = allCandidates.filter(
                    (c: any) => c.user_id === userId
                );
                applications = userApplications;

                // Get vote count if approved and ongoing
                const approvedApp = userApplications.find((app: any) => app.is_approved);
                const now = new Date();
                const isOngoing = activeElection.voting_start && activeElection.voting_end
                    ? now >= new Date(activeElection.voting_start) &&
                      now <= new Date(activeElection.voting_end)
                    : false;

                if (approvedApp && isOngoing) {
                    try {
                        const resultsRes = await electionAPI.getLiveResults(activeElection.election_id);
                        const resultsData = resultsRes.data;
                        const positionResults = resultsData?.live_results?.[approvedApp.position?.title || ""];
                        const candidateResult = positionResults?.find(
                            (r: any) =>
                                r.candidate_name ===
                                `${approvedApp.user?.first_name} ${approvedApp.user?.last_name}`
                        );
                        voteCount = candidateResult?.votes || 0;
                    } catch (e) {
                        console.error("Failed to fetch vote count:", e);
                    }
                }
            }

            return {
                activeElection,
                applications,
                voteCount,
                hasActiveElection: !!activeElection,
            };
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2,
    });
};

export const useRefreshCandidateDashboard = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'candidate'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
    };
};

// ============ COMELEC DASHBOARD ============
export const useComelecDashboardData = (electionId?: string) => {
    return useQuery({
        queryKey: ['dashboard', 'comelec', electionId],
        queryFn: async () => {
            if (!electionId) {
                return {
                    statistics: null,
                    positionProgress: [],
                    recentActivity: { last_30_minutes: 0 },
                    isOngoing: false,
                    election: null,
                };
            }

            try {
                const response = await monitoringAPI.getDashboard(electionId);
                const data = response.data as any;
                
                return {
                    statistics: data?.statistics || null,
                    positionProgress: data?.position_progress || [],
                    recentActivity: data?.recent_activity || { last_30_minutes: 0 },
                    isOngoing: data?.is_ongoing || false,
                    election: data?.election || null,
                };
            } catch (error) {
                console.error("Failed to fetch COMELEC dashboard:", error);
                return {
                    statistics: null,
                    positionProgress: [],
                    recentActivity: { last_30_minutes: 0 },
                    isOngoing: false,
                    election: null,
                };
            }
        },
        enabled: !!electionId,
        staleTime: 1000 * 30, // 30 seconds for monitoring
        refetchInterval: 1000 * 60, // Auto-refetch every minute
    });
};

export const useRefreshComelecDashboard = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'comelec'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
    };
};