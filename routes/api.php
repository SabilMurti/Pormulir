<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PublicFormController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ResponseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::prefix('auth')->group(function () {
    Route::get('google', [AuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // User Lookup
    Route::post('users/lookup', [UserController::class, 'lookup']);

    // Workspaces
    Route::apiResource('workspaces', WorkspaceController::class);
    Route::post('workspaces/{workspace}/invite', [WorkspaceController::class, 'invite']);

    // Forms (nested under workspaces for creation, standalone for other operations)
    Route::get('workspaces/{workspace}/forms', [FormController::class, 'index']);
    Route::post('workspaces/{workspace}/forms', [FormController::class, 'store']);
    
    // Standalone Forms Routes (NEW)
    Route::get('forms', [FormController::class, 'listAll']);
    Route::post('forms', [FormController::class, 'storeStandalone']);

    Route::apiResource('forms', FormController::class)->except(['index', 'store']);
    Route::post('forms/{form}/duplicate', [FormController::class, 'duplicate']);
    Route::put('forms/{form}/publish', [FormController::class, 'publish']);
    Route::put('forms/{form}/close', [FormController::class, 'close']);

    // Questions
    Route::post('forms/{form}/questions', [QuestionController::class, 'store']);
    Route::put('questions/{question}', [QuestionController::class, 'update']);
    Route::delete('questions/{question}', [QuestionController::class, 'destroy']);
    Route::post('forms/{form}/questions/reorder', [QuestionController::class, 'reorder']);

    // Responses
    Route::get('forms/{form}/responses', [ResponseController::class, 'index']);
    Route::delete('forms/{form}/responses', [ResponseController::class, 'destroyAll']);
    Route::get('forms/{form}/responses/export', [ResponseController::class, 'export']);
    Route::get('forms/{form}/responses/{session}', [ResponseController::class, 'show']);
    Route::delete('forms/{form}/responses/{session}', [ResponseController::class, 'destroy']);
    Route::get('forms/{form}/summary', [ResponseController::class, 'summary']);

    // AI Generation
    Route::prefix('ai')->group(function () {
        Route::post('generate', [AIController::class, 'generate']);
        Route::post('generate-from-file', [AIController::class, 'generateFromFile']);
        Route::post('improve', [AIController::class, 'improve']);
        Route::post('forms/{form}/add-questions', [AIController::class, 'addToForm']);
        Route::get('usage', [AIController::class, 'usage']);
    });

    // Media Upload
    Route::prefix('media')->group(function () {
        Route::get('/', [MediaController::class, 'index']);
        Route::post('upload/image', [MediaController::class, 'uploadImage']);
        Route::post('upload/document', [MediaController::class, 'uploadDocument']);
        Route::post('upload/image-url', [MediaController::class, 'uploadImageUrl']);
        Route::post('video-embed', [MediaController::class, 'addVideoEmbed']);
        Route::delete('{id}', [MediaController::class, 'destroy']);
    });
});

// Public Form Routes
Route::prefix('f')->group(function () {
    Route::get('{slug}', [PublicFormController::class, 'show']);
    Route::post('{slug}/start', [PublicFormController::class, 'start']);
    Route::post('{slug}/submit', [PublicFormController::class, 'submit']);
    Route::post('{slug}/submit-direct', [PublicFormController::class, 'submitDirect']);
    Route::post('{slug}/violation', [PublicFormController::class, 'violation']);
    Route::get('{slug}/results', [PublicFormController::class, 'results']);
});
