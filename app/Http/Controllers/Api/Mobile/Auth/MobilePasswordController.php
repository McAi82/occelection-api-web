<?php

namespace App\Http\Controllers\Api\Mobile\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\LOG;
use Illuminate\Support\Str;

class MobilePasswordController extends Controller
{
    /**
     * Change Password
     * POST /api/mobile/change-password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:8|different:current_password',
            'confirm_password' => 'required|same:new_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 400);
        }

        $user->password_hash = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Forgot Password
     * POST /api/mobile/forgot-password
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        
        $token = Str::random(60);
        
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => now()]
        );
        
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . $user->email;
        
        try {
            Mail::send('emails.password-reset', [
                'userName' => $user->first_name . ' ' . $user->last_name,
                'resetUrl' => $resetUrl,
            ], function($message) use ($user) {
                $message->to($user->email)
                        ->subject('Password Reset Request');
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email. Please try again.'
            ], 500);
        }
    }

    /**
     * Reset Password
     * POST /api/mobile/reset-password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'token' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $reset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$reset) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token'
            ], 400);
        }

        if (now()->diffInHours($reset->created_at) > 1) {
            return response()->json([
                'success' => false,
                'message' => 'Token expired'
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->password_hash = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully'
        ]);
    }
}