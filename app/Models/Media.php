<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'original_name',
        'filename',
        'path',
        'mime_type',
        'size',
        'url',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'size' => 'integer',
    ];

    protected $appends = ['public_url'];

    /**
     * Get the user that owns the media.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the public URL for the media.
     */
    public function getPublicUrlAttribute(): string
    {
        if ($this->type === 'video' && $this->url) {
            return $this->url;
        }
        
        return asset('storage/' . $this->path);
    }

    /**
     * Get human-readable file size.
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Scope to filter by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Check if media is an image.
     */
    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    /**
     * Check if media is a document.
     */
    public function isDocument(): bool
    {
        return $this->type === 'document';
    }

    /**
     * Check if media is a video.
     */
    public function isVideo(): bool
    {
        return $this->type === 'video';
    }
}
