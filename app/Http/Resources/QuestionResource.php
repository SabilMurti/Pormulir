<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'content' => $this->content,
            'description' => $this->description,
            'media' => $this->media,
            'validation' => $this->validation,
            'correct_answer' => $this->when(
                $request->user()?->id === $this->form?->created_by,
                $this->correct_answer
            ),
            'explanation' => $this->when(
                $request->user()?->id === $this->form?->created_by,
                $this->explanation
            ),
            'points' => $this->points,
            'sort_order' => $this->sort_order,
            'options' => OptionResource::collection($this->whenLoaded('options')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
