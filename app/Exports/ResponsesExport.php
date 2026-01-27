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
    public function __construct(
        private Form $form
    ) {}

    public function collection()
    {
        return $this->form->sessions()
            ->where('status', 'submitted')
            ->with('responses')
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
            'Score',
            'Status',
        ];

        foreach ($this->form->questions()->orderBy('sort_order')->get() as $question) {
            $headers[] = $question->content;
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
            $session->score !== null ? round($session->score, 2) . '%' : '-',
            ucfirst($session->status),
        ];

        $responseMap = $session->responses->keyBy('question_id');
        
        foreach ($this->form->questions()->orderBy('sort_order')->get() as $question) {
            $response = $responseMap[$question->id] ?? null;
            $answer = $response?->answer;
            
            if (is_array($answer)) {
                // For checkbox/multiple answers, get the option contents
                if ($question->hasOptions()) {
                    $optionIds = $answer;
                    $options = $question->options()->whereIn('id', $optionIds)->pluck('content');
                    $answer = $options->implode(', ');
                } else {
                    $answer = implode(', ', $answer);
                }
            } elseif ($question->hasOptions() && $answer) {
                // For single choice, get the option content
                $option = $question->options()->find($answer);
                $answer = $option?->content ?? $answer;
            }
            
            $row[] = $answer ?? '-';
        }

        return $row;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F46E5'],
                ],
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Responses';
    }

    private function formatTime(?int $seconds): string
    {
        if (!$seconds) return '0:00';
        
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        
        return sprintf('%d:%02d', $minutes, $secs);
    }
}
