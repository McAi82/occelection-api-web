// resources/js/hooks/useApplications.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { candidacyAPI } from '../api/candidacy';
import { queryKeys } from './queryKeys';

export const useAdminApplications = (params?: any) => {
    return useQuery({
        queryKey: queryKeys.applications.adminList(params),
        queryFn: async () => {
            const response = await candidacyAPI.adminGetApplications(params);
            return response.data?.data || response.data || [];
        },
        staleTime: 1000 * 60 * 2,
    });
};

export const useComelecApplications = (params?: any) => {
    return useQuery({
        queryKey: queryKeys.applications.comelecList(params),
        queryFn: async () => {
            const response = await candidacyAPI.comelecGetApplications(params);
            return response.data?.data || response.data || [];
        },
        staleTime: 1000 * 60 * 2,
    });
};

export const useMyApplications = (electionId?: number) => {
    return useQuery({
        queryKey: queryKeys.applications.myApplications(electionId),
        queryFn: async () => {
            const response = await candidacyAPI.getMyApplications(electionId);
            return response.data || [];
        },
        staleTime: 1000 * 60 * 2,
    });
};

export const useRefreshApplications = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    };
};