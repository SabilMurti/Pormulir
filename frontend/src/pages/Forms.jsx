import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal,
  Grid3X3,
  List,
  Eye,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Skeleton } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import formService from '../services/form';
import workspaceService from '../services/workspace';
import { copyToClipboard } from '../utils/helpers';

export function Forms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    workspace_id: '' 
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [formsRes, workspacesRes] = await Promise.all([
        formService.getAll(),
        workspaceService.getAll().catch(() => ({ data: [] })),
      ]);
      setForms(formsRes.data || []);
      setWorkspaces(workspacesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    
    setSaving(true);
    try {
      const response = await formService.create(formData);
      navigate(`/forms/${response.data.id}/edit`);
    } catch (error) {
      console.error('Failed to create form:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (form) => {
    if (!confirm(`Are you sure you want to delete "${form.title}"?`)) return;
    
    try {
      await formService.delete(form.id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete form:', error);
    }
  };

  const handleDuplicate = async (form) => {
    try {
      await formService.duplicate(form.id);
      await fetchData();
    } catch (error) {
      console.error('Failed to duplicate form:', error);
    }
  };

  const handleCopyLink = (form) => {
    const url = `${window.location.origin}/f/${form.slug}`;
    copyToClipboard(url);
    alert('Link copied to clipboard!');
  };

  // Filter & Sort forms
  const filteredForms = forms
    .filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
      const matchesWorkspace = workspaceFilter === 'all' || form.workspace_id === workspaceFilter;
      return matchesSearch && matchesStatus && matchesWorkspace;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === 'a-z') return a.title.localeCompare(b.title);
      if (sortOrder === 'z-a') return b.title.localeCompare(a.title);
      return 0;
    });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forms</h1>
          <p className="text-slate-600 mt-1">Create and manage your forms</p>
        </div>
        <Button 
          onClick={() => {
            setFormData({ title: '', description: '', workspace_id: '' });
            setShowCreateModal(true);
          }} 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Form
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search forms..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {workspaces.length > 0 && (
            <select
              className="input w-auto max-w-[200px]"
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
            >
              <option value="all">All Workspaces</option>
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          )}

          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>

          <select
            className="input w-auto"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="a-z">Name (A-Z)</option>
            <option value="z-a">Name (Z-A)</option>
          </select>

          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Forms Grid/List */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredForms.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredForms.map((form) => (
            <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link to={`/forms/${form.id}/edit`}>
                    <h3 className="font-semibold text-slate-900 truncate hover:text-primary-600 transition-colors">
                      {form.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                    {form.description || 'No description'}
                  </p>
                </div>
                <Dropdown
                  trigger={
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-2">
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                  }
                >
                  <DropdownItem onClick={() => navigate(`/forms/${form.id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownItem>
                  <DropdownItem onClick={() => navigate(`/forms/${form.id}/responses`)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Answers & Grades
                  </DropdownItem>
                  <DropdownItem onClick={() => handleCopyLink(form)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownItem>
                  <DropdownItem onClick={() => window.open(`/f/${form.slug}?preview=true`, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownItem>
                  <DropdownItem onClick={() => handleDuplicate(form)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownItem>
                  <DropdownItem 
                    onClick={() => handleDelete(form)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownItem>
                </Dropdown>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {form.response_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(form.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  form.status === 'published' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : form.status === 'closed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {form.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No forms found"
          description={searchQuery ? 'Try a different search term' : 'Create your first form to get started'}
          action={
            !searchQuery && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Form
              </Button>
            )
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Form"
      >
        <div className="space-y-4">
          <Input
            label="Form Title"
            placeholder="My Survey"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Input
            label="Description (Optional)"
            placeholder="A brief description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {workspaces.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Workspace (Optional)
              </label>
              <select
                className="input"
                value={formData.workspace_id}
                onChange={(e) => setFormData({ ...formData, workspace_id: e.target.value })}
              >
                <option value="">No workspace</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Create Form
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Forms;
