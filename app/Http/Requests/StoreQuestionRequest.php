<?php

namespace App\Http\Requests;

use App\Models\Question;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(Question::TYPES)],
            'content' => 'required|string',
            'description' => 'nullable|string',
            'is_required' => 'nullable|boolean',
            'settings' => 'nullable|array',
            'media' => 'nullable|array',
            'validation' => 'nullable|array',
            'correct_answer' => 'nullable',
            'explanation' => 'nullable|string',
            'points' => 'nullable|integer|min:0',
            'options' => 'nullable|array',
            // Relaxed validation - controller handles normalization
            'options.*' => 'nullable',
        ];
    }
}
