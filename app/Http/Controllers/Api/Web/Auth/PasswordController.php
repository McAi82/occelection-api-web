<?php

namespace App\Http\Controllers\Api\Web\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\HasApiResponse;
use App\Traits\HasAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\PasswordResetMail;

class PasswordController extends Controller
{
    use HasApiResponse, HasAuditLog;

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:8|different:current_password',
            'confirm_password' => 'required|same:new_password',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password_hash)) {
            return $this->errorResponse('Current password is incorrect', 400);
        }

        $user->password_hash = Hash::make($request->new_password);
        $user->save();

        $this->logAction(
            $user->user_id,
            'CHANGE_PASSWORD',
            'users',
            $user->user_id,
            null,
            null,
            $request->ip()
        );

        return $this->successResponse(null, 'Password changed successfully');
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }
        
        $token = Str::random(60);
        
        \DB::table('password_reset_tokens')->updateOrInsert(
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
                        ->subject('Password Reset Request - OCC Election System');
            });
            
            return $this->successResponse(
                ['debug_url' => env('APP_DEBUG', false) ? $resetUrl : null],
                'Password reset link sent to your email'
            );
            
        } catch (\Exception $e) {
            \Log::error('Failed to send email: ' . $e->getMessage());
            return $this->errorResponse('Failed to send email. Please try again.', 500);
        }
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'token' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $reset = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$reset) {
            return $this->errorResponse('Invalid token', 400);
        }

        if (now()->diffInHours($reset->created_at) > 1) {
            return $this->errorResponse('Token expired', 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->password_hash = Hash::make($request->password);
        $user->save();

        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        $this->logAction(
            $user->user_id,
            'RESET_PASSWORD',
            'users',
            $user->user_id,
            null,
            null,
            $request->ip()
        );

        return $this->successResponse(null, 'Password reset successfully');
    }
}