<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'is_correct' => $this->when(
                $request->user()?->id === $this->question?->form?->created_by,
                $this->is_correct
            ),
            'sort_order' => $this->sort_order,
        ];
    }
}
