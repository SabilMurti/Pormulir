<?php

namespace App\Http\Controllers;

use App\Http\Resources\FormResource;
use App\Http\Resources\FormSessionResource;
use App\Models\Form;
use App\Models\FormSession;
use App\Models\Response;
use App\Models\ViolationLog;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicFormController extends Controller
{
    public function __construct(
        private ExamService $examService
    ) {}
    public function show(string $slug): JsonResponse
    {
        $form = Form::where('slug', $slug)
            ->where('status', 'published')
            ->with(['questions.options'])
            ->firstOrFail();

        // Check access restrictions
        $settings = $form->settings ?? [];
        $access = $settings['access'] ?? [];

        if ($access['start_at'] && now()->lt($access['start_at'])) {
            return response()->json([
                'error' => 'Form not yet available',
                'starts_at' => $access['start_at'],
            ], 403);
        }

        if ($access['end_at'] && now()->gt($access['end_at'])) {
            return response()->json([
                'error' => 'Form has ended',
                'ended_at' => $access['end_at'],
            ], 403);
        }

        return response()->json([
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'description' => $form->description,
                'settings' => [
                    'general' => $settings['general'] ?? [],
                    'exam_mode' => $settings['exam_mode'] ?? [],
                ],
                'theme' => $form->theme,
                'questions' => $form->questions->map(fn($q) => [
                    'id' => $q->id,
                    'type' => $q->type,
                    'content' => $q->content,
                    'description' => $q->description,
                    'media' => $q->media,
                    'validation' => $q->validation,
                    'points' => $q->points,
                    'sort_order' => $q->sort_order,
                    'options' => $q->options->map(fn($o) => [
                        'id' => $o->id,
                        'content' => $o->content,
                        'sort_order' => $o->sort_order,
                    ]),
                ]),
            ],
        ]);
    }

    public function start(Request $request, string $slug): JsonResponse
    {
        $form = Form::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $settings = $form->settings ?? [];
        $general = $settings['general'] ?? [];
        $access = $settings['access'] ?? [];

        // Validate password if required
        if ($access['password'] ?? null) {
            $request->validate(['password' => 'required|string']);
            if ($request->password !== $access['password']) {
                return response()->json(['error' => 'Invalid password'], 401);
            }
        }

        // Check one response limit
        if ($general['limit_one_response'] ?? false) {
            $existing = FormSession::where('form_id', $form->id)
                ->where('status', 'submitted')
                ->where(function($q) use ($request) {
                    $q->where('ip_address', $request->ip())
                        ->orWhere('respondent_email', $request->email);
                    if ($request->user()) {
                        $q->orWhere('user_id', $request->user()->id);
                    }
                })
                ->exists();

            if ($existing) {
                return response()->json(['error' => 'You have already submitted this form'], 403);
            }
        }

        $session = FormSession::create([
            'form_id' => $form->id,
            'user_id' => $request->user()?->id,
            'respondent_email' => $request->email,
            'respondent_name' => $request->name,
            'status' => 'in_progress',
            'started_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Get exam data with shuffled questions/options
        $examData = $this->examService->prepareExamData($form);

        return response()->json([
            'session_id' => $session->id,
            'started_at' => $session->started_at,
            'time_limit_minutes' => $examData['time_limit_minutes'],
            'exam_mode' => $examData['exam_mode_enabled'],
            'anti_cheat_rules' => $examData['anti_cheat'],
            'questions' => $examData['questions'],
        ]);
    }

    public function submit(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|uuid',
            'responses' => 'required|array',
            'responses.*.question_id' => 'required|uuid',
            'responses.*.answer' => 'nullable',
        ]);

        $form = Form::where('slug', $slug)->firstOrFail();
        $session = FormSession::where('id', $request->session_id)
            ->where('form_id', $form->id)
            ->where('status', 'in_progress')
            ->firstOrFail();

        // Check time limit
        $settings = $form->settings ?? [];
        $examMode = $settings['exam_mode'] ?? [];
        if ($examMode['time_limit_minutes'] ?? null) {
            $timeLimit = $session->started_at->addMinutes($examMode['time_limit_minutes']);
            if (now()->gt($timeLimit)) {
                $session->update(['status' => 'violated']);
                return response()->json(['error' => 'Time limit exceeded'], 403);
            }
        }

        DB::transaction(function () use ($request, $form, $session) {
            $totalPoints = 0;
            $earnedPoints = 0;

            foreach ($request->responses as $responseData) {
                $question = $form->questions()->find($responseData['question_id']);
                if (!$question) continue;

                $isCorrect = null;
                $pointsEarned = null;

                // Auto-grade if correct answer exists
                if ($question->correct_answer !== null) {
                    $isCorrect = $this->checkAnswer($question, $responseData['answer']);
                    $pointsEarned = $isCorrect ? $question->points : 0;
                    $totalPoints += $question->points;
                    $earnedPoints += $pointsEarned;
                }

                Response::updateOrCreate(
                    [
                        'session_id' => $session->id,
                        'question_id' => $question->id,
                    ],
                    [
                        'answer' => $responseData['answer'],
                        'is_correct' => $isCorrect,
                        'points_earned' => $pointsEarned,
                    ]
                );
            }

            $session->update([
                'status' => 'submitted',
                'submitted_at' => now(),
                'time_spent_seconds' => now()->diffInSeconds($session->started_at),
                'score' => $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : null,
            ]);
        });

        $session->refresh();

        // Send email notifications
        $this->sendNotifications($form, $session, $settings);

        $response = [
            'message' => $settings['general']['confirmation_message'] ?? 'Thank you for your submission!',
            'submitted_at' => $session->submitted_at,
            'time_spent_seconds' => $session->time_spent_seconds,
        ];

        // Show score if enabled
        if ($settings['exam_mode']['show_score_after'] ?? false) {
            $response['score'] = $session->score;
            $response['passed'] = $session->score >= ($settings['exam_mode']['passing_score'] ?? 0);
        }

        return response()->json($response);
    }

    private function sendNotifications(Form $form, FormSession $session, array $settings): void
    {
        $notifications = $settings['notifications'] ?? [];

        // Notify form creator
        if ($notifications['notify_on_submission'] ?? true) {
            $creator = $form->creator;
            if ($creator?->email) {
                \Illuminate\Support\Facades\Mail::to($creator->email)
                    ->queue(new \App\Mail\FormSubmissionNotification($form, $session));
            }
        }

        // Send confirmation to respondent
        if (($notifications['send_confirmation'] ?? false) && $session->respondent_email) {
            \Illuminate\Support\Facades\Mail::to($session->respondent_email)
                ->queue(new \App\Mail\SubmissionConfirmation($form, $session));
        }
    }

    public function violation(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|uuid',
            'event_type' => 'required|string|max:50',
            'event_data' => 'nullable|array',
        ]);

        $form = Form::where('slug', $slug)->firstOrFail();
        $session = FormSession::where('id', $request->session_id)
            ->where('form_id', $form->id)
            ->where('status', 'in_progress')
            ->firstOrFail();

        ViolationLog::create([
            'session_id' => $session->id,
            'event_type' => $request->event_type,
            'event_data' => $request->event_data,
            'occurred_at' => now(),
        ]);

        // Check max violations
        $settings = $form->settings ?? [];
        $maxViolations = $settings['exam_mode']['anti_cheat']['max_violations'] ?? 3;
        $violationCount = $session->violations()->count();

        if ($violationCount >= $maxViolations) {
            $session->update(['status' => 'violated']);
            return response()->json([
                'error' => 'Maximum violations exceeded',
                'terminated' => true,
            ], 403);
        }

        return response()->json([
            'violation_count' => $violationCount,
            'max_violations' => $maxViolations,
            'warning' => $violationCount >= ($maxViolations - 1),
        ]);
    }

    public function results(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|uuid',
        ]);

        $form = Form::where('slug', $slug)->firstOrFail();
        $session = FormSession::where('id', $request->session_id)
            ->where('form_id', $form->id)
            ->where('status', 'submitted')
            ->firstOrFail();

        $results = $this->examService->getExamResults($session);

        return response()->json($results);
    }

    private function checkAnswer($question, $answer): bool
    {
        $correct = $question->correct_answer;

        if ($question->type === 'multiple_choice') {
            return $answer === $correct;
        }

        if ($question->type === 'checkboxes') {
            $correctIds = is_array($correct) ? $correct : [$correct];
            $answerIds = is_array($answer) ? $answer : [$answer];
            sort($correctIds);
            sort($answerIds);
            return $correctIds === $answerIds;
        }

        // Text comparison (case insensitive, trimmed)
        if (is_string($answer) && is_string($correct)) {
            return strtolower(trim($answer)) === strtolower(trim($correct));
        }

        return $answer == $correct;
    }
}
