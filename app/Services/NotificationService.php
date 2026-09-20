<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\VoterRegistry;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send notification to a user
     */
    public function send($userId, $title, $message, $type = 'system', $data = null): ?Notification
    {
        try {
            // ✅ Check if user exists and is active
            $user = User::find($userId);
            if (!$user || !$user->is_active) {
                Log::info("User {$userId} not found or inactive, skipping notification");
                return null;
            }

            $notification = Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'data' => $data,
                'is_read' => false,
            ]);

            Log::info("Notification sent to user {$userId}: {$title}");

            return $notification;
        } catch (\Exception $e) {
            Log::error("Failed to send notification: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Send notification to multiple users with condition check
     */
    public function sendToMany($userIds, $title, $message, $type = 'system', $data = null, $condition = null): int
    {
        $count = 0;
        foreach ($userIds as $userId) {
            // ✅ Check condition if provided
            if ($condition && is_callable($condition)) {
                if (!$condition($userId)) {
                    continue;
                }
            }

            $result = $this->send($userId, $title, $message, $type, $data);
            if ($result) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * Send notification to all users who haven't voted yet
     */
    public function sendToNonVoters($electionId, $title, $message, $type = 'system', $data = null): int
    {
        $nonVoters = VoterRegistry::where('election_id', $electionId)
            ->where('has_voted', false)
            ->pluck('user_id')
            ->toArray();

        if (empty($nonVoters)) {
            Log::info("No non-voters found for election {$electionId}");
            return 0;
        }

        return $this->sendToMany(
            $nonVoters,
            $title,
            $message,
            $type,
            $data
        );
    }

    /**
     * Send notification only to users who haven't read similar notifications
     * This checks if they've already received and read a similar notification
     */
    public function sendToUnreadOnly($userIds, $title, $message, $type, $data = null): int
    {
        $count = 0;
        foreach ($userIds as $userId) {
            // ✅ Check if user has already read a similar notification
            $hasReadSimilar = Notification::where('user_id', $userId)
                ->where('type', $type)
                ->where('is_read', true)
                ->where('created_at', '>=', now()->subDays(7)) // Only check last 7 days
                ->exists();

            if ($hasReadSimilar) {
                Log::info("User {$userId} already read similar notification, skipping");
                continue;
            }

            $result = $this->send($userId, $title, $message, $type, $data);
            if ($result) {
                $count++;
            }
        }
        return $count;
    }

    // ==================== SPECIFIC NOTIFICATION TYPES ====================

    /**
     * Vote confirmation notification
     */
    public function voteConfirmed($userId, $electionTitle, $receiptCode): ?Notification
    {
        return $this->send(
            $userId,
            '🗳️ Vote Confirmed!',
            "Your vote in {$electionTitle} has been successfully cast. Receipt: {$receiptCode}",
            'vote_confirmation',
            ['election' => $electionTitle, 'receipt_code' => $receiptCode]
        );
    }

    /**
     * Candidate approval notification (Admin)
     */
    public function candidateApprovedAdmin($userId, $position, $electionTitle): ?Notification
    {
        return $this->send(
            $userId,
            '📋 Admin Approved Your Application',
            "Your application for {$position} in {$electionTitle} has been approved by Admin. Waiting for COMELEC approval.",
            'candidate_approval',
            ['position' => $position, 'election' => $electionTitle, 'status' => 'admin_approved']
        );
    }

    /**
     * Candidate approval notification (COMELEC)
     */
    public function candidateApprovedComelec($userId, $position, $electionTitle): ?Notification
    {
        return $this->send(
            $userId,
            '🎉 You are now a Candidate!',
            "Congratulations! You are now an official candidate for {$position} in {$electionTitle}.",
            'candidate_approval',
            ['position' => $position, 'election' => $electionTitle, 'status' => 'comelec_approved']
        );
    }

    /**
     * Election reminder - ONLY sent to non-voters
     */
    public function sendElectionReminder($electionId, $electionTitle, $startDate): int
    {
        return $this->sendToNonVoters(
            $electionId,
            '📢 Election Reminder',
            "The {$electionTitle} election starts on " . \Carbon\Carbon::parse($startDate)->format('F d, Y') . ". Don't forget to vote!",
            'election_reminder',
            ['election' => $electionTitle, 'start_date' => $startDate]
        );
    }

    /**
     * Election started notification - ONLY sent to non-voters
     */
    public function electionStarted($electionId, $electionTitle): int
    {
        return $this->sendToNonVoters(
            $electionId,
            '🗳️ Election Started!',
            "The {$electionTitle} election has started! Cast your vote now.",
            'election_reminder',
            ['election' => $electionTitle, 'status' => 'started']
        );
    }

    /**
     * Election ending soon notification - ONLY sent to non-voters
     */
    public function electionEndingSoon($electionId, $electionTitle, $endDate): int
    {
        $hoursLeft = now()->diffInHours(\Carbon\Carbon::parse($endDate));

        return $this->sendToNonVoters(
            $electionId,
            '⚠️ Election Ending Soon!',
            "The {$electionTitle} election ends in {$hoursLeft} hours. Cast your vote now before it's too late!",
            'election_reminder',
            ['election' => $electionTitle, 'end_date' => $endDate, 'hours_left' => $hoursLeft]
        );
    }

    /**
     * Election ended notification - sent to ALL voters
     */
    public function electionEnded($electionId, $electionTitle): int
    {
        // Get all voters (both voted and not voted)
        $allVoters = VoterRegistry::where('election_id', $electionId)
            ->pluck('user_id')
            ->toArray();

        if (empty($allVoters)) {
            return 0;
        }

        return $this->sendToMany(
            $allVoters,
            '📊 Election Ended',
            "The {$electionTitle} election has ended. Results are now available.",
            'election_reminder',
            ['election' => $electionTitle, 'status' => 'ended']
        );
    }

    /**
     * New campaign post - sent to ALL voters
     */
    public function newCampaignPost($electionId, $candidateName, $postTitle, $postId): int
    {
        $voterIds = VoterRegistry::where('election_id', $electionId)
            ->pluck('user_id')
            ->toArray();

        if (empty($voterIds)) {
            return 0;
        }

        return $this->sendToMany(
            $voterIds,
            '📝 New Campaign Post',
            "{$candidateName} posted: \"{$postTitle}\"",
            'system',
            ['candidate' => $candidateName, 'post' => $postTitle, 'post_id' => $postId]
        );
    }

    /**
     * Feedback response notification
     */
    public function feedbackResponded($userId, $feedbackTitle): ?Notification
    {
        return $this->send(
            $userId,
            '💬 Admin Responded to Your Feedback',
            "Admin has responded to your feedback: \"{$feedbackTitle}\"",
            'feedback_response',
            ['feedback' => $feedbackTitle]
        );
    }

    /**
     * Feedback approved notification
     */
    public function feedbackApproved($userId, $feedbackTitle): ?Notification
    {
        return $this->send(
            $userId,
            '✅ Feedback Approved',
            "Your feedback \"{$feedbackTitle}\" has been approved and is now public.",
            'feedback_response',
            ['feedback' => $feedbackTitle, 'status' => 'approved']
        );
    }

    /**
     * Schedule request approved
     */
    public function scheduleRequestApproved($userId, $section, $date, $time): ?Notification
    {
        return $this->send(
            $userId,
            '✅ Schedule Request Approved',
            "Your campaign schedule for {$section} on {$date} at {$time} has been approved.",
            'system',
            ['section' => $section, 'date' => $date, 'time' => $time]
        );
    }

    /**
     * Schedule request rejected
     */
    public function scheduleRequestRejected($userId, $section, $reason = null): ?Notification
    {
        $message = "Your campaign schedule request for {$section} has been rejected.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        return $this->send(
            $userId,
            '❌ Schedule Request Rejected',
            $message,
            'system',
            ['section' => $section]
        );
    }

    /**
     * Schedule request rescheduled
     */
    public function scheduleRequestRescheduled($userId, $section, $newDate, $newTime): ?Notification
    {
        return $this->send(
            $userId,
            '🔄 Schedule Request Rescheduled',
            "Your campaign schedule for {$section} has been rescheduled to {$newDate} at {$newTime}.",
            'system',
            ['section' => $section, 'date' => $newDate, 'time' => $newTime]
        );
    }

    /**
     * Partylist membership approved
     */
    public function partylistMembershipApproved($userId, $partylistName): ?Notification
    {
        return $this->send(
            $userId,
            '✅ Partylist Membership Approved',
            "Your membership request for {$partylistName} has been approved.",
            'system',
            ['partylist' => $partylistName]
        );
    }

    /**
     * Partylist membership rejected
     */
    public function partylistMembershipRejected($userId, $partylistName): ?Notification
    {
        return $this->send(
            $userId,
            '❌ Partylist Membership Rejected',
            "Your membership request for {$partylistName} has been rejected.",
            'system',
            ['partylist' => $partylistName]
        );
    }

    /**
     * Voter registered notification
     */
    public function voterRegistered($userId, $electionTitle): ?Notification
    {
        return $this->send(
            $userId,
            '📝 You are Registered!',
            "You have been registered as a voter for {$electionTitle}.",
            'system',
            ['election' => $electionTitle]
        );
    }

    /**
     * Application submitted notification
     */
    public function applicationSubmitted($userId, $electionTitle, $position): ?Notification
    {
        return $this->send(
            $userId,
            '📋 Application Submitted',
            "Your candidacy application for {$position} in {$electionTitle} has been submitted. Please wait for admin review.",
            'system',
            ['election' => $electionTitle, 'position' => $position]
        );
    }

    /**
     * Candidate rejected notification
     */
    public function candidateRejected($userId, $position, $electionTitle, $reason = null): ?Notification
    {
        $message = "Your application for {$position} in {$electionTitle} has been rejected.";
        if ($reason) {
            $message .= " Reason: {$reason}";
        }

        return $this->send(
            $userId,
            '❌ Application Rejected',
            $message,
            'system',
            ['position' => $position, 'election' => $electionTitle]
        );
    }

    /**
     * Voters imported notification (Admin only)
     */
    public function votersImported($adminId, $electionTitle, $count): ?Notification
    {
        return $this->send(
            $adminId,
            '📋 Voters Imported',
            "Successfully imported {$count} voters for {$electionTitle}",
            'system',
            ['election' => $electionTitle, 'count' => $count]
        );
    }

    public function partylistRequestReceived($creatorId, $candidateName, $partylistName, $position, $membershipId): ?Notification
    {
        return $this->send(
            $creatorId,
            '📋 New Partylist Membership Request',
            "{$candidateName} (Position: {$position}) has requested to join your partylist \"{$partylistName}\". Please review and approve or reject the request.",
            'system',
            [
                'candidate' => $candidateName,
                'partylist' => $partylistName,
                'membership_id' => $membershipId,
                'position' => $position,
                'type' => 'partylist_request'
            ]
        );
    }
}
