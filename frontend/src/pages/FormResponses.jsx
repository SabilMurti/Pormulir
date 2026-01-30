import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Download, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  Eye,
  TrendingUp,
  X,
  Trash2,
  Trophy,
  AlertCircle,
  Check,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Skeleton } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import formService from '../services/form';
import responseService from '../services/response';
import aiService from '../services/ai';
import sheetsService from '../services/sheets';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export function FormResponses() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('individual');
  
  // Modal state for viewing student answers
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // All services already return response.data, so results are the data directly
      const [formData, responsesData, summaryData] = await Promise.all([
        formService.getById(id),
        responseService.list(id).catch(() => ({ data: [] })),
        responseService.getSummary(id).catch(() => null),
      ]);

      setForm(formData);
      
      if (formData.spreadsheet_id) {
        setSheetStatus(prev => ({
          ...prev,
          linked: true,
          spreadsheet_id: formData.spreadsheet_id,
          spreadsheet_url: formData.spreadsheet_url,
          loading: false
        }));
      }
      // responseService.list returns { data: [...] } from Laravel pagination
      setResponses(responsesData?.data || responsesData || []);
      setSummary(summaryData);
      // console.log('DEBUG - Form:', formData);
      // console.log('DEBUG - Responses:', responsesData);
      // console.log('DEBUG - Summary:', summaryData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteConfirm(true);
  };

  const executeDeleteAll = async () => {
    setDeleting(true);
    try {
      await responseService.deleteAll(id);
      setResponses([]);
      setSummary(null);
      toast.success('Semua respons berhasil dihapus');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete responses:', error);
      toast.error('Gagal menghapus respons');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewAnswer = async (session) => {
    setSelectedSession(session);
    setLoadingDetail(true);
    try {
      const response = await responseService.get(id, session.id);
      setSessionDetail(response);
    } catch (error) {
      console.error('Failed to fetch session detail:', error);
      toast.error('Gagal memuat jawaban siswa');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAIChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Build context from responses and summary data
      const context = {
        respondents: responses.map(r => ({
          name: r.respondent_name || 'Anonymous',
          email: r.respondent_email,
          score: r.score,
          time_seconds: r.time_spent_seconds,
          submitted_at: r.submitted_at,
        })),
        summary: summary,
        total: responses.length,
        avgScore: responses.filter(r => r.score !== null).length > 0 
          ? responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.filter(r => r.score !== null).length 
          : null,
        avgTime: responses.filter(r => r.time_spent_seconds).length > 0
          ? responses.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0) / responses.filter(r => r.time_spent_seconds).length
          : null,
      };

      const result = await aiService.analyzeResponses(id, userMessage, context);
      
      // Add AI response
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.analysis,
        meta: result.meta 
      }]);
      
      // Scroll to bottom
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Maaf, terjadi kesalahan saat menganalisis data. Silakan coba lagi.',
        isError: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSession(null);
    setSessionDetail(null);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const blob = await responseService.export(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Helper to clean filename
      const getCleanFileName = () => {
        const rawTitle = form?.title || 'Untitled Form';
        
        // 1. Strip HTML tags using browser DOM parser
        const temp = document.createElement('div');
        temp.innerHTML = rawTitle;
        const text = temp.textContent || temp.innerText || '';

        // 2. Remove illegal characters but allow standard punctuation like () - .
        return text.replace(/[^a-zA-Z0-9 \-_().]/g, '').trim() || 'Untitled Form';
      };

      const cleanTitle = getCleanFileName();
      console.log('Exporting as:', cleanTitle); // Debug log
      
      a.download = `Hasil Respon - ${cleanTitle}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Gagal mengexport respons');
    } finally {
      setExporting(false);
    }
  };

  // Google Sheets Integration State
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [sheetMode, setSheetMode] = useState('create'); // 'create' or 'select'
  const [sheetStatus, setSheetStatus] = useState({ linked: false, spreadsheet_url: null, loading: false });
  const [sheetConnecting, setSheetConnecting] = useState(false);

  // Fetch spreadsheet status when modal opens
  const openSheetModal = async () => {
    setShowSheetModal(true);
    setSheetStatus(prev => ({ ...prev, loading: true }));
    try {
      const status = await sheetsService.getStatus(id);
      console.log('Sheet Status Response:', status);
      setSheetStatus({ ...status, loading: false });
    } catch (error) {
      console.error('Failed to fetch sheet status:', error);
      setSheetStatus(prev => ({ ...prev, loading: false })); 
    }
  };

  const handleSheetConnect = async () => {
    setSheetConnecting(true);
    try {
      const result = await sheetsService.create(id);
      toast.success(`Spreadsheet berhasil dibuat! ${result.synced_responses} respons disinkronkan.`);
      setSheetStatus({
        linked: true,
        spreadsheet_id: result.spreadsheet_id,
        spreadsheet_url: result.spreadsheet_url,
        loading: false,
      });
      // Don't close modal - show the linked state
    } catch (error) {
      console.error('Failed to create spreadsheet:', error);
      if (error.response?.status === 401) {
        toast.error('Perlu otorisasi Google Sheets. Silakan login ulang dengan Google.');
      } else {
        toast.error(error.response?.data?.message || 'Gagal membuat spreadsheet');
      }
    } finally {
      setSheetConnecting(false);
    }
  };

  const handleSheetSync = async () => {
    setSheetConnecting(true);
    try {
      const result = await sheetsService.sync(id);
      toast.success(result.message);
    } catch (error) {
      console.error('Failed to sync:', error);
      toast.error(error.response?.data?.message || 'Gagal sinkronisasi');
    } finally {
      setSheetConnecting(false);
    }
  };

  const handleSheetUnlink = async () => {
    setSheetConnecting(true);
    try {
      await sheetsService.unlink(id);
      toast.success('Spreadsheet berhasil di-unlink');
      setSheetStatus({ linked: false, spreadsheet_url: null, loading: false });
    } catch (error) {
      console.error('Failed to unlink:', error);
      toast.error('Gagal unlink spreadsheet');
    } finally {
      setSheetConnecting(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Total Responses', 
      value: responses.length, 
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-100',
    },
    { 
      label: 'Average Score', 
      value: (() => {
        // Calculate from responses array directly (most reliable)
        const scoresWithData = responses.filter(r => {
          const score = parseFloat(r.score);
          return !isNaN(score);
        });
        if (scoresWithData.length > 0) {
          const avg = scoresWithData.reduce((sum, r) => sum + parseFloat(r.score), 0) / scoresWithData.length;
          if (!isNaN(avg)) {
            return `${Math.round(avg)}%`;
          }
        }
        // Fallback to summary
        const summaryScore = parseFloat(summary?.stats?.average_score);
        if (!isNaN(summaryScore)) {
          return `${Math.round(summaryScore)}%`;
        }
        return 'N/A';
      })(),
      icon: Trophy,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    { 
      label: 'Avg. Time', 
      value: (() => {
        // Try from summary first, then calculate from responses
        if (summary?.stats?.average_time_seconds) {
          return formatDuration(summary.stats.average_time_seconds);
        }
        // Calculate from responses array
        const timesWithData = responses.filter(r => r.time_spent_seconds);
        if (timesWithData.length > 0) {
          const avg = timesWithData.reduce((sum, r) => sum + r.time_spent_seconds, 0) / timesWithData.length;
          return formatDuration(Math.round(avg));
        }
        return 'N/A';
      })(),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    { 
      label: 'Today', 
      value: responses.filter(r => 
        new Date(r.submitted_at).toDateString() === new Date().toDateString()
      ).length, 
      icon: TrendingUp,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to={`/forms/${id}/edit`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Edit
              </Button>
            </Link>
          </div>
          <h1 
            className="text-2xl font-bold text-slate-900 prose prose-xl max-w-none"
            dangerouslySetInnerHTML={{ __html: form?.title || 'Form Responses' }} 
          />
          <p className="text-slate-600 mt-1">Student Answers & Grades</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/forms/${id}/edit`}>
            <Button variant="secondary" className="gap-2">
              <Eye className="w-4 h-4" />
              Edit Form
            </Button>
          </Link>
          
          {responses.length > 0 && (
            <Button 
              onClick={handleDeleteAll} 
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete All'}
            </Button>
          )}

          <Button 
            onClick={openSheetModal} 
            className="gap-2 bg-green-600 hover:bg-green-700 text-white border-transparent"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Link to Sheets
          </Button>

          <Button 
            onClick={() => handleExport('excel')} 
            className="gap-2"
            disabled={exporting || responses.length === 0}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'individual'
              ? 'text-primary-600 border-primary-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Student Answers ({responses.length})
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'summary'
              ? 'text-primary-600 border-primary-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'text-purple-600 border-purple-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Insights
        </button>
      </div>

      {/* Content */}
      {responses.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No responses yet"
          description="Share your form to start collecting responses"
          action={
            form?.slug && (
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
                  toast.success('Link berhasil disalin!');
                }}
                className="gap-2"
              >
                Copy Form Link
              </Button>
            )
          }
        />
      ) : activeTab === 'individual' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">#</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Student Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Submitted</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Duration</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Score</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {responses.map((response, i) => (
                  <tr key={response.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {response.respondent_name || 'Anonymous'}
                        </div>
                        {response.respondent_email && (
                          <div className="text-sm text-slate-500">{response.respondent_email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {response.submitted_at ? new Date(response.submitted_at).toLocaleString('id-ID') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDuration(response.time_spent_seconds)}
                    </td>
                    <td className="px-6 py-4">
                      {response.score !== undefined && response.score !== null ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          response.score >= 80 
                            ? 'bg-emerald-100 text-emerald-700'
                            : response.score >= 60
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(response.score)}%
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleViewAnswer(response)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Answers
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : activeTab === 'summary' ? (
        <div className="space-y-6">
          {/* Overview Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Score Distribution
              </h3>
              {(() => {
                // Build score distribution data
                const scoreRanges = [
                  { range: '0-20%', min: 0, max: 20, count: 0, color: '#ef4444' },
                  { range: '21-40%', min: 21, max: 40, count: 0, color: '#f97316' },
                  { range: '41-60%', min: 41, max: 60, count: 0, color: '#eab308' },
                  { range: '61-80%', min: 61, max: 80, count: 0, color: '#22c55e' },
                  { range: '81-100%', min: 81, max: 100, count: 0, color: '#10b981' },
                ];
                
                responses.forEach(r => {
                  const score = parseFloat(r.score);
                  if (!isNaN(score)) {
                    const range = scoreRanges.find(sr => score >= sr.min && score <= sr.max);
                    if (range) range.count++;
                  }
                });

                const hasData = scoreRanges.some(r => r.count > 0);
                
                if (!hasData) {
                  return (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      No score data available
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={scoreRanges}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        name="Students"
                        radius={[4, 4, 0, 0]}
                      >
                        {scoreRanges.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </Card>

            {/* Response Timeline Chart */}
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Response Timeline
              </h3>
              {(() => {
                // Group responses by date
                const timelineData = {};
                responses.forEach(r => {
                  if (r.submitted_at) {
                    const date = new Date(r.submitted_at).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: 'short' 
                    });
                    timelineData[date] = (timelineData[date] || 0) + 1;
                  }
                });

                const chartData = Object.entries(timelineData)
                  .map(([date, count]) => ({ date, count }))
                  .slice(-7); // Last 7 days

                if (chartData.length === 0) {
                  return (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      No timeline data available
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Responses"
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </Card>
          </div>

          {/* Question Performance Row */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Question Performance (Correct Rate %)
            </h3>
            {(() => {
              const questionsWithRate = (summary?.questions || [])
                .filter(q => q.correct_rate !== undefined)
                .map((q, i) => ({
                  name: `Q${i + 1}`,
                  fullName: q.content?.replace(/<[^>]*>/g, '').substring(0, 50) + '...',
                  rate: q.correct_rate,
                  fill: q.correct_rate >= 70 ? '#22c55e' : q.correct_rate >= 50 ? '#eab308' : '#ef4444',
                }));

              if (questionsWithRate.length === 0) {
                return (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No graded questions available
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={Math.max(200, questionsWithRate.length * 50)}>
                  <BarChart data={questionsWithRate} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={40} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Correct Rate']}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }}
                    />
                    <Bar 
                      dataKey="rate" 
                      name="Correct Rate"
                      radius={[0, 4, 4, 0]}
                    >
                      {questionsWithRate.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </Card>

          {/* Per-Question Answer Distribution */}
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mt-8">
            <CheckCircle2 className="w-5 h-5 text-primary-500" />
            Answer Distribution by Question
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(summary?.questions || []).map((question, i) => {
              const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
              
              return (
                <Card key={question.id} className="p-6">
                  <div className="mb-4">
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                      Question {i + 1}
                    </span>
                    <h4 
                      className="font-medium text-slate-900 mt-2 line-clamp-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{question.type}</span>
                      {question.correct_rate !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          question.correct_rate >= 70 
                            ? 'bg-emerald-100 text-emerald-700'
                            : question.correct_rate >= 50 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {question.correct_rate}% correct
                        </span>
                      )}
                    </div>
                  </div>

                  {question.options?.length > 0 ? (
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Pie Chart */}
                      <div className="w-full lg:w-1/2">
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={question.options}
                              dataKey="count"
                              nameKey="content"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              innerRadius={40}
                              label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                              labelLine={false}
                            >
                              {question.options.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name) => [value, name?.replace(/<[^>]*>/g, '').substring(0, 30)]}
                              contentStyle={{ 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: '12px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="w-full lg:w-1/2 space-y-2">
                        {question.options.map((opt, optIdx) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[optIdx % COLORS.length] }}
                            />
                            <span 
                              className="text-xs text-slate-600 line-clamp-1 flex-1 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: opt.content }}
                            />
                            <span className="text-xs font-medium text-slate-900">
                              {opt.count || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">
                      Text responses - view individual answers for details
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Empty state if no questions */}
          {(!summary?.questions || summary.questions.length === 0) && (
            <Card className="p-12">
              <EmptyState
                icon={BarChart3}
                title="No Summary Data"
                description="Submit some responses to see analytics and charts here"
              />
            </Card>
          )}
        </div>
      ) : activeTab === 'ai' ? (
        /* AI Insights Chat Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">AI Insights</h3>
                    <p className="text-sm text-slate-500">Tanya AI tentang data respons kamu</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Halo! Saya AI Assistant
                    </h3>
                    <p className="text-slate-500 max-w-md mb-6">
                      Saya bisa membantu menganalisis {responses.length} respons formulir ini. 
                      Tanyakan apapun tentang pola jawaban, insight, atau rekomendasi!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        'Berikan ringkasan keseluruhan',
                        'Pertanyaan mana yang paling sulit?',
                        'Apa insight utama dari data ini?',
                        'Rekomendasi perbaikan soal',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setChatInput(suggestion);
                            setTimeout(() => handleAIChat(), 100);
                          }}
                          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : msg.isError
                            ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-md'
                            : 'bg-slate-100 text-slate-900 rounded-bl-md'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div 
                            className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-slate-900"
                            dangerouslySetInnerHTML={{ 
                              __html: msg.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                                .replace(/• /g, '&bull; ')
                            }}
                          />
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-sm text-slate-500">Menganalisis data...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleAIChat} className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tanyakan sesuatu tentang respons..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                    disabled={chatLoading}
                  />
                  <Button 
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 bg-purple-600 hover:bg-purple-700"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Quick Stats
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Total Respons</span>
                  <span className="font-semibold text-slate-900">{responses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Rata-rata Skor</span>
                  <span className="font-semibold text-slate-900">
                    {(() => {
                      const scoresWithData = responses.filter(r => {
                        const score = parseFloat(r.score);
                        return !isNaN(score);
                      });
                      if (scoresWithData.length > 0) {
                        const avg = scoresWithData.reduce((sum, r) => sum + parseFloat(r.score), 0) / scoresWithData.length;
                        if (!isNaN(avg)) {
                          return `${Math.round(avg)}%`;
                        }
                      }
                      return 'N/A';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Rata-rata Waktu</span>
                  <span className="font-semibold text-slate-900">
                    {(() => {
                      const timesWithData = responses.filter(r => r.time_spent_seconds);
                      if (timesWithData.length > 0) {
                        const avg = timesWithData.reduce((sum, r) => sum + r.time_spent_seconds, 0) / timesWithData.length;
                        return formatDuration(Math.round(avg));
                      }
                      return 'N/A';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Jumlah Pertanyaan</span>
                  <span className="font-semibold text-slate-900">{form?.questions?.length || summary?.questions?.length || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium text-slate-900 mb-3">💡 Coba Tanyakan</h4>
              <div className="space-y-2">
                {[
                  'Analisis pola kesalahan siswa',
                  'Soal mana dengan jawaban paling beragam?',
                  'Berapa persen siswa yang lulus?',
                  'Buat rekomendasi remedial',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setChatInput(q);
                      setTimeout(() => handleAIChat(), 100);
                    }}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Student Answer Detail Modal */}
      <Modal 
        isOpen={!!selectedSession} 
        onClose={closeModal}
        title={`Answers: ${selectedSession?.respondent_name || 'Anonymous'}`}
        size="xl"
      >
        {loadingDetail ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading answers...</p>
          </div>
        ) : sessionDetail ? (
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Score Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {sessionDetail.session?.respondent_name || 'Anonymous'}
                  </h3>
                  {sessionDetail.session?.respondent_email && (
                    <p className="text-sm text-slate-500">{sessionDetail.session.respondent_email}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">
                    Submitted: {sessionDetail.session?.submitted_at 
                      ? new Date(sessionDetail.session.submitted_at).toLocaleString('id-ID') 
                      : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  {sessionDetail.session?.score !== null && sessionDetail.session?.score !== undefined ? (
                    <div>
                      <div className={`text-4xl font-bold ${
                        sessionDetail.session.score >= 80 
                          ? 'text-emerald-600'
                          : sessionDetail.session.score >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {Math.round(sessionDetail.session.score)}
                      </div>
                      <div className="text-sm text-slate-500">Score</div>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-400">N/A</div>
                  )}
                </div>
              </div>
            </div>

            {/* Questions and Answers */}
            <div className="space-y-4">
              {sessionDetail.form?.questions?.map((question, qIndex) => {
                const studentResponse = sessionDetail.session?.responses?.find(
                  r => r.question_id === question.id
                );
                const isCorrect = studentResponse?.is_correct;
                const hasCorrectAnswer = question.correct_answer || question.options?.some(o => o.is_correct);

                return (
                  <div 
                    key={question.id} 
                    className={`p-4 rounded-xl border-2 ${
                      isCorrect === true 
                        ? 'border-emerald-200 bg-emerald-50/50' 
                        : isCorrect === false 
                        ? 'border-red-200 bg-red-50/50'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-500">Q{qIndex + 1}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                            {question.type}
                          </span>
                          {question.points && (
                            <span className="text-xs text-slate-500">{question.points} pts</span>
                          )}
                        </div>
                        <p 
                          className="font-medium text-slate-900 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: question.content }} 
                        />
                      </div>
                      {hasCorrectAnswer && (
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          isCorrect === true 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isCorrect === false 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isCorrect === true ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Correct
                            </>
                          ) : isCorrect === false ? (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              Wrong
                            </>
                          ) : (
                            'Not graded'
                          )}
                        </div>
                      )}
                    </div>

                    {/* Options with correct/wrong indicators */}
                    {question.options?.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        {question.options.map((option) => {
                          const answer = studentResponse?.answer;
                          // Check if response matches option ID (new) or Content (legacy)
                          const isSelected = 
                            answer === option.id || 
                            answer === option.content ||
                            (Array.isArray(answer) && (answer.includes(option.id) || answer.includes(option.content)));
                            
                          const isCorrectOption = option.is_correct;

                          return (
                            <div 
                              key={option.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                isCorrectOption && isSelected
                                  ? 'bg-emerald-100 border-emerald-300'
                                  : isSelected && !isCorrectOption
                                  ? 'bg-red-100 border-red-300'
                                  : isCorrectOption && !isSelected
                                  ? 'bg-emerald-50 border-emerald-200 border-dashed'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              {/* Selection indicator */}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected 
                                  ? isCorrectOption 
                                    ? 'bg-emerald-500 border-emerald-500' 
                                    : 'bg-red-500 border-red-500'
                                  : isCorrectOption
                                  ? 'border-emerald-400'
                                  : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>

                              {/* Option content */}
                              <span 
                                className={`flex-1 prose prose-sm max-w-none ${
                                  isCorrectOption 
                                    ? 'text-emerald-800 font-medium' 
                                    : isSelected 
                                    ? 'text-red-800' 
                                    : 'text-slate-700'
                                }`}
                                dangerouslySetInnerHTML={{ __html: option.content }}
                              />

                              {/* Labels */}
                              {isCorrectOption && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full">
                                  ✓ Correct Answer
                                </span>
                              )}
                              {isSelected && !isCorrectOption && (
                                <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full">
                                  Student's Answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Text answer */
                      <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                        <p className="text-sm text-slate-500 mb-1">Student's Answer:</p>
                        {studentResponse?.answer ? (
                          <div 
                            className="text-slate-900 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: studentResponse.answer }} 
                          />
                        ) : (
                          <p className="italic text-slate-400">No answer</p>
                        )}
                      </div>
                    )}

                    {/* Points earned */}
                    {studentResponse?.points_earned !== null && studentResponse?.points_earned !== undefined && (
                      <div className="mt-3 text-sm text-slate-600">
                        Points earned: <span className="font-medium">{studentResponse.points_earned}</span> / {question.points || 10}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Failed to load answers
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <Button onClick={closeModal}>Close</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDeleteAll}
        title="Hapus Semua Respons?"
        message="Apakah Anda yakin ingin menghapus semua respons? Tindakan ini tidak dapat dibatalkan dan semua nilai siswa akan hilang."
        confirmText="Hapus Semua"
        type="danger"
        isLoading={deleting}
      />

      {/* Google Sheets Modal */}
      <Modal
        isOpen={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        title={sheetStatus.linked ? "Pengaturan Spreadsheet" : "Pilih tujuan respons"}
        maxWidth="max-w-md"
      >
        {sheetStatus.loading ? (
           <div className="flex justify-center items-center py-12">
             <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
           </div>
        ) : sheetStatus.linked ? (
           <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start gap-3">
                 <div className="p-2 bg-green-100 rounded-lg">
                   <FileSpreadsheet className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                    <h4 className="font-medium text-green-900">Terhubung ke Spreadsheet</h4>
                    <p className="text-sm text-green-700 mt-1 mb-2">
                      Respons baru akan otomatis dikirim ke spreadsheet ini.
                    </p>
                    <a 
                      href={sheetStatus.spreadsheet_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-green-700 hover:text-green-800 underline flex items-center gap-1"
                    >
                      Buka Spreadsheet <ArrowLeft className="w-3 h-3 rotate-180" />
                    </a>
                 </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100">
                 <h4 className="text-sm font-medium text-slate-900">Tindakan</h4>
                 <Button 
                   onClick={handleSheetSync} 
                   disabled={sheetConnecting}
                   className="w-full justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                 >
                   {sheetConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-green-600" />}
                   Sinkronisasi Ulang Semua Respons
                 </Button>
                 
                 <Button 
                   onClick={handleSheetUnlink}
                   disabled={sheetConnecting}
                   variant="outline"
                   className="w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                 >
                   Putuskan Hubungan (Unlink)
                 </Button>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowSheetModal(false)}>Tutup</Button>
              </div>
           </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
               Buat Google Spreadsheet baru untuk menyimpan respons formulir ini secara otomatis.
              </p>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-900 mb-2">Nama Spreadsheet</label>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <input 
                        type="text" 
                        className="flex-1 w-full text-sm outline-none text-slate-700 placeholder:text-slate-400"
                        value={`(Respons) ${form?.title || 'Untitled Form'}`}
                        readOnly
                      />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                      Spreadsheet akan otomatis dibuat di akun Google Drive yang terhubung.
                  </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setShowSheetModal(false)}
                disabled={sheetConnecting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSheetConnect}
                disabled={sheetConnecting}
                className="bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm gap-2"
              >
                {sheetConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                Buat Spreadsheet
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default FormResponses;
