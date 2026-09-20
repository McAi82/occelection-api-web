<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendVoteReceipt implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $email;
    protected $receiptCode;
    protected $userName;
    protected $electionTitle;

    public function __construct($email, $receiptCode, $userName, $electionTitle)
    {
        $this->email = $email;
        $this->receiptCode = $receiptCode;
        $this->userName = $userName;
        $this->electionTitle = $electionTitle;
    }

    public function handle()
    {
        Mail::send('emails.vote-receipt', [
            'userName' => $this->userName,
            'receiptCode' => $this->receiptCode,
            'electionTitle' => $this->electionTitle,
            'date' => now()->format('F j, Y g:i A')
        ], function($message) {
            $message->to($this->email)
                    ->subject('Your Voting Receipt - ' . $this->electionTitle);
        });
        
    }
}