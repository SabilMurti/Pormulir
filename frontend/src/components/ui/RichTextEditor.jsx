import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import CodeBlock from '@tiptap/extension-code-block';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Color } from '@tiptap/extension-color';
import {TextStyle} from '@tiptap/extension-text-style';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  RemoveFormatting,
  List,
  ListOrdered,
  Code,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  ChevronUp,
  Quote,
  Strikethrough,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  FileText,
  Table as TableIcon,
  Columns,
  Rows,
  Trash2,
  MoreHorizontal,
  Palette,
  Baseline,
  Droplet,
  Grid,
  Square,
  Maximize
} from 'lucide-react';
import { useCallback, useState, useEffect, useRef, memo, useMemo } from 'react';
import MediaUploadModal from './MediaUploadModal';

// Static Data moved outside components to prevent re-creation
const MATH_CATEGORIES = [
  {
    label: 'Operators',
    symbols: [
      { symbol: '±', name: 'Plus-minus' }, { symbol: '×', name: 'Multiply' },
      { symbol: '÷', name: 'Divide' }, { symbol: '·', name: 'Dot' },
      { symbol: '√', name: 'Square root' }, { symbol: '∛', name: 'Cube root' },
      { symbol: '∑', name: 'Sum' }, { symbol: '∏', name: 'Product' },
      { symbol: '∫', name: 'Integral' },
    ],
  },
  {
    label: 'Comparison',
    symbols: [
      { symbol: '≠', name: 'Not equal' }, { symbol: '≈', name: 'Approximately' },
      { symbol: '≤', name: 'Less or equal' }, { symbol: '≥', name: 'Greater or equal' },
      { symbol: '≪', name: 'Much less' }, { symbol: '≫', name: 'Much greater' },
      { symbol: '∝', name: 'Proportional' }, { symbol: '≡', name: 'Identical' },
    ],
  },
  {
    label: 'Greek Letters',
    symbols: [
      { symbol: 'α', name: 'Alpha' }, { symbol: 'β', name: 'Beta' },
      { symbol: 'γ', name: 'Gamma' }, { symbol: 'δ', name: 'Delta' },
      { symbol: 'θ', name: 'Theta' }, { symbol: 'λ', name: 'Lambda' },
      { symbol: 'π', name: 'Pi' }, { symbol: 'σ', name: 'Sigma' },
      { symbol: 'φ', name: 'Phi' }, { symbol: 'ω', name: 'Omega' },
      { symbol: 'Δ', name: 'Delta (cap)' }, { symbol: 'Σ', name: 'Sigma (cap)' },
    ],
  },
  {
    label: 'Set & Logic',
    symbols: [
      { symbol: '∈', name: 'Element of' }, { symbol: '∉', name: 'Not element' },
      { symbol: '⊂', name: 'Subset' }, { symbol: '⊃', name: 'Superset' },
      { symbol: '∪', name: 'Union' }, { symbol: '∩', name: 'Intersection' },
      { symbol: '∅', name: 'Empty set' }, { symbol: '∀', name: 'For all' },
      { symbol: '∃', name: 'Exists' }, { symbol: '∧', name: 'And' },
      { symbol: '∨', name: 'Or' }, { symbol: '¬', name: 'Not' },
    ],
  },
  {
    label: 'Constants & Misc',
    symbols: [
      { symbol: '∞', name: 'Infinity' }, { symbol: '°', name: 'Degree' },
      { symbol: '′', name: 'Prime' }, { symbol: '″', name: 'Double prime' },
      { symbol: '∂', name: 'Partial' }, { symbol: '∇', name: 'Nabla' },
      { symbol: '‰', name: 'Per mille' }, { symbol: '→', name: 'Arrow right' },
      { symbol: '←', name: 'Arrow left' }, { symbol: '↔', name: 'Arrow both' },
      { symbol: '⇒', name: 'Implies' }, { symbol: '⇔', name: 'If and only if' },
    ],
  },
  {
    label: 'Fractions',
    symbols: [
      { symbol: '½', name: 'One half' }, { symbol: '⅓', name: 'One third' },
      { symbol: '⅔', name: 'Two thirds' }, { symbol: '¼', name: 'One quarter' },
      { symbol: '¾', name: 'Three quarters' }, { symbol: '⅕', name: 'One fifth' },
      { symbol: '⅙', name: 'One sixth' }, { symbol: '⅛', name: 'One eighth' },
    ],
  },
];

const TABLE_COLORS = [
  { color: '#ffffff', name: 'Putih' },
  { color: '#f8fafc', name: 'Slate' },
  { color: '#fee2e2', name: 'Merah' },
  { color: '#fef3c7', name: 'Kuning' },
  { color: '#dcfce7', name: 'Hijau' },
  { color: '#dbeafe', name: 'Biru' },
  { color: '#f3e8ff', name: 'Ungu' },
];

// Simple Toolbar (default view)
const SimpleMenuBar = memo(({ editor, onExpand }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.isActive('link') ? editor.getAttributes('link').href : '';
    const url = window.prompt('URL', previousUrl);
    if (!url) {
      if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div 
      className="flex items-center gap-0.5 border-b border-slate-200 p-1.5 bg-slate-50 rounded-t-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Add Link">
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </ToolbarButton>

      <div className="flex-1" />
      <button
        onClick={onExpand}
        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
        type="button"
        title="More formatting options"
      >
        More
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
});

// Expanded Toolbar (all options)
// Expanded Toolbar (all options)
const ExpandedMenuBar = memo(({ editor, onCollapse, onAddMedia }) => {
  const borderColorPickerRef = useRef(null);
  const textColorPickerRef = useRef(null);

  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.isActive('link') ? editor.getAttributes('link').href : '';
    const url = window.prompt('URL', previousUrl);
    if (!url) {
      if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Optimize table check
  const isTableActive = editor.isActive('table');

  return (
    <div 
      className="border-b border-slate-200 bg-slate-50 rounded-t-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-100">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarDivider />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          title="Subscript"
        >
          <SubscriptIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          title="Superscript"
        >
          <SuperscriptIcon className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarDivider />
        
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Add Link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarDivider />

        <ToolbarButton onClick={() => onAddMedia('image')} title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => onAddMedia('video')} title="Insert Video">
          <YoutubeIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => onAddMedia('document')} title="Insert Document">
          <FileText className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />
        <button
          onClick={onCollapse}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
          type="button"
          title="Less options"
        >
          Less
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarDivider />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarDivider />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
        
        <MathSymbolsDropdown editor={editor} />
      </div>

      {isTableActive && (
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3 px-3 py-2 border-t border-slate-200 bg-slate-50">
           <div className="flex items-center gap-1 px-1.5 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
             <Grid className="w-3.5 h-3.5 text-slate-400 mr-1" />
             <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before" className="h-7 w-7">
                <Columns className="w-3.5 h-3.5" /><span className="text-[10px] text-primary-500">+</span>
             </ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After" className="h-7 w-7">
                <Columns className="w-3.5 h-3.5" /><span className="text-[10px] text-green-500">+</span>
             </ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column" className="h-7 w-7">
                <Columns className="w-3.5 h-3.5 text-red-400" />
             </ToolbarButton>
           </div>

           <div className="flex items-center gap-1 px-1.5 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
             <Grid className="w-3.5 h-3.5 text-slate-400 rotate-90 mr-1" />
             <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before" className="h-7 w-7">
                <Rows className="w-3.5 h-3.5" /><span className="text-[10px] text-primary-500">+</span>
             </ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After" className="h-7 w-7">
                <Rows className="w-3.5 h-3.5" /><span className="text-[10px] text-green-500">+</span>
             </ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row" className="h-7 w-7">
                <Rows className="w-3.5 h-3.5 text-red-400" />
             </ToolbarButton>
           </div>
           
           <div className="flex items-center gap-1 px-1.5 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
             <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Cells" className="h-7 px-2 text-xs">
                Gabung
             </ToolbarButton>
             <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} title="Split Cell" className="h-7 px-2 text-xs">
                Pisah
             </ToolbarButton>
           </div>

           <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
             <div className="flex gap-0.5">
                {TABLE_COLORS.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', c.color).run()}
                    className="w-5 h-5 rounded-sm border border-slate-200"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                    type="button"
                  />
                ))}
             </div>
             
             <ToolbarDivider />
             
             <div className="relative flex items-center">
                <ToolbarButton 
                  onClick={() => textColorPickerRef.current.click()} 
                  title="Warna Teks" 
                  className="h-7 w-7"
                >
                  <Baseline className="w-4 h-4" />
                </ToolbarButton>
                <input 
                  type="color" 
                  ref={textColorPickerRef}
                  className="absolute invisible w-0 h-0"
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                />
             </div>

             <ToolbarDivider />

             <div className="flex items-center gap-1">
                <div className="relative flex items-center">
                  <ToolbarButton 
                    onClick={() => borderColorPickerRef.current.click()}
                    title="Warna Border"
                    className="h-7 w-7"
                  >
                    <div className="w-3.5 h-3.5 border-2 border-slate-500 rounded-sm" />
                  </ToolbarButton>
                  <input 
                    type="color" 
                    ref={borderColorPickerRef}
                    className="absolute invisible w-0 h-0"
                    onChange={(e) => {
                      editor.chain().focus().setCellAttribute('borderColor', e.target.value).run();
                      editor.chain().focus().setCellAttribute('borderWidth', '1px').run();
                    }}
                  />
                </div>
                
                <div className="flex gap-0.5">
                  {[0, 1, 2, 4].map(w => (
                    <button
                      key={w}
                      onClick={() => editor.chain().focus().setCellAttribute('borderWidth', `${w}px`).run()}
                      className={`px-1.5 py-0.5 text-[9px] border border-slate-200 rounded font-bold ${w === 0 ? 'bg-red-50 text-red-600' : 'bg-white'}`}
                      type="button"
                    >
                      {w === 0 ? 'OFF' : `${w}px`}
                    </button>
                  ))}
                </div>
             </div>
           </div>
           
           <button 
             onClick={() => editor.chain().focus().deleteTable().run()} 
             className="h-9 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-semibold flex items-center gap-1 ml-auto"
             type="button"
           >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
           </button>
        </div>
      )}
    </div>
  );
});

// Math Symbols Dropdown Component
const MathSymbolsDropdown = memo(({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);

  const insertSymbol = useCallback((symbol) => {
    editor.chain().focus().insertContent(symbol).run();
    setIsOpen(false);
  }, [editor]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded hover:bg-slate-200 transition-colors flex items-center gap-0.5 ${
          isOpen ? 'bg-slate-200 text-slate-900' : 'text-slate-500'
        }`}
        title="Math Symbols"
        type="button"
      >
        <span className="text-sm font-medium">∑</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 p-2 w-72 max-h-80 overflow-y-auto custom-scrollbar">
            {MATH_CATEGORIES.map((category, catIndex) => (
              <div key={catIndex} className="mb-2 last:mb-0">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider px-1 mb-1">
                  {category.label}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {category.symbols.map((item, symIndex) => (
                    <button
                      key={symIndex}
                      onClick={() => insertSymbol(item.symbol)}
                      className="w-7 h-7 flex items-center justify-center text-lg hover:bg-primary-100 hover:text-primary-700 rounded transition-colors"
                      title={item.name}
                      type="button"
                    >
                      {item.symbol}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// Toolbar Button Component
const ToolbarButton = memo(({ onClick, active, title, children, className }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 ${
      active ? 'bg-slate-200 text-slate-900 border-b-2 border-primary-500' : 'text-slate-500'
    } ${className || ''}`}
    title={title}
    type="button"
  >
    {children}
  </button>
));

const ToolbarDivider = memo(() => (
  <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />
));

export function RichTextEditor({ value, onChange, onBlur, placeholder, className, isSimple = false }) {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const updateTimeoutRef = useRef(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Memoize extensions to prevent re-creation on every render
  const extensions = useMemo(() => [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      listItem: false,
      codeBlock: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-500 underline cursor-pointer',
      },
    }),
    BulletList,
    OrderedList,
    ListItem,
    CodeBlock.configure({
      HTMLAttributes: {
        class: 'bg-slate-800 text-slate-100 rounded-lg p-4 font-mono text-sm',
      },
    }),
    Highlight.configure({
      HTMLAttributes: {
        class: 'bg-yellow-200 px-0.5 rounded',
      },
    }),
    Subscript,
    Superscript,
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full my-4',
      },
    }),
    TableRow,
    TableHeader.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {}
              return { style: `background-color: ${attributes.backgroundColor}` }
            },
          },
          borderColor: {
            default: '#cbd5e1',
            parseHTML: element => element.style.borderColor || null,
            renderHTML: attributes => {
              if (!attributes.borderColor) return {}
              return { style: `border-color: ${attributes.borderColor}` }
            },
          },
          borderWidth: {
            default: '1px',
            parseHTML: element => element.style.borderWidth || null,
            renderHTML: attributes => {
              if (!attributes.borderWidth) return {}
              return { style: `border-width: ${attributes.borderWidth}; border-style: solid` }
            },
          },
        }
      },
      renderHTML({ HTMLAttributes }) {
        return ['th', HTMLAttributes, 0];
      },
    }).configure({
      HTMLAttributes: {
        class: 'p-2 font-bold text-left bg-slate-100',
      },
    }),
    TableCell.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              if (!attributes.backgroundColor) return {}
              return { style: `background-color: ${attributes.backgroundColor}` }
            },
          },
          borderColor: {
            default: '#cbd5e1',
            parseHTML: element => element.style.borderColor || null,
            renderHTML: attributes => {
              if (!attributes.borderColor) return {}
              return { style: `border-color: ${attributes.borderColor}` }
            },
          },
          borderWidth: {
            default: '1px',
            parseHTML: element => element.style.borderWidth || null,
            renderHTML: attributes => {
              if (!attributes.borderWidth) return {}
              return { style: `border-width: ${attributes.borderWidth}; border-style: solid` }
            },
          },
        }
      },
    }).configure({
      HTMLAttributes: {
        class: 'p-2 relative vertical-top',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TextStyle,
    Color,
    Placeholder.configure({
      placeholder: placeholder || 'Type something...',
      emptyEditorClass: 'is-editor-empty',
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto my-4 border border-slate-200 shadow-sm',
      },
    }),
    Youtube.configure({
      controls: true,
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'w-full aspect-video rounded-lg overflow-hidden my-4 border border-slate-200 bg-slate-100',
      },
    }),
  ], [placeholder]); // Only re-create if placeholder changes

  const editor = useEditor({
    extensions,
    content: value || '',
    onUpdate: ({ editor }) => {
      // Debounced update to prevent lag
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        if (html !== value) {
          onChange && onChange(html);
        }
      }, 300); // Optimized to 300ms
    },
    onFocus: () => setIsFocused(true),
    onBlur: ({ editor: blurEditor }) => {
      setIsFocused(false);
      // Send final update on blur to ensure data is saved
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (blurEditor) {
        const html = blurEditor.getHTML();
        if (html !== value) {
          onChange && onChange(html);
        }
      }
      onBlur && onBlur();
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[1.5em] ${className || ''}`,
      },
    },
  });

  /* Media Handler */
  const [mediaConfig, setMediaConfig] = useState({ open: false, type: 'all' });

  const handleMediaInsert = (media) => {
    if (media.type === 'image') {
      editor.chain().focus().setImage({ src: media.public_url }).run();
    } else if (media.type === 'video') {
       editor.chain().focus().setYoutubeVideo({ src: media.url }).run();
    } else if (media.type === 'document') {
       // Insert nicely formatted link for document
       const content = `
        <div class="not-prose my-2">
          <a href="${media.public_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 hover:border-slate-300 transition-all group text-decoration-none shadow-sm">
            <div class="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="flex flex-col text-left">
              <span class="font-medium text-slate-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-1 max-w-[200px]">${media.original_name}</span>
              <span class="text-xs text-slate-500 font-normal mt-0.5">${media.human_size || 'Document'}</span>
            </div>
          </a>
        </div>
       `;
       editor.chain().focus().insertContent(content).run();
    }
    setMediaConfig({ ...mediaConfig, open: false });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`relative ${isFocused ? 'ring-2 ring-primary-500 rounded-lg' : 'hover:ring-1 hover:ring-slate-300 rounded-lg transition-all'}`}>
      <style>{`
        .ProseMirror {
          min-height: 100px;
          outline: none;
        }
        /* Table Styles (Responsive & Pretty) */
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5rem 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .ProseMirror table td, 
        .ProseMirror table th {
          min-width: 1em;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror table th {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
        }
        .ProseMirror table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(45, 126, 231, 0.1);
          pointer-events: none;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: auto;
          cursor: col-resize;
        }
        /* Custom Cell Colors Support */
        .ProseMirror table td[style*="background-color"],
        .ProseMirror table th[style*="background-color"] {
           /* Ensure text is readable on colored backgrounds */
        }
      `}</style>

      {/* Toolbar - hanya muncul saat fokus */}
      <div className={`transition-all duration-200 ${isFocused ? 'opacity-100 visible' : 'opacity-0 invisible h-0 overflow-hidden'}`}>
        {isExpanded ? (
          <ExpandedMenuBar 
            editor={editor} 
            onCollapse={() => setIsExpanded(false)} 
            onAddMedia={(type) => setMediaConfig({ open: true, type })}
          />
        ) : (
          <SimpleMenuBar editor={editor} onExpand={() => setIsExpanded(true)} />
        )}
      </div>
      
      {/* Scrollable Container for Table Responsiveness */}
      <div className="overflow-x-auto custom-scrollbar">
        <EditorContent editor={editor} className="p-3" />
      </div>

      {/* Media Upload Modal */}
      {mediaConfig.open && (
        <MediaUploadModal 
          type={mediaConfig.type} 
          onClose={() => setMediaConfig({ ...mediaConfig, open: false })}
          onSelect={handleMediaInsert}
        />
      )}
    </div>
  );
}

export default RichTextEditor;
