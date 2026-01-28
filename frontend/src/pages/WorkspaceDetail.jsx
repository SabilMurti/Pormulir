import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Settings, 
  Users, 
  Plus, 
  MoreHorizontal, 
  FileText,
  Clock,
  Trash2,
  Mail,
  Shield,
  ArrowLeft,
  Pencil
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Skeleton, PageLoader } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import workspaceService from '../services/workspace';
import formService from '../services/form';

export function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forms'); // 'forms', 'members', 'settings'
  
  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'editor' });
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const [workspaceRes, formsRes] = await Promise.all([
        workspaceService.getById(id),
        formService.list(id).catch(() => ({ data: [] }))
      ]);
      
      setWorkspace(workspaceRes.data);
      setForms(formsRes.data || []);
      setEditData({ 
        name: workspaceRes.data.name, 
        description: workspaceRes.data.description || '' 
      });
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      if (error.response?.status === 404) {
        navigate('/workspaces');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!editData.name.trim()) return;
    setProcessing(true);
    try {
      await workspaceService.update(id, editData);
      await fetchWorkspaceData();
      setShowEditModal(false);
    } catch (error) {
      alert('Failed to update workspace');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('Are you sure you want to delete this workspace? All forms inside will be deleted permanently.')) return;
    try {
      await workspaceService.delete(id);
      navigate('/workspaces');
    } catch (error) {
      alert('Failed to delete workspace');
    }
  };

  const handleInviteMember = async () => {
    if (!inviteData.email.trim()) return;
    setProcessing(true);
    try {
      await workspaceService.invite(id, inviteData);
      await fetchWorkspaceData();
      setShowInviteModal(false);
      setInviteData({ ...inviteData, email: '' });
      alert('Invitation sent successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!confirm('Are you sure?')) return;
    try {
      await formService.delete(formId);
      setForms(forms.filter(f => f.id !== formId));
    } catch (error) {
      alert('Failed to delete form');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/workspaces" className="text-slate-500 hover:text-primary-600 transition-colors">
              <div className="flex items-center gap-1 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Workspaces
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{workspace?.name}</h1>
              <p className="text-slate-600 text-sm max-w-xl">
                {workspace?.description || 'No description provided'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowEditModal(true)}
              className="ml-2"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowInviteModal(true)} variant="secondary" className="gap-2">
            <Users className="w-4 h-4" />
            Invite Member
          </Button>
          <Link to={`/forms/new?workspace=${id}`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Form
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'forms'
              ? 'text-primary-600 border-primary-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Forms ({forms.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'members'
              ? 'text-primary-600 border-primary-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Members ({workspace?.members?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'text-primary-600 border-primary-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Content */}
      {activeTab === 'forms' && (
        <>
          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <Link to={`/forms/${form.id}/edit`}>
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
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
                        Edit
                      </DropdownItem>
                      <DropdownItem onClick={() => navigate(`/forms/${form.id}/responses`)}>
                        Responses
                      </DropdownItem>
                      <DropdownItem 
                        onClick={() => handleDeleteForm(form.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {form.response_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(form.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      form.status === 'published' 
                        ? 'bg-emerald-100 text-emerald-700' 
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
              title="No forms in this workspace"
              description="Create a new form to get started"
              action={
                <Link to={`/forms/new?workspace=${id}`}>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Form
                  </Button>
                </Link>
              }
            />
          )}
        </>
      )}

      {activeTab === 'members' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Member</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Role</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Owner */}
                <tr>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm">
                        {workspace.owner?.name?.[0] || 'O'}
                      </div>
                      <span className="font-medium text-slate-900">{workspace.owner?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{workspace.owner?.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Shield className="w-3 h-3" />
                      Owner
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right"></td>
                </tr>
                {/* Available Members data */}
                {workspace.members?.map((member) => (
                   (member.id !== workspace.owner.id) && (
                    <tr key={member.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                            {member.name?.[0] || 'U'}
                          </div>
                          <span className="font-medium text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                          {member.pivot?.role || 'Member'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                          Remove
                        </Button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h3>
            <div className="space-y-4">
              <Input
                label="Workspace Name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  className="input min-h-[100px]"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Describe your workspace..."
                />
              </div>
              <Button onClick={handleUpdateWorkspace} loading={processing} className="mt-2">
                Save Changes
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 mb-4">
              Deleting this workspace will permanently remove all forms and data associated with it. This action cannot be undone.
            </p>
            <Button 
              variant="danger" 
              onClick={handleDeleteWorkspace}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Workspace
            </Button>
          </Card>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select
              className="input"
              value={inviteData.role}
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
            >
              <option value="editor">Editor (Can create and edit forms)</option>
              <option value="viewer">Viewer (Can only view responses)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} loading={processing}>
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal (Reuse logic from main page if needed, but here handled inline/tab) */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Workspace"
      >
         <div className="space-y-4">
          <Input
            label="Workspace Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="input"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkspace} loading={processing}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default WorkspaceDetail;
