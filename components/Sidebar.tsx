
import React from 'react';
import { Section } from '../types';
import { FileText, ClipboardList, Stethoscope, BookOpen, PenTool, CheckCircle, Scale, Settings, Eye } from 'lucide-react';

interface SidebarProps {
  currentSection: Section;
  onNavigate: (section: Section) => void;
}

const menuItems = [
  { section: Section.CONFIG, icon: Settings, label: 'Configurações' },
  { section: Section.PREAMBULO, icon: FileText, label: '1. Preâmbulo' },
  { section: Section.HISTORICO, icon: ClipboardList, label: '2. Histórico' },
  { section: Section.DESCRICAO, icon: Stethoscope, label: '3. Descrição' },
  { section: Section.DISCUSSAO, icon: BookOpen, label: '4. Discussão' },
  { section: Section.CONCLUSAO, icon: Scale, label: '5. Conclusões' },
  { section: Section.QUESITOS, icon: PenTool, label: '6. Quesitos' },
  { section: Section.ENCERRAMENTO, icon: CheckCircle, label: '7. Encerramento' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onNavigate }) => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex-shrink-0 h-screen overflow-y-auto sticky top-0 border-r border-slate-800 shadow-xl flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center font-serif font-bold text-white border-2 border-white shadow">SP</div>
        <h1 className="font-bold text-lg tracking-wide">Laudos IMESC</h1>
      </div>
      
      <div className="p-4 pb-0">
         <button
            onClick={() => onNavigate(Section.PREVIEW)}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 border ${
              currentSection === Section.PREVIEW
                ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400 ring-opacity-50'
                : 'bg-slate-800 text-blue-200 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Eye size={18} />
            <span className="font-bold text-sm">Visualizar Laudo</span>
          </button>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = currentSection === item.section;
          return (
            <button
              key={item.section}
              onClick={() => onNavigate(item.section)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-imesc-600 text-white shadow-md'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-6 mt-auto border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">v1.1.0 &copy; 2024 LegalTech</p>
      </div>
    </aside>
  );
};

export default Sidebar;
