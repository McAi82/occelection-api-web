<?php
// app/Http/Controllers/Api/Web/Auth/FaceController.php

namespace App\Http\Controllers\Api\Web\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FaceRecognitionService;
use App\Traits\HasApiResponse;
use App\Traits\HasFileUpload;
use App\Traits\HasAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FaceController extends Controller
{
    use HasApiResponse, HasFileUpload, HasAuditLog;

    protected FaceRecognitionService $faceService;

    public function __construct(FaceRecognitionService $faceService)
    {
        $this->faceService = $faceService;
    }

    public function registerFaceFromMobile(Request $request)
    {
        // ✅ Log the incoming request
        Log::info('📸 Face registration from mobile', [
            'user_id' => $request->input('user_id'),
            'has_face_photo' => $request->hasFile('face_photo'),
            'has_encoding' => $request->has('face_encoding'),
        ]);

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,user_id',
            'face_photo' => 'required|image|max:2048|mimes:jpeg,png,jpg',
            'face_encoding' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::findOrFail($request->user_id);

        // ✅ Check if user is trying to register someone else's face
        if ($user->user_id !== $request->user()->user_id && !in_array($request->user()->role, ['admin'])) {
            return $this->errorResponse('Unauthorized to register face for this user', 403);
        }

        try {
            // ✅ Get face encoding from request or compute it
            $faceEncoding = null;
            if ($request->has('face_encoding')) {
                $faceEncoding = json_decode($request->input('face_encoding'), true);
                Log::info('📥 Received face encoding from mobile', [
                    'encoding_length' => is_array($faceEncoding) ? count($faceEncoding) : 0,
                ]);
            }

            // ✅ Upload face photo
            $facePhoto = $request->file('face_photo');
            
            // Delete old photo if exists
            if ($user->face_reference_photo) {
                $oldPath = str_replace('/storage/', '', $user->face_reference_photo);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Store new photo
            $photoUrl = $this->uploadFile($facePhoto, 'face_photos');
            
            // ✅ Update user
            $user->face_reference_photo = $photoUrl;
            $user->is_face_registered = true;
            
            // Store encoding if provided
            if ($faceEncoding) {
                $user->face_encoding = json_encode($faceEncoding);
            }
            
            $user->save();

            // ✅ Log the action
            $this->logAction(
                $request->user()->user_id,
                'REGISTER_FACE_MOBILE',
                'users',
                $user->user_id,
                null,
                [
                    'face_registered' => true,
                    'photo_url' => $photoUrl,
                    'has_encoding' => !is_null($faceEncoding),
                ],
                $request->ip()
            );

            Log::info('✅ Face registered from mobile successfully', [
                'user_id' => $user->user_id,
            ]);

            return $this->successResponse([
                'user_id' => $user->user_id,
                'face_photo_url' => $photoUrl,
                'is_face_registered' => $user->is_face_registered,
            ], 'Face registered successfully');

        } catch (\Exception $e) {
            Log::error('❌ Face registration from mobile failed', [
                'user_id' => $request->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Failed to register face: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Register face for a user (admin only)
     */
    public function registerFace(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,user_id',
            'face_photo' => 'required|image|max:2048|mimes:jpeg,png,jpg',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::findOrFail($request->user_id);
        $facePhoto = $request->file('face_photo');

        // Validate face quality first
        $validationResult = $this->faceService->validateFace($facePhoto);
        
        if (!$validationResult['success'] || !$validationResult['has_face']) {
            return $this->errorResponse(
                $validationResult['message'] ?? 'No face detected. Please ensure your face is clearly visible.',
                400
            );
        }

        if ($validationResult['confidence'] < 0.75) {
            $tip = $this->faceService->getRegistrationTips($validationResult['quality_breakdown'] ?? []);
            return $this->errorResponse(
                "Face quality too low (confidence: {$validationResult['confidence']}%). {$tip}",
                400
            );
        }

        // Register face with the service
        $result = $this->faceService->registerFace($user->user_id, $facePhoto);

        if (!$result['success']) {
            return $this->errorResponse(
                $result['message'] ?? 'Failed to register face',
                400
            );
        }

        // Save face data to user
        $user->face_reference_photo = $this->uploadFile($facePhoto, 'face_photos');
        $user->face_encoding = json_encode($result['encoding'] ?? null);
        $user->is_face_registered = true;
        $user->save();

        $this->logAction(
            $request->user()->user_id,
            'REGISTER_FACE',
            'users',
            $user->user_id,
            null,
            ['face_registered' => true, 'confidence' => $result['confidence']],
            $request->ip()
        );

        return $this->successResponse([
            'face_photo_url' => $user->face_reference_photo,
            'confidence' => $result['confidence'],
            'quality_breakdown' => $result['quality_breakdown'] ?? null,
            'tip' => $result['tip'] ?? null,
        ], 'Face registered successfully');
    }

    /**
     * Verify face via API (web)
     */
     public function verifyFace(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,user_id',
            'face_photo' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::find($request->user_id);

        if (!$user) {
            return $this->notFoundResponse('User not found');
        }

        if (!$user->is_face_registered || !$user->face_encoding) {
            return response()->json([
                'success' => true,
                'match' => true,
                'message' => 'No face registered, proceeding with login'
            ]);
        }

        $facePhoto = $request->file('face_photo');
        $storedEncoding = json_decode($user->face_encoding, true);

        // Get all active users' encodings for matching
        $storedEncodings = User::where('is_face_registered', true)
            ->whereNotNull('face_encoding')
            ->get()
            ->map(function ($u) {
                return [
                    'student_id' => $u->user_id,
                    'encoding' => json_decode($u->face_encoding, true),
                ];
            })
            ->filter(function ($item) {
                return !empty($item['encoding']);
            })
            ->values()
            ->toArray();

        // Convert image to base64
        $base64Image = 'data:' . $facePhoto->getMimeType() . ';base64,' .
            base64_encode(file_get_contents($facePhoto->getRealPath()));

        $result = $this->faceService->verifyFace($base64Image, $storedEncodings);

        if ($result['match'] && $result['student_id'] == $user->user_id) {
            return response()->json([
                'success' => true,
                'match' => true,
                'confidence' => $result['confidence'],
                'message' => 'Face verified successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'match' => false,
            'confidence' => $result['confidence'] ?? 0,
            'message' => $result['message'] ?? 'Face verification failed'
        ], 401);
    }


    /**
     * Verify face by user ID (for mobile)
     */
    public function verifyFaceById(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,user_id',
            'face_photo' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::find($request->user_id);

        if (!$user) {
            return $this->notFoundResponse('User not found');
        }

        if (!$user->is_face_registered || !$user->face_encoding) {
            return response()->json([
                'success' => true,
                'match' => true,
                'message' => 'No face registered, proceeding with login'
            ]);
        }

        $facePhoto = $request->file('face_photo');
        
        // Convert image to base64
        $base64Image = 'data:' . $facePhoto->getMimeType() . ';base64,' . 
            base64_encode(file_get_contents($facePhoto->getRealPath()));

        // Get encodings for matching
        $storedEncodings = User::where('is_face_registered', true)
            ->whereNotNull('face_encoding')
            ->get()
            ->map(function ($u) {
                return [
                    'student_id' => $u->user_id,
                    'encoding' => json_decode($u->face_encoding, true),
                ];
            })
            ->filter(function ($item) {
                return !empty($item['encoding']);
            })
            ->values()
            ->toArray();

        $result = $this->faceService->verifyFace($base64Image, $storedEncodings);

        if ($result['match'] && $result['student_id'] == $user->user_id) {
            return response()->json([
                'success' => true,
                'match' => true,
                'confidence' => $result['confidence'],
                'message' => 'Face verified successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'match' => false,
            'confidence' => $result['confidence'] ?? 0,
            'message' => $result['message'] ?? 'Face verification failed'
        ], 401);
    }

    public function registerFacePublic(Request $request)
{
    // ✅ Log the request data for debugging
    Log::info('Face registration request', [
        'all_inputs' => $request->all(),
        'files' => $request->hasFile('face_photo') ? 'has_file' : 'no_file',
        'user_id_input' => $request->input('user_id'),
    ]);

    $validator = Validator::make($request->all(), [
        'user_id' => 'required|exists:users,user_id',
        'face_photo' => 'required|image|max:2048|mimes:jpeg,png,jpg',
    ]);

    if ($validator->fails()) {
        Log::error('Validation failed', ['errors' => $validator->errors()]);
        return $this->validationErrorResponse($validator->errors());
    }

    // ✅ Get user_id from the request
    $userId = $request->input('user_id');
    Log::info('Looking for user with ID: ' . $userId);
    
    $user = User::find($userId);
    
    if (!$user) {
        Log::error('User not found', ['user_id' => $userId]);
        return $this->errorResponse('User not found', 404);
    }

    Log::info('User found', [
        'user_id' => $user->user_id,
        'email' => $user->email,
        'has_face' => $user->face_reference_photo ? 'yes' : 'no'
    ]);

    $facePhoto = $request->file('face_photo');

    try {
        // Delete old photo if exists
        if ($user->face_reference_photo) {
            $oldPath = str_replace('/storage/', '', $user->face_reference_photo);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
                Log::info('Deleted old face photo', ['path' => $oldPath]);
            }
        }

        // Upload new photo
        $photoUrl = $this->uploadFile($facePhoto, 'face_photos');
        Log::info('Uploaded face photo', ['url' => $photoUrl]);
        
        // Update user
        $user->face_reference_photo = $photoUrl;
        $user->is_face_registered = true;
        $user->save();

        Log::info('User face registered successfully', [
            'user_id' => $user->user_id,
            'photo_url' => $photoUrl
        ]);

        return $this->successResponse([
            'user_id' => $user->user_id,
            'face_photo_url' => $photoUrl,
            'is_face_registered' => $user->is_face_registered,
        ], 'Face registered successfully');

    } catch (\Exception $e) {
        Log::error('Face registration failed: ' . $e->getMessage(), [
            'user_id' => $userId,
            'trace' => $e->getTraceAsString()
        ]);
        return $this->errorResponse('Failed to register face: ' . $e->getMessage(), 500);
    }
}

    /**
     * Detect face quality (for mobile)
     */
    public function detectFace(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'face_photo' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $facePhoto = $request->file('face_photo');
        $result = $this->faceService->validateFace($facePhoto);

        return response()->json([
            'success' => $result['success'],
            'has_face' => $result['has_face'] ?? false,
            'confidence' => $result['confidence'] ?? 0,
            'message' => $result['message'] ?? 'Face validation completed',
            'quality_breakdown' => $result['quality_breakdown'] ?? null,
        ]);
    }

    /**
     * Get health status of face service
     */
    public function healthCheck()
    {
        $isHealthy = $this->faceService->healthCheck();
        
        return response()->json([
            'service' => 'Face Recognition Service',
            'status' => $isHealthy ? 'healthy' : 'unhealthy',
            'timestamp' => now()->toISOString(),
        ]);
    }

    // Keep existing methods: updateFacePhoto, getUsersWithoutFace, getUsersWithFace, deleteFace
    // These remain unchanged as they only need to use the new service where face verification is required
}