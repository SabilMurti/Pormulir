<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViolationLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'session_id',
        'event_type',
        'event_data',
        'occurred_at',
    ];

    protected $casts = [
        'event_data' => 'array',
        'occurred_at' => 'datetime',
    ];

    public const EVENT_TYPES = [
        'tab_switch',
        'fullscreen_exit',
        'copy_attempt',
        'paste_attempt',
        'right_click',
        'keyboard_shortcut',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(FormSession::class, 'session_id');
    }
}
