<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'form_id',
        'type',
        'content',
        'description',
        'media',
        'validation',
        'correct_answer',
        'explanation',
        'points',
        'sort_order',
    ];

    protected $casts = [
        'media' => 'array',
        'validation' => 'array',
        'correct_answer' => 'array',
        'points' => 'integer',
        'sort_order' => 'integer',
    ];

    public const TYPES = [
        'short_text',
        'long_text',
        'multiple_choice',
        'checkboxes',
        'dropdown',
        'number',
        'email',
        'phone',
        'date',
        'time',
        'file_upload',
        'rating',
        'scale',
        'section',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(Option::class)->orderBy('sort_order');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }

    public function hasOptions(): bool
    {
        return in_array($this->type, ['multiple_choice', 'checkboxes', 'dropdown']);
    }
}
