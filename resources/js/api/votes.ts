// src/api/votes.ts
import axios from "./axios";
import { ApiResponse, Vote, VoteReceipt } from "../types";

export interface CastVoteData {
  votes: Array<{
    position_id: number;
    candidate_id: number;
  }>;
}

export const voteAPI = {
  castVote: (electionId: number | string, votes: CastVoteData): Promise<ApiResponse<VoteReceipt>> =>
    axios.post(`/elections/${electionId}/vote`, votes),

  checkStatus: (electionId: number | string): Promise<ApiResponse<{ has_voted: boolean }>> =>
    axios.get(`/elections/${electionId}/vote-status`),

  getReceipt: (electionId: number | string): Promise<ApiResponse<VoteReceipt>> =>
    axios.get(`/elections/${electionId}/receipt`),

  getHistory: (): Promise<ApiResponse<Vote[]>> =>
    axios.get("/votes/history"),
};

export const voteService = voteAPI;