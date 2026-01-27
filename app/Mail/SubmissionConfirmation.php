<?php

namespace App\Mail;

use App\Models\Form;
use App\Models\FormSession;
use App\Services\ExamService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubmissionConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Form $form,
        public FormSession $session
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your submission: {$this->form->title}",
        );
    }

    public function content(): Content
    {
        $settings = $this->form->settings ?? [];
        $examMode = $settings['exam_mode'] ?? [];
        $showScore = $examMode['show_score_after'] ?? false;

        return new Content(
            markdown: 'emails.submission-confirmation',
            with: [
                'formTitle' => $this->form->title,
                'respondentName' => $this->session->respondent_name ?? 'there',
                'submittedAt' => $this->session->submitted_at->format('M d, Y H:i'),
                'timeSpent' => $this->formatTime($this->session->time_spent_seconds),
                'score' => $showScore && $this->session->score !== null 
                    ? round($this->session->score, 2) . '%' 
                    : null,
                'passed' => $showScore && $this->session->score !== null 
                    ? $this->session->score >= ($examMode['passing_score'] ?? 0)
                    : null,
                'confirmationMessage' => $settings['general']['confirmation_message'] ?? 'Thank you for your submission!',
            ],
        );
    }

    private function formatTime(?int $seconds): string
    {
        if (!$seconds) return '0:00';
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        return sprintf('%d:%02d', $minutes, $secs);
    }
}
