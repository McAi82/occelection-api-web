<?php
// app/Http/Controllers/Api/Mobile/Auth/MobileFaceController.php

namespace App\Http\Controllers\Api\Mobile\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\FaceRecognitionService;
use App\Traits\HasApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MobileFaceController extends Controller
{
    use HasApiResponse;

    protected FaceRecognitionService $faceService;

    public function __construct(FaceRecognitionService $faceService)
    {
        $this->faceService = $faceService;
    }

    /**
     * Register face publicly (without authentication)
     * POST /api/mobile/face/register-public
     */
    public function registerFacePublic(Request $request)
    {
        Log::info('📸 Public face registration request received');

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,user_id',
            'face_photo' => 'required|image|max:2048|mimes:jpeg,png,jpg',
        ]);

        if ($validator->fails()) {
            Log::error('❌ Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userId = $request->input('user_id');
            $facePhoto = $request->file('face_photo');

            Log::info('👤 Processing face for user_id: ' . $userId);
            Log::info('📸 Photo info:', [
                'name' => $facePhoto->getClientOriginalName(),
                'size' => $facePhoto->getSize(),
                'mime' => $facePhoto->getMimeType(),
            ]);

            // Find user
            $user = User::find($userId);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // ✅ STEP 1: Save the photo to storage FIRST
            Log::info('📤 Saving photo to storage...');

            if ($user->face_reference_photo) {
                $oldPath = str_replace('/storage/', '', $user->face_reference_photo);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                    Log::info('🗑️ Deleted old photo: ' . $oldPath);
                }
            }

            $photoUrl = $this->uploadFile($facePhoto, 'face_photos');
            Log::info('✅ Photo saved to: ' . $photoUrl);

            // ✅ STEP 2: Validate face quality
            Log::info('🔍 Validating face quality...');
            $validationResult = $this->faceService->validateFace($facePhoto);

            if (!$validationResult['success'] || !$validationResult['has_face']) {
                $path = str_replace('/storage/', '', $photoUrl);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message'] ?? 'No face detected.',
                ], 400);
            }

            if (($validationResult['confidence'] ?? 0) < 0.70) {
                $path = str_replace('/storage/', '', $photoUrl);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                $tip = $this->faceService->getRegistrationTips($validationResult['quality_breakdown'] ?? []);
                return response()->json([
                    'success' => false,
                    'message' => "Face quality too low (confidence: {$validationResult['confidence']}%). {$tip}",
                ], 400);
            }

            // ✅ STEP 3: Register face with Python service
            Log::info('🤖 Registering face with Python service...');
            $result = $this->faceService->registerFace($userId, $facePhoto);

            if (!$result['success']) {
                $path = str_replace('/storage/', '', $photoUrl);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Failed to register face',
                ], 400);
            }

            // ✅ STEP 4: Save face data to database
            $user->face_reference_photo = $photoUrl;
            $user->face_encoding = json_encode($result['encoding']);
            $user->is_face_registered = true;
            $user->save();

            // ✅ STEP 5: Log face registration
            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'MOBILE_FACE_REGISTERED',
                'target_table' => 'users',
                'target_id' => $user->user_id,
                'old_value' => json_encode([
                    'was_registered' => false,
                    'email' => $user->email,
                ]),
                'new_value' => json_encode([
                    'face_photo_url' => $photoUrl,
                    'confidence' => $result['confidence'],
                    'quality_breakdown' => $result['quality_breakdown'] ?? null,
                    'registered_at' => now()->toISOString(),
                ]),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            Log::info('✅ Face registered successfully for user: ' . $userId);

            return response()->json([
                'success' => true,
                'message' => 'Face registered successfully',
                'face_photo_url' => $photoUrl,
                'face_encoding' => $result['encoding'],
                'encoding' => $result['encoding'],
                'confidence' => $result['confidence'],
                'quality_breakdown' => $result['quality_breakdown'] ?? null,
                'tip' => $result['tip'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Face registration error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to register face: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload file to storage
     */
    protected function uploadFile($file, $directory): string
    {
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');
        return '/storage/' . $path;
    }

    /**
     * Get face data for local storage sync
     * GET /api/mobile/face/data
     */
    public function getFaceData(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            if (!$user->is_face_registered || !$user->face_encoding) {
                return response()->json([
                    'success' => false,
                    'message' => 'Face not registered',
                ], 404);
            }

            $photoUrl = $user->face_reference_photo;
            if ($photoUrl && !str_starts_with($photoUrl, 'http')) {
                $photoUrl = url($photoUrl);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $user->user_id,
                    'face_encoding' => json_decode($user->face_encoding, true),
                    'face_photo_url' => $photoUrl,
                    'registered_at' => $user->updated_at ? $user->updated_at->toISOString() : now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Get face data error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get face data'
            ], 500);
        }
    }

    /**
     * Update face photo (authenticated)
     * POST /api/mobile/update-face-photo
     */
    public function updateFacePhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'face_photo' => 'required|image|max:2048|mimes:jpeg,png,jpg',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $facePhoto = $request->file('face_photo');

            // Save old photo URL for audit
            $oldPhotoUrl = $user->face_reference_photo;
            $wasRegistered = $user->is_face_registered;

            // Delete old photo
            if ($oldPhotoUrl) {
                $oldPath = str_replace('/storage/', '', $oldPhotoUrl);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Upload new photo
            $photoUrl = $this->uploadFile($facePhoto, 'face_photos');

            // Validate face quality
            $validationResult = $this->faceService->validateFace($facePhoto);

            if (!$validationResult['success'] || !$validationResult['has_face']) {
                $path = str_replace('/storage/', '', $photoUrl);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message'] ?? 'No face detected.',
                ], 400);
            }

            // Register face with service
            $result = $this->faceService->registerFace($user->user_id, $facePhoto);

            if (!$result['success']) {
                $path = str_replace('/storage/', '', $photoUrl);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }

                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Failed to register face',
                ], 400);
            }

            // Save to database
            $user->face_reference_photo = $photoUrl;
            $user->face_encoding = json_encode($result['encoding']);
            $user->is_face_registered = true;
            $user->save();

            // ✅ Log face update
            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'MOBILE_FACE_UPDATED',
                'target_table' => 'users',
                'target_id' => $user->user_id,
                'old_value' => json_encode([
                    'was_registered' => $wasRegistered,
                    'old_photo_url' => $oldPhotoUrl,
                    'email' => $user->email,
                ]),
                'new_value' => json_encode([
                    'new_photo_url' => $photoUrl,
                    'confidence' => $result['confidence'],
                    'quality_breakdown' => $result['quality_breakdown'] ?? null,
                    'updated_at' => now()->toISOString(),
                ]),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Face updated successfully',
                'face_photo_url' => $photoUrl,
                'face_encoding' => $result['encoding'],
                'encoding' => $result['encoding'],
                'confidence' => $result['confidence'],
                'quality_breakdown' => $result['quality_breakdown'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Update face photo error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update face photo'
            ], 500);
        }
    }

    protected function validationErrorResponse($errors)
    {
        return response()->json([
            'success' => false,
            'errors' => $errors
        ], 422);
    }

    protected function notFoundResponse($message = 'Not found')
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], 404);
    }
}
