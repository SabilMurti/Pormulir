<?php

namespace App\Services;

use App\Models\Form;
use App\Models\FormSession;
use App\Models\Question;
use Illuminate\Support\Collection;

class ExamService
{
    /**
     * Prepare exam data with shuffled questions/options if enabled
     */
    public function prepareExamData(Form $form): array
    {
        $settings = $form->settings ?? [];
        $examMode = $settings['exam_mode'] ?? [];
        $general = $settings['general'] ?? [];

        $questions = $form->questions()->with('options')->orderBy('sort_order')->get();

        // Shuffle questions if enabled
        if ($general['shuffle_questions'] ?? false) {
            $questions = $questions->shuffle();
        }

        // Shuffle options if enabled (exam mode)
        if ($examMode['shuffle_options'] ?? false) {
            $questions = $questions->map(function ($question) {
                if ($question->hasOptions()) {
                    $question->setRelation('options', $question->options->shuffle());
                }
                return $question;
            });
        }

        return [
            'questions' => $questions->map(fn($q) => $this->formatQuestionForRespondent($q)),
            'time_limit_minutes' => $examMode['time_limit_minutes'] ?? null,
            'exam_mode_enabled' => $examMode['enabled'] ?? false,
            'anti_cheat' => $examMode['anti_cheat'] ?? [],
        ];
    }

    /**
     * Validate timer - check if submission is within time limit
     */
    public function validateTimer(FormSession $session): array
    {
        $form = $session->form;
        $settings = $form->settings ?? [];
        $examMode = $settings['exam_mode'] ?? [];
        $timeLimit = $examMode['time_limit_minutes'] ?? null;

        if (!$timeLimit) {
            return ['valid' => true, 'exceeded_by' => 0];
        }

        $deadline = $session->started_at->addMinutes($timeLimit);
        $now = now();

        if ($now->gt($deadline)) {
            $exceededBy = $now->diffInSeconds($deadline);
            return [
                'valid' => false,
                'exceeded_by' => $exceededBy,
                'deadline' => $deadline,
            ];
        }

        return ['valid' => true, 'remaining_seconds' => $deadline->diffInSeconds($now)];
    }

    /**
     * Calculate score for a session
     */
    public function calculateScore(FormSession $session): array
    {
        $form = $session->form;
        $settings = $form->settings ?? [];
        $examMode = $settings['exam_mode'] ?? [];

        $totalPoints = $form->questions()->sum('points');
        $earnedPoints = $session->responses()->sum('points_earned');

        $score = $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
        $passingScore = $examMode['passing_score'] ?? 0;
        $passed = $score >= $passingScore;

        return [
            'total_points' => $totalPoints,
            'earned_points' => $earnedPoints,
            'score_percentage' => round($score, 2),
            'passing_score' => $passingScore,
            'passed' => $passed,
            'grade' => $this->calculateGrade($score),
        ];
    }

    /**
     * Get detailed exam results
     */
    public function getExamResults(FormSession $session): array
    {
        $form = $session->form;
        $settings = $form->settings ?? [];
        $examMode = $settings['exam_mode'] ?? [];
        $showScoreAfter = $examMode['show_score_after'] ?? true;

        $results = [
            'session_id' => $session->id,
            'status' => $session->status,
            'started_at' => $session->started_at,
            'submitted_at' => $session->submitted_at,
            'time_spent_seconds' => $session->time_spent_seconds,
            'time_spent_formatted' => $this->formatTime($session->time_spent_seconds),
            'violations_count' => $session->violations()->count(),
        ];

        if ($showScoreAfter && $session->status === 'submitted') {
            $scoreData = $this->calculateScore($session);
            $results = array_merge($results, $scoreData);

            // Add question breakdown
            $results['questions'] = $session->responses()->with('question.options')->get()->map(function ($response) {
                $question = $response->question;
                return [
                    'question_id' => $question->id,
                    'content' => $question->content,
                    'type' => $question->type,
                    'your_answer' => $response->answer,
                    'is_correct' => $response->is_correct,
                    'points_possible' => $question->points,
                    'points_earned' => $response->points_earned,
                    'explanation' => $response->is_correct === false ? $question->explanation : null,
                ];
            });
        }

        return $results;
    }

    /**
     * Check anti-cheat rules
     */
    public function checkAntiCheatRules(FormSession $session): array
    {
        $form = $session->form;
        $settings = $form->settings ?? [];
        $antiCheat = $settings['exam_mode']['anti_cheat'] ?? [];

        $violationCount = $session->violations()->count();
        $maxViolations = $antiCheat['max_violations'] ?? 3;

        return [
            'violations' => $violationCount,
            'max_violations' => $maxViolations,
            'should_terminate' => $violationCount >= $maxViolations,
            'warning_threshold' => $maxViolations - 1,
            'is_warning' => $violationCount === ($maxViolations - 1),
            'rules' => [
                'fullscreen_required' => $antiCheat['fullscreen_required'] ?? false,
                'block_copy_paste' => $antiCheat['block_copy_paste'] ?? false,
                'detect_tab_switch' => $antiCheat['detect_tab_switch'] ?? false,
            ],
        ];
    }

    private function formatQuestionForRespondent(Question $question): array
    {
        return [
            'id' => $question->id,
            'type' => $question->type,
            'content' => $question->content,
            'description' => $question->description,
            'media' => $question->media,
            'validation' => $question->validation,
            'points' => $question->points,
            'options' => $question->options->map(fn($o) => [
                'id' => $o->id,
                'content' => $o->content,
            ])->values(),
        ];
    }

    private function calculateGrade(float $score): string
    {
        return match (true) {
            $score >= 90 => 'A',
            $score >= 80 => 'B',
            $score >= 70 => 'C',
            $score >= 60 => 'D',
            default => 'F',
        };
    }

    private function formatTime(?int $seconds): string
    {
        if (!$seconds) return '0:00';
        
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        
        return sprintf('%d:%02d', $minutes, $secs);
    }
}
