<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AIGenerateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'topic' => 'required|string|max:500',
            'count' => 'nullable|integer|min:1|max:20',
            'type' => 'nullable|string|in:multiple_choice,checkboxes,short_text,long_text',
            'difficulty' => 'nullable|string|in:easy,medium,hard',
            'language' => 'nullable|string|in:id,en',
        ];
    }

    public function messages(): array
    {
        return [
            'topic.required' => 'Topic is required for generating questions',
            'count.max' => 'Maximum 20 questions can be generated at once',
        ];
    }
}
