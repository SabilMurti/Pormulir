<?php

namespace App\Services;

use App\Models\AiUsageLog;
use App\Models\User;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Collection;

class GeminiService
{
    private const MODEL = 'gemini-2.0-flash';

    public function generateQuestions(
        User $user,
        string $topic,
        int $count = 5,
        string $type = 'multiple_choice',
        ?string $difficulty = 'medium',
        ?string $language = 'id'
    ): array {
        $prompt = $this->buildPrompt($topic, $count, $type, $difficulty, $language);

        $result = Gemini::generativeModel(model: self::MODEL)
            ->generateContent($prompt);

        $response = $result->text();
        $questions = $this->parseQuestionsFromResponse($response, $type);

        // Log usage
        $this->logUsage($user, 'generate_questions', $questions);

        return $questions;
    }

    public function generateFromFile(
        User $user,
        string $content,
        int $count = 5,
        string $type = 'multiple_choice',
        ?string $language = 'id'
    ): array {
        $prompt = $this->buildFilePrompt($content, $count, $type, $language);

        $result = Gemini::generativeModel(model: self::MODEL)
            ->generateContent($prompt);

        $response = $result->text();
        $questions = $this->parseQuestionsFromResponse($response, $type);

        // Log usage
        $this->logUsage($user, 'generate_from_file', $questions);

        return $questions;
    }

    public function improveQuestion(
        User $user,
        string $questionContent,
        string $instruction
    ): array {
        $prompt = <<<PROMPT
Kamu adalah asisten pembuat soal profesional.

Soal saat ini:
{$questionContent}

Instruksi perbaikan:
{$instruction}

Berikan hasil perbaikan soal dalam format JSON:
{
  "content": "pertanyaan yang sudah diperbaiki",
  "description": "penjelasan singkat (opsional)",
  "options": [
    {"content": "pilihan A", "is_correct": false},
    {"content": "pilihan B", "is_correct": true}
  ],
  "explanation": "penjelasan jawaban benar"
}

Hanya kembalikan JSON, tanpa penjelasan tambahan.
PROMPT;

        $result = Gemini::generativeModel(model: self::MODEL)
            ->generateContent($prompt);

        $response = $result->text();
        $question = $this->parseJsonFromResponse($response);

        // Log usage
        $this->logUsage($user, 'improve_question', [$question]);

        return $question;
    }

    private function buildPrompt(
        string $topic,
        int $count,
        string $type,
        string $difficulty,
        string $language
    ): string {
        $lang = $language === 'id' ? 'Bahasa Indonesia' : 'English';
        $typeDesc = $this->getTypeDescription($type);
        
        return <<<PROMPT
Kamu adalah asisten pembuat soal profesional. Buatlah {$count} soal {$typeDesc} tentang topik: "{$topic}"

Persyaratan:
- Tingkat kesulitan: {$difficulty}
- Bahasa: {$lang}
- Untuk pilihan ganda: 4 opsi (A, B, C, D), tandai yang benar
- Untuk checkbox: bisa lebih dari 1 jawaban benar
- Untuk short_text/long_text: berikan contoh jawaban benar

Format output JSON array:
[
  {
    "type": "{$type}",
    "content": "pertanyaan",
    "description": "penjelasan tambahan (opsional)",
    "points": 10,
    "correct_answer": "jawaban benar atau array ID opsi",
    "explanation": "penjelasan mengapa jawaban ini benar",
    "options": [
      {"content": "opsi A", "is_correct": false},
      {"content": "opsi B", "is_correct": true},
      {"content": "opsi C", "is_correct": false},
      {"content": "opsi D", "is_correct": false}
    ]
  }
]

Hanya kembalikan JSON array, tanpa penjelasan tambahan.
PROMPT;
    }

    private function buildFilePrompt(
        string $content,
        int $count,
        string $type,
        string $language
    ): string {
        $lang = $language === 'id' ? 'Bahasa Indonesia' : 'English';
        $typeDesc = $this->getTypeDescription($type);

        // Truncate content if too long
        $maxLength = 10000;
        if (strlen($content) > $maxLength) {
            $content = substr($content, 0, $maxLength) . "\n[...konten dipotong...]";
        }

        return <<<PROMPT
Kamu adalah asisten pembuat soal profesional. 
Berdasarkan materi berikut, buatlah {$count} soal {$typeDesc}.

=== MATERI ===
{$content}
=== END MATERI ===

Persyaratan:
- Bahasa: {$lang}
- Soal harus berdasarkan materi yang diberikan
- Untuk pilihan ganda: 4 opsi, tandai yang benar
- Beri penjelasan untuk setiap jawaban

Format output JSON array:
[
  {
    "type": "{$type}",
    "content": "pertanyaan",
    "description": null,
    "points": 10,
    "correct_answer": "jawaban benar",
    "explanation": "penjelasan",
    "options": [
      {"content": "opsi", "is_correct": true/false}
    ]
  }
]

Hanya kembalikan JSON array, tanpa penjelasan tambahan.
PROMPT;
    }

    private function getTypeDescription(string $type): string
    {
        return match ($type) {
            'multiple_choice' => 'pilihan ganda (single answer)',
            'checkboxes' => 'pilihan ganda (multiple answers)',
            'short_text' => 'jawaban singkat',
            'long_text' => 'essay',
            default => $type,
        };
    }

    private function parseQuestionsFromResponse(string $response, string $type): array
    {
        $json = $this->parseJsonFromResponse($response);
        
        if (!is_array($json)) {
            return [];
        }

        // If single object, wrap in array
        if (isset($json['content'])) {
            $json = [$json];
        }

        // Validate and clean each question
        return array_map(function ($q) use ($type) {
            return [
                'type' => $q['type'] ?? $type,
                'content' => $q['content'] ?? '',
                'description' => $q['description'] ?? null,
                'points' => $q['points'] ?? 10,
                'correct_answer' => $q['correct_answer'] ?? null,
                'explanation' => $q['explanation'] ?? null,
                'options' => $q['options'] ?? [],
            ];
        }, $json);
    }

    private function parseJsonFromResponse(string $response): array
    {
        // Remove markdown code blocks if present
        $response = preg_replace('/```json\s*/', '', $response);
        $response = preg_replace('/```\s*/', '', $response);
        $response = trim($response);

        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Try to extract JSON from response
            if (preg_match('/\[[\s\S]*\]/', $response, $matches)) {
                $decoded = json_decode($matches[0], true);
            } elseif (preg_match('/\{[\s\S]*\}/', $response, $matches)) {
                $decoded = json_decode($matches[0], true);
            }
        }

        return $decoded ?? [];
    }

    private function logUsage(User $user, string $action, array $questions): void
    {
        AiUsageLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'tokens_used' => 0, // Gemini doesn't expose token count easily
            'questions_generated' => count($questions),
        ]);
    }
}
