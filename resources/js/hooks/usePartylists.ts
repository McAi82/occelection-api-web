// resources/js/hooks/usePartylists.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { partylistAPI } from '../api/partylists';
import { candidatePartylistAPI } from '../api/candidatePartylist';
import { queryKeys } from './queryKeys';

export const usePartylists = (electionId?: string) => {
    return useQuery({
        queryKey: queryKeys.partylists.byElection(electionId || ''),
        queryFn: async () => {
            const response = await partylistAPI.getAll(electionId);
            return response.data || [];
        },
        enabled: !!electionId,
        staleTime: 1000 * 60 * 5,
    });
};

export const useCandidatePartylists = (electionId: number) => {
    return useQuery({
        queryKey: ['candidatePartylists', electionId],
        queryFn: async () => {
            const response = await candidatePartylistAPI.getLists(electionId);
            return response.data || [];
        },
        enabled: !!electionId,
        staleTime: 1000 * 60 * 2,
    });
};

export const useRefreshPartylists = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.partylists.all });
    };
};