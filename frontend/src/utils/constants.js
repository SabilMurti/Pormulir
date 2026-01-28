// API Configuration
export const API_BASE_URL = '/api';

// Question Types
export const QUESTION_TYPES = [
  { id: 'short_text', label: 'Short Text', icon: 'Type', description: 'Single line text input' },
  { id: 'long_text', label: 'Long Text', icon: 'AlignLeft', description: 'Multi-line text area' },
  { id: 'multiple_choice', label: 'Multiple Choice', icon: 'Circle', description: 'Single answer selection' },
  { id: 'checkboxes', label: 'Checkboxes', icon: 'CheckSquare', description: 'Multiple answers allowed' },
  { id: 'dropdown', label: 'Dropdown', icon: 'ChevronDown', description: 'Select from list' },
  { id: 'rating', label: 'Rating', icon: 'Star', description: 'Star rating scale' },
  { id: 'scale', label: 'Linear Scale', icon: 'Sliders', description: 'Numeric scale (1-10)' },
  { id: 'date', label: 'Date', icon: 'Calendar', description: 'Date picker' },
  { id: 'time', label: 'Time', icon: 'Clock', description: 'Time picker' },
  { id: 'file_upload', label: 'File Upload', icon: 'Upload', description: 'File attachment' },
  { id: 'section', label: 'Section', icon: 'Minus', description: 'Section divider' },
  { id: 'image', label: 'Image', icon: 'Image', description: 'Display image' },
  { id: 'video', label: 'Video', icon: 'Video', description: 'Embed video' },
  { id: 'matrix', label: 'Matrix', icon: 'Grid3x3', description: 'Grid/table format' },
];

// Form Statuses
export const FORM_STATUS = {
  draft: { label: 'Draft', color: 'neutral' },
  published: { label: 'Published', color: 'success' },
  closed: { label: 'Closed', color: 'warning' },
};

// Workspace Roles
export const WORKSPACE_ROLES = {
  owner: { label: 'Owner', color: 'primary' },
  editor: { label: 'Editor', color: 'success' },
  viewer: { label: 'Viewer', color: 'neutral' },
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', color: 'success' },
  { id: 'medium', label: 'Medium', color: 'warning' },
  { id: 'hard', label: 'Hard', color: 'error' },
];

// Languages
export const LANGUAGES = [
  { id: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
];

// Navigation Items
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/workspaces', label: 'Workspaces', icon: 'Folder' },
  { path: '/forms', label: 'Forms', icon: 'FileText' },
  { path: '/ai', label: 'AI Generator', icon: 'Sparkles' },
];

// Feature List (for Landing Page)
export const FEATURES = [
  {
    icon: 'FileText',
    title: '14 Question Types',
    description: 'From text inputs to matrix grids, we have all the question types you need.',
  },
  {
    icon: 'Sparkles',
    title: 'AI-Powered',
    description: 'Generate questions from topics or documents using Google Gemini AI.',
  },
  {
    icon: 'GraduationCap',
    title: 'Exam Mode',
    description: 'Timer, anti-cheat detection, auto-grading, and result analysis.',
  },
  {
    icon: 'BarChart3',
    title: 'Analytics',
    description: 'Get insights with response statistics and completion rates.',
  },
  {
    icon: 'Download',
    title: 'Export Data',
    description: 'Export responses to Excel or CSV with styled formatting.',
  },
  {
    icon: 'Users',
    title: 'Team Collaboration',
    description: 'Invite team members with role-based access control.',
  },
];
