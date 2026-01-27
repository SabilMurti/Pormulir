<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormSession extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'form_id',
        'user_id',
        'respondent_email',
        'respondent_name',
        'status',
        'started_at',
        'submitted_at',
        'time_spent_seconds',
        'score',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'time_spent_seconds' => 'integer',
        'score' => 'decimal:2',
    ];

    public const STATUSES = [
        'in_progress',
        'submitted',
        'violated',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class, 'session_id');
    }

    public function violations(): HasMany
    {
        return $this->hasMany(ViolationLog::class, 'session_id');
    }

    public function calculateScore(): float
    {
        $totalPoints = $this->form->questions()->sum('points');
        $earnedPoints = $this->responses()->sum('points_earned');
        
        return $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
    }
}
