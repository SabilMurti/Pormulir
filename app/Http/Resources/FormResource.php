<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'slug' => $this->slug,
            'status' => $this->status,
            'settings' => $this->settings,
            'theme' => $this->theme,
            'max_responses' => $this->max_responses,
            'access_type' => $this->access_type ?? 'public',
            'allowed_emails' => $this->allowed_emails,
            'questions_count' => $this->whenCounted('questions'),
            'sessions_count' => $this->whenCounted('sessions'),
            'workspace' => new WorkspaceResource($this->whenLoaded('workspace')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'questions' => QuestionResource::collection($this->whenLoaded('questions')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
