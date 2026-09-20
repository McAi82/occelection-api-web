// resources/js/hooks/useCampaignSchedules.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignScheduleAPI, CreateScheduleData, UpdateScheduleData, CampaignSchedule, PaginatedSchedulesResponse } from '../api/campaignschedules';

export const useCampaignSchedules = (electionId: string | number, page: number = 1, perPage: number = 20) => {
    return useQuery({
        queryKey: ['campaignSchedules', electionId, page, perPage],
        queryFn: async () => {
            if (!electionId) return { data: [], current_page: 1, last_page: 1, per_page: perPage, total: 0 } as PaginatedSchedulesResponse;
            const response = await campaignScheduleAPI.getByElection(electionId, page, perPage);
            const result = response.data;
            
            if (result && typeof result === 'object') {
                if (Array.isArray(result)) {
                    return { data: result, current_page: 1, last_page: 1, per_page: perPage, total: result.length };
                }
                if (result.data && Array.isArray(result.data)) {
                    if (result.current_page !== undefined) {
                        return result;
                    }
                    return { data: result.data, current_page: 1, last_page: 1, per_page: perPage, total: result.data.length };
                }
            }
            return { data: [], current_page: 1, last_page: 1, per_page: perPage, total: 0 };
        },
        enabled: !!electionId,
        staleTime: 1000 * 60 * 2,
    });
};

export const useCreateCampaignSchedule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ electionId, data }: { electionId: string | number; data: CreateScheduleData }) =>
            campaignScheduleAPI.create(electionId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['campaignSchedules', variables.electionId] });
        },
    });
};

export const useUpdateCampaignSchedule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateScheduleData }) =>
            campaignScheduleAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaignSchedules'] });
        },
    });
};

export const useDeleteCampaignSchedule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => campaignScheduleAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaignSchedules'] });
        },
    });
};

export const useRefreshCampaignSchedules = () => {
    const queryClient = useQueryClient();
    return (electionId?: string | number) => {
        if (electionId) {
            queryClient.invalidateQueries({ queryKey: ['campaignSchedules', electionId] });
        } else {
            queryClient.invalidateQueries({ queryKey: ['campaignSchedules'] });
        }
    };
};