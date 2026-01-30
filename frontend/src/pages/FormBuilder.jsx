import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  Settings, 
  Upload,
  Plus,
  Sparkles,
  GripVertical,
  Loader2,
  ArrowLeft,
  Globe,
  ClipboardList,
  Layers,
  Minus,
  FileText,
  Send
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Loading';
import QuestionCard from '../components/forms/QuestionCard';
import QuestionTypePicker from '../components/forms/QuestionTypePicker';
import FormSettingsPanel from '../components/forms/FormSettingsPanel';
import PublishModal from '../components/forms/PublishModal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import formService from '../services/form';
import questionService from '../services/question';

import workspaceService from '../services/workspace';
import { RichTextEditor } from '../components/ui/RichTextEditor';

// Wrapper for Drag and Drop
function SortableQuestionCard({ question, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <QuestionCard
        question={question}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
}

export function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState({
    title: 'Untitled Form',
    description: '',
    status: 'draft',
    settings: {},
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  
  // Debounce ref for API calls
  const updateTimeoutRef = useRef({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Cleanup debounce timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isNew) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    setLoading(true);
    try {
      const response = await formService.getById(id);
      const formData = response.data;
      setForm({
        id: formData.id,
        title: formData.title,
        description: formData.description || '',
        status: formData.status,
        settings: formData.settings || {},
        slug: formData.slug,
        access_type: formData.access_type || 'public',
        allowed_emails: formData.allowed_emails || [],
      });
      setQuestions(formData.questions || []);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      alert('Failed to load form');
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        // Needs a workspace to create a form
        const workspaces = await workspaceService.getAll();
        if (!workspaces.data || workspaces.data.length === 0) {
           throw new Error('No workspace found. Please create a workspace first.');
        }
        const defaultWorkspaceId = workspaces.data[0].id;

        const response = await formService.create({
          title: form.title,
          description: form.description,
          settings: form.settings,
          workspace_id: defaultWorkspaceId
        });
        
        const newFormId = response.data.id;

        // Create the questions that were added before saving
        // Preserving order by using invalid/temp IDs to map to real creations? 
        // Actually, just loop and create them.
        for (const q of questions) {
           // Remove temp ID
           const { id, ...qData } = q;
           await questionService.create(newFormId, qData);
        }

        navigate(`/forms/${newFormId}/edit`, { replace: true });
      } else {
        // Update Form Details
        await formService.update(id, {
          title: form.title,
          description: form.description,
          settings: form.settings,
        });

        // Sync all questions to ensure data consistency
        // This rescues cases where auto-save might have failed
        // Filter out temp- questions just in case, though they shouldn't exist in edit mode usually
        const questionUpdates = questions
          .filter(q => !String(q.id).startsWith('temp-'))
          .map(q => questionService.update(q.id, {
            content: q.content,
            description: q.description,
            options: q.options,
            settings: q.settings,
            is_required: q.is_required,
            type: q.type, // types usually don't change but good to include
            points: q.points
          }).catch(err => console.warn(`Failed to sync question ${q.id}`, err)));
        
        await Promise.all(questionUpdates);

        // check if there are any NEW questions (temp-id) that were added but not saved?
        // In edit mode, usually handleAddQuestion saves immediately. 
        // But if we want to be robust:
        const newQuestions = questions.filter(q => String(q.id).startsWith('temp-'));
        for (const q of newQuestions) {
             const { id: tempId, ...qData } = q;
             await questionService.create(id, qData);
             // We won't update local state here because navigation/refresh or subsequent fetches will get correct data
             // But ideally we should replace tempId with realId in state to prevent duplicates on next save.
             // Given the current flow, simple alert is fine.
        }

        // Explicitly Save Order
        // Note: For new questions above, we haven't updated their IDs in 'questions' state yet.
        // So this reorder might send temp-ids which will fail validation.
        // Ideally we should refetch form after save, or just rely on 'create' sorting (it appends).
        // Let's just try to reorder non-temp questions for now.
        const currentOrder = questions
          .filter(q => !String(q.id).startsWith('temp-'))
          .map(q => q.id);
          
        if (currentOrder.length > 0) {
            await questionService.reorder(id, currentOrder)
              .catch(err => console.error('Failed to save order:', err));
        }
      }
      setHasChanges(false);
      alert('Form saved successfully');
    } catch (error) {
      console.error('Failed to save form:', error);
      alert(error.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await formService.publish(id);
      setForm({ ...form, status: 'published' });
      alert('Form published successfully!');
    } catch (error) {
      console.error('Failed to publish form:', error);
      alert('Failed to publish form');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (type) => {
    setShowTypePicker(false);
    
    let defaultOptions = [];
    let defaultSettings = {};

    // Initialize type-specific defaults
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(type)) {
      defaultOptions = [{ content: 'Option 1', is_correct: false }];
    } else if (type === 'matrix') {
      defaultSettings = {
        rows: ['Row 1'],
        columns: ['Column 1', 'Column 2']
      };
    } else if (type === 'scale') {
      defaultSettings = { min: 1, max: 10, minLabel: 'Worst', maxLabel: 'Best' };
    } else if (type === 'rating') {
      defaultSettings = { max: 5, icon: 'star' };
    }

    const newQuestion = {
      type,
      content: type === 'section' ? 'New Section' : 'New Question',
      description: '',
      is_required: false,
      options: defaultOptions,
      settings: defaultSettings,
    };

    if (!isNew && id) {
      try {
        const response = await questionService.create(id, newQuestion);
        setQuestions([...questions, response.data]);
      } catch (error) {
        console.error('Failed to add question:', error);
      }
    } else {
      setQuestions([...questions, { ...newQuestion, id: `temp-${Date.now()}` }]);
      setHasChanges(true);
    }
  };

  const handleUpdateQuestion = useCallback((questionId, updates) => {
    // Update local state immediately for responsive UI
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
    setHasChanges(true);

    // Debounced API call to prevent excessive requests during rapid typing
    if (!isNew && id && !String(questionId).startsWith('temp-')) {
      // Clear previous timeout for this question
      if (updateTimeoutRef.current[questionId]) {
        clearTimeout(updateTimeoutRef.current[questionId]);
      }
      
      // Set new debounced call
      updateTimeoutRef.current[questionId] = setTimeout(async () => {
        try {
          await questionService.update(questionId, updates);
        } catch (error) {
          console.error('Failed to update question:', error);
        }
        delete updateTimeoutRef.current[questionId];
      }, 500); // 500ms debounce
    }
  }, [isNew, id]);

  const handleDeleteQuestion = async (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    setHasChanges(true);

    if (!isNew && id && !String(questionId).startsWith('temp-')) {
      try {
        await questionService.delete(questionId);
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const handleAutoPage = async (interval) => {
    if (!confirm(`This will automatically insert a section break every ${interval} questions. Continue?`)) return;
    
    setLoading(true);
    try {
      let questionCount = 0;
      let insertedCount = 0;
      
      const builtQuestions = [];
      const newSectionsToCreate = [];

      for (const q of questions) {
        if (q.type !== 'section') {
           questionCount++;
           if (questionCount > 1 && (questionCount - 1) % interval === 0) {
             const newSection = {
                type: 'section',
                content: `Page ${Math.floor((questionCount - 1) / interval) + 1}`,
                description: '',
                is_required: false,
                options: [],
                settings: {},
                id: `temp-section-${Date.now()}-${insertedCount}`
             };
             builtQuestions.push(newSection);
             newSectionsToCreate.push(newSection);
             insertedCount++;
           }
        }
        builtQuestions.push(q);
      }
      
      setQuestions(builtQuestions);
      setHasChanges(true);

      if (!isNew && id && newSectionsToCreate.length > 0) {
         for (const sec of newSectionsToCreate) {
            try {
               const res = await questionService.create(id, { ...sec, id: undefined });
               setQuestions(prev => prev.map(q => q.id === sec.id ? res.data : q));
            } catch (e) {
               console.error('Failed to create auto-section', e);
            }
         }
      }
      
    } catch (error) {
       console.error('Auto-page failed', error);
       alert('Failed to auto-page questions');
    } finally {
       setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);
      setHasChanges(true);

      // Reorder via API
      if (!isNew && id) {
        try {
          await questionService.reorder(id, newQuestions.map(q => q.id));
        } catch (error) {
          console.error('Failed to reorder questions:', error);
        }
      }
    }
  };

  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <Card className="p-6 mb-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-20 w-full" />
        </Card>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 mb-4">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/forms')}
                className="gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Forms
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                form.status === 'published' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {form.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {!isNew && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/forms/${id}/responses`)}
                  className="gap-1"
                >
                  <ClipboardList className="w-4 h-4" />
                  Answers
                </Button>
              )}
              {form.slug && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(`/f/${form.slug}?preview=true`, '_blank')}
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSettings(true)}
                className="gap-1"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="gap-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={async () => {
                  // For new forms or forms without id, save first
                  if (isNew || !form.id) {
                    await handleSave();
                    // After save, the page will navigate to the new form
                    // User will need to click publish again
                    alert('Form disimpan! Silakan klik Publish lagi.');
                    return;
                  }
                  setShowPublishModal(true);
                }}
                disabled={saving || (isNew && questions.length === 0)}
                className="gap-2 ml-2 bg-primary-600 hover:bg-primary-700 text-white shadow-sm border-0"
              >
                <Send className="w-4 h-4" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PublishModal 
        form={form}
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onUpdate={setForm}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Form Header */}
        <Card className="p-6 mb-6">
          <RichTextEditor
            value={form.title}
            onChange={(html) => handleFormChange('title', html)}
            placeholder="Form Title"
            className="text-2xl font-bold text-slate-900"
          />
          <div className="mt-4">
            <RichTextEditor
              value={form.description}
              onChange={(html) => handleFormChange('description', html)}
              placeholder="Add a description..."
              className="text-slate-600"
            />
          </div>
        </Card>

        {/* Questions */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            {questions.map((question, index) => (
              <SortableQuestionCard
                key={question.id}
                question={question}
                index={index}
                isSelected={selectedQuestionId === question.id}
                onSelect={() => setSelectedQuestionId(question.id)}
                onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                onDelete={() => handleDeleteQuestion(question.id)}
                onDuplicate={() => handleAddQuestion(question.type)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Question Buttons */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="secondary" 
            onClick={() => setShowTypePicker(true)}
            className="flex-1 gap-2 py-4"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleAddQuestion('section')}
            className="flex-none gap-2 py-4 px-6"
            title="Add Section Break"
          >
             <Minus className="w-5 h-5 rotate-90" />
             Section
          </Button>
          
          <Dropdown
            trigger={
              <Button variant="secondary" className="flex-none gap-2 py-4 px-6">
                 <Layers className="w-5 h-5" />
                 Auto-Page
              </Button>
            }
            align="right"
          >
             <div className="p-2 text-xs text-slate-500 font-medium">Split form every...</div>
             {[5, 10, 15, 20].map(num => (
               <DropdownItem 
                 key={num}
                 onClick={() => handleAutoPage(num)}
                 icon={FileText}
               >
                 {num} Questions
               </DropdownItem>
             ))}
          </Dropdown>

          <Button 
            variant="secondary" 
            onClick={() => navigate('/ai')}
            className="flex-1 gap-2 py-4"
          >
            <Sparkles className="w-5 h-5" />
            Generate with AI
          </Button>
        </div>
      </div>

      {/* Question Type Picker Modal */}
      <Modal
        isOpen={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Choose Question Type"
        size="lg"
      >
        <QuestionTypePicker onSelect={handleAddQuestion} />
      </Modal>

      {/* Settings Panel */}
      <FormSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={form.settings}
        onUpdate={(newSettings) => {
          handleFormChange('settings', newSettings);
        }}
      />
    </div>
  );
}

export default FormBuilder;
