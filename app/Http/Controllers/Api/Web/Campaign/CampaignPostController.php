<?php
// app/Http/Controllers/Api/Web/Campaign/CampaignPostController.php

namespace App\Http\Controllers\Api\Web\Campaign;

use App\Http\Controllers\Controller;
use App\Models\CampaignPost;
use App\Models\PostComment;
use App\Models\PostReaction;
use App\Models\Candidate;
use App\Models\AuditLog;
use App\Models\VoterRegistry;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CampaignPostController extends Controller
{
    /**
     * Get posts for an election (Voter view - all active posts)
     */
    public function getPosts(Request $request, $electionId)
    {
        try {
            $perPage = $request->get('per_page', 20);

            $posts = CampaignPost::where('election_id', $electionId)
                ->where('is_active', true)
                ->with([
                    'candidate.user',
                    'candidate.position',
                    'candidate.partylist',
                    'comments' => function ($query) {
                        $query->with('user')->limit(5);
                    },
                    'reactions',
                ])
                ->withCount(['comments', 'reactions'])
                ->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Check if user has reacted to each post
            $userId = $request->user()->user_id;
            foreach ($posts as $post) {
                $post->user_reaction = $post->userReaction($userId)->first();
            }

            return response()->json([
                'success' => true,
                'data' => $posts
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch posts: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch posts'
            ], 500);
        }
    }

    /**
     * Get posts by a specific candidate (Candidate's timeline)
     */
    public function getCandidatePosts(Request $request, $candidateId)
    {
        try {
            $perPage = $request->get('per_page', 20);

            $posts = CampaignPost::where('candidate_id', $candidateId)
                ->where('is_active', true)
                ->with([
                    'candidate.user',
                    'candidate.position',
                    'candidate.partylist',
                    'comments' => function ($query) {
                        $query->with('user')->limit(5);
                    },
                    'reactions',
                ])
                ->withCount(['comments', 'reactions'])
                ->orderBy('is_pinned', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            $userId = $request->user()->user_id;
            foreach ($posts as $post) {
                $post->user_reaction = $post->userReaction($userId)->first();
            }

            return response()->json([
                'success' => true,
                'data' => $posts
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch candidate posts: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch posts'
            ], 500);
        }
    }

    /**
     * Create a post (Candidate or Admin only)
     */
    public function createPost(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'election_id' => 'required|exists:elections,election_id',
                'content' => 'required|string|max:5000',
                'title' => 'nullable|string|max:255',
                'type' => 'nullable|in:survey,announcement,update',
                'is_pinned' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();
            $electionId = $request->election_id;

            // ✅ Check if user is admin
            $isAdmin = $user->role === 'admin';

            // ✅ Check if user is a candidate
            $candidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $electionId)
                ->where('is_approved', true)
                ->first();

            // ✅ Only allow admin or approved candidate to create posts
            if (!$isAdmin && !$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be an approved candidate or admin to create a post'
                ], 403);
            }

            // ✅ If not admin, candidate must be approved
            if (!$isAdmin && $candidate && !$candidate->is_approved) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your candidacy is not yet approved'
                ], 403);
            }

            // ✅ Determine candidate_id for the post
            $candidateId = null;
            if ($isAdmin && $request->has('candidate_id')) {
                // Admin can assign post to a specific candidate
                $assignedCandidate = Candidate::where('candidate_id', $request->candidate_id)
                    ->where('election_id', $electionId)
                    ->where('is_approved', true)
                    ->first();
                if ($assignedCandidate) {
                    $candidateId = $assignedCandidate->candidate_id;
                }
            } elseif ($candidate) {
                // Candidate creates post for themselves
                $candidateId = $candidate->candidate_id;
            }

            // Create the post
            $post = CampaignPost::create([
                'candidate_id' => $candidateId,
                'election_id' => $electionId,
                'content' => $request->content,
                'title' => $request->title,
                'type' => $request->type ?? 'survey',
                'is_pinned' => $request->is_pinned ?? false,
                'is_active' => true,
            ]);

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'CREATE_CAMPAIGN_POST',
                'target_table' => 'campaign_posts',
                'target_id' => $post->post_id,
                'new_value' => json_encode($post->toArray()),
                'ip_address' => $request->ip(),
            ]);

            // ✅ Send notification to all voters about new post
            try {
                $notificationService = app(NotificationService::class);
                $user = $request->user();
                $candidateName = $user->first_name . ' ' . $user->last_name;
                $postTitle = $post->title ?? 'New Campaign Post';

                // ✅ Use newCampaignPost method - sends to ALL voters
                $sentCount = $notificationService->newCampaignPost(
                    $electionId,
                    $candidateName,
                    $postTitle,
                    $post->post_id
                );

                Log::info("Campaign post notification sent to {$sentCount} voters");
            } catch (\Exception $e) {
                Log::warning('Failed to send campaign post notification: ' . $e->getMessage());
            }


            return response()->json([
                'success' => true,
                'message' => 'Post created successfully',
                'data' => $post->load(['candidate.user', 'candidate.position'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create post: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create post: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a post (Candidate or Admin only)
     */
    public function updatePost(Request $request, $postId)
    {
        try {
            $post = CampaignPost::findOrFail($postId);

            $user = $request->user();
            $isAdmin = $user->role === 'admin';

            // ✅ Check if user owns the post or is admin
            if (!$isAdmin) {
                $candidate = Candidate::where('user_id', $user->user_id)->first();
                if (!$candidate || $post->candidate_id !== $candidate->candidate_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not own this post'
                    ], 403);
                }
            }

            $validator = Validator::make($request->all(), [
                'content' => 'sometimes|string|max:5000',
                'title' => 'nullable|string|max:255',
                'type' => 'nullable|in:survey,announcement,update',
                'is_pinned' => 'boolean',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $oldData = $post->toArray();
            $post->update($request->only(['content', 'title', 'type', 'is_pinned', 'is_active']));

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'UPDATE_CAMPAIGN_POST',
                'target_table' => 'campaign_posts',
                'target_id' => $postId,
                'old_value' => json_encode($oldData),
                'new_value' => json_encode($post->toArray()),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Post updated successfully',
                'data' => $post->load(['candidate.user', 'candidate.position'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update post: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update post: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a post (Candidate or Admin only)
     */
    public function deletePost(Request $request, $postId)
    {
        try {
            $post = CampaignPost::findOrFail($postId);

            $user = $request->user();
            $isAdmin = $user->role === 'admin';

            // ✅ Check if user owns the post or is admin
            if (!$isAdmin) {
                $candidate = Candidate::where('user_id', $user->user_id)->first();
                if (!$candidate || $post->candidate_id !== $candidate->candidate_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not own this post'
                    ], 403);
                }
            }

            $oldData = $post->toArray();
            $post->delete();

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'DELETE_CAMPAIGN_POST',
                'target_table' => 'campaign_posts',
                'target_id' => $postId,
                'old_value' => json_encode($oldData),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Post deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete post: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete post: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a comment to a post
     */
    public function addComment(Request $request, $postId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $post = CampaignPost::findOrFail($postId);

            $comment = PostComment::create([
                'post_id' => $postId,
                'user_id' => $request->user()->user_id,
                'content' => $request->content,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully',
                'data' => $comment->load('user')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add comment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a comment (Owner or admin only)
     */
    public function deleteComment(Request $request, $commentId)
    {
        try {
            $comment = PostComment::findOrFail($commentId);
            $user = $request->user();
            $isAdmin = $user->role === 'admin';

            // Check if user owns the comment or is admin
            if ($comment->user_id !== $user->user_id && !$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $comment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete comment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a reaction to a post
     */
    public function addReaction(Request $request, $postId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:like,heart,laugh,wow,sad,angry,insightful,helpful',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $post = CampaignPost::findOrFail($postId);
            $userId = $request->user()->user_id;

            // Check if user already reacted
            $existingReaction = PostReaction::where('post_id', $postId)
                ->where('user_id', $userId)
                ->first();

            if ($existingReaction) {
                // Update existing reaction type
                $existingReaction->update(['type' => $request->type]);

                return response()->json([
                    'success' => true,
                    'message' => 'Reaction updated',
                    'data' => $existingReaction
                ]);
            }

            $reaction = PostReaction::create([
                'post_id' => $postId,
                'user_id' => $userId,
                'type' => $request->type,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reaction added',
                'data' => $reaction
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add reaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add reaction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove reaction from a post
     */
    public function removeReaction(Request $request, $postId)
    {
        try {
            $userId = $request->user()->user_id;

            $reaction = PostReaction::where('post_id', $postId)
                ->where('user_id', $userId)
                ->first();

            if (!$reaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reaction not found'
                ], 404);
            }

            $reaction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Reaction removed'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to remove reaction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove reaction: ' . $e->getMessage()
            ], 500);
        }
    }
}
