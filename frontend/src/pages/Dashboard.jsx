import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  BarChart3, 
  TrendingUp,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Loading';
import { useAuthStore } from '../stores/authStore';
import workspaceService from '../services/workspace';
import formService from '../services/form';

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalForms: 0,
    totalResponses: 0,
    totalWorkspaces: 0,
    activeExams: 0,
  });
  const [recentForms, setRecentForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch workspaces and forms
      const [workspacesRes, formsRes] = await Promise.all([
        workspaceService.getAll().catch(() => ({ data: [] })),
        formService.getAll().catch(() => ({ data: [] })),
      ]);

      const workspaces = workspacesRes.data || [];
      const forms = formsRes.data || [];

      // Calculate stats
      const totalResponses = forms.reduce((sum, form) => sum + (form.response_count || 0), 0);
      const activeExams = forms.filter(f => f.is_exam_mode && f.status === 'published').length;

      setStats({
        totalForms: forms.length,
        totalResponses: totalResponses,
        totalWorkspaces: workspaces.length,
        activeExams: activeExams,
      });

      // Get recent forms (last 5)
      setRecentForms(forms.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Forms', 
      value: stats.totalForms, 
      icon: FileText, 
      color: 'text-primary-600',
      bg: 'bg-primary-100',
    },
    { 
      label: 'Responses', 
      value: stats.totalResponses, 
      icon: BarChart3, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    { 
      label: 'Workspaces', 
      value: stats.totalWorkspaces, 
      icon: Users, 
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    { 
      label: 'Active Exams', 
      value: stats.activeExams, 
      icon: TrendingUp, 
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
  ];

  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-slate-600 mt-1">
          Here's what's happening with your forms today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                  </>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/forms/new" className="block group">
          <Card className="p-6 h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Create New Form</h3>
                <p className="text-sm text-slate-500">Start from scratch</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/ai" className="block group">
          <Card className="p-6 h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Generate with AI</h3>
                <p className="text-sm text-slate-500">Create questions automatically</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/workspaces" className="block group">
          <Card className="p-6 h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Manage Workspaces</h3>
                <p className="text-sm text-slate-500">Organize your forms</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Forms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Forms</h2>
            <Link to="/forms">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentForms.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentForms.map((form) => (
                <Link 
                  key={form.id} 
                  to={`/forms/${form.id}/edit`}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{form.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {form.response_count || 0} responses
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(form.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    form.status === 'published' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {form.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-1">No forms yet</h3>
              <p className="text-sm text-slate-500 mb-4">Create your first form to get started</p>
              <Link to="/forms/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Form
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
