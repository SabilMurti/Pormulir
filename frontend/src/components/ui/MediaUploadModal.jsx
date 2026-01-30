import { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Youtube, 
  Link as LinkIcon,
  Loader2,
  X 
} from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import mediaService from '../../services/media';

export default function MediaUploadModal({ onClose, onSelect, type = 'all' }) {
  const [activeTab, setActiveTab] = useState('upload'); // upload, url, library
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      let response;
      if (file.type.startsWith('image/')) {
        response = await mediaService.uploadImage(file);
      } else {
        response = await mediaService.uploadDocument(file);
      }
      
      onSelect(response.data.media);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;

    setLoading(true);
    try {
      let response;
      // Check if it's a video URL (simple check)
      const isVideo = url.match(/(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/);
      
      if (isVideo) {
        response = await mediaService.addVideoEmbed(url);
      } else {
        response = await mediaService.uploadImageUrl(url);
      }

      onSelect(response.data.media);
      onClose();
    } catch (error) {
      console.error('Failed to add from URL:', error);
      alert('Failed to add from URL: ' + (error.response?.data?.error || error.response?.data?.message || 'Invalid URL'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Add Media</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                activeTab === 'upload'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                activeTab === 'url'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              From URL
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-500 hover:bg-slate-50 transition-all cursor-pointer"
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={type === 'image' ? "image/*" : "image/*,.pdf,.doc,.docx"}
                onChange={handleFileUpload}
                disabled={loading}
              />
              {loading ? (
                <div className="py-4">
                  <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-primary-600" />
                  </div>
                  <h4 className="font-medium text-slate-900">Click to upload</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {type === 'image' ? 'Images (JPG, PNG, GIF)' : 'Images, PDF, or Doc'}
                  </p>
                  <p className="text-xs text-slate-400 mt-4">
                    Max size: 5MB (Image), 10MB (Doc)
                  </p>
                </>
              )}
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <Input
                label="Media URL"
                placeholder="https://example.com/image.jpg or YouTube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
              <div className="text-xs text-slate-500">
                Supports: Direct Image Links, YouTube, Vimeo, Dailymotion
              </div>
              <Button 
                onClick={handleUrlSubmit} 
                disabled={!url || loading} 
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Add Media
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
