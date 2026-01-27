<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'action',
        'tokens_used',
        'questions_generated',
    ];

    protected $casts = [
        'tokens_used' => 'integer',
        'questions_generated' => 'integer',
    ];

    public const ACTIONS = [
        'generate_questions',
        'generate_from_file',
        'improve_question',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
