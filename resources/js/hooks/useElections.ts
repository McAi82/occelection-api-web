// resources/js/hooks/useElections.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { electionAPI, Winner } from '../api/elections';
import { queryKeys } from './queryKeys';

export const useElections = (filters?: any) => {
    return useQuery({
        queryKey: queryKeys.elections.list(filters),
        queryFn: async () => {
            const response = await electionAPI.getAll();
            return response.data || [];
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const useElection = (id: number) => {
    return useQuery({
        queryKey: queryKeys.elections.detail(id),
        queryFn: async () => {
            const response = await electionAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
};

export const useWinners = (id: number) => {
    return useQuery({
        queryKey: queryKeys.elections.winners(id),
        queryFn: async () => {
            const response = await electionAPI.getWinners(id);
            return response.data || [];
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
    });
};

// Helper hook to refresh elections
export const useRefreshElections = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
    };
};