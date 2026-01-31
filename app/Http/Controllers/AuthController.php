<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file'
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::updateOrCreate(
                ['google_id' => $googleUser->getId()],
                [
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'google_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken,
                ]
            );

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Return HTML that sends token via postMessage to parent window
            return $this->postMessageResponse([
                'type' => 'oauth-success',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->postMessageResponse([
                'type' => 'oauth-error',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Return HTML page that sends data via postMessage to opener window
     */
    private function postMessageResponse(array $data)
    {
        $json = json_encode($data);
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        
        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <title>Authentication</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f8fafc;
            color: #334155;
        }
        .loader {
            text-align: center;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Completing authentication...</p>
    </div>
    <script>
        (function() {
            const data = {$json};
            const frontendUrl = '{$frontendUrl}';
            
            // Send to opener window (popup mode)
            if (window.opener) {
                window.opener.postMessage(data, '*');
                window.close();
            } 
            // Fallback: send to parent (iframe mode, less common)
            else if (window.parent !== window) {
                window.parent.postMessage(data, '*');
            }
            // No opener - redirect to frontend with token in hash
            else {
                if (data.type === 'oauth-success') {
                    window.location.href = frontendUrl + '/login/callback#token=' + data.token;
                } else {
                    window.location.href = frontendUrl + '/login#error=' + encodeURIComponent(data.error);
                }
            }
        })();
    </script>
</body>
</html>
HTML;

        return response($html)->header('Content-Type', 'text/html');
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
