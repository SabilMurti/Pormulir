<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Services\GoogleSheetsService;
use Illuminate\Http\Request;

class SheetsController extends Controller
{
    protected GoogleSheetsService $sheetsService;

    public function __construct(GoogleSheetsService $sheetsService)
    {
        $this->sheetsService = $sheetsService;
    }

    /**
     * Check if user has Sheets authorization
     */
    public function checkAuth(Request $request)
    {
        $user = $request->user();

        if (!$user->google_token) {
            return response()->json([
                'authorized' => false,
                'auth_url' => $this->sheetsService->getAuthUrl(),
                'message' => 'Perlu otorisasi Google Sheets'
            ]);
        }

        $hasValidToken = $this->sheetsService->hasValidToken($user);

        return response()->json([
            'authorized' => $hasValidToken,
            'auth_url' => $hasValidToken ? null : $this->sheetsService->getAuthUrl(),
        ]);
    }

    /**
     * Create a new spreadsheet and link it to the form
     */
    public function create(Request $request, Form $form)
    {
        $user = $request->user();

        // Verify ownership
        // Verify ownership
        if ($form->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if already linked
        if ($form->spreadsheet_id) {
            return response()->json([
                'message' => 'Form sudah terhubung ke spreadsheet',
                'spreadsheet_id' => $form->spreadsheet_id,
                'spreadsheet_url' => $form->spreadsheet_url,
            ], 400);
        }

        // Check token
        if (!$this->sheetsService->hasValidToken($user)) {
            return response()->json([
                'message' => 'Perlu otorisasi Google Sheets',
                'auth_url' => $this->sheetsService->getAuthUrl(),
            ], 401);
        }

        try {
            $this->sheetsService->setAccessToken($user);
            $result = $this->sheetsService->createSpreadsheet($form);

            // Update form with spreadsheet info
            $form->update([
                'spreadsheet_id' => $result['spreadsheet_id'],
                'spreadsheet_url' => $result['spreadsheet_url'],
            ]);

            // Sync existing responses
            $syncedCount = 0;
            if ($form->sessions()->count() > 0) {
                $syncedCount = $this->sheetsService->syncAllResponses($form);
            }

            return response()->json([
                'message' => 'Spreadsheet berhasil dibuat',
                'spreadsheet_id' => $result['spreadsheet_id'],
                'spreadsheet_url' => $result['spreadsheet_url'],
                'synced_responses' => $syncedCount,
            ]);

        } catch (\Exception $e) {
            \Log::error('Sheets API Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat spreadsheet: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync all responses to existing spreadsheet
     */
    public function sync(Request $request, Form $form)
    {
        $user = $request->user();

        if ($form->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$form->spreadsheet_id) {
            return response()->json([
                'message' => 'Form belum terhubung ke spreadsheet',
            ], 400);
        }

        if (!$this->sheetsService->hasValidToken($user)) {
            return response()->json([
                'message' => 'Perlu otorisasi Google Sheets',
                'auth_url' => $this->sheetsService->getAuthUrl(),
            ], 401);
        }

        try {
            $this->sheetsService->setAccessToken($user);
            $syncedCount = $this->sheetsService->syncAllResponses($form);

            return response()->json([
                'message' => "Berhasil sinkronisasi {$syncedCount} respons",
                'synced_responses' => $syncedCount,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal sinkronisasi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unlink spreadsheet from form
     */
    public function unlink(Request $request, Form $form)
    {
        $user = $request->user();

        if ($form->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $form->update([
            'spreadsheet_id' => null,
            'spreadsheet_url' => null,
        ]);

        return response()->json([
            'message' => 'Spreadsheet berhasil di-unlink dari form',
        ]);
    }

    /**
     * Get spreadsheet info for a form
     */
    public function status(Request $request, Form $form)
    {
        $user = $request->user();

        if ($form->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'linked' => !empty($form->spreadsheet_id),
            'spreadsheet_id' => $form->spreadsheet_id,
            'spreadsheet_url' => $form->spreadsheet_url,
        ]);
    }
}
