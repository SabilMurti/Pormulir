<?php

namespace App\Http\Controllers;

use App\Http\Requests\AIGenerateRequest;
use App\Models\AiUsageLog;
use App\Models\Form;
use App\Models\Question;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AIController extends Controller
{
    public function __construct(
        private GeminiService $geminiService
    ) {}

    public function generate(AIGenerateRequest $request): JsonResponse
    {
        try {
            $questions = $this->geminiService->generateQuestions(
                user: $request->user(),
                topic: $request->topic,
                count: $request->count ?? 5,
                type: $request->type ?? 'multiple_choice',
                difficulty: $request->difficulty ?? 'medium',
                language: $request->language ?? 'id'
            );

            return response()->json([
                'questions' => $questions,
                'count' => count($questions),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate questions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function generateFromFile(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:txt,pdf,doc,docx|max:10240',
            'count' => 'nullable|integer|min:1|max:20',
            'type' => 'nullable|string|in:multiple_choice,checkboxes,short_text,long_text,mixed',
            'language' => 'nullable|string|in:id,en',
        ]);

        try {
            $file = $request->file('file');
            $content = $this->extractFileContent($file);

            if (empty($content)) {
                return response()->json([
                    'error' => 'Could not extract content from file',
                ], 422);
            }

            $questions = $this->geminiService->generateFromFile(
                user: $request->user(),
                content: $content,
                count: $request->count ?? 5,
                type: $request->type ?? 'multiple_choice',
                language: $request->language ?? 'id'
            );

            return response()->json([
                'questions' => $questions,
                'count' => count($questions),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate questions from file',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function improve(Request $request): JsonResponse
    {
        $request->validate([
            'question_content' => 'required|string',
            'instruction' => 'required|string|max:500',
        ]);

        try {
            $improved = $this->geminiService->improveQuestion(
                user: $request->user(),
                questionContent: $request->question_content,
                instruction: $request->instruction
            );

            return response()->json([
                'question' => $improved,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to improve question',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function addToForm(Request $request, Form $form): JsonResponse
    {
        $this->authorize('update', $form->workspace);

        $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.type' => 'required|string',
            'questions.*.content' => 'required|string',
        ]);

        $maxOrder = $form->questions()->max('sort_order') ?? 0;
        $createdQuestions = [];

        foreach ($request->questions as $index => $questionData) {
            $question = $form->questions()->create([
                'type' => $questionData['type'],
                'content' => $questionData['content'],
                'description' => $questionData['description'] ?? null,
                'points' => $questionData['points'] ?? 0,
                'correct_answer' => $questionData['correct_answer'] ?? null,
                'explanation' => $questionData['explanation'] ?? null,
                'sort_order' => $maxOrder + $index + 1,
            ]);

            // Create options if provided
            if (!empty($questionData['options']) && $question->hasOptions()) {
                foreach ($questionData['options'] as $optIndex => $optionData) {
                    $option = $question->options()->create([
                        'content' => $optionData['content'],
                        'is_correct' => $optionData['is_correct'] ?? false,
                        'sort_order' => $optIndex,
                    ]);

                    // Update correct_answer with option ID if this is correct
                    if ($optionData['is_correct'] ?? false) {
                        if ($question->type === 'multiple_choice') {
                            $question->update(['correct_answer' => $option->id]);
                        } elseif ($question->type === 'checkboxes') {
                            $correctAnswers = $question->correct_answer ?? [];
                            $correctAnswers[] = $option->id;
                            $question->update(['correct_answer' => $correctAnswers]);
                        }
                    }
                }
            }

            $createdQuestions[] = $question->load('options');
        }

        return response()->json([
            'message' => count($createdQuestions) . ' questions added to form',
            'questions' => $createdQuestions,
        ], 201);
    }

    /**
     * Analyze form responses with AI
     */
    public function analyzeResponses(Request $request, Form $form): JsonResponse
    {
        $this->authorize('view', $form->workspace);

        $request->validate([
            'prompt' => 'required|string|max:1000',
            'context' => 'nullable|array',
        ]);

        try {
            // Get form data with responses
            $form->load(['questions.options', 'sessions' => function($q) {
                $q->where('status', 'submitted')
                  ->with('responses')
                  ->orderBy('submitted_at', 'desc')
                  ->limit(100); // Limit to latest 100 for performance
            }]);

            // Use frontend context if provided, otherwise build from backend
            $frontendContext = $request->context;

            $analysis = $this->geminiService->analyzeResponses(
                user: $request->user(),
                form: $form,
                prompt: $request->prompt,
                frontendContext: $frontendContext
            );

            return response()->json([
                'analysis' => $analysis,
                'meta' => [
                    'total_responses' => $form->sessions->count(),
                    'analyzed_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to analyze responses',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function usage(Request $request): JsonResponse
    {
        $logs = AiUsageLog::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $stats = [
            'total_questions_generated' => $logs->sum('questions_generated'),
            'total_requests' => $logs->count(),
            'by_action' => $logs->groupBy('action')->map->count(),
        ];

        return response()->json([
            'stats' => $stats,
            'recent_logs' => $logs->take(10)->map(fn($log) => [
                'action' => $log->action,
                'questions_generated' => $log->questions_generated,
                'created_at' => $log->created_at,
            ]),
        ]);
    }

    private function extractFileContent($file): string
    {
        $mimeType = $file->getMimeType();
        $path = $file->getPathname();

        // For text files
        if (str_contains($mimeType, 'text')) {
            return file_get_contents($path);
        }

        // For PDF files - basic extraction
        if ($mimeType === 'application/pdf') {
            return $this->extractPdfContent($path);
        }

        // For other files, try to read as text
        return file_get_contents($path);
    }

    private function extractPdfContent(string $path): string
    {
        // Simple PDF text extraction using pdftotext if available
        $output = shell_exec("pdftotext -layout '{$path}' - 2>/dev/null");
        
        if (!empty($output)) {
            return $output;
        }

        // Fallback: try to read raw PDF and extract text
        $content = file_get_contents($path);
        
        // Very basic PDF text extraction
        $text = '';
        if (preg_match_all('/\((.*?)\)/', $content, $matches)) {
            $text = implode(' ', $matches[1]);
        }
        
        return $text ?: 'Could not extract text from PDF';
    }
}
