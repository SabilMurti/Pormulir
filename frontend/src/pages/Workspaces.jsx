import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Plus, 
  MoreHorizontal, 
  Users, 
  FileText,
  Pencil,
  Trash2,
  Settings
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Skeleton } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import workspaceService from '../services/workspace';

export function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await workspaceService.getAll();
      setWorkspaces(response.data || []);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      await workspaceService.create(formData);
      await fetchWorkspaces();
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name.trim() || !selectedWorkspace) return;
    
    setSaving(true);
    try {
      await workspaceService.update(selectedWorkspace.id, formData);
      await fetchWorkspaces();
      setShowEditModal(false);
      setSelectedWorkspace(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to update workspace:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workspace) => {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"?`)) return;
    
    try {
      await workspaceService.delete(workspace.id);
      await fetchWorkspaces();
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const openEditModal = (workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({ name: workspace.name, description: workspace.description || '' });
    setShowEditModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
          <p className="text-slate-600 mt-1">Organize your forms into workspaces</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Workspace
        </Button>
      </div>

      {/* Workspaces Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="w-8 h-8 rounded" />
              </div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card 
              key={workspace.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative group"
              onClick={(e) => {
                // Prevent navigation if dropdown is clicked
                if (e.target.closest('button')) return;
                navigate(`/workspaces/${workspace.id}`);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-primary-600" />
                </div>
                <Dropdown
                  trigger={
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative z-10">
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                  }
                >
                  <DropdownItem onClick={() => openEditModal(workspace)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownItem>
                  <DropdownItem onClick={() => navigate(`/workspaces/${workspace.id}`)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownItem>
                  <DropdownItem 
                    onClick={() => handleDelete(workspace)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownItem>
                </Dropdown>
              </div>

              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                {workspace.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                {workspace.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {workspace.forms_count || 0} forms
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {workspace.members_count || 1} members
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No workspaces yet"
          description="Create your first workspace to organize your forms"
          action={
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Workspace
            </Button>
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Workspace"
      >
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            placeholder="My Workspace"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Description (Optional)"
            placeholder="A brief description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={saving}>
              Create Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Rename Workspace"
      >
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            placeholder="My Workspace"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Description (Optional)"
            placeholder="A brief description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Workspaces;
