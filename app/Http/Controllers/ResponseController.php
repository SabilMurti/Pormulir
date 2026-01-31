<?php

namespace App\Http\Controllers;

use App\Exports\ResponsesExport;
use App\Http\Resources\FormSessionResource;
use App\Models\Form;
use App\Models\FormSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResponseController extends Controller
{
    public function index(Request $request, Form $form): AnonymousResourceCollection
    {
        // Handle forms with or without workspace
        if ($form->workspace_id) {
            $this->authorize('view', $form->workspace);
        }

        // Optimized: Removing 'responses.question' eager load for list view
        $sessions = $form->sessions()
            ->where('status', 'submitted')
            ->with(['user']) 
            ->orderBy('submitted_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return FormSessionResource::collection($sessions);
    }

    // ... (rest of methods)

    public function summary(Form $form): JsonResponse
    {
        // Handle forms with or without workspace
        if ($form->workspace_id) {
            $this->authorize('view', $form->workspace);
        }

        $form->load('questions.options');

        $sessionsQuery = $form->sessions()->where('status', 'submitted');
        
        $stats = [
            'total_responses' => $sessionsQuery->count(),
            'average_score' => round($sessionsQuery->avg('score') ?? 0, 2),
            'average_time_seconds' => round($sessionsQuery->avg('time_spent_seconds') ?? 0),
            'completion_rate' => $this->calculateCompletionRate($form),
        ];

        // OPTIMIZATION: Fetch ALL responses in one query instead of loops
        $allResponses = DB::table('responses')
            ->join('form_sessions', 'responses.session_id', '=', 'form_sessions.id')
            ->where('form_sessions.form_id', $form->id)
            ->where('form_sessions.status', 'submitted')
            ->select('responses.question_id', 'responses.answer', 'responses.is_correct')
            ->get()
            ->groupBy('question_id');

        $questionStats = $form->questions->map(function ($question) use ($allResponses) {
            $questionResponses = $allResponses->get($question->id) ?? collect();
            
            $questionData = [
                'id' => $question->id,
                'content' => $question->content,
                'type' => $question->type,
            ];

            if ($question->hasOptions()) {
                // In-memory counting
                $answerCounts = $questionResponses->pluck('answer')
                    ->flatMap(function ($answer) {
                        $decoded = json_decode($answer, true);
                        return is_array($decoded) ? $decoded : [$decoded];
                    })
                    ->countBy()
                    ->toArray();

                $questionData['options'] = $question->options->map(fn($o) => [
                    'id' => $o->id,
                    'content' => $o->content,
                    'count' => $answerCounts[$o->id] ?? 0,
                ]);
            }

            if ($question->points > 0) {
                $total = $questionResponses->count();
                $correct = $questionResponses->where('is_correct', true)->count();
                
                $questionData['correct_rate'] = $total > 0 ? round(($correct / $total) * 100, 2) : 0;
            }

            return $questionData;
        });

        return response()->json([
            'stats' => $stats,
            'questions' => $questionStats,
        ]);
    }

    public function show(Form $form, FormSession $session): JsonResponse
    {
        // Handle forms with or without workspace
        if ($form->workspace_id) {
            $this->authorize('view', $form->workspace);
        }

        if ($session->form_id !== $form->id) {
            abort(404);
        }

        $session->load(['user', 'responses.question.options', 'violations']);
        
        // Get form questions with correct answers for grading view
        $form->load('questions.options');

        return response()->json([
            'session' => [
                'id' => $session->id,
                'respondent_name' => $session->respondent_name,
                'respondent_email' => $session->respondent_email,
                'status' => $session->status,
                'started_at' => $session->started_at,
                'submitted_at' => $session->submitted_at,
                'time_spent_seconds' => $session->time_spent_seconds,
                'score' => $session->score,
                'ip_address' => $session->ip_address,
                'responses' => $session->responses->map(fn($r) => [
                    'id' => $r->id,
                    'question_id' => $r->question_id,
                    'answer' => $r->answer,
                    'is_correct' => $r->is_correct,
                    'points_earned' => $r->points_earned,
                ]),
                'violations_count' => $session->violations->count(),
            ],
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'questions' => $form->questions->map(fn($q) => [
                    'id' => $q->id,
                    'type' => $q->type,
                    'content' => $q->content,
                    'description' => $q->description,
                    'points' => $q->points,
                    'correct_answer' => $q->correct_answer,
                    'options' => $q->options->map(fn($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                        'is_correct' => $o->is_correct,
                    ]),
                ]),
            ],
        ]);
    }

    public function destroy(Form $form, FormSession $session): JsonResponse
    {
        $this->authorize('update', $form->workspace);

        if ($session->form_id !== $form->id) {
            abort(404);
        }

        $session->delete();

        return response()->json(['message' => 'Response deleted successfully']);
    }

    public function destroyAll(Form $form): JsonResponse
    {
        $this->authorize('update', $form->workspace);

        $form->sessions()->delete();

        return response()->json(['message' => 'All responses deleted successfully']);
    }

    public function export(Request $request, Form $form): BinaryFileResponse|StreamedResponse
    {
        $this->authorize('view', $form->workspace);

        $format = $request->query('format', 'xlsx');
        
        // Create user-friendly filename: "Hasil Respon - Form Title"
        // Remove illegal characters for filenames
        $safeTitle = preg_replace('/[^A-Za-z0-9 \-_]/', '', $form->title);
        $filename = 'Hasil Respon - ' . $safeTitle;

        if ($format === 'csv') {
            return Excel::download(new ResponsesExport($form), $filename . '.csv', \Maatwebsite\Excel\Excel::CSV);
        }

        return Excel::download(new ResponsesExport($form), $filename . '.xlsx');
    }



    private function calculateCompletionRate(Form $form): float
    {
        $started = $form->sessions()->count();
        $submitted = $form->sessions()->where('status', 'submitted')->count();
        
        return $started > 0 ? round(($submitted / $started) * 100, 2) : 0;
    }
}
