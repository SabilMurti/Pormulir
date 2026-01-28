<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Form extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'created_by',
        'title',
        'description',
        'slug',
        'status',
        'settings',
        'theme',
    ];

    protected $casts = [
        'settings' => 'array',
        'theme' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('sort_order');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(FormSession::class);
    }

    public function getDefaultSettings(): array
    {
        return [
            'general' => [
                'collect_email' => false,
                'require_login' => false, // New Setting
                'limit_one_response' => false,
                'show_progress' => true,
                'shuffle_questions' => false,
                'shuffle_options' => false,
                'allow_resubmit' => false,
                'show_score_after' => false,
                'show_correct_answers' => false,
                'passing_score' => null,
                'confirmation_message' => 'Terima kasih!',
            ],
            'access' => [
                'require_login' => false,
                'password' => null,
                'start_at' => null,
                'end_at' => null,
            ],
            'exam_mode' => [
                'enabled' => false,
                'time_limit_minutes' => null,
                'anti_cheat' => [
                    'fullscreen_required' => false,
                    'block_copy_paste' => false,
                    'detect_tab_switch' => false,
                    'max_violations' => 3,
                ],
            ],
            'notifications' => [
                'notify_on_submission' => true,
                'send_confirmation' => false,
            ],
        ];
    }
}
