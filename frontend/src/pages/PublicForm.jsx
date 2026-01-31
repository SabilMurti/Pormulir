import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Loader2,
  XCircle,
  Trophy,
  Cloud  // Added Cloud icon
} from 'lucide-react';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loading';
import publicFormService from '../services/publicForm';
import { useAuthStore } from '../stores/authStore';
import authService from '../services/auth';

// Helper to strip HTML for non-rich-text compatible inputs (like Select options)
const stripHtml = (html) => {
  if (!html) return '';
  // Basic strip for display
  return String(html).replace(/<[^>]+>/g, '');
};

export function PublicForm() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  
  // Auth Store
  const { user, token, isAuthenticated, setAuth, logout, fetchUser } = useAuthStore();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [startTime] = useState(Date.now());
  const [respondentInfo, setRespondentInfo] = useState({
    name: '',
    email: '',
  });

  // Re-hydrate auth state if token exists but user is missing
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  useEffect(() => {
    fetchForm();
  }, [slug]);

  // Auto-fill respondent info if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setRespondentInfo({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [isAuthenticated, user]);

  const questions = form?.questions || [];
  const progress = questions.length > 0 
    ? Math.round((Object.keys(answers).length / questions.length) * 100) 
    : 0;

  // Memoize pages to prevent re-shuffling on re-renders
  const pages = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
    // Safety check for form availability
    const formTitle = form?.title || '';
    const formDescription = form?.description || '';
    
    const _pages = [];
    let _currentPageQuestions = [];
    let _currentSection = { 
      title: formTitle, 
      description: formDescription, 
      settings: {} 
     };

    questions.forEach((q) => {
      if (q.type === 'section') {
        if (_currentPageQuestions.length > 0) {
          _pages.push({ section: _currentSection, questions: _currentPageQuestions });
        }
        _currentSection = { 
          title: q.content, 
          description: q.description,
          settings: q.settings || {} 
        };
        _currentPageQuestions = [];
      } else {
        _currentPageQuestions.push(q);
      }
    });
    
    // Push last page
    if (_currentPageQuestions.length > 0 || _pages.length === 0) {
      _pages.push({ section: _currentSection, questions: _currentPageQuestions });
    }

    // Apply Shuffling per Page
    _pages.forEach(page => {
      if (page.section.settings?.shuffle_questions) {
        // Fisher-Yates Shuffle
        for (let i = page.questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [page.questions[i], page.questions[j]] = [page.questions[j], page.questions[i]];
        }
      }
    });

    return _pages;
  }, [questions, form?.title, form?.description]);

  const activePage = Math.min(Math.max(0, currentQuestion), Math.max(0, pages.length - 1));
  const pageData = pages.length > 0 ? pages[activePage] : null;

  const fetchForm = async () => {
    setLoading(true);
    try {
      const response = await publicFormService.getBySlug(slug, isPreview);
      setForm(response.form || response.data || response);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error;
      
      if (errorCode === 'CLOSED') {
        setError('Formulir ini sudah ditutup dan tidak menerima respons lagi.');
      } else if (errorCode === 'DRAFT') {
        setError('Formulir ini belum dipublikasikan.');
      } else if (error.response?.status === 404 || errorCode === 'NOT_FOUND') {
        setError('Formulir tidak ditemukan atau sudah tidak tersedia.');
      } else if (errorCode === 'LOGIN_REQUIRED') {
        setError('Login diperlukan untuk mengakses formulir ini.');
      } else if (errorCode === 'RESTRICTED_ACCESS') {
        setError('Anda tidak memiliki akses ke formulir ini.');
      } else if (errorCode === 'MAX_RESPONSES_REACHED') {
        setError('Formulir ini sudah mencapai batas maksimal respons dan tidak menerima jawaban baru.');
      } else if (errorCode === 'ALREADY_SUBMITTED') {
        setError('Anda sudah pernah mengisi formulir ini. Setiap orang hanya dapat mengirim satu respons.');
      } else {
        setError(errorMessage || 'Gagal memuat formulir. Silakan coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Save current URL to redirect back after login
      localStorage.setItem('redirect_url', window.location.href);

      const url = await authService.getGoogleAuthUrl();
      // Full page redirect for seamless experience (mobile friendly)
      window.location.href = url;
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to initialize login');
    }
  };

  const handleLogout = async () => {
    await logout();
    // Clear info
    setRespondentInfo({ name: '', email: '' });
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate required questions
    const requiredQuestions = form.questions?.filter(q => q.is_required) || [];
    const missingRequired = requiredQuestions.filter(q => !answers[q.id]);
    
    if (missingRequired.length > 0) {
      alert('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    try {
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      const response = await publicFormService.submit(slug, {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          question_id: questionId,
          value: value,
        })),
        respondent_name: respondentInfo.name || null,
        respondent_email: respondentInfo.email || null,
        duration: duration,
      });

      setSubmitted(true);
      setForm(prev => ({ ...prev, submissionResult: response }));
    } catch (error) {
      console.error('Failed to submit response:', error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      
      if (errorCode === 'MAX_RESPONSES_REACHED') {
        setError('Formulir ini sudah mencapai batas maksimal respons.');
        setSubmitted(false);
      } else if (errorCode === 'ALREADY_SUBMITTED') {
        setError('Anda sudah pernah mengisi formulir ini.');
        setSubmitted(false);
      } else if (errorCode === 'LOGIN_REQUIRED') {
        alert('Anda perlu login untuk mengirim respons.');
      } else {
        alert(errorMessage || 'Gagal mengirim respons. Silakan coba lagi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // Require Login Screen
  if (form.settings?.general?.require_login && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cloud className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{form.title}</h1>
          <p className="text-slate-600 mb-8">
            This form requires you to sign in with Google to verify your identity.
          </p>
          <Button onClick={handleGoogleLogin} size="lg" className="w-full gap-2 justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const questions = form.questions || [];
    const result = form.submissionResult || {};
    const showCorrectAnswers = result.show_correct_answers;
    const answersReview = result.answers_review || [];
    
    // Helper to get review data for a question
    const getReviewData = (questionId) => {
      return answersReview.find(r => r.question_id === questionId);
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        {/* Success Header */}
        <div className={`${result.passed === false ? 'bg-red-500' : 'bg-emerald-500'} text-white py-8`}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                {result.passed === false ? (
                  <XCircle className="w-8 h-8" />
                ) : (
                  <CheckCircle className="w-8 h-8" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Response Submitted!</h1>
                <p className={`${result.passed === false ? 'text-red-100' : 'text-emerald-100'} mt-1`}>
                  {form.settings?.thank_you_message || 'Your response has been recorded successfully.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Response Review */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Score Card (if score is available) */}
          {result.score !== undefined && (
            <div className={`${result.passed === false ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} rounded-2xl border p-6 mb-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${result.passed === false ? 'bg-red-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                    <Trophy className={`w-7 h-7 ${result.passed === false ? 'text-red-600' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Your Score</p>
                    <p className={`text-3xl font-bold ${result.passed === false ? 'text-red-600' : 'text-emerald-600'}`}>
                      {Math.round(result.score)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {result.earned_points !== undefined && (
                    <p className="text-sm text-slate-500">
                      {result.earned_points} / {result.total_points} points
                    </p>
                  )}
                  {result.passed !== undefined && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      result.passed 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.passed ? 'Passed' : 'Not Passed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className={`${showCorrectAnswers ? 'bg-blue-50 border-blue-200' : 'bg-slate-200 border-slate-300'} rounded-xl p-4 mb-6 flex items-center gap-3`}>
            <AlertCircle className={`w-5 h-5 ${showCorrectAnswers ? 'text-blue-500' : 'text-slate-500'} flex-shrink-0`} />
            <p className={`text-sm ${showCorrectAnswers ? 'text-blue-700' : 'text-slate-600'}`}>
              {showCorrectAnswers 
                ? 'Review your answers below. Correct answers are shown in green, incorrect in red.'
                : 'Your response has been recorded. You can review your answers below but cannot make changes.'
              }
            </p>
          </div>

          {/* Form Title */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <div 
                  className="font-semibold text-slate-900 prose prose-p:my-0 max-w-none" 
                  dangerouslySetInnerHTML={{ __html: form.title }} 
                />
                {form.description && (
                  <div 
                    className="text-sm text-slate-500 mt-1 prose prose-sm prose-p:my-0 max-w-none" 
                    dangerouslySetInnerHTML={{ __html: form.description }} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Respondent Info (if collected) */}
          {form.settings?.general?.collect_email && (respondentInfo.name || respondentInfo.email) && (
            <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mb-6 opacity-80">
              <h3 className="font-medium text-slate-500 mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {respondentInfo.name && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                    <div className="bg-slate-200 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-600">
                      {respondentInfo.name}
                    </div>
                  </div>
                )}
                {respondentInfo.email && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                    <div className="bg-slate-200 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-600">
                      {respondentInfo.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions with Submitted Answers */}
          {questions.map((question, index) => {
            const reviewData = getReviewData(question.id);
            const isCorrect = reviewData?.is_correct;
            const hasReview = showCorrectAnswers && reviewData;
            
            // Determine border color based on correct/incorrect
            let borderClass = 'border-slate-200';
            let bgClass = 'bg-slate-100';
            if (hasReview && isCorrect !== null) {
              borderClass = isCorrect ? 'border-emerald-300' : 'border-red-300';
              bgClass = isCorrect ? 'bg-emerald-50' : 'bg-red-50';
            }
            
            return (
              <div 
                key={question.id}
                className={`${bgClass} rounded-2xl border ${borderClass} p-6 mb-4`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                    hasReview && isCorrect !== null
                      ? isCorrect 
                        ? 'bg-emerald-200 text-emerald-700'
                        : 'bg-red-200 text-red-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {hasReview && isCorrect !== null ? (
                      isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start gap-1">
                      <div 
                        className="font-medium text-slate-700 prose prose-sm prose-p:my-0 max-w-none" 
                        dangerouslySetInnerHTML={{ __html: question.content }} 
                      />
                      {question.is_required && <span className="text-slate-400 ml-1 select-none">*</span>}
                    </div>
                    {question.description && (
                      <div 
                        className="text-sm text-slate-400 mt-1 prose prose-sm prose-p:my-0 max-w-none" 
                        dangerouslySetInnerHTML={{ __html: question.description }} 
                      />
                    )}
                    {/* Points indicator */}
                    {hasReview && reviewData.points_earned !== null && (
                      <p className={`text-xs mt-1 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                        {reviewData.points_earned} / {question.points || 10} points
                      </p>
                    )}
                  </div>
                </div>

                {/* Read-only Answer Display */}
                <div className="pl-11">
                  {renderSubmittedAnswerWithReview(question, answers[question.id], reviewData, showCorrectAnswers)}
                </div>
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            {form.settings?.general?.allow_resubmit && (
              <Button 
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                }}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Another Response
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }



  const handleNext = () => {
     if (!pageData) return;
     // Validate current page
     const requiredQuestions = pageData.questions.filter(q => q.is_required);
     const missing = requiredQuestions.filter(q => {
       const val = answers[q.id];
       return val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
     });

     if (missing.length > 0) {
       alert('Please answer all required questions on this page.');
       return;
     }
     
     setCurrentQuestion(activePage + 1);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
     setCurrentQuestion(activePage - 1);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div 
                className="font-semibold text-slate-900 prose prose-sm prose-p:my-0 prose-headings:my-0 prose-blockquote:my-0 prose-blockquote:border-l-2 max-w-none line-clamp-1" 
                dangerouslySetInnerHTML={{ __html: form.title }} 
              />
            </div>
            {form.settings?.exam_mode?.enabled && form.settings?.exam_mode?.time_limit_minutes && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {form.settings.exam_mode.time_limit_minutes} min
                </span>
              </div>
            )}
          </div>
          {/* Progress Bar - only show if setting enabled */}
          {(form.settings?.general?.show_progress !== false) && (
            <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Form Title Card with Auth Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 border-t-[10px] border-t-primary-600">
          {/* Title & Description */}
          <div className="p-6">
            <div 
              className="text-3xl font-normal text-slate-900 mb-2 prose prose-2xl prose-p:my-0 prose-headings:my-0 prose-blockquote:border-l-primary-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-700 max-w-none" 
              dangerouslySetInnerHTML={{ __html: form.title }} 
            />
            {form.description && (
              <div 
                className="text-sm text-slate-600 prose prose-sm prose-p:my-1 prose-blockquote:border-l-primary-600 prose-blockquote:pl-3 max-w-none" 
                dangerouslySetInnerHTML={{ __html: form.description }} 
              />
            )}
          </div>

          {/* Auth Status Header */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
            {isAuthenticated && user ? (
              // Logged In State
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">{user.email}</span>
                  <button 
                    onClick={handleLogout} 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Ganti akun
                  </button>
                </div>
              </>
            ) : (
              // Not Logged In State
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                <span className="text-sm text-slate-500">Masuk ke Google untuk menyimpan progres.</span>
                <button 
                   onClick={handleGoogleLogin}
                   className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium text-left sm:text-center"
                >
                  Masuk dengan Google
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Respondent Info (Only show if email collection is on AND user is NOT logged in) */}
        {form.settings?.general?.collect_email && !isAuthenticated && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="font-medium text-slate-900 mb-4">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name {form.settings?.require_name && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  className="input"
                  value={respondentInfo.name}
                  onChange={(e) => setRespondentInfo({ ...respondentInfo, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email {form.settings?.require_email && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  className="input"
                  value={respondentInfo.email}
                  onChange={(e) => setRespondentInfo({ ...respondentInfo, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        {pageData ? (
           <div>
              {/* Page Header (if different from Form Header or if it's a Section) */}
              {activePage > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 border-t-[5px] border-t-purple-500">
                   <div 
                      className="text-2xl font-normal text-slate-900 mb-2 prose prose-lg prose-p:my-0 prose-blockquote:border-l-purple-600 prose-blockquote:pl-4 prose-blockquote:italic max-w-none" 
                      dangerouslySetInnerHTML={{ __html: pageData.section.title }} 
                   />
                   {pageData.section.description && (
                     <div 
                       className="text-sm text-slate-600 prose prose-sm prose-p:my-0 prose-blockquote:border-l-purple-600 prose-blockquote:pl-3 max-w-none" 
                       dangerouslySetInnerHTML={{ __html: pageData.section.description }} 
                     />
                   )}
                </div>
              )}

              {/* Questions for Current Page */}
              {pageData.questions.map((question, index) => (
               <div 
                 key={question.id}
                 className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4"
               >
                 <div className="flex items-start gap-3 mb-4">
                   <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600">
                     {/* Calculate global index using question ID match in main list to stay consistent */}
                     {questions.findIndex(q => q.id === question.id) + 1}
                   </span>
                  <div className="flex-1">
                     <div className="flex items-start gap-1">
                       <div 
                         className="font-medium text-slate-900 prose prose-slate prose-p:my-0 prose-headings:my-0 prose-p:leading-normal max-w-none"
                         dangerouslySetInnerHTML={{ __html: question.content }}
                       />
                       {question.is_required && <span className="text-red-500 mt-1 select-none">*</span>}
                     </div>
                     {question.description && (
                       <div 
                          className="text-sm text-slate-500 mt-1 prose prose-sm prose-p:my-0 max-w-none" 
                          dangerouslySetInnerHTML={{ __html: question.description }} 
                       />
                     )}
                   </div>
                 </div>

                 <div className="pl-11">
                   {renderQuestionInput(question, answers[question.id], (value) => handleAnswerChange(question.id, value))}
                 </div>
               </div>
              ))}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                {activePage > 0 && (
                  <Button 
                    size="lg"
                    variant="secondary"
                    onClick={handleBack}
                    className="gap-2 px-8"
                  >
                    Back
                  </Button>
                )}
                <div className="flex-1"></div>
                {activePage < pages.length - 1 ? (
                  <Button 
                    size="lg"
                    onClick={handleNext}
                    className="gap-2 px-8"
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                   size="lg"
                   onClick={handleSubmit}
                   disabled={submitting}
                   className="gap-2 px-12"
                  >
                   {submitting ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin" />
                       Submitting...
                     </>
                   ) : (
                     <>
                       <Send className="w-5 h-5" />
                       Submit
                     </>
                   )}
                  </Button>
                )}
              </div>
           </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No questions available in this form.
          </div>
        )}
      </div>
    </div>
  );
}



function renderQuestionInput(question, value, onChange) {
  const type = question.type;

  switch (type) {
    case 'short_text':
      return (
        <input
          type="text"
          className="input"
          placeholder="Your answer..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'long_text':
      return (
        <textarea
          className="input"
          rows={4}
          placeholder="Your answer..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            // Use ID if available, otherwise fallback to content (legacy)
            const optionValue = option.id || option.content || option.text || option;
            const isSelected = value === optionValue;
            
            return (
              <label 
                key={option.id || i}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={isSelected}
                    onChange={() => onChange(optionValue)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-primary-500'
                      : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                </div>
                <div 
                  className="text-slate-700 prose prose-sm prose-p:my-0 max-w-none"
                  dangerouslySetInnerHTML={{ __html: option.content || option.text || option }} 
                />
              </label>
            );
          })}
        </div>
      );

    case 'checkbox':
    case 'checkboxes':
      const checkboxValue = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            // Use ID if available
            const optionValue = option.id || option.content || option.text || option;
            const isChecked = checkboxValue.includes(optionValue);
            return (
              <label 
                key={option.id || i}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        onChange(checkboxValue.filter(v => v !== optionValue));
                      } else {
                        onChange([...checkboxValue, optionValue]);
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isChecked
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-slate-300'
                  }`}>
                    {isChecked && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <div 
                  className="text-slate-700 prose prose-sm prose-p:my-0 max-w-none"
                  dangerouslySetInnerHTML={{ __html: option.content || option.text || option }} 
                />
              </label>
            );
          })}
        </div>
      );

    case 'dropdown':
      return (
        <select
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an option...</option>
          {question.options?.map((option, i) => {
            const optionValue = option.content || option.text || option;
            const plainText = stripHtml(optionValue);
            return (
              <option key={option.id || i} value={optionValue}>
                {plainText}
              </option>
            );
          })}
        </select>
      );

    case 'rating':
      const max = question.settings?.max || 5;
      return (
        <div className="flex gap-2">
          {[...Array(max)].map((_, i) => (
            <button
              key={i}
              onClick={() => onChange(i + 1)}
              className={`w-12 h-12 rounded-lg border-2 font-medium transition-all ${
                value === i + 1
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      );

    case 'linear_scale':
      const min = question.settings?.min || 1;
      const scaleMax = question.settings?.max || 10;
      return (
        <div className="flex flex-wrap gap-2">
          {[...Array(scaleMax - min + 1)].map((_, i) => {
            const num = min + i;
            return (
              <button
                key={num}
                onClick={() => onChange(num)}
                className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                  value === num
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'email':
      return (
        <input
          type="email"
          className="input"
          placeholder="your@email.com"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          className="input"
          placeholder="Enter a number..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'phone':
      return (
        <input
          type="tel"
          className="input"
          placeholder="+62 812 3456 7890"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return (
        <input
          type="text"
          className="input"
          placeholder="Your answer..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

// Function to render submitted answers in read-only mode with gray styling
function renderSubmittedAnswer(question, value) {
  const type = question.type;
  
  // Common style for read-only display
  const readOnlyStyle = "bg-slate-200 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-600";
  
  // If no answer provided
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className={`${readOnlyStyle} italic text-slate-400`}>
        No answer provided
      </div>
    );
  }

  switch (type) {
    case 'short_text':
    case 'long_text':
    case 'email':
    case 'phone':
    case 'number':
    case 'date':
    case 'time':
      return (
        <div className={readOnlyStyle}>
          {value}
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            // Use ID if available
            const optionValue = option.id || option.content || option.text || option;
            const isSelected = value === optionValue;
            return (
              <div
                key={option.id || i}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                  isSelected
                    ? 'border-slate-400 bg-slate-200'
                    : 'border-slate-200 bg-slate-100 opacity-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'border-slate-500'
                    : 'border-slate-300'
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  )}
                </div>
                <div 
                  className={isSelected ? 'text-slate-700 prose prose-sm max-w-none' : 'text-slate-400 prose prose-sm max-w-none'}
                  dangerouslySetInnerHTML={{ __html: option.content || option.text || option }}
                />
              </div>
            );
          })}
        </div>
      );

    case 'checkbox':
    case 'checkboxes':
      const checkboxValue = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            // Use ID if available
            const optionValue = option.id || option.content || option.text || option;
            const isChecked = checkboxValue.includes(optionValue);
            return (
              <div
                key={option.id || i}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                  isChecked
                    ? 'border-slate-400 bg-slate-200'
                    : 'border-slate-200 bg-slate-100 opacity-50'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isChecked
                    ? 'border-slate-500 bg-slate-500'
                    : 'border-slate-300'
                }`}>
                  {isChecked && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
                <div 
                  className={isChecked ? 'text-slate-700 prose prose-sm max-w-none' : 'text-slate-400 prose prose-sm max-w-none'}
                  dangerouslySetInnerHTML={{ __html: option.content || option.text || option }}
                />
              </div>
            );
          })}
        </div>
      );

    case 'dropdown':
      return (
        <div className={readOnlyStyle}>
          {value}
        </div>
      );

    case 'rating':
      const max = question.settings?.max || 5;
      return (
        <div className="flex gap-2">
          {[...Array(max)].map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-lg border-2 font-medium flex items-center justify-center ${
                value === i + 1
                  ? 'border-slate-500 bg-slate-500 text-white'
                  : 'border-slate-200 bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      );

    case 'linear_scale':
      const min = question.settings?.min || 1;
      const scaleMax = question.settings?.max || 10;
      return (
        <div className="flex flex-wrap gap-2">
          {[...Array(scaleMax - min + 1)].map((_, i) => {
            const num = min + i;
            return (
              <div
                key={num}
                className={`w-10 h-10 rounded-lg border-2 text-sm font-medium flex items-center justify-center ${
                  value === num
                    ? 'border-slate-500 bg-slate-500 text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {num}
              </div>
            );
          })}
        </div>
      );

    default:
      return (
        <div className={readOnlyStyle}>
          {typeof value === 'object' ? JSON.stringify(value) : value}
        </div>
      );
  }
}

// Function to render submitted answers with review (showing correct/incorrect)
function renderSubmittedAnswerWithReview(question, value, reviewData, showCorrectAnswers) {
  const type = question.type;
  const isCorrect = reviewData?.is_correct;
  const correctAnswer = reviewData?.correct_answer;
  
  // If not showing correct answers, use the regular read-only display
  if (!showCorrectAnswers || !reviewData) {
    return renderSubmittedAnswer(question, value);
  }
  
  // Common styles
  const correctStyle = "bg-emerald-100 border border-emerald-300 rounded-lg px-4 py-2.5 text-emerald-700";
  const incorrectStyle = "bg-red-100 border border-red-300 rounded-lg px-4 py-2.5 text-red-700";
  const neutralStyle = "bg-slate-200 border border-slate-300 rounded-lg px-4 py-2.5 text-slate-600";
  
  // Handle no answer
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className="space-y-2">
        <div className={incorrectStyle + " italic"}>
          No answer provided
        </div>
        {correctAnswer && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700">Correct answer: <strong>{typeof correctAnswer === 'object' ? JSON.stringify(correctAnswer) : correctAnswer}</strong></span>
          </div>
        )}
      </div>
    );
  }

  switch (type) {
    case 'short_text':
    case 'long_text':
    case 'email':
    case 'phone':
    case 'number':
    case 'date':
    case 'time':
      return (
        <div className="space-y-2">
          <div className={isCorrect ? correctStyle : incorrectStyle}>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{value}</span>
            </div>
          </div>
          {!isCorrect && correctAnswer && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Correct answer: <strong>{correctAnswer}</strong></span>
            </div>
          )}
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            const optionValue = option.content || option.text || option;
            const isSelected = value === optionValue;
            const isCorrectOption = correctAnswer === optionValue;
            
            let optionClass = 'border-slate-200 bg-slate-100';
            if (isSelected && isCorrect) {
              optionClass = 'border-emerald-400 bg-emerald-100';
            } else if (isSelected && !isCorrect) {
              optionClass = 'border-red-400 bg-red-100';
            } else if (isCorrectOption && !isCorrect) {
              optionClass = 'border-emerald-400 bg-emerald-50';
            }
            
            return (
              <div
                key={option.id || i}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${optionClass}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? isCorrect ? 'border-emerald-500' : 'border-red-500'
                    : isCorrectOption ? 'border-emerald-500' : 'border-slate-300'
                }`}>
                  {isSelected && (
                    <div className={`w-2.5 h-2.5 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  )}
                  {!isSelected && isCorrectOption && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className={
                  isSelected 
                    ? isCorrect ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
                    : isCorrectOption ? 'text-emerald-700 font-medium' : 'text-slate-500'
                }>
                  {optionValue}
                </span>
                {isSelected && isCorrect && (
                  <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />
                )}
                {isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                )}
                {!isSelected && isCorrectOption && !isCorrect && (
                  <span className="text-xs text-emerald-600 ml-auto">✓ Correct</span>
                )}
              </div>
            );
          })}
        </div>
      );

    case 'checkbox':
    case 'checkboxes':
      const checkboxValue = Array.isArray(value) ? value : [];
      const correctCheckboxValues = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
      
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => {
            const optionText = option.content || option.text || option;
            const isChecked = checkboxValue.includes(optionText);
            const isCorrectOption = correctCheckboxValues.includes(optionText);
            
            let optionClass = 'border-slate-200 bg-slate-100';
            if (isChecked && isCorrectOption) {
              optionClass = 'border-emerald-400 bg-emerald-100';
            } else if (isChecked && !isCorrectOption) {
              optionClass = 'border-red-400 bg-red-100';
            } else if (!isChecked && isCorrectOption) {
              optionClass = 'border-emerald-400 bg-emerald-50';
            }
            
            return (
              <div
                key={option.id || i}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${optionClass}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isChecked
                    ? isCorrectOption ? 'border-emerald-500 bg-emerald-500' : 'border-red-500 bg-red-500'
                    : isCorrectOption ? 'border-emerald-500' : 'border-slate-300'
                }`}>
                  {isChecked && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                  {!isChecked && isCorrectOption && (
                    <div className="w-2 h-2 bg-emerald-500 rounded-sm" />
                  )}
                </div>
                <span className={
                  isChecked 
                    ? isCorrectOption ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
                    : isCorrectOption ? 'text-emerald-700 font-medium' : 'text-slate-500'
                }>
                  {optionText}
                </span>
                {isChecked && !isCorrectOption && (
                  <span className="text-xs text-red-600 ml-auto">✗ Wrong</span>
                )}
                {!isChecked && isCorrectOption && (
                  <span className="text-xs text-emerald-600 ml-auto">✓ Correct</span>
                )}
              </div>
            );
          })}
        </div>
      );

    case 'dropdown':
      return (
        <div className="space-y-2">
          <div className={isCorrect ? correctStyle : incorrectStyle}>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{value}</span>
            </div>
          </div>
          {!isCorrect && correctAnswer && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Correct answer: <strong>{correctAnswer}</strong></span>
            </div>
          )}
        </div>
      );

    case 'rating':
    case 'linear_scale':
      return (
        <div className="space-y-2">
          <div className={isCorrect ? correctStyle : incorrectStyle}>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>Your answer: {value}</span>
            </div>
          </div>
          {!isCorrect && correctAnswer && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Correct answer: <strong>{correctAnswer}</strong></span>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <div className={isCorrect === null ? neutralStyle : (isCorrect ? correctStyle : incorrectStyle)}>
            {typeof value === 'object' ? JSON.stringify(value) : value}
          </div>
          {isCorrect === false && correctAnswer && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Correct answer: <strong>{typeof correctAnswer === 'object' ? JSON.stringify(correctAnswer) : correctAnswer}</strong></span>
            </div>
          )}
        </div>
      );
  }
}

export default PublicForm;
