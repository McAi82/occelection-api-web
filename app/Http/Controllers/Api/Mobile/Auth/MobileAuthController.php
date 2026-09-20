<?php

namespace App\Http\Controllers\Api\Mobile\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class MobileAuthController extends Controller
{
    /**
     * Mobile Login
     * POST /api/mobile/login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            // ✅ Log failed login attempt
            AuditLog::create([
                'user_id' => null,
                'action_type' => 'MOBILE_LOGIN_FAILED',
                'target_table' => 'users',
                'target_id' => null,
                'old_value' => json_encode(['email' => $request->email]),
                'new_value' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_active) {
            // ✅ Log inactive account attempt
            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'MOBILE_LOGIN_INACTIVE',
                'target_table' => 'users',
                'target_id' => $user->user_id,
                'old_value' => json_encode(['email' => $request->email, 'status' => 'inactive']),
                'new_value' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated'
            ], 403);
        }

        $token = $user->createToken('mobile_auth_token', ['mobile'])->plainTextToken;

        // ✅ Log successful mobile login
        AuditLog::create([
            'user_id' => $user->user_id,
            'action_type' => 'MOBILE_LOGIN_SUCCESS',
            'target_table' => 'users',
            'target_id' => $user->user_id,
            'old_value' => json_encode([
                'email' => $request->email,
                'role' => $user->role,
                'device' => $request->header('User-Agent'),
            ]),
            'new_value' => json_encode([
                'login_time' => now()->toISOString(),
                'ip' => $request->ip(),
                'platform' => 'mobile',
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'user_id' => $user->user_id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'course_id' => $user->course_id,
                'year_level' => $user->year_level,
                'role' => $user->role,
                'is_face_registered' => $user->is_face_registered,
                'face_reference_photo' => $user->face_reference_photo,
                'course' => $user->course ? [
                    'course_id' => $user->course->course_id,
                    'course_code' => $user->course->course_code,
                    'course_name' => $user->course->course_name,
                ] : null,
            ]
        ]);
    }

    /**
     * Mobile Register
     * POST /api/mobile/register
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'student_id' => 'required|string|unique:users,student_id',
            'course_id' => 'nullable|exists:courses,course_id',
            'year_level' => 'nullable|integer|min:1|max:4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'student_id' => $request->student_id,
            'course_id' => $request->course_id,
            'year_level' => $request->year_level,
            'role' => 'voter',
            'is_active' => true,
        ]);

        $token = $user->createToken('mobile_auth_token', ['mobile'])->plainTextToken;

        // ✅ Log mobile registration
        AuditLog::create([
            'user_id' => $user->user_id,
            'action_type' => 'MOBILE_REGISTER',
            'target_table' => 'users',
            'target_id' => $user->user_id,
            'old_value' => null,
            'new_value' => json_encode([
                'email' => $request->email,
                'student_id' => $request->student_id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'role' => 'voter',
                'registered_at' => now()->toISOString(),
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'user_id' => $user->user_id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'role' => $user->role,
                'course' => $user->course ? [
                    'course_id' => $user->course->course_id,
                    'course_code' => $user->course->course_code,
                    'course_name' => $user->course->course_name,
                ] : null,
                'year_level' => $user->year_level,
                'is_face_registered' => $user->is_face_registered,
            ]
        ], 201);
    }

    /**
     * Mobile Logout
     * POST /api/mobile/logout
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            // ✅ Log logout
            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'MOBILE_LOGOUT',
                'target_table' => 'users',
                'target_id' => $user->user_id,
                'old_value' => json_encode([
                    'email' => $user->email,
                    'logout_time' => now()->toISOString(),
                ]),
                'new_value' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            try {
                $request->user()->currentAccessToken()->delete();
            } catch (\Exception $e) {
                Log::warning('Failed to delete token during logout: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get Authenticated User
     * GET /api/mobile/me
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['course', 'section']);

        return response()->json([
            'success' => true,
            'user' => [
                'user_id' => $user->user_id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'course_id' => $user->course_id,
                'section_id' => $user->section_id,
                'year_level' => $user->year_level,
                'role' => $user->role,
                'is_face_registered' => $user->is_face_registered,
                'face_reference_photo' => $user->face_reference_photo,
                'course' => $user->course ? [
                    'course_id' => $user->course->course_id,
                    'course_code' => $user->course->course_code,
                    'course_name' => $user->course->course_name,
                ] : null,
                'section' => $user->section ? [
                    'section_id' => $user->section->section_id,
                    'section_code' => $user->section->section_code,
                    'section_name' => $user->section->section_name,
                    'year_level' => $user->section->year_level,
                ] : null,
            ]
        ]);
    }

    /**
     * Verify Credentials (public)
     * POST /api/mobile/verify-credentials
     */
    public function verifyCredentials(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            // ✅ Log failed verification
            AuditLog::create([
                'user_id' => null,
                'action_type' => 'MOBILE_VERIFY_CREDENTIALS_FAILED',
                'target_table' => 'users',
                'target_id' => null,
                'old_value' => json_encode(['email' => $request->email]),
                'new_value' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (in_array($user->role, ['admin', 'comelec'])) {
            // ✅ Log role restriction
            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'MOBILE_ACCESS_DENIED_ROLE',
                'target_table' => 'users',
                'target_id' => $user->user_id,
                'old_value' => json_encode([
                    'email' => $request->email,
                    'role' => $user->role,
                ]),
                'new_value' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Admins and COMELEC members cannot log in on mobile'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'user_id' => $user->user_id,
            'has_face_registered' => !is_null($user->face_reference_photo) && $user->is_face_registered,
            'face_reference_photo' => $user->face_reference_photo,
        ]);
    }

    /**
     * Update FCM Token
     * POST /api/mobile/fcm-token
     */
    public function updateFcmToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fcm_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $user->fcm_token = $request->fcm_token;
        $user->save();

        // ✅ Log FCM token update
        AuditLog::create([
            'user_id' => $user->user_id,
            'action_type' => 'MOBILE_FCM_TOKEN_UPDATED',
            'target_table' => 'users',
            'target_id' => $user->user_id,
            'old_value' => null,
            'new_value' => json_encode([
                'fcm_token' => substr($request->fcm_token, 0, 20) . '...',
                'updated_at' => now()->toISOString(),
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token updated successfully'
        ]);
    }
}
