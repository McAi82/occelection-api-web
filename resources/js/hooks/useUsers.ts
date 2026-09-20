// resources/js/hooks/useUsers.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../api/admin';
import { queryKeys } from './queryKeys';

export const useUsers = (params?: any) => {
    return useQuery({
        queryKey: queryKeys.users.list(),
        queryFn: async () => {
            const response = await adminAPI.getUsers();
            return response.data?.data || response.data || [];
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const useRefreshUsers = () => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    };
};