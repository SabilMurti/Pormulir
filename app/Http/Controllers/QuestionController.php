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
        $this->authorize('update', $form->workspace);

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
        $this->authorize('update', $question->form->workspace);

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

    public function destroy(Question $question): JsonResponse
    {
        $this->authorize('update', $question->form->workspace);

        $question->delete();

        return response()->json(['message' => 'Question deleted successfully']);
    }

    public function reorder(Request $request, Form $form): JsonResponse
    {
        $this->authorize('update', $form->workspace);

        $request->validate([
            'questions' => 'required|array',
            'questions.*.id' => 'required|uuid|exists:questions,id',
            'questions.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->questions as $questionData) {
            Question::where('id', $questionData['id'])
                ->where('form_id', $form->id)
                ->update(['sort_order' => $questionData['sort_order']]);
        }

        return response()->json(['message' => 'Questions reordered successfully']);
    }
}
