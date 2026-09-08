import React from 'react';
import { Sparkles } from 'lucide-react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, className, ...props }) => (
  <div className="flex flex-col space-y-1 mb-4">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <input
      className={`border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-imc-400 focus:border-imc-500 outline-none transition-all ${className}`}
      {...props}
    />
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  quickInserts?: string[];
  onQuickInsert?: (text: string) => void;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, quickInserts, onQuickInsert, className, ...props }) => {
  return (
    <div className="flex flex-col space-y-1 mb-6">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        {quickInserts && onQuickInsert && (
          <div className="flex space-x-2">
            {quickInserts.map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onQuickInsert(text)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-300 transition-colors flex items-center"
              >
                <Sparkles size={10} className="mr-1 text-yellow-600" />
                {text.substring(0, 15)}...
              </button>
            ))}
          </div>
        )}
      </div>
      <textarea
        className={`border border-slate-300 rounded-md px-3 py-2 text-sm min-h-[120px] focus:ring-2 focus:ring-imc-400 focus:border-imc-500 outline-none transition-all resize-y font-sans leading-relaxed ${className}`}
        {...props}
      />
    </div>
  );
};