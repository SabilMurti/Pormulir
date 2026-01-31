<?php

namespace App\Exports;

use App\Models\Form;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ResponsesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private $questions;

    public function __construct(
        private Form $form
    ) {
        // Eager load questions with options to prevent N+1 queries during export
        $this->questions = $this->form->questions()
            ->with('options')
            ->orderBy('sort_order')
            ->get();
    }

    public function collection()
    {
        return $this->form->sessions()
            ->where('status', 'submitted')
            ->with(['responses']) // We don't need to load questions here since we process them separately
            ->orderBy('submitted_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        $headers = [
            'Respondent Name',
            'Respondent Email',
            'Submitted At',
            'Time Spent',
            'Score (%)', // Clarified unit
            'Status',
        ];

        foreach ($this->questions as $question) {
            // Clean HTML tags for Excel header
            $headers[] = $this->cleanContent($question->content);
        }

        return $headers;
    }

    public function map($session): array
    {
        $row = [
            $session->respondent_name ?? 'Anonymous',
            $session->respondent_email ?? '-',
            $session->submitted_at?->format('Y-m-d H:i:s'),
            $this->formatTime($session->time_spent_seconds),
            $session->score !== null ? round($session->score, 2) : '-', // Removed % symbol to keep it numeric
            ucfirst($session->status),
        ];

        // Map responses for O(1) access
        $responseMap = $session->responses->keyBy('question_id');
        
        foreach ($this->questions as $question) {
            $response = $responseMap[$question->id] ?? null;
            $answer = $response?->answer;
            
            $formattedAnswer = '-';

            if ($answer) {
                if ($question->hasOptions()) {
                    // Try to resolve option content from ID(s)
                    // The answer could be an ID (string/int) or array of IDs
                    $answerIds = is_array($answer) ? $answer : [$answer];
                    
                    $optionContents = $question->options
                        ->whereIn('id', $answerIds)
                        ->pluck('content')
                        ->toArray();

                    // If we found matching options, use their content. 
                    // Otherwise unnecessary fallback to original answer (if it was text legacy)
                    if (!empty($optionContents)) {
                        $formattedAnswer = implode(', ', array_map([$this, 'cleanContent'], $optionContents));
                    } else {
                        // Fallback: If no ID match found, maybe it's legacy text content
                        $formattedAnswer = is_array($answer) 
                            ? implode(', ', array_map([$this, 'cleanContent'], $answer))
                            : $this->cleanContent($answer);
                    }
                } else {
                    // Free text answer
                    $formattedAnswer = $this->cleanContent($answer);
                }
            }
            
            $row[] = $formattedAnswer;
        }

        return $row;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'],
                ],
                'alignment' => ['vertical' => 'center'],
            ],
        ];
    }

    public function title(): string
    {
        return substr($this->cleanContent($this->form->title), 0, 30); // Excel sheet name limit
    }

    private function formatTime(?int $seconds): string
    {
        if (!$seconds) return '0:00';
        
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        
        return sprintf('%d:%02d', $minutes, $secs);
    }

    private function cleanContent(?string $content): string
    {
        if (!$content) return '';
        
        // Decode HTML entities (e.g. &nbsp;, &gt;)
        $decoded = html_entity_decode($content);
        
        // Replace <br> and <p> with newlines for better cell formatting
        $withNewlines = preg_replace('/<br\s*\/?>/i', "\n", $decoded);
        $withNewlines = preg_replace('/<\/p>\s*<p>/i', "\n\n", $withNewlines);
        
        // Strip remaining tags
        return trim(strip_tags($withNewlines));
    }
}
