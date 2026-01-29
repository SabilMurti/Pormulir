import { useEffect, useState } from 'react';
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
  Check
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import formService from '../services/form';
import responseService from '../services/response';

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

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [formRes, responsesRes, summaryRes] = await Promise.all([
        formService.getById(id),
        responseService.list(id).catch(() => ({ data: [] })),
        responseService.getSummary(id).catch(() => ({ data: null })),
      ]);

      setForm(formRes.data);
      setResponses(responsesRes.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL responses? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await responseService.deleteAll(id);
      setResponses([]);
      setSummary(null);
      alert('All responses have been deleted.');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete responses:', error);
      alert('Failed to delete responses');
    } finally {
      setDeleting(false);
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
      alert('Failed to load student answers');
    } finally {
      setLoadingDetail(false);
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
      a.download = `${form?.title || 'responses'}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export responses');
    } finally {
      setExporting(false);
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
      value: summary?.stats?.average_score ? `${summary.stats.average_score}%` : 'N/A', 
      icon: Trophy,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    { 
      label: 'Avg. Time', 
      value: formatDuration(summary?.stats?.average_time_seconds), 
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
            <Link to="/forms">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                Forms
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
                  alert('Link copied!');
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question summaries */}
          {summary?.questions?.map((question, i) => (
            <Card key={question.id}>
              <CardHeader>
                <h3 className="font-medium text-slate-900">
                  <span className="mr-1">{i + 1}.</span>
                  <span dangerouslySetInnerHTML={{ __html: question.content }} />
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500">{question.type}</span>
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
              </CardHeader>
              <CardContent>
                {question.options?.length > 0 ? (
                  <div className="space-y-2">
                    {question.options.map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between">
                        <span 
                          className="text-sm text-slate-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: opt.content }} 
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(opt.count / responses.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-900 w-8 text-right">
                            {opt.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Text responses - see individual answers</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                          const isSelected = studentResponse?.answer === option.content || 
                            (Array.isArray(studentResponse?.answer) && studentResponse.answer.includes(option.content));
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
    </div>
  );
}

export default FormResponses;
