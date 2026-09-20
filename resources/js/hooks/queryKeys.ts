// resources/js/hooks/queryKeys.ts
export const queryKeys = {
    elections: {
        all: ['elections'] as const,
        lists: () => [...queryKeys.elections.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.elections.lists(), filters] as const,
        details: () => [...queryKeys.elections.all, 'detail'] as const,
        detail: (id: number) => [...queryKeys.elections.details(), id] as const,
        winners: (id: number) => [...queryKeys.elections.detail(id), 'winners'] as const,
    },
    candidates: {
        all: ['candidates'] as const,
        byElection: (electionId: string) => [...queryKeys.candidates.all, electionId] as const,
        detail: (id: number) => [...queryKeys.candidates.all, 'detail', id] as const,
    },
    partylists: {
        all: ['partylists'] as const,
        byElection: (electionId: string) => [...queryKeys.partylists.all, electionId] as const,
        detail: (id: number) => [...queryKeys.partylists.all, 'detail', id] as const,
    },
    users: {
        all: ['users'] as const,
        list: () => [...queryKeys.users.all, 'list'] as const,
    },
    feedback: {
        all: ['feedback'] as const,
        list: (params?: any) => [...queryKeys.feedback.all, 'list', params] as const,
    },
    applications: {
        all: ['applications'] as const,
        adminList: (params?: any) => [...queryKeys.applications.all, 'admin', params] as const,
        comelecList: (params?: any) => [...queryKeys.applications.all, 'comelec', params] as const,
        myApplications: (electionId?: number) => [...queryKeys.applications.all, 'my', electionId] as const,
    },
    partylistRequests: {
        all: ['partylistRequests'] as const,
        list: () => [...queryKeys.partylistRequests.all, 'list'] as const,
    },
    comments: {
        all: ['comments'] as const,
        byElection: (electionId: string) => [...queryKeys.comments.all, electionId] as const,
    },
};