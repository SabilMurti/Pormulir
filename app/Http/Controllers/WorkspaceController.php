<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Requests\UpdateWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workspaces = $request->user()
            ->workspaces()
            ->with('owner')
            ->withCount('forms')
            ->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        $workspace = Workspace::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . Str::random(6),
            'owner_id' => $request->user()->id,
            'settings' => $request->settings ?? [],
        ]);

        // Add owner as member
        $workspace->members()->attach($request->user()->id, ['role' => 'owner']);

        return new WorkspaceResource($workspace->load('owner'));
    }

    public function show(Workspace $workspace): WorkspaceResource
    {
        $this->authorize('view', $workspace);

        return new WorkspaceResource(
            $workspace->load(['owner', 'members'])
                ->loadCount('forms')
        );
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): WorkspaceResource
    {
        $this->authorize('update', $workspace);

        $workspace->update($request->validated());

        return new WorkspaceResource($workspace->load('owner'));
    }

    public function destroy(Workspace $workspace): JsonResponse
    {
        $this->authorize('delete', $workspace);

        $workspace->delete();

        return response()->json(['message' => 'Workspace deleted successfully']);
    }

    public function invite(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('update', $workspace);

        $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:editor,viewer',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found. They must sign up first.',
            ], 404);
        }

        if ($workspace->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'User is already a member of this workspace.',
            ], 409);
        }

        $workspace->members()->attach($user->id, ['role' => $request->role]);

        return response()->json([
            'message' => 'User invited successfully.',
        ]);
    }
}
