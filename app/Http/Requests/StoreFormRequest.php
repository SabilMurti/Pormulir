<?php

namespace App\Http\Requests;

use App\Models\Question;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'theme' => 'nullable|array',
            'workspace_id' => 'nullable|uuid|exists:workspaces,id',
        ];
    }
}
