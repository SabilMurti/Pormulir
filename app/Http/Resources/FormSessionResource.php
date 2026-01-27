<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'respondent_name' => $this->respondent_name,
            'respondent_email' => $this->respondent_email,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'time_spent_seconds' => $this->time_spent_seconds,
            'score' => $this->score,
            'ip_address' => $this->ip_address,
            'user' => new UserResource($this->whenLoaded('user')),
            'responses' => ResponseResource::collection($this->whenLoaded('responses')),
            'violations' => $this->whenLoaded('violations', fn() => $this->violations->map(fn($v) => [
                'event_type' => $v->event_type,
                'occurred_at' => $v->occurred_at,
            ])),
            'violations_count' => $this->when($this->violations !== null, fn() => $this->violations->count()),
        ];
    }
}
