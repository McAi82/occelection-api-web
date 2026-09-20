<?php

namespace App\Http\Controllers\Api\Mobile\Interaction;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\FeedbackCategory;
use App\Models\FeedbackHelpfulVote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MobileFeedbackController extends Controller
{
    /**
     * Get public feedback
     * GET /mobile/feedback
     */
    public function index(Request $request)
    {
        try {
            $query = Feedback::with(['user', 'election', 'category'])
                ->where('is_public', true)
                ->where('status', 'approved');

            if ($request->has('election_id')) {
                $query->where('election_id', $request->election_id);
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            $feedback = $query->orderBy('created_at', 'desc')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $feedback
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch feedback'
            ], 500);
        }
    }

    /**
     * Get feedback categories
     * GET /mobile/feedback/categories
     */
    public function getCategories()
    {
        try {
            $categories = FeedbackCategory::where('is_active', true)
                ->orderBy('display_order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch categories'
            ], 500);
        }
    }

    /**
     * Store feedback
     * POST /mobile/feedback
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'election_id' => 'required|exists:elections,election_id',
                'category_id' => 'required|exists:feedback_categories,category_id',
                'rating' => 'required|integer|min:1|max:5',
                'title' => 'nullable|string|max:255',
                'comment' => 'required|string',
                'is_public' => 'boolean',
                'is_anonymous' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $userId = $request->is_anonymous ? null : $request->user()->user_id;

            $feedback = Feedback::create([
                'user_id' => $userId,
                'election_id' => $request->election_id,
                'category_id' => $request->category_id,
                'rating' => $request->rating,
                'title' => $request->title,
                'comment' => $request->comment,
                'is_public' => $request->is_public ?? false,
                'is_anonymous' => $request->is_anonymous ?? false,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Feedback submitted successfully',
                'data' => $feedback
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback'
            ], 500);
        }
    }

    /**
     * Mark feedback as helpful
     * POST /mobile/feedback/{id}/helpful
     */
    public function markHelpful($id, Request $request)
    {
        try {
            $feedback = Feedback::findOrFail($id);

            $existing = FeedbackHelpfulVote::where('feedback_id', $id)
                ->where('user_id', $request->user()->user_id)
                ->exists();

            if (!$existing) {
                FeedbackHelpfulVote::create([
                    'feedback_id' => $id,
                    'user_id' => $request->user()->user_id,
                ]);

                $feedback->increment('helpful_count');
            }

            return response()->json([
                'success' => true,
                'message' => 'Marked as helpful',
                'helpful_count' => $feedback->fresh()->helpful_count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as helpful'
            ], 500);
        }
    }
}