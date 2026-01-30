<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Lookup user by email (single or batch).
     */
    public function lookup(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|string|email',
            'emails' => 'nullable|array',
            'emails.*' => 'email'
        ]);

        if ($request->has('emails')) {
            $users = User::whereIn('email', $request->emails)->get(['name', 'email', 'avatar_url']);
            return response()->json([
                'users' => $users
            ]);
        }
        
        $user = User::where('email', $request->email)->first();
        
        if ($user) {
            return response()->json([
                'found' => true,
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ]
            ]);
        }
        
        return response()->json([
            'found' => false,
            'user' => null
        ]);
    }
}
