<?php
// app/Http/Controllers/Api/Web/Comment/CommentController.php

namespace App\Http\Controllers\Api\Web\Comment;

use App\Http\Controllers\Controller;
use App\Models\LiveComment;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    public function getByElection($electionId)
    {
        try {
            $comments = LiveComment::where('election_id', $electionId)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($comment) {
                    return [
                        'comment_id' => $comment->comment_id,
                        'election_id' => $comment->election_id,
                        'user_id' => $comment->user_id,
                        'comment_text' => $comment->comment_text,
                        'is_visible' => $comment->is_visible,
                        'created_at' => $comment->created_at,
                        'user' => $comment->user ? [
                            'user_id' => $comment->user->user_id,
                            'first_name' => $comment->user->first_name,
                            'last_name' => $comment->user->last_name,
                            'email' => $comment->user->email,
                        ] : null
                    ];
                });
            
            return response()->json($comments);
        } catch (\Exception $e) {
            Log::error('Failed to fetch comments: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch comments', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'election_id' => 'required|exists:elections,election_id',
                'comment_text' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $comment = LiveComment::create([
                'election_id' => $request->election_id,
                'user_id' => $request->user()->user_id,
                'comment_text' => $request->comment_text,
                'is_visible' => true,
            ]);

            return response()->json([
                'message' => 'Comment posted successfully',
                'comment' => $comment->load('user')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to post comment: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to post comment', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * ✅ FIXED: Moderate comment (hide/show)
     */
    public function moderate(Request $request, $commentId)
    {
        try {
            // ✅ Find the comment
            $comment = LiveComment::find($commentId);
            
            if (!$comment) {
                return response()->json([
                    'message' => 'Comment not found'
                ], 404);
            }

            // ✅ Validate input
            $validator = Validator::make($request->all(), [
                'is_visible' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // ✅ Update the comment
            $comment->is_visible = $request->is_visible;
            $comment->moderated_by_user_id = $request->user()->user_id;
            $comment->moderated_at = now();
            $comment->save();

            // ✅ Log the action
            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action_type' => 'MODERATE_COMMENT',
                'target_table' => 'live_comments',
                'target_id' => $commentId,
                'old_value' => json_encode(['is_visible' => !$request->is_visible]),
                'new_value' => json_encode(['is_visible' => $request->is_visible]),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => $request->is_visible ? 'Comment is now visible' : 'Comment has been hidden',
                'comment' => $comment->load('user')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to moderate comment: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to moderate comment: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a comment
     */
    public function delete(Request $request, $commentId)
    {
        try {
            $comment = LiveComment::find($commentId);
            
            if (!$comment) {
                return response()->json([
                    'message' => 'Comment not found'
                ], 404);
            }

            $comment->delete();

            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action_type' => 'DELETE_COMMENT',
                'target_table' => 'live_comments',
                'target_id' => $commentId,
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete comment: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete comment: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}