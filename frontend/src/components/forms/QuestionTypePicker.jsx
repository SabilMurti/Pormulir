import { 
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
  Image,
  Video,
  Grid3x3,
} from 'lucide-react';

const questionTypes = [
  { 
    category: 'Text',
    items: [
      { id: 'short_text', label: 'Short Text', icon: Type, description: 'Single line text input' },
      { id: 'long_text', label: 'Long Text', icon: AlignLeft, description: 'Multi-line text area' },
    ]
  },
  {
    category: 'Choice',
    items: [
      { id: 'multiple_choice', label: 'Multiple Choice', icon: Circle, description: 'Single answer selection' },
      { id: 'checkboxes', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple answers allowed' },
      { id: 'dropdown', label: 'Dropdown', icon: ChevronDown, description: 'Select from dropdown list' },
    ]
  },
  {
    category: 'Rating',
    items: [
      { id: 'rating', label: 'Rating', icon: Star, description: 'Star rating (1-5)' },
      { id: 'scale', label: 'Linear Scale', icon: Sliders, description: 'Numeric scale (1-10)' },
    ]
  },
  {
    category: 'Date & Time',
    items: [
      { id: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
      { id: 'time', label: 'Time', icon: Clock, description: 'Time picker' },
    ]
  },
  {
    category: 'Media & Other',
    items: [
      { id: 'file_upload', label: 'File Upload', icon: Upload, description: 'File attachment' },
      { id: 'section', label: 'Section', icon: Minus, description: 'Section divider with title' },
      { id: 'image', label: 'Image', icon: Image, description: 'Display an image' },
      { id: 'video', label: 'Video', icon: Video, description: 'Embed a video' },
      { id: 'matrix', label: 'Matrix', icon: Grid3x3, description: 'Grid/table questions' },
    ]
  },
];

export function QuestionTypePicker({ onSelect }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {questionTypes.map((category) => (
        <div key={category.category}>
          <h4 className="text-sm font-medium text-slate-500 mb-3">{category.category}</h4>
          <div className="space-y-2">
            {category.items.map((type) => (
              <button
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors">
                  <type.icon className="w-5 h-5 text-slate-600 group-hover:text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{type.label}</div>
                  <div className="text-sm text-slate-500">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuestionTypePicker;
