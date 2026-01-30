import { useState, useEffect } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  Copy, 
  Globe, 
  Mail, 
  Code,
  Lock,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import formService from '../../services/form';
import userService from '../../services/user';

export default function PublishModal({ form, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('link'); // link, email, embed
  const [copied, setCopied] = useState(false);
  const [shortenUrl, setShortenUrl] = useState(false);
  const [isPublished, setIsPublished] = useState(form.status === 'published');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Access Control State
  const [accessType, setAccessType] = useState(form.access_type || 'public');
  const [allowedEmails, setAllowedEmails] = useState(form.allowed_emails || []);
  const [newEmail, setNewEmail] = useState('');
  const [emailDetails, setEmailDetails] = useState({});

  useEffect(() => {
    setIsPublished(form.status === 'published');
    setAccessType(form.access_type || 'public');
    setAllowedEmails(form.allowed_emails || []);
  }, [form]);

  // Auto-publish when modal opens and form is not yet published
  useEffect(() => {
    const autoPublish = async () => {
      if (isOpen && form.id && form.status !== 'published') {
        setUpdatingStatus(true);
        try {
          await formService.publish(form.id);
          setIsPublished(true);
          onUpdate && onUpdate({ ...form, status: 'published' });
        } catch (error) {
          console.error('Failed to auto-publish:', error);
        } finally {
          setUpdatingStatus(false);
        }
      }
    };
    autoPublish();
  }, [isOpen, form.id]);

  // Fetch details for allowed emails
  useEffect(() => {
    if (allowedEmails.length > 0) {
      const missing = allowedEmails.filter(e => !emailDetails[e]);
      if (missing.length > 0) {
        userService.batchLookup(missing).then(res => {
          if (res.data.users) {
            const newDetails = {};
            res.data.users.forEach(u => {
              newDetails[u.email] = u;
            });
            setEmailDetails(prev => ({ ...prev, ...newDetails }));
          }
        }).catch(err => console.error('Failed to fetch users', err));
      }
    }
  }, [allowedEmails]);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/f/${form.slug}`;
  const displayUrl = shortenUrl ? `${window.location.origin}/f/${form.slug.substring(0, 8)}...` : publicUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublishStatus = async () => {
    setUpdatingStatus(true);
    try {
      const newStatus = isPublished ? 'draft' : 'published';
      if (isPublished) {
        await formService.close(form.id); 
      } else {
        await formService.publish(form.id);
      }
      setIsPublished(!isPublished);
      onUpdate && onUpdate({ ...form, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update form status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateAccessSettings = async (updates) => {
    try {
      // Optimistic update
      if (updates.access_type) setAccessType(updates.access_type);
      if (updates.allowed_emails) setAllowedEmails(updates.allowed_emails);

      await formService.update(form.id, updates);
      onUpdate && onUpdate({ ...form, ...updates });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (newEmail && newEmail.includes('@') && !allowedEmails.includes(newEmail)) {
      // Add immediately
      const updatedEmails = [...allowedEmails, newEmail];
      setAllowedEmails(updatedEmails); // Update local state strictly
      updateAccessSettings({ allowed_emails: updatedEmails });
      
      // Try lookup
      try {
          const res = await userService.lookup(newEmail);
          if (res.data.found) {
              setEmailDetails(prev => ({ ...prev, [newEmail]: res.data.user }));
          }
      } catch (err) { /* ignore */ }
      
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email) => {
    const updatedEmails = allowedEmails.filter(e => e !== email);
    setAllowedEmails(updatedEmails);
    updateAccessSettings({ allowed_emails: updatedEmails });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-xl font-medium text-slate-800">Kirim formulir</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto">
          {/* Status Toggle Section */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900 mb-1">Status Formulir</h3>
              <p className="text-sm text-slate-500">
                {isPublished 
                  ? 'Formulir aktif dan menerima jawaban.' 
                  : 'Formulir ditutup. Responden tidak bisa mengisi.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isPublished}
                onChange={togglePublishStatus}
                disabled={updatingStatus}
              />
              <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isPublished ? 'peer-checked:bg-primary-600' : ''}`}></div>
            </label>
          </div>

          <div className="p-6 space-y-6">
            {/* Share Via Tabs */}
            <div>
              <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
                <button 
                  onClick={() => setActiveTab('link')}
                  className={`pb-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 px-1 ${
                    activeTab === 'link' 
                      ? 'border-primary-600 text-primary-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LinkIcon className="w-5 h-5" />
                  Link
                </button>
                <button 
                  onClick={() => setActiveTab('email')}
                  className={`pb-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 px-1 ${
                    activeTab === 'email' 
                      ? 'border-primary-600 text-primary-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  Email
                </button>
                <button 
                  onClick={() => setActiveTab('embed')}
                  className={`pb-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 px-1 ${
                    activeTab === 'embed' 
                      ? 'border-primary-600 text-primary-700' 
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Code className="w-5 h-5" />
                  Sematkan HTML
                </button>
              </div>

              {/* Link Content */}
              {activeTab === 'link' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly
                        value={displayUrl}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <Button onClick={handleCopy} variant="secondary">
                        {copied ? 'Disalin!' : 'Salin'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="shorten_url"
                      checked={shortenUrl}
                      onChange={(e) => setShortenUrl(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="shorten_url" className="text-sm text-slate-700 cursor-pointer select-none">
                      Perpendek URL
                    </label>
                  </div>
                </div>
              )}

              {/* Email Content */}
              {activeTab === 'email' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Kepada</label>
                    <Input placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Subjek</label>
                    <Input defaultValue={form.title} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Pesan</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                      defaultValue={`Saya mengundang Anda untuk mengisi formulir:\n\n${form.title}\n\n${form.description || ''}`}
                    ></textarea>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button>Kirim Email</Button>
                  </div>
                </div>
              )}

               {/* Embed Content */}
               {activeTab === 'embed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kode HTML</label>
                    <div className="flex gap-2">
                      <textarea 
                        readOnly
                        value={`<iframe src="${publicUrl}" width="640" height="800" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24 resize-none"
                      />
                      <Button onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${publicUrl}" width="640" height="800" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }} variant="secondary" className="h-fit">
                        {copied ? 'Disalin!' : 'Salin'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-1/2">
                        <label className="text-xs text-slate-500 block mb-1">Lebar (px)</label>
                        <Input defaultValue="640" />
                     </div>
                     <div className="w-1/2">
                        <label className="text-xs text-slate-500 block mb-1">Tinggi (px)</label>
                        <Input defaultValue="800" />
                     </div>
                  </div>
                </div>
               )}
            </div>

            {/* Access Settings */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Akses Umum</h3>
              
              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accessType === 'public' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-600'}`}>
                      {accessType === 'public' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <select 
                        value={accessType}
                        onChange={(e) => updateAccessSettings({ access_type: e.target.value })}
                        className="bg-transparent font-medium text-sm text-slate-900 focus:outline-none cursor-pointer hover:bg-slate-100 rounded px-1 -ml-1 py-0.5 transition-colors border-none ring-0 w-full"
                      >
                        <option value="public">Siapa saja yang memiliki link</option>
                        <option value="restricted">Dibatasi</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {accessType === 'public' 
                          ? 'Siapapun bisa mengisi (tetap memerlukan Google Login)' 
                          : 'Hanya orang yang ditambahkan yang bisa mengisi'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Restricted Email List */}
                {accessType === 'restricted' && (
                  <div className="border-t border-slate-200 bg-white p-4 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleAddEmail} className="flex gap-2 mb-4">
                      <Input 
                        placeholder="Tambahkan email..." 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="flex-1"
                        type="email"
                      />
                      <Button variant="secondary" type="submit" disabled={!newEmail}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah
                      </Button>
                    </form>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {allowedEmails.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-sm italic">
                          Belum ada email yang diizinkan
                        </div>
                      ) : (
                        allowedEmails.map((email) => {
                          const user = emailDetails[email];
                          return (
                            <div key={email} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                              <div className="flex items-center gap-3">
                                {user && user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                                ) : (
                                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium uppercase">
                                       {email[0]}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-800">{user?.name || email}</span>
                                    {user && <span className="text-xs text-slate-500">{email}</span>}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveEmail(email)}
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                title="Hapus akses"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <Button variant="ghost" onClick={onClose}>Selesai</Button>
        </div>
      </div>
    </div>
  );
}
