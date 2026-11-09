<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'mobile'       => ['nullable', 'string', 'max:20'],
            'country_code' => ['nullable', 'string', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.min'      => 'Password must be at least 8 characters.',
            'password.mixed'    => 'Password must contain at least one uppercase and one lowercase letter.',
            'password.numbers'  => 'Password must contain at least one number.',
            'password.symbols'  => 'Password must contain at least one special character.',
            'email.unique'      => 'An account with this email already exists.',
        ];
    }
}
