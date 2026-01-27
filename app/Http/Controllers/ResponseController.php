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
        $this->authorize('view', $form->workspace);

        $sessions = $form->sessions()
            ->where('status', 'submitted')
            ->with(['user', 'responses.question'])
            ->orderBy('submitted_at', 'desc')
            ->paginate($request->per_page ?? 50);

        return FormSessionResource::collection($sessions);
    }

    public function show(Form $form, FormSession $session): FormSessionResource
    {
        $this->authorize('view', $form->workspace);

        if ($session->form_id !== $form->id) {
            abort(404);
        }

        return new FormSessionResource(
            $session->load(['user', 'responses.question', 'violations'])
        );
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

    public function export(Request $request, Form $form): BinaryFileResponse|StreamedResponse
    {
        $this->authorize('view', $form->workspace);

        $format = $request->query('format', 'xlsx');
        $filename = $form->slug . '-responses';

        if ($format === 'csv') {
            return Excel::download(new ResponsesExport($form), $filename . '.csv', \Maatwebsite\Excel\Excel::CSV);
        }

        return Excel::download(new ResponsesExport($form), $filename . '.xlsx');
    }

    public function summary(Form $form): JsonResponse
    {
        $this->authorize('view', $form->workspace);

        $form->load('questions.options');

        $sessions = $form->sessions()->where('status', 'submitted');
        
        $stats = [
            'total_responses' => $sessions->count(),
            'average_score' => round($sessions->avg('score') ?? 0, 2),
            'average_time_seconds' => round($sessions->avg('time_spent_seconds') ?? 0),
            'completion_rate' => $this->calculateCompletionRate($form),
        ];

        $questionStats = [];
        foreach ($form->questions as $question) {
            $questionData = [
                'id' => $question->id,
                'content' => $question->content,
                'type' => $question->type,
            ];

            if ($question->hasOptions()) {
                $optionCounts = DB::table('responses')
                    ->join('form_sessions', 'responses.session_id', '=', 'form_sessions.id')
                    ->where('responses.question_id', $question->id)
                    ->where('form_sessions.status', 'submitted')
                    ->select('responses.answer')
                    ->get()
                    ->pluck('answer')
                    ->flatMap(function ($answer) {
                        $decoded = json_decode($answer, true);
                        return is_array($decoded) ? $decoded : [$decoded];
                    })
                    ->countBy()
                    ->toArray();

                $questionData['options'] = $question->options->map(fn($o) => [
                    'id' => $o->id,
                    'content' => $o->content,
                    'count' => $optionCounts[$o->id] ?? 0,
                ]);
            }

            if ($question->points > 0) {
                $responses = $form->sessions()
                    ->where('status', 'submitted')
                    ->join('responses', 'form_sessions.id', '=', 'responses.session_id')
                    ->where('responses.question_id', $question->id)
                    ->select('responses.is_correct')
                    ->get();

                $correct = $responses->where('is_correct', true)->count();
                $total = $responses->count();
                
                $questionData['correct_rate'] = $total > 0 ? round(($correct / $total) * 100, 2) : 0;
            }

            $questionStats[] = $questionData;
        }

        return response()->json([
            'stats' => $stats,
            'questions' => $questionStats,
        ]);
    }

    private function calculateCompletionRate(Form $form): float
    {
        $started = $form->sessions()->count();
        $submitted = $form->sessions()->where('status', 'submitted')->count();
        
        return $started > 0 ? round(($submitted / $started) * 100, 2) : 0;
    }
}
