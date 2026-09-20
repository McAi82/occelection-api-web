<?php

namespace App\Http\Controllers\Api\Mobile\Interaction;

use App\Http\Controllers\Controller;
use App\Models\LiveComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MobileCommentController extends Controller
{
    /**
     * Get comments for election
     * GET /mobile/comments/{electionId}
     */
    public function getByElection($electionId)
    {
        try {
            $comments = LiveComment::where('election_id', $electionId)
                ->where('is_visible', true)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function($comment) {
                    return [
                        'comment_id' => $comment->comment_id,
                        'comment_text' => $comment->comment_text,
                        'created_at' => $comment->created_at,
                        'user' => [
                            'first_name' => $comment->user->first_name,
                            'last_name' => $comment->user->last_name,
                        ]
                    ];
                });
            
            return response()->json([
                'success' => true,
                'comments' => $comments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comments'
            ], 500);
        }
    }

    /**
     * Post a comment
     * POST /mobile/comments
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'election_id' => 'required|exists:elections,election_id',
                'comment_text' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $comment = LiveComment::create([
                'election_id' => $request->election_id,
                'user_id' => $request->user()->user_id,
                'comment_text' => $request->comment_text,
                'is_visible' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment posted successfully',
                'comment' => $comment->load('user')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to post comment'
            ], 500);
        }
    }
}