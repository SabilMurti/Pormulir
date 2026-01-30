<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;

class MediaController extends Controller
{
    // Max file sizes in MB
    private const MAX_IMAGE_SIZE = 5;
    private const MAX_DOCUMENT_SIZE = 10;
    
    // Allowed file types
    private const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    private const ALLOWED_DOCUMENTS = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
    ];

    /**
     * Get user's media library
     */
    public function index(Request $request)
    {
        $type = $request->query('type');
        
        $query = $request->user()->media()->latest();
        
        if ($type) {
            $query->ofType($type);
        }
        
        $media = $query->paginate(20);
        
        return response()->json($media);
    }

    /**
     * Upload image file
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                File::types(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])
                    ->max(self::MAX_IMAGE_SIZE * 1024), // Convert MB to KB
            ],
        ], [
            'file.max' => 'Ukuran gambar maksimal ' . self::MAX_IMAGE_SIZE . 'MB.',
            'file.types' => 'Format gambar harus JPG, PNG, GIF, WebP, atau SVG.',
        ]);

        return $this->processUpload($request, 'image', 'images');
    }

    /**
     * Upload document file (PDF, DOC, etc.)
     */
    public function uploadDocument(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                File::types(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'])
                    ->max(self::MAX_DOCUMENT_SIZE * 1024),
            ],
        ], [
            'file.max' => 'Ukuran dokumen maksimal ' . self::MAX_DOCUMENT_SIZE . 'MB.',
            'file.types' => 'Format dokumen harus PDF, DOC, XLS, PPT, atau TXT.',
        ]);

        return $this->processUpload($request, 'document', 'documents');
    }

    /**
     * Upload image from URL
     */
    public function uploadImageUrl(Request $request)
    {
        $request->validate([
            'url' => ['required', 'url', 'active_url'],
        ]);

        $url = $request->url;
        
        try {
            // Fetch image from URL
            $contents = file_get_contents($url);
            if (!$contents) {
                return response()->json(['error' => 'Gagal mengambil gambar dari URL'], 400);
            }

            // Get file info
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($contents);
            
            if (!in_array($mimeType, self::ALLOWED_IMAGES)) {
                return response()->json(['error' => 'URL bukan gambar yang valid'], 400);
            }

            // Check file size
            $size = strlen($contents);
            if ($size > self::MAX_IMAGE_SIZE * 1024 * 1024) {
                return response()->json(['error' => 'Ukuran gambar melebihi ' . self::MAX_IMAGE_SIZE . 'MB'], 400);
            }

            // Generate filename
            $extension = $this->getExtensionFromMime($mimeType);
            $filename = Str::uuid() . '.' . $extension;
            $path = 'images/' . date('Y/m') . '/' . $filename;

            // Store file
            Storage::disk('public')->put($path, $contents);

            // Create media record
            $media = $request->user()->media()->create([
                'type' => 'image',
                'original_name' => basename(parse_url($url, PHP_URL_PATH)) ?: 'image.' . $extension,
                'filename' => $filename,
                'path' => $path,
                'mime_type' => $mimeType,
                'size' => $size,
                'url' => $url,
                'metadata' => ['source' => 'url'],
            ]);

            return response()->json([
                'success' => true,
                'media' => $media,
                'url' => $media->public_url,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal mengambil gambar: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Add video embed link
     */
    public function addVideoEmbed(Request $request)
    {
        $request->validate([
            'url' => ['required', 'url'],
        ]);

        $url = $request->url;
        $embedData = $this->parseVideoUrl($url);
        
        if (!$embedData) {
            return response()->json([
                'error' => 'URL video tidak valid. Gunakan YouTube, Vimeo, atau Dailymotion.'
            ], 400);
        }

        $media = $request->user()->media()->create([
            'type' => 'video',
            'original_name' => $embedData['title'] ?? 'Video',
            'filename' => $embedData['id'],
            'path' => '',
            'mime_type' => 'video/embed',
            'size' => 0,
            'url' => $embedData['embed_url'],
            'metadata' => $embedData,
        ]);

        return response()->json([
            'success' => true,
            'media' => $media,
            'embed_url' => $embedData['embed_url'],
            'thumbnail' => $embedData['thumbnail'] ?? null,
        ]);
    }

    /**
     * Delete media
     */
    public function destroy(Request $request, string $id)
    {
        $media = $request->user()->media()->findOrFail($id);
        
        // Delete file from storage if it exists
        if ($media->path && Storage::disk('public')->exists($media->path)) {
            Storage::disk('public')->delete($media->path);
        }
        
        $media->delete();
        
        return response()->json(['success' => true]);
    }

    /**
     * Process file upload
     */
    private function processUpload(Request $request, string $type, string $folder)
    {
        $file = $request->file('file');
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        $path = $folder . '/' . date('Y/m') . '/' . $filename;
        
        // Store file
        Storage::disk('public')->put($path, file_get_contents($file));
        
        // Create media record
        $media = $request->user()->media()->create([
            'type' => $type,
            'original_name' => $file->getClientOriginalName(),
            'filename' => $filename,
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'metadata' => [
                'extension' => $extension,
            ],
        ]);
        
        return response()->json([
            'success' => true,
            'media' => $media,
            'url' => $media->public_url,
        ]);
    }

    /**
     * Parse video URL to get embed info
     */
    private function parseVideoUrl(string $url): ?array
    {
        // YouTube
        if (preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            $videoId = $matches[1];
            return [
                'platform' => 'youtube',
                'id' => $videoId,
                'embed_url' => "https://www.youtube.com/embed/{$videoId}",
                'thumbnail' => "https://img.youtube.com/vi/{$videoId}/maxresdefault.jpg",
                'title' => 'YouTube Video',
            ];
        }
        
        // Vimeo
        if (preg_match('/vimeo\.com\/(?:video\/)?(\d+)/', $url, $matches)) {
            $videoId = $matches[1];
            return [
                'platform' => 'vimeo',
                'id' => $videoId,
                'embed_url' => "https://player.vimeo.com/video/{$videoId}",
                'thumbnail' => null,
                'title' => 'Vimeo Video',
            ];
        }
        
        // Dailymotion
        if (preg_match('/dailymotion\.com\/video\/([a-zA-Z0-9]+)/', $url, $matches)) {
            $videoId = $matches[1];
            return [
                'platform' => 'dailymotion',
                'id' => $videoId,
                'embed_url' => "https://www.dailymotion.com/embed/video/{$videoId}",
                'thumbnail' => "https://www.dailymotion.com/thumbnail/video/{$videoId}",
                'title' => 'Dailymotion Video',
            ];
        }
        
        return null;
    }

    /**
     * Get file extension from MIME type
     */
    private function getExtensionFromMime(string $mimeType): string
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
        ];
        
        return $map[$mimeType] ?? 'jpg';
    }
}
