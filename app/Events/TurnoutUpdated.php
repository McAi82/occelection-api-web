<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TurnoutUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $electionId;
    public $votedCount;
    public $totalVoters;
    public $percentage;

    public function __construct($electionId, $votedCount, $totalVoters, $percentage)
    {
        $this->electionId = $electionId;
        $this->votedCount = $votedCount;
        $this->totalVoters = $totalVoters;
        $this->percentage = $percentage;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('election.' . $this->electionId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'turnout-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'election_id' => $this->electionId,
            'voted_count' => $this->votedCount,
            'total_voters' => $this->totalVoters,
            'percentage' => $this->percentage,
            'timestamp' => now()->toISOString(),
        ];
    }
}