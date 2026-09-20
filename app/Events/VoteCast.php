<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoteCast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $electionId;
    public $positionId;
    public $candidateId;
    public $candidateName;
    public $voteCount;
    public $totalVotes;

    public function __construct($electionId, $positionId, $candidateId, $candidateName, $voteCount, $totalVotes)
    {
        $this->electionId = $electionId;
        $this->positionId = $positionId;
        $this->candidateId = $candidateId;
        $this->candidateName = $candidateName;
        $this->voteCount = $voteCount;
        $this->totalVotes = $totalVotes;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('election.' . $this->electionId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'vote-cast';
    }

    public function broadcastWith(): array
    {
        return [
            'election_id' => $this->electionId,
            'position_id' => $this->positionId,
            'candidate_id' => $this->candidateId,
            'candidate_name' => $this->candidateName,
            'vote_count' => $this->voteCount,
            'total_votes' => $this->totalVotes,
            'timestamp' => now()->toISOString(),
        ];
    }
}