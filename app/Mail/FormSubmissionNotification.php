<?php

namespace App\Mail;

use App\Models\Form;
use App\Models\FormSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FormSubmissionNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Form $form,
        public FormSession $session
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Response: {$this->form->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.form-submission',
            with: [
                'formTitle' => $this->form->title,
                'respondentName' => $this->session->respondent_name ?? 'Anonymous',
                'respondentEmail' => $this->session->respondent_email ?? 'Not provided',
                'submittedAt' => $this->session->submitted_at->format('M d, Y H:i'),
                'timeSpent' => $this->formatTime($this->session->time_spent_seconds),
                'score' => $this->session->score !== null ? round($this->session->score, 2) . '%' : null,
                'formUrl' => config('app.url') . "/forms/{$this->form->id}/responses",
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
