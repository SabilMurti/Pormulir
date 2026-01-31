<?php

namespace App\Services;

use Google\Client;
use Google\Service\Sheets;
use Google\Service\Drive;
use App\Models\Form;
use App\Models\User;

class GoogleSheetsService
{
    protected Client $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect'));
        $this->client->addScope(Sheets::SPREADSHEETS);
        $this->client->addScope(Drive::DRIVE_FILE);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('consent');
    }

    /**
     * Set the access token for the authenticated user
     */
    public function setAccessToken(User $user): self
    {
        $token = [
            'access_token' => $user->google_token,
            'refresh_token' => $user->google_refresh_token,
            'expires_in' => 3600,
        ];

        $this->client->setAccessToken($token);

        // Refresh token if expired
        if ($this->client->isAccessTokenExpired()) {
            if ($this->client->getRefreshToken()) {
                $newToken = $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
                
                // Update user's token
                $user->update([
                    'google_token' => $newToken['access_token'],
                    'google_refresh_token' => $newToken['refresh_token'] ?? $user->google_refresh_token,
                ]);
            }
        }

        return $this;
    }

    /**
     * Create a new spreadsheet for form responses
     */
    public function createSpreadsheet(Form $form): array
    {
        $sheetsService = new Sheets($this->client);

        // Clean form title from HTML
        $cleanTitle = strip_tags($form->title);

        $spreadsheet = new Sheets\Spreadsheet([
            'properties' => [
                'title' => "(Respons) {$cleanTitle}"
            ]
        ]);

        $spreadsheet = $sheetsService->spreadsheets->create($spreadsheet);

        $spreadsheetId = $spreadsheet->getSpreadsheetId();
        $spreadsheetUrl = $spreadsheet->getSpreadsheetUrl();

        // Initialize headers
        $this->initializeHeaders($spreadsheetId, $form);

        return [
            'spreadsheet_id' => $spreadsheetId,
            'spreadsheet_url' => $spreadsheetUrl,
        ];
    }

    /**
     * Initialize spreadsheet with headers based on form questions
     */
    protected function initializeHeaders(string $spreadsheetId, Form $form): void
    {
        $sheetsService = new Sheets($this->client);

        // Build headers from form questions
        $headers = ['Timestamp', 'Nama Responden', 'Email'];
        
        $questions = $form->questions()->orderBy('sort_order')->get();
        foreach ($questions as $question) {
            if ($question->type !== 'section') {
                $headers[] = strip_tags($question->content);
            }
        }

        $range = 'Sheet1!A1';
        $body = new Sheets\ValueRange([
            'values' => [$headers]
        ]);

        $sheetsService->spreadsheets_values->update(
            $spreadsheetId,
            $range,
            $body,
            ['valueInputOption' => 'RAW']
        );

        // Format header row (bold, background color)
        $this->formatHeaderRow($spreadsheetId, count($headers));
    }

    /**
     * Format the header row with styling
     */
    protected function formatHeaderRow(string $spreadsheetId, int $columnCount): void
    {
        $sheetsService = new Sheets($this->client);

        $requests = [
            // 1. Format Header (Purple bg, white text, bold, wrap text, center align)
            new Sheets\Request([
                'repeatCell' => [
                    'range' => [
                        'sheetId' => 0,
                        'startRowIndex' => 0,
                        'endRowIndex' => 1,
                        'startColumnIndex' => 0,
                        'endColumnIndex' => $columnCount,
                    ],
                    'cell' => [
                        'userEnteredFormat' => [
                            'backgroundColor' => [ // Google Forms Purple
                                'red' => 0.40,   // 103
                                'green' => 0.23, // 58
                                'blue' => 0.72,  // 183
                            ],
                            'textFormat' => [
                                'bold' => true,
                                'foregroundColor' => ['red' => 1, 'green' => 1, 'blue' => 1],
                                'fontSize' => 10,
                                'fontFamily' => 'Roboto',
                            ],
                            'verticalAlignment' => 'MIDDLE',
                            'horizontalAlignment' => 'LEFT',
                            'wrapStrategy' => 'WRAP',
                            'padding' => ['top' => 5, 'bottom' => 5, 'left' => 5, 'right' => 5],
                        ],
                    ],
                    'fields' => 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment,wrapStrategy,padding)',
                ],
            ]),
            
            // 2. Format Data Rows (Wrap text, Align Top)
            new Sheets\Request([
                'repeatCell' => [
                    'range' => [
                        'sheetId' => 0,
                        'startRowIndex' => 1,
                    ],
                    'cell' => [
                        'userEnteredFormat' => [
                            'wrapStrategy' => 'WRAP',
                            'verticalAlignment' => 'TOP',
                        ],
                    ],
                    'fields' => 'userEnteredFormat(wrapStrategy,verticalAlignment)',
                ],
            ]),

            // 3. Freeze Header & Rename Sheet
            new Sheets\Request([
                'updateSheetProperties' => [
                    'properties' => [
                        'sheetId' => 0,
                        'title' => 'Form Responses 1',
                        'gridProperties' => [
                            'frozenRowCount' => 1,
                        ],
                    ],
                    'fields' => 'title,gridProperties.frozenRowCount',
                ],
            ]),

            // 4. Set Basic Filter
            new Sheets\Request([
                'setBasicFilter' => [
                    'filter' => [
                        'range' => [
                            'sheetId' => 0,
                            'startRowIndex' => 0,
                            'startColumnIndex' => 0,
                            'endColumnIndex' => $columnCount,
                        ]
                    ]
                ]
            ]),

            // 5. Set Timestamp Width (180px)
            new Sheets\Request([
                'updateDimensionProperties' => [
                    'range' => [
                        'sheetId' => 0,
                        'dimension' => 'COLUMNS',
                        'startIndex' => 0,
                        'endIndex' => 1,
                    ],
                    'properties' => ['pixelSize' => 170],
                    'fields' => 'pixelSize',
                ]
            ]),

            // 6. Set Other Columns Width (250px default)
            new Sheets\Request([
                'updateDimensionProperties' => [
                    'range' => [
                        'sheetId' => 0,
                        'dimension' => 'COLUMNS',
                        'startIndex' => 1,
                        'endIndex' => $columnCount,
                    ],
                    'properties' => ['pixelSize' => 250],
                    'fields' => 'pixelSize',
                ]
            ]),
        ];

        $batchUpdateRequest = new Sheets\BatchUpdateSpreadsheetRequest([
            'requests' => $requests,
        ]);

        $sheetsService->spreadsheets->batchUpdate($spreadsheetId, $batchUpdateRequest);
    }

    /**
     * Append a response row to the spreadsheet
     */
    public function appendResponse(Form $form, array $responseData): void
    {
        if (!$form->spreadsheet_id) {
            return;
        }

        $sheetsService = new Sheets($this->client);

        // Build row data
        $row = [
            $responseData['submitted_at'] ?? now()->toDateTimeString(),
            $responseData['respondent_name'] ?? 'Anonymous',
            $responseData['respondent_email'] ?? '',
        ];

        // Add answers in order of questions
        $questions = $form->questions()->orderBy('sort_order')->get();
        $answers = collect($responseData['answers'] ?? []);

        foreach ($questions as $question) {
            if ($question->type !== 'section') {
                $answer = $answers->firstWhere('question_id', $question->id);
                $row[] = $this->formatAnswer($answer);
            }
        }

        $range = 'Sheet1!A:A';
        $body = new Sheets\ValueRange([
            'values' => [$row]
        ]);

        $sheetsService->spreadsheets_values->append(
            $form->spreadsheet_id,
            $range,
            $body,
            ['valueInputOption' => 'USER_ENTERED', 'insertDataOption' => 'INSERT_ROWS']
        );
    }

    /**
     * Format answer for spreadsheet cell
     */
    protected function formatAnswer($answer): string
    {
        if (!$answer) {
            return '';
        }

        $value = $answer['answer'] ?? '';

        // Handle array answers (checkboxes, etc.)
        if (is_array($value)) {
            return implode(', ', $value);
        }

        // Strip HTML
        return strip_tags((string) $value);
    }

    /**
     * Sync all existing responses to spreadsheet
     */
    public function syncAllResponses(Form $form): int
    {
        if (!$form->spreadsheet_id) {
            throw new \Exception('Form has no linked spreadsheet');
        }

        $sheetsService = new Sheets($this->client);

        // Clear existing data (except headers)
        $clearRequest = new Sheets\ClearValuesRequest();
        $sheetsService->spreadsheets_values->clear(
            $form->spreadsheet_id,
            'Sheet1!A2:Z',
            $clearRequest
        );

        // Get all sessions with answers
        $sessions = $form->sessions()
            ->with('answers.question')
            ->orderBy('submitted_at')
            ->get();

        if ($sessions->isEmpty()) {
            return 0;
        }

        // Build rows
        $rows = [];
        $questions = $form->questions()->orderBy('sort_order')->get();

        foreach ($sessions as $session) {
            $row = [
                $session->submitted_at?->toDateTimeString() ?? '',
                $session->respondent_name ?? 'Anonymous',
                $session->respondent_email ?? '',
            ];

            foreach ($questions as $question) {
                if ($question->type !== 'section') {
                    $answer = $session->answers->firstWhere('question_id', $question->id);
                    $row[] = $answer ? $this->formatAnswer(['answer' => $answer->answer]) : '';
                }
            }

            $rows[] = $row;
        }

        // Append all rows
        $range = 'Sheet1!A2';
        $body = new Sheets\ValueRange([
            'values' => $rows
        ]);

        $sheetsService->spreadsheets_values->update(
            $form->spreadsheet_id,
            $range,
            $body,
            ['valueInputOption' => 'USER_ENTERED']
        );

        return count($rows);
    }

    /**
     * Check if user has valid Google token with Sheets scope
     */
    public function hasValidToken(User $user): bool
    {
        if (!$user->google_token) {
            return false;
        }

        try {
            $this->setAccessToken($user);
            return !$this->client->isAccessTokenExpired();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get authorization URL for Sheets permission
     */
    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }
}
