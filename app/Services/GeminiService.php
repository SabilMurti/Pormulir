<?php

namespace App\Services;

use App\Models\AiUsageLog;
use App\Models\User;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Collection;

class GeminiService
{
    private const MODEL = 'gemini-2.5-flash';

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

PENTING - Gunakan HTML formatting untuk membuat soal lebih menarik dan terstruktur:

1. TABEL (Sangat Direkomendasikan untuk Data/Perbandingan):
   Gunakan tag HTML table standar. Contoh struktur:
   <table>
     <tr>
       <th>Header 1</th>
       <th>Header 2</th>
     </tr>
     <tr>
       <td>Data 1</td>
       <td>Data 2</td>
     </tr>
   </table>
   - Gunakan tabel untuk: membandingkan dua hal, menampilkan data statistik, atau menyajikan langkah-langkah.

2. LIST & STRUKTUR:
   - Bullet List: <ul><li>Item 1</li><li>Item 2</li></ul>
   - Numbered List: <ol><li>Langkah 1</li><li>Langkah 2</li></ol>
   - Code Block: <pre><code>console.log('Hello');</code></pre> (untuk soal pemrograman)

3. ALIGMENT & STYLE:
   - Rata Tengah: <p style="text-align: center">Teks Tengah</p>
   - Rata Kanan: <p style="text-align: right">Teks Kanan</p>
   - Highlight: <mark>Teks Penting</mark>

4. FORMAT KHUSUS LAINNYA:
   - Matematika: <sup>2</sup> (pangkat), <sub>2</sub> (subskrip)
   - Simbol: ±, ×, ÷, √, ∛, ≠, ≈, ≤, ≥, ∞, π, α, β, θ, ∑
   - Pecahan: ½, ⅓, ⅔, ¼, ¾
- Himpunan: ∈, ∉, ⊂, ∪, ∩, ∅
- Ayat/Hadits: <blockquote><em>teks ayat</em></blockquote>
   - Contoh: <blockquote><em>"Innalillahi wa inna ilaihi raji'un"</em></blockquote> atau <blockquote><em>"إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ"</em></blockquote>

   - Penekanan: <strong>teks tebal</strong>, <em>teks miring</em>, <u>garis bawah</u>, <s>coret</s>

5. MEDIA (Gunakan URL Eksternal, JANGAN minta upload):
   - Image: <img src="URL_VALID_GAMBAR_PUBLIK" alt="Deskripsi"> (Hanya jika Anda memiliki URL gambar yang relevan dan publik. Jangan gunakan placeholder lokal).
   - Video: Jika perlu, berikan link YouTube.

CATATAN: JANGAN gunakan fitur upload file atau meminta user mengupload file. Gunakan format teks rich text di atas semaksimal mungkin.

Berikan hasil perbaikan soal dalam format JSON:
{
  "content": "pertanyaan yang sudah diperbaiki (dengan HTML formatting jika perlu)",
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
        
        $typeDesc = $type === 'mixed' 
            ? 'berbagai tipe (Pilihan Ganda, Essay, Checkbox)' 
            : $this->getTypeDescription($type);

        $jsonTypeField = $type === 'mixed' 
            ? "tipe soal (pilih: multiple_choice, checkboxes, short_text, long_text)"
            : $type;
        
        return <<<PROMPT
Kamu adalah asisten pembuat soal profesional. Buatlah {$count} soal {$typeDesc} tentang topik: "{$topic}"

Persyaratan:
- Tingkat kesulitan: {$difficulty}
- Bahasa: {$lang}
- Jika Mixed: Variasikan tipe soal secara acak.
- Untuk pilihan ganda: 4 opsi (A, B, C, D), tandai yang benar
- Untuk checkbox: bisa lebih dari 1 jawaban benar
- Untuk short_text/long_text: berikan contoh jawaban benar

PENTING - Gunakan HTML formatting untuk konten yang memerlukan format khusus:

1. TABEL & STRUKTUR DATA:
   - Table: Gunakan <table>, <tr>, <th>, <td> untuk menyajikan data terstruktur.
   - List: Gunakan <ul> (bullet) atau <ol> (nomor) untuk daftar.
   - Code: Gunakan <pre><code>...</code></pre> untuk snippet kode.

2. FORMAT TEKS & MATEMATIKA:
   - Style: <strong>Tebal</strong>, <em>Miring</em>, <u>Garis Bawah</u>, <s>Coret</s>, <mark>Highlight</mark>
   - Alignment: <p style="text-align: center|right|justify">Teks</p>
   - Math: <sup>2</sup>, <sub>2</sub>, ±, ×, ÷, √, ∑, ∞, π, α, β, dst.
   - Himpunan: ∈, ∉, ⊂, ∪, ∩, ∅
- Ayat/Hadits: <blockquote><em>teks ayat</em></blockquote>
   - Contoh: <blockquote><em>"Innalillahi wa inna ilaihi raji'un"</em></blockquote> atau <blockquote><em>"إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ"</em></blockquote>

3. KUTIPAN & MEDIA:
   - Quote: <blockquote><em>"Teks Kutipan"</em></blockquote>
   - Image: <img src="URL"> (Hanya jika URL publik tersedia).
   - JANGAN gunakan upload file. Gunakan deskripsi teks atau URL eksternal.

Format output JSON array:
[
  {
    "type": "{$jsonTypeField}",
    "content": "pertanyaan dengan HTML formatting jika diperlukan",
    "description": "penjelasan tambahan (opsional)",
    "points": 10,
    "correct_answer": "jawaban benar atau array ID opsi",
    "explanation": "penjelasan mengapa jawaban ini benar",
    "options": [
      {"content": "a. opsi A", "is_correct": false},
      {"content": "b. opsi B", "is_correct": true},
      {"content": "c. opsi C", "is_correct": false},
      {"content": "d. opsi D", "is_correct": false}
    ]
  }
]

Hanya kembalikan JSON array, tanpa penjelasan tambahan.
PENTING: Untuk soal multiple_choice, konten opsi HARUS diawali dengan huruf label (a., b., c., d.).
PROMPT;
    }

    private function buildFilePrompt(
        string $content,
        int $count,
        string $type,
        string $language
    ): string {
        $lang = $language === 'id' ? 'Bahasa Indonesia' : 'English';
        
        $typeDesc = $type === 'mixed' 
            ? 'berbagai tipe (Pilihan Ganda, Essay, Checkbox)' 
            : $this->getTypeDescription($type);

        $jsonTypeField = $type === 'mixed' 
            ? "tipe soal (pilih: multiple_choice, checkboxes, short_text, long_text)"
            : $type;

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
- Jika Mixed: Variasikan tipe soal.
- Untuk pilihan ganda: 4 opsi, tandai yang benar
- Beri penjelasan untuk setiap jawaban

PENTING - Gunakan STRUKTUR HTML LENGKAP agar soal menarik dan profesional:

1. TABEL (Sangat Berguna untuk Perbandingan/Data):
   <table><tr><th>Header A</th><th>Header B</th></tr><tr><td>Data A</td><td>Data B</td></tr></table>
   Gunakan tabel untuk menyajikan data, perbedaan, atau klasifikasi.

2. FORMAT TEKS & LIST:
   - <strong>Tebal</strong>, <em>Miring</em>, <mark>Highlight</mark>, <u>Underline</u>
   - List: <ul><li>Item</li></ul> atau <ol><li>Langkah</li></ol>
   - Alignment: <p style="text-align: center">Teks Tengah</p>
   - Ayat/Hadits: <blockquote><em>teks ayat</em></blockquote>
   - Contoh: <blockquote><em>"Innalillahi wa inna ilaihi raji'un"</em></blockquote> atau <blockquote><em>"إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ"</em></blockquote>

3. SPECIAL CONTENT:
   - Code: <pre><code>code here</code></pre>
   - Quote: <blockquote><em>"Kutipan"</em></blockquote>
   - Math: <sup>2</sup>, <sub>2</sub>, √, ∑, π, ∞, ±, ×, ÷
   - Simbol: α, β, θ, ≤, ≥, ≠, ≈
   - Himpunan: ∈, ∉, ⊂, ∪, ∩, ∅

Format output JSON array:
[
  {
    "type": "{$jsonTypeField}",
    "content": "pertanyaan dengan HTML formatting jika diperlukan",
    "description": null,
    "points": 10,
    "correct_answer": "jawaban benar",
    "explanation": "penjelasan",
    "options": [
      {"content": "a. opsi", "is_correct": true/false}
    ]
  }
]

Hanya kembalikan JSON array, tanpa penjelasan tambahan.
PENTING: Untuk soal multiple_choice, konten opsi HARUS diawali dengan huruf label (a., b., c., d.).
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
            $questionType = $q['type'] ?? ($type === 'mixed' ? 'short_text' : $type);
            
            // Normalize type - map AI returned types to valid backend types
            $typeMapping = [
                'mixed' => 'multiple_choice',
                'checkbox' => 'checkboxes',
                'essay' => 'long_text',
                'text' => 'short_text',
                'pilihan_ganda' => 'multiple_choice',
                'isian' => 'short_text',
                'uraian' => 'long_text',
                'scale' => 'linear_scale',
            ];
            
            $questionType = strtolower(trim($questionType));
            if (isset($typeMapping[$questionType])) {
                $questionType = $typeMapping[$questionType];
            }
            // Normalize correct_answer to array if it's a string
            $correctAnswer = $q['correct_answer'] ?? null;
            if (is_string($correctAnswer) && !empty($correctAnswer)) {
                $correctAnswer = [$correctAnswer];
            }

            return [
                'type' => $questionType,
                'content' => $q['content'] ?? '',
                'description' => $q['description'] ?? null,
                'points' => $q['points'] ?? 10,
                'correct_answer' => $correctAnswer,
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
