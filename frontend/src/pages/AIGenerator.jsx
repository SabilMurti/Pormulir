import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Loader2, 
  Check,
  Plus,
  RefreshCw,
  Wand2
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import aiService from '../services/ai';
import formService from '../services/form';

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'rating', label: 'Rating' },
  { value: 'linear_scale', label: 'Linear Scale' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'mixed', label: 'Mixed / Auto (AI Choice)' },
];

const TEMPLATES = [
  { label: 'Customer Feedback', topic: 'Customer satisfaction survey for product feedback', count: 10 },
  { label: 'Job Interview', topic: 'Technical interview questions for software developer position', count: 8 },
  { label: 'Course Quiz', topic: 'Quiz about programming fundamentals and basic concepts', count: 15 },
  { label: 'Event Registration', topic: 'Event registration form with attendee details', count: 8 },
];

export function AIGenerator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('topic'); // 'topic' or 'file'
  const [topic, setTopic] = inputState('');
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    count: 5,
    type: 'multiple_choice',
    difficulty: 'medium',
    language: 'id',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [forms, setForms] = useState([]);
  const [targetFormId, setTargetFormId] = useState('');
  const [addingToForm, setAddingToForm] = useState(false);

  // Custom useState with input handling
  function inputState(initialValue) {
    const [value, setValue] = useState(initialValue);
    return [value, setValue];
  }

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await formService.getAll();
      setForms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'topic' && !topic.trim()) {
      alert('Please enter a topic');
      return;
    }
    if (mode === 'file' && !file) {
      alert('Please upload a file');
      return;
    }

    setGenerating(true);
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    
    try {
      let response;
      
      if (mode === 'topic') {
        response = await aiService.generate({
          topic: topic,
          count: options.count,
          type: options.type,
          difficulty: options.difficulty,
          language: options.language,
        });
      } else {
        response = await aiService.generateFromFile(file, {
          count: options.count,
          type: options.type,
          difficulty: options.difficulty,
          language: options.language,
        });
      }

      const questions = response?.questions || response || [];
      setGeneratedQuestions(questions);
      setSelectedQuestions(questions.map((_, i) => i));
    } catch (error) {
      console.error('Failed to generate questions:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to generate questions. Please try again.';
      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleTemplateClick = (template) => {
    setTopic(template.topic);
    setOptions({ ...options, count: template.count });
  };

  const toggleQuestionSelection = (index) => {
    setSelectedQuestions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAddToForm = async () => {
    if (!targetFormId) {
      alert('Please select a form');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    setAddingToForm(true);
    try {
      const questionsToAdd = selectedQuestions.map(i => generatedQuestions[i]);
      
      // Add questions to form via API
      for (const question of questionsToAdd) {
        await formService.addQuestion(targetFormId, question);
      }

      alert(`Added ${questionsToAdd.length} questions to form!`);
      navigate(`/forms/${targetFormId}/edit`);
    } catch (error) {
      console.error('Failed to add questions:', error);
      alert('Failed to add questions to form');
    } finally {
      setAddingToForm(false);
    }
  };

  const handleCreateNewForm = async () => {
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    setAddingToForm(true);
    try {
      // Create new form
      const formResponse = await formService.create({
        title: topic || 'AI Generated Form',
        description: `Form generated from topic: ${topic}`,
      });

      const formId = formResponse.data.id;
      const questionsToAdd = selectedQuestions.map(i => generatedQuestions[i]);
      
      // Add questions to form
      for (const question of questionsToAdd) {
        await formService.addQuestion(formId, question);
      }

      navigate(`/forms/${formId}/edit`);
    } catch (error) {
      console.error('Failed to create form:', error);
      alert('Failed to create form');
    } finally {
      setAddingToForm(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Question Generator</h1>
            <p className="text-slate-600">Generate questions using Google Gemini AI</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-6">
          {/* Mode Selection */}
          <Card className="p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('topic')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  mode === 'topic' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                From Topic
              </button>
              <button
                onClick={() => setMode('file')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  mode === 'file' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-5 h-5 inline mr-2" />
                From File
              </button>
            </div>
          </Card>

          {/* Input Area */}
          <Card className="p-6">
            {mode === 'topic' ? (
              <>
                <Textarea
                  label="Describe your topic"
                  placeholder="e.g., Customer satisfaction survey for an e-commerce website..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                />
                
                {/* Quick Templates */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quick Templates
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((template, i) => (
                      <button
                        key={i}
                        onClick={() => handleTemplateClick(template)}
                        className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                {file ? (
                  <p className="font-medium text-slate-900">{file.name}</p>
                ) : (
                  <>
                    <p className="font-medium text-slate-900">Click to upload a file</p>
                    <p className="text-sm text-slate-500 mt-1">PDF, DOC, DOCX, or TXT</p>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Options */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Number of Questions
                </label>
                <select
                  className="input"
                  value={options.count}
                  onChange={(e) => setOptions({ ...options, count: parseInt(e.target.value) })}
                >
                  {[3, 5, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n} questions</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Question Type
                </label>
                <select
                  className="input"
                  value={options.type}
                  onChange={(e) => setOptions({ ...options, type: e.target.value })}
                >
                  {QUESTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Difficulty
                </label>
                <select
                  className="input"
                  value={options.difficulty}
                  onChange={(e) => setOptions({ ...options, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Language
                </label>
                <select
                  className="input"
                  value={options.language}
                  onChange={(e) => setOptions({ ...options, language: e.target.value })}
                >
                  <option value="id">Indonesian</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full mt-6 gap-2"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Questions
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right: Results */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Generated Questions
                  {generatedQuestions.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({selectedQuestions.length}/{generatedQuestions.length} selected)
                    </span>
                  )}
                </h3>
                {generatedQuestions.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGenerate}
                    disabled={generating}
                    className="gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                  <p className="text-slate-600">Generating questions with AI...</p>
                </div>
              ) : generatedQuestions.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {generatedQuestions.map((question, index) => (
                    <div
                      key={index}
                      onClick={() => toggleQuestionSelection(index)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedQuestions.includes(index)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          selectedQuestions.includes(index)
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-slate-300'
                        }`}>
                          {selectedQuestions.includes(index) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {index + 1}. {question.content || question.question || question.text}
                          </p>
                          {question.options && question.options.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {question.options.map((opt, i) => {
                                const isCorrect = typeof opt === 'object' && opt.is_correct;
                                const optContent = typeof opt === 'string' ? opt : opt.text || opt.content;
                                return (
                                  <div 
                                    key={i} 
                                    className={`flex items-center gap-2 text-sm ${
                                      isCorrect ? 'text-emerald-700 font-medium' : 'text-slate-600'
                                    }`}
                                  >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                      isCorrect 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {isCorrect ? '✓' : String.fromCharCode(65 + i)}
                                    </span>
                                    <span>{optContent}</span>
                                    {isCorrect && (
                                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        Jawaban Benar
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="font-medium text-slate-900">No questions yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter a topic and click generate to create questions
                  </p>
                </div>
              )}

              {/* Actions */}
              {generatedQuestions.length > 0 && selectedQuestions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex gap-3">
                    <select
                      className="input flex-1"
                      value={targetFormId}
                      onChange={(e) => setTargetFormId(e.target.value)}
                    >
                      <option value="">Select a form...</option>
                      {forms.map(form => (
                        <option key={form.id} value={form.id}>{form.title}</option>
                      ))}
                    </select>
                    <Button 
                      onClick={handleAddToForm}
                      disabled={!targetFormId || addingToForm}
                    >
                      {addingToForm ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Form'}
                    </Button>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full gap-2"
                    onClick={handleCreateNewForm}
                    disabled={addingToForm}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Form with Selected
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AIGenerator;
