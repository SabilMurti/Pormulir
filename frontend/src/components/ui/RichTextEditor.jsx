import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, RemoveFormatting } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    // Check if link is active to get previous URL
    const previousUrl = editor.isActive('link') ? editor.getAttributes('link').href : '';
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 p-1 bg-slate-50 rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
        type="button"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
        type="button"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('underline') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
        type="button"
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1" />
      <button
        onClick={setLink}
        className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('link') ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}
        type="button"
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className="p-1.5 rounded hover:bg-slate-200 transition-colors text-slate-500"
        type="button"
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, onBlur, placeholder, className, isSimple = false }) {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
         openOnClick: false,
         HTMLAttributes: {
            class: 'text-blue-500 underline',
         },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
       const html = editor.getHTML();
       onChange && onChange(html);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      onBlur && onBlur();
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[1.5em] ${className || ''}`,
      },
    },
  });

  if (!editor) {
     return null; 
  }

  return (
    <div className={`relative group ${isFocused ? 'ring-2 ring-primary-500 rounded-lg' : 'hover:ring-1 hover:ring-slate-300 rounded-lg transition-all'}`}>
      {/* Show toolbar when focused or hovered, or always for title? User req seems to imply it's there */}
      {(isFocused || (!editor.isEmpty)) && (
        <div className={`transition-all duration-200 ${isFocused ? 'opacity-100 visible' : 'opacity-0 invisible h-0 overflow-hidden group-hover:opacity-100 group-hover:visible group-hover:h-auto'}`}>
           <MenuBar editor={editor} />
        </div>
      )}
      <EditorContent editor={editor} className="p-2" />
    </div>
  );
}

export default RichTextEditor;
