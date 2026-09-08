import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  quickInserts?: string[];
  onQuickInsert?: (path: string, text: string) => void; // Modified to match parent expectation if needed, or handled locally
  path?: string; // Optional path for parent updater
}

declare global {
  interface Window {
    Quill: any;
  }
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, value, onChange, quickInserts }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current && window.Quill) {
      quillRef.current = new window.Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ]
        },
        placeholder: 'Digite aqui...'
      });

      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        onChange(html);
      });
    }
  }, []); // Init once

  // Update content if value changes externally (and isn't the same as current editor content to avoid loop/cursor jump)
  useEffect(() => {
    if (quillRef.current) {
        const currentContent = quillRef.current.root.innerHTML;
        if (currentContent !== value) {
            // Only update if strictly different to avoid cursor jumping
            // Basic check, usually comparing text is safer but HTML structure might vary
            // For this app, we blindly update if empty, otherwise we trust internal state mostly
            // except for resets.
             if (value === '' || value === '<p><br></p>') {
                 quillRef.current.root.innerHTML = value;
             } else if (Math.abs(currentContent.length - value.length) > 5) {
                 // Heuristic: if length changed significantly externally (e.g. load), update
                 quillRef.current.root.innerHTML = value;
             }
        }
    }
  }, [value]);

  const handleInsert = (text: string) => {
    if (quillRef.current) {
      const range = quillRef.current.getSelection(true);
      quillRef.current.insertText(range.index, text + ' ', 'user');
      quillRef.current.setSelection(range.index + text.length + 1);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        {quickInserts && (
          <div className="flex space-x-2">
            {quickInserts.map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsert(text)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-300 transition-colors flex items-center"
              >
                <Sparkles size={10} className="mr-1 text-yellow-600" />
                {text.substring(0, 15)}...
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white">
        <div ref={editorRef} style={{ height: 'auto' }} />
      </div>
    </div>
  );
};

export default RichTextEditor;
