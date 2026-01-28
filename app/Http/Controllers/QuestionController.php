<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Http\Resources\QuestionResource;
use App\Models\Form;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function store(StoreQuestionRequest $request, Form $form): QuestionResource
    {
        // Handle forms with or without workspace
        if ($form->workspace_id) {
            $this->authorize('update', $form->workspace);
        } else {
            // For standalone forms, check if user owns the form
            if ($form->created_by !== $request->user()->id) {
                abort(403, 'Unauthorized');
            }
        }

        $maxOrder = $form->questions()->max('sort_order') ?? 0;

        $question = $form->questions()->create([
            ...$request->validated(),
            'sort_order' => $maxOrder + 1,
        ]);

        // Create options if provided
        if ($request->has('options') && $question->hasOptions()) {
            foreach ($request->options as $index => $optionData) {
                $question->options()->create([
                    'content' => $optionData['content'],
                    'is_correct' => $optionData['is_correct'] ?? false,
                    'sort_order' => $index,
                ]);
            }
        }

        return new QuestionResource($question->load('options'));
    }

    public function update(UpdateQuestionRequest $request, Question $question): QuestionResource
    {
        // Handle forms with or without workspace
        if ($question->form->workspace_id) {
            $this->authorize('update', $question->form->workspace);
        } else {
            if ($question->form->created_by !== $request->user()->id) {
                abort(403, 'Unauthorized');
            }
        }

        $question->update($request->validated());

        // Update options if provided
        if ($request->has('options')) {
            $question->options()->delete();
            
            foreach ($request->options as $index => $optionData) {
                $question->options()->create([
                    'content' => $optionData['content'],
                    'is_correct' => $optionData['is_correct'] ?? false,
                    'sort_order' => $index,
                ]);
            }
        }

        return new QuestionResource($question->load('options'));
    }

    public function destroy(Request $request, Question $question): JsonResponse
    {
        // Handle forms with or without workspace
        if ($question->form->workspace_id) {
            $this->authorize('update', $question->form->workspace);
        } else {
            if ($question->form->created_by !== $request->user()->id) {
                abort(403, 'Unauthorized');
            }
        }

        $question->delete();

        return response()->json(['message' => 'Question deleted successfully']);
    }

    public function reorder(Request $request, Form $form): JsonResponse
    {
        // Handle forms with or without workspace
        if ($form->workspace_id) {
            $this->authorize('update', $form->workspace);
        } else {
            if ($form->created_by !== $request->user()->id) {
                abort(403, 'Unauthorized');
            }
        }

        $request->validate([
            'order' => 'required|array',
            'order.*' => 'required|uuid|exists:questions,id',
        ]);

        foreach ($request->order as $index => $questionId) {
            Question::where('id', $questionId)
                ->where('form_id', $form->id)
                ->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Questions reordered successfully']);
    }
}
