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
    public function show(Request $request, string $slug): JsonResponse
    {
        // Check if preview mode (for draft forms)
        $isPreview = $request->query('preview') === 'true';
        
        // First, check if form exists at all
        $form = Form::where('slug', $slug)->with(['questions.options'])->first();
        
        if (!$form) {
            return response()->json([
                'error' => 'Form not found',
                'code' => 'NOT_FOUND'
            ], 404);
        }
        
        // Check form status (unless preview mode)
        if (!$isPreview) {
            if ($form->status === 'draft') {
                return response()->json([
                    'error' => 'This form is not yet published',
                    'code' => 'DRAFT'
                ], 403);
            }
            
            if ($form->status === 'closed') {
                return response()->json([
                    'error' => 'This form is closed and no longer accepting responses',
                    'code' => 'CLOSED'
                ], 403);
            }
        }

        // Check access restrictions
        $settings = $form->settings ?? [];
        $access = $settings['access'] ?? [];
        $general = $settings['general'] ?? [];
        $examMode = $settings['exam_mode'] ?? [];

        if (!empty($access['start_at']) && now()->lt($access['start_at'])) {
            return response()->json([
                'error' => 'Form not yet available',
                'starts_at' => $access['start_at'],
            ], 403);
        }

        if (!empty($access['end_at']) && now()->gt($access['end_at'])) {
            return response()->json([
                'error' => 'Form has ended',
                'ended_at' => $access['end_at'],
            ], 403);
        }

        // Access Control Logic (Restricted Mode)
        if ($form->access_type === 'restricted') {
            $user = auth('sanctum')->user();
            if (!$user) {
                // If checking preview/info, we might want to let them see basic info? 
                // But generally restricted means restricted.
                return response()->json(['error' => 'Authentication required', 'code' => 'LOGIN_REQUIRED'], 401);
            }
            
            $allowedEmails = $form->allowed_emails ?? [];
            // Creator always has access
            if ($user->id !== $form->created_by && !in_array($user->email, $allowedEmails)) {
                 return response()->json(['error' => 'Access denied', 'code' => 'RESTRICTED_ACCESS'], 403);
            }
        }

        // Prepare questions
        $questions = $form->questions;
        
        // Shuffle questions if enabled
        if ($general['shuffle_questions'] ?? false) {
            $questions = $questions->shuffle();
        }
        
        // Map questions with optional option shuffling (now in general settings)
        $shuffleOptions = $general['shuffle_options'] ?? false;
        
        $mappedQuestions = $questions->map(function($q) use ($shuffleOptions) {
            $options = $q->options;
            
            // Shuffle options if enabled (only for multiple choice type questions)
            if ($shuffleOptions && in_array($q->type, ['multiple_choice', 'checkboxes', 'dropdown'])) {
                $options = $options->shuffle();
            }
            
            return [
                'id' => $q->id,
                'type' => $q->type,
                'content' => $q->content,
                'description' => $q->description,
                'is_required' => $q->is_required ?? false,
                'media' => $q->media,
                'validation' => $q->validation,
                'points' => $q->points,
                'settings' => $q->settings,
                'sort_order' => $q->sort_order,
                'options' => $options->map(fn($o) => [
                    'id' => $o->id,
                    'content' => $o->content,
                    'sort_order' => $o->sort_order,
                ]),
            ];
        });

        return response()->json([
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'description' => $form->description,
                'settings' => [
                    'general' => $general,
                    'exam_mode' => $examMode,
                ],
                'theme' => $form->theme,
                'questions' => $mappedQuestions,
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

        // Try to authenticate user from Bearer token manually
        $user = auth('sanctum')->user();

        // Access Control Logic (Restricted Mode) - Check 1
        if ($form->access_type === 'restricted') {
            if (!$user) {
                return response()->json(['error' => 'Authentication required', 'code' => 'LOGIN_REQUIRED'], 401);
            }
            $allowedEmails = $form->allowed_emails ?? [];
            if ($user->id !== $form->created_by && !in_array($user->email, $allowedEmails)) {
                 return response()->json(['error' => 'Access denied', 'code' => 'RESTRICTED_ACCESS'], 403);
            }
        }

        // Check login requirement (General)
        if (($general['require_login'] ?? false) && !$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Check one response limit
        if ($general['limit_one_response'] ?? false) {
            $existingQuery = FormSession::where('form_id', $form->id)
                ->where('status', 'submitted');
            
            // If login required or user exists, check by user_id
            if ($user) {
                $existingQuery->where('user_id', $user->id);
            } else {
                // Formatting query to handle guest uniqueness
                $existingQuery->where(function($q) use ($request) {
                    $q->where('ip_address', $request->ip())
                        ->orWhere('respondent_email', $request->email);
                });
            }

            if ($existingQuery->exists()) {
                return response()->json(['error' => 'You have already submitted this form'], 403);
            }
        }

        $session = FormSession::create([
            'form_id' => $form->id,
            'user_id' => $user?->id,
            'respondent_email' => $user ? $user->email : $request->email,
            'respondent_name' => $user ? $user->name : $request->name,
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
                // Eager load options for accurate answer checking
                $question = $form->questions()->with('options')->find($responseData['question_id']);
                if (!$question) continue;

                $isCorrect = null;
                $pointsEarned = null;

                // Auto-grade if correct answer exists (either in correct_answer field OR options with is_correct flag)
                $hasCorrectAnswer = ($question->correct_answer !== null && !empty($question->correct_answer))
                    || $question->options->contains(fn($o) => $o->is_correct);
                    
                if ($hasCorrectAnswer) {
                    $isCorrect = $this->checkAnswer($question, $responseData['answer']);
                    $pointsEarned = $isCorrect ? ($question->points ?? 10) : 0;
                    $totalPoints += ($question->points ?? 10);
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

    /**
     * Direct submit without requiring a session first
     * Simpler flow for surveys and forms that don't need exam mode
     */
    public function submitDirect(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required',
            'answers.*.value' => 'nullable',
            'respondent_name' => 'nullable|string|max:255',
            'respondent_email' => 'nullable|email|max:255',
            'duration' => 'nullable|integer',
        ]);

        $form = Form::where('slug', $slug)->firstOrFail();
        
        $settings = $form->settings ?? [];
        $general = $settings['general'] ?? [];

        // Try to authenticate user from Bearer token manually
        $user = auth('sanctum')->user();

        // Access Control Logic (Restricted Mode)
        if ($form->access_type === 'restricted') {
            if (!$user) {
                return response()->json(['error' => 'Authentication required', 'code' => 'LOGIN_REQUIRED'], 401);
            }
            $allowedEmails = $form->allowed_emails ?? [];
            if ($user->id !== $form->created_by && !in_array($user->email, $allowedEmails)) {
                 return response()->json(['error' => 'Access denied', 'code' => 'RESTRICTED_ACCESS'], 403);
            }
        }

        // Check login requirement
        if (($general['require_login'] ?? false) && !$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Check one response limit
        if ($general['limit_one_response'] ?? false) {
            $existingQuery = FormSession::where('form_id', $form->id)
                ->where('status', 'submitted');
                
            if ($user) {
                $existingQuery->where('user_id', $user->id);
            } else {
                $existingQuery->where(function($q) use ($request) {
                    $q->where('ip_address', $request->ip());
                    if ($request->respondent_email) {
                        $q->orWhere('respondent_email', $request->respondent_email);
                    }
                });
            }

            if ($existingQuery->exists()) {
                return response()->json(['error' => 'You have already submitted this form'], 403);
            }
        }

        $session = null;
        $totalPoints = 0;
        $earnedPoints = 0;

        DB::transaction(function () use ($request, $form, &$session, &$totalPoints, &$earnedPoints, $user) {
            // Create session
            $session = FormSession::create([
                'form_id' => $form->id,
                'user_id' => $user?->id,
                'respondent_email' => $user ? $user->email : $request->respondent_email,
                'respondent_name' => $user ? $user->name : $request->respondent_name,
                'status' => 'submitted',
                'started_at' => now()->subSeconds($request->duration ?? 0),
                'submitted_at' => now(),
                'time_spent_seconds' => $request->duration ?? 0,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Save responses
            foreach ($request->answers as $answerData) {
                // Eager load options for accurate answer checking
                $question = $form->questions()->with('options')->find($answerData['question_id']);
                if (!$question) continue;

                $isCorrect = null;
                $pointsEarned = null;

                // Auto-grade if correct answer exists (either in correct_answer field OR options with is_correct flag)
                $hasCorrectAnswer = ($question->correct_answer !== null && !empty($question->correct_answer))
                    || $question->options->contains(fn($o) => $o->is_correct);
                    
                if ($hasCorrectAnswer) {
                    $isCorrect = $this->checkAnswer($question, $answerData['value']);
                    $pointsEarned = $isCorrect ? ($question->points ?? 10) : 0;
                    $totalPoints += ($question->points ?? 10);
                    $earnedPoints += $pointsEarned;
                }

                Response::create([
                    'session_id' => $session->id,
                    'question_id' => $question->id,
                    'answer' => $answerData['value'],
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned,
                ]);
            }

            // Update session with score
            if ($totalPoints > 0) {
                $session->update([
                    'score' => ($earnedPoints / $totalPoints) * 100,
                ]);
            }
        });

        $session->refresh();

        $response = [
            'success' => true,
            'message' => $settings['general']['confirmation_message'] ?? 'Thank you for your submission!',
            'submitted_at' => $session->submitted_at,
            'time_spent_seconds' => $session->time_spent_seconds,
        ];

        // Show score if enabled (now in general settings)
        if ($general['show_score_after'] ?? false) {
            $response['score'] = $session->score;
            $response['total_points'] = $totalPoints;
            $response['earned_points'] = $earnedPoints;
            $passingScore = $general['passing_score'] ?? null;
            if ($passingScore !== null) {
                $response['passed'] = $session->score >= $passingScore;
            }
        }

        // Show correct answers if enabled (now in general settings)
        if ($general['show_correct_answers'] ?? false) {
            $answersReview = [];
            $sessionResponses = $session->responses()->with('question.options')->get();
            
            foreach ($sessionResponses as $resp) {
                $question = $resp->question;
                $reviewData = [
                    'question_id' => $question->id,
                    'user_answer' => $resp->answer,
                    'is_correct' => $resp->is_correct,
                    'points_earned' => $resp->points_earned,
                    'correct_answer' => $question->correct_answer,
                ];
                
                // For multiple choice/checkbox, also include the correct option text
                if (in_array($question->type, ['multiple_choice', 'checkbox', 'checkboxes'])) {
                    $correctAnswer = $question->correct_answer;
                    if ($correctAnswer) {
                        // Find the correct option text
                        $correctOption = $question->options->first(function($opt) use ($correctAnswer) {
                            return $opt->content === $correctAnswer || $opt->id === $correctAnswer;
                        });
                        $reviewData['correct_option_text'] = $correctOption?->content ?? $correctAnswer;
                    }
                }
                
                $answersReview[] = $reviewData;
            }
            
            $response['answers_review'] = $answersReview;
            $response['show_correct_answers'] = true;
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
        
        // Handle multiple choice questions
        if ($question->type === 'multiple_choice') {
            // First, check if any option is marked as correct (is_correct flag)
            $correctOption = $question->options->first(fn($o) => $o->is_correct);
            if ($correctOption) {
                // User sends content, compare with correct option's content
                return $this->normalizeContent($answer) === $this->normalizeContent($correctOption->content);
            }
            
            // If correct_answer is an option ID (UUID format), find the option
            if ($correct && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $correct)) {
                $correctOption = $question->options->first(fn($o) => $o->id === $correct);
                if ($correctOption) {
                    return $this->normalizeContent($answer) === $this->normalizeContent($correctOption->content);
                }
            }
            
            // Direct content comparison
            return $this->normalizeContent($answer) === $this->normalizeContent($correct);
        }

        // Handle checkboxes questions
        if ($question->type === 'checkboxes') {
            // Get all correct options by is_correct flag
            $correctOptions = $question->options->filter(fn($o) => $o->is_correct);
            if ($correctOptions->count() > 0) {
                $correctContents = $correctOptions->pluck('content')->map(fn($c) => $this->normalizeContent($c))->toArray();
                $answerContents = is_array($answer) 
                    ? array_map(fn($a) => $this->normalizeContent($a), $answer)
                    : [$this->normalizeContent($answer)];
                sort($correctContents);
                sort($answerContents);
                return $correctContents === $answerContents;
            }
            
            // Fallback to correct_answer field (array of IDs or contents)
            $correctIds = is_array($correct) ? $correct : [$correct];
            $answerIds = is_array($answer) ? $answer : [$answer];
            
            // Try to resolve IDs to content if they look like UUIDs
            $correctContents = array_map(function($id) use ($question) {
                if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
                    $opt = $question->options->first(fn($o) => $o->id === $id);
                    return $opt ? $this->normalizeContent($opt->content) : $this->normalizeContent($id);
                }
                return $this->normalizeContent($id);
            }, $correctIds);
            
            $answerContents = array_map(fn($a) => $this->normalizeContent($a), $answerIds);
            
            sort($correctContents);
            sort($answerContents);
            return $correctContents === $answerContents;
        }

        // Text comparison (case insensitive, trimmed, HTML stripped)
        if (is_string($answer) && is_string($correct)) {
            return $this->normalizeContent($answer) === $this->normalizeContent($correct);
        }

        return $answer == $correct;
    }
    
    /**
     * Normalize content for comparison by stripping HTML tags, trimming, and lowercasing
     */
    private function normalizeContent($content): string
    {
        if (!is_string($content)) {
            return '';
        }
        return strtolower(trim(strip_tags($content)));
    }
}
