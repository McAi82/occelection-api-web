<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'student_id' => 'required|string|unique:users,student_id',
            'course' => 'nullable|string|max:100',
            'year_level' => 'nullable|integer|min:1|max:4',
        ];
    }
}