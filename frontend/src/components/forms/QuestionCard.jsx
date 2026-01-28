import { 
  GripVertical, 
  Trash2, 
  Copy, 
  MoreVertical,
  Type,
  AlignLeft,
  Circle,
  CheckSquare,
  ChevronDown,
  Star,
  Sliders,
  Calendar,
  Clock,
  Upload,
  Minus,
  Image as ImageIcon,
  Video,
  Grid3x3,
  Plus,
  X,
  Link,
  Table
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn, generateId } from '../../utils/helpers';
import { Input, Textarea } from '../ui/Input';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';
import Button from '../ui/Button';
import { RichTextEditor } from '../ui/RichTextEditor';

const questionTypeIcons = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: Circle,
  checkboxes: CheckSquare,
  dropdown: ChevronDown,
  rating: Star,
  scale: Sliders,
  date: Calendar,
  time: Clock,
  file_upload: Upload,
  section: Minus,
  image: ImageIcon,
  video: Video,
  matrix: Grid3x3,
};

const questionTypeLabels = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  multiple_choice: 'Multiple Choice',
  checkboxes: 'Checkboxes',
  dropdown: 'Dropdown',
  rating: 'Rating',
  scale: 'Linear Scale',
  date: 'Date',
  time: 'Time',
  file_upload: 'File Upload',
  section: 'Section',
  image: 'Image',
  video: 'Video',
  matrix: 'Matrix',
};

// Sub-component for Option Editing
const OptionEditor = ({ value, onUpdate, placeholder }) => {
  const contentRef = useRef(value);

  const handleChange = (html) => {
    contentRef.current = html;
  };

  const handleBlur = () => {
    if (contentRef.current !== value) {
      onUpdate(contentRef.current);
    }
  };

  return (
    <RichTextEditor
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="text-sm min-h-[2.5rem]"
    />
  );
};

export function QuestionCard({ 
  question, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  dragHandleProps,
}) {
  const [localContent, setLocalContent] = useState(question.content || '');
  const [localDescription, setLocalDescription] = useState(question.description || '');
  
  useEffect(() => {
    setLocalContent(question.content || '');
    setLocalDescription(question.description || '');
  }, [question.content, question.description]);

  const Icon = questionTypeIcons[question.type] || Type;

  const handleContentBlur = () => {
    if (localContent !== question.content) {
      onUpdate({ content: localContent });
    }
  };

  const handleDescriptionBlur = () => {
    if (localDescription !== question.description) {
      onUpdate({ description: localDescription });
    }
  };

  const handleUpdateSettings = (settings) => {
    onUpdate({ settings: { ...(question.settings || {}), ...settings } });
  };

  // Option Handlers
  const handleAddOption = () => {
    const newOption = { id: generateId(), content: '', is_correct: false };
    onUpdate({ options: [...(question.options || []), newOption] });
  };

  const handleUpdateOption = (optionId, content) => {
    onUpdate({
      options: question.options.map(opt =>
        opt.id === optionId ? { ...opt, content } : opt
      ),
    });
  };

  const handleDeleteOption = (optionId) => {
    onUpdate({
      options: question.options.filter(opt => opt.id !== optionId),
    });
  };

  const handleToggleCorrect = (optionId) => {
    onUpdate({
      options: question.options.map(opt =>
        opt.id === optionId 
          ? { ...opt, is_correct: !opt.is_correct }
          : question.type === 'multiple_choice' 
            ? { ...opt, is_correct: false }
            : opt
      ),
    });
  };

  // Matrix Handlers
  const handleMatrixAdd = (field) => {
    const currentList = question.settings?.[field] || [];
    handleUpdateSettings({ [field]: [...currentList, `${field === 'rows' ? 'Row' : 'Column'} ${currentList.length + 1}`] });
  };

  const handleMatrixUpdate = (field, index, value) => {
    const newList = [...(question.settings?.[field] || [])];
    newList[index] = value;
    handleUpdateSettings({ [field]: newList });
  };

  const handleMatrixDelete = (field, index) => {
    const newList = [...(question.settings?.[field] || [])];
    newList.splice(index, 1);
    handleUpdateSettings({ [field]: newList });
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'bg-white rounded-xl border-2 transition-all cursor-pointer group',
        isSelected 
          ? 'border-primary-500 shadow-lg shadow-primary-100' 
          : 'border-transparent shadow-md hover:border-slate-200'
      )}
    >
      {/* Header */}
      {/* ... keep header ... */}
      <div className={cn(
        "flex items-start gap-2 p-4 pb-2",
        question.type === 'section' && "bg-slate-50 rounded-t-xl border-b border-slate-100"
      )}>
        {/* Drag Handle */}
        <button
          {...dragHandleProps}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Type Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
          <Icon className="w-3.5 h-3.5" />
          {questionTypeLabels[question.type]}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Required Toggle (Hidden for some types) */}
        {!['section', 'image', 'video'].includes(question.type) && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={question.is_required || false}
              onChange={(e) => onUpdate({ is_required: e.target.checked })}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            Required
          </label>
        )}

        {/* Menu */}
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            align="right"
          >
            <DropdownItem icon={Copy} onClick={onDuplicate}>Duplicate</DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={Trash2} danger onClick={onDelete}>Delete</DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3 pt-2">
        {/* Question Text */}
        <div onClick={e => e.stopPropagation()}>
            <RichTextEditor
              value={localContent}
              onChange={setLocalContent}
              onBlur={handleContentBlur}
              placeholder={question.type === 'section' ? "Section Title" : "Type your question here..."}
              className={question.type === 'section' ? "text-2xl font-bold" : "text-lg font-medium"}
            />
        </div>

        {/* Description - Optional: Keep as plain text or upgrade? Request says "judul question maupun option". Didn't explicitly say description. Keeping plain text for simplicity unless asked. */}
        <div onClick={e => e.stopPropagation()}>
           <RichTextEditor
              value={localDescription}
              onChange={setLocalDescription}
              onBlur={handleDescriptionBlur}
              placeholder="Add description (optional)"
              className="text-sm text-slate-500"
           />
        </div>

        {/* Section Shuffle Toggle */}
        {question.type === 'section' && (
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input 
                type="checkbox"
                checked={question.settings?.shuffle_questions || false}
                onChange={(e) => handleUpdateSettings({ shuffle_questions: e.target.checked })}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Shuffle questions in this section
            </label>
          </div>
        )}

        {/* --- TYPE SPECIFIC RENDERERS --- */}

        {/* Options for Multiple Choice / Checkboxes / Dropdown */}
        {['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type) && (
          <div className="space-y-2 mt-4">
            {question.options?.map((option, index) => (
              <div key={option.id} className="flex items-start gap-2 group/option">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCorrect(option.id);
                  }}
                  className={cn(
                    'mt-2 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    question.type === 'checkboxes' && 'rounded',
                    option.is_correct
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 hover:border-slate-400'
                  )}
                  title="Mark as correct answer"
                >
                  {option.is_correct && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                {/* Option Editor */}
                <div className="flex-1" onClick={e => e.stopPropagation()}>
                    <OptionEditor 
                        value={option.content} 
                        onUpdate={(val) => handleUpdateOption(option.id, val)}
                        placeholder={`Option ${index + 1}`}
                    />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteOption(option.id);
                  }}
                  className="mt-2 p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover/option:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddOption();
                }}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add option
              </button>
              
              {question.options?.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete all options?')) {
                      onUpdate({ options: [] });
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}



        {/* Rating */}
        {question.type === 'rating' && (
          <div className="flex items-center gap-1 mt-4">
             <div className="flex items-center gap-2 mb-2 w-full">
                <span className="text-sm text-slate-500">Max Rating:</span>
                <select 
                    className="input w-20 py-1"
                    value={question.settings?.max || 5}
                    onChange={(e) => handleUpdateSettings({ max: parseInt(e.target.value) })}
                    onClick={(e) => e.stopPropagation()}
                >
                    {[3,4,5,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>
             <div className="flex gap-1">
                {[...Array(question.settings?.max || 5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-slate-300" />
                ))}
            </div>
          </div>
        )}

        {/* Scale */}
        {question.type === 'scale' && (
          <div className="mt-4 space-y-4">
             <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Min Label</label>
                    <input 
                        className="input w-full text-sm" 
                        value={question.settings?.minLabel || ''} 
                        onChange={(e) => handleUpdateSettings({ minLabel: e.target.value })}
                        placeholder="Worst"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Max Label</label>
                    <input 
                        className="input w-full text-sm" 
                        value={question.settings?.maxLabel || ''} 
                        onChange={(e) => handleUpdateSettings({ maxLabel: e.target.value })}
                        placeholder="Best"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
             </div>
            <div className="flex items-center justify-between px-2">
                <span className="text-sm text-slate-500">{question.settings?.min || 1}</span>
                <div className="flex-1 mx-4 flex gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <div key={num} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-xs text-slate-500">{num}</div>
                    ))}
                    ...
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-xs text-slate-500">{question.settings?.max || 10}</div>
                </div>
                <span className="text-sm text-slate-500">{question.settings?.max || 10}</span>
            </div>
          </div>
        )}

        {/* Matrix */}
        {question.type === 'matrix' && (
            <div className="mt-4 grid md:grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">Rows</label>
                        <button onClick={(e) => { e.stopPropagation(); handleMatrixAdd('rows'); }} className="text-primary-600 hover:text-primary-700">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {question.settings?.rows?.map((row, i) => (
                            <div key={i} className="flex gap-2">
                                <input 
                                    className="input py-1 px-2 text-sm" 
                                    value={row} 
                                    onChange={(e) => handleMatrixUpdate('rows', i, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleMatrixDelete('rows', i); }} className="text-slate-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase text-slate-500">Columns</label>
                        <button onClick={(e) => { e.stopPropagation(); handleMatrixAdd('columns'); }} className="text-primary-600 hover:text-primary-700">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2">
                         {question.settings?.columns?.map((col, i) => (
                            <div key={i} className="flex gap-2">
                                <input 
                                    className="input py-1 px-2 text-sm" 
                                    value={col} 
                                    onChange={(e) => handleMatrixUpdate('columns', i, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleMatrixDelete('columns', i); }} className="text-slate-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Image / Video */}
        {['image', 'video'].includes(question.type) && (
            <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                    <input 
                        className="input flex-1"
                        placeholder={question.type === 'image' ? "Enter Image URL..." : "Enter Video URL (YouTube)..."}
                        value={question.settings?.url || ''}
                        onChange={(e) => handleUpdateSettings({ url: e.target.value })}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
                {question.settings?.url && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 min-h-[200px] flex items-center justify-center relative group/preview">
                        {question.type === 'image' ? (
                            <img src={question.settings.url} alt="Preview" className="max-h-[400px] w-auto mx-auto object-contain" />
                        ) : (
                            <div className="aspect-video w-full max-w-lg mx-auto bg-black">
                                <iframe 
                                    src={question.settings.url.replace('watch?v=', 'embed/')} 
                                    className="w-full h-full" 
                                    frameBorder="0" 
                                    allowFullScreen 
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Simple Type Previews */}
        {question.type === 'short_text' && <input disabled className="w-full input bg-slate-50 mt-2" placeholder="Short answer text" />}
        {question.type === 'long_text' && <textarea disabled className="w-full input bg-slate-50 mt-2 resize-none" rows={3} placeholder="Long answer text" />}
        {question.type === 'date' && <input type="date" disabled className="input bg-slate-50 w-48 mt-2" />}
        {question.type === 'time' && <input type="time" disabled className="input bg-slate-50 w-36 mt-2" />}
        {question.type === 'file_upload' && (
          <div className="mt-2 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default QuestionCard;
