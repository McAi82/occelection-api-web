// resources/js/hooks/useCandidates.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { candidateAPI } from '../api/candidates';
import { queryKeys } from './queryKeys';

export const useCandidates = (electionId: string) => {
    return useQuery({
        queryKey: queryKeys.candidates.byElection(electionId),
        queryFn: async () => {
            if (!electionId) return [];
            const response = await candidateAPI.getByElection(electionId);
            return response.data || [];
        },
        enabled: !!electionId,
        staleTime: 1000 * 60 * 2,
    });
};

export const useCandidate = (id: number) => {
    return useQuery({
        queryKey: queryKeys.candidates.detail(id),
        queryFn: async () => {
            const response = await candidateAPI.getById(id);
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
};

export const useRefreshCandidates = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
    };
};