<?php

namespace App\Http\Controllers\Api\Web\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use App\Traits\HasApiResponse;
use App\Traits\HasAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;

class AuthController extends Controller
{
    use HasApiResponse, HasAuditLog;

    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'student_id' => $request->student_id,
            'course_id' => $request->course_id,
            'year_level' => $request->year_level,
            'role' => 'voter',
            'is_active' => true,
        ]);

        $this->logAction(
            $user->user_id,
            'REGISTER',
            'users',
            $user->user_id,
            null,
            $user->toArray(),
            $request->ip()
        );

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $request->authenticate(); 
        
        $user = $request->user();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Account is deactivated'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user,
            'role' => $user->role
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        $this->logAction(
            $user->user_id,
            'LOGOUT',
            'users',
            $user->user_id,
            null,
            null,
            $request->ip()
        );

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('course');
        
        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

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
        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
    }

    if (in_array($user->role, ['admin', 'comelec'])) {
        return response()->json([
            'success' => false,
            'message' => 'Admins and COMELEC members cannot log in on mobile. Please use the web application.'
        ], 403);
    }

    // ✅ Return user_id and face data
    return response()->json([
        'success' => true,
        'requires_2fa' => $user->two_factor_enabled ?? false,
        'two_factor_enabled' => $user->two_factor_enabled ?? false,
        'user_id' => $user->user_id, // ✅ Added user_id
        'has_face_registered' => !is_null($user->face_reference_photo) && $user->is_face_registered,
        'face_reference_photo' => $user->face_reference_photo,
    ]);
}
}