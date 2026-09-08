
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { Section, ReportData, INITIAL_REPORT_DATA, Quesito } from './types';
import { generatePdf, generatePdfPreviewUrl } from './services/pdfGenerator';
import { TextInput } from './components/Input';
import RichTextEditor from './components/RichTextEditor';
import { Download, Plus, Trash2, FileOutput, Info, CheckCircle, Upload, Save, RotateCcw, Clock, RefreshCcw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(Section.CONFIG);
  const [data, setData] = useState<ReportData>(INITIAL_REPORT_DATA);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Load data and settings from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('imesc_report_data');
    const savedConfig = localStorage.getItem('imesc_app_config');

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Merge with initial data to ensure all fields exist (migration safety)
        setData({ ...INITIAL_REPORT_DATA, ...parsedData });
        setLastSaved(new Date());
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }

    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        if (typeof parsedConfig.autoSaveEnabled === 'boolean') {
          setAutoSaveEnabled(parsedConfig.autoSaveEnabled);
        }
      } catch (e) {
        console.error("Failed to load config", e);
      }
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('imesc_app_config', JSON.stringify({ autoSaveEnabled }));
  }, [autoSaveEnabled]);

  // Auto-save interval
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const intervalId = setInterval(() => {
      localStorage.setItem('imesc_report_data', JSON.stringify(data));
      setLastSaved(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [autoSaveEnabled, data]);

  // Generate preview when entering preview section
  useEffect(() => {
    if (activeSection === Section.PREVIEW) {
        setIsGenerating(true);
        // Use timeout to allow UI to render loading state before heavy sync operation
        const timer = setTimeout(() => {
            try {
                const url = generatePdfPreviewUrl(data);
                setPreviewUrl(url);
            } catch (e) {
                console.error("Error generating preview", e);
                setPreviewUrl(null);
            } finally {
                setIsGenerating(false);
            }
        }, 500); // Slight delay for better UX (loader visibility)
        
        return () => clearTimeout(timer);
    } else {
        setPreviewUrl(null);
    }
  }, [activeSection, data]);

  // Helper to update state deeply
  const updateData = (path: string, value: any) => {
    setData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  // Manual Save
  const handleManualSave = () => {
    localStorage.setItem('imesc_report_data', JSON.stringify(data));
    setLastSaved(new Date());
  };

  // Reset Data
  const handleResetData = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      setData(INITIAL_REPORT_DATA);
      localStorage.removeItem('imesc_report_data');
      setLastSaved(null);
    }
  };

  // Helper for Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quesito Helpers
  const addQuesito = (type: 'quesitosJuizo' | 'quesitosRequerente' | 'quesitosRequerido') => {
    const newQ: Quesito = {
      id: Math.random().toString(36).substr(2, 9),
      number: data[type].length + 1,
      question: '',
      answer: ''
    };
    setData(prev => ({ ...prev, [type]: [...prev[type], newQ] }));
  };

  const updateQuesito = (type: 'quesitosJuizo' | 'quesitosRequerente' | 'quesitosRequerido', id: string, field: 'question' | 'answer', value: string) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const removeQuesito = (type: 'quesitosJuizo' | 'quesitosRequerente' | 'quesitosRequerido', id: string) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].filter(q => q.id !== id)
    }));
  };

  const renderContent = () => {
    switch (activeSection) {
      case Section.CONFIG:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">Configurações & Dados Iniciais</h2>

            {/* Application Preferences */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                    <Save size={16} className="mr-2" /> Preferências do Aplicativo
                </h3>
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={autoSaveEnabled} 
                                onChange={(e) => setAutoSaveEnabled(e.target.checked)} 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-700">Auto-save (30s)</span>
                        </label>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={handleManualSave}
                            className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                        >
                            <Save size={16} className="mr-2 text-blue-500" />
                            Salvar Agora
                        </button>
                        <button 
                            onClick={handleResetData}
                            className="flex items-center px-4 py-2 bg-white border border-red-200 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 shadow-sm transition-colors"
                        >
                            <RotateCcw size={16} className="mr-2" />
                            Limpar Dados
                        </button>
                    </div>
                </div>
                {lastSaved && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center">
                        <Clock size={12} className="mr-1" />
                        Último salvamento: {lastSaved.toLocaleTimeString()}
                    </p>
                )}
            </div>
            
            {/* Logo Upload */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-6">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Cabeçalho & Identidade</h3>
               <div className="flex items-start space-x-6">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Logo do Cabeçalho</label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                <p className="text-sm text-slate-500"><span className="font-semibold">Clique para enviar</span></p>
                                <p className="text-xs text-slate-500">PNG, JPG (MAX. 2MB)</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                 </div>
                 {data.logoUrl && (
                   <div className="flex flex-col items-center space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Pré-visualização</span>
                      <div className="p-2 border rounded bg-white shadow-sm">
                        <img src={data.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
                      </div>
                      <button onClick={() => updateData('logoUrl', null)} className="text-xs text-red-500 hover:text-red-700 underline">Remover</button>
                   </div>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput label="Número da Pasta IMESC" value={data.folderNumber} onChange={e => updateData('folderNumber', e.target.value)} placeholder="Ex: 12345/2024" />
              <TextInput label="Nome do Perito" value={data.peritoName} onChange={e => updateData('peritoName', e.target.value)} />
              <TextInput label="CRM" value={data.peritoCrm} onChange={e => updateData('peritoCrm', e.target.value)} />
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex items-start space-x-3">
              <Info className="text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-700">Estas informações e o logo aparecerão no Cabeçalho e Rodapé de todas as páginas do laudo gerado.</p>
            </div>
          </div>
        );

      case Section.PREAMBULO:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">1. Preâmbulo</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 mb-4">1.1 Dados do Processo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Autoridade Requisitante" value={data.processo.autoridade} onChange={e => updateData('processo.autoridade', e.target.value)} />
                    <TextInput label="Número do Processo" value={data.processo.numero} onChange={e => updateData('processo.numero', e.target.value)} />
                    <TextInput label="Natureza da Ação" value={data.processo.natureza} onChange={e => updateData('processo.natureza', e.target.value)} />
                    <TextInput label="Registro IMESC" value={data.processo.registroImesc} onChange={e => updateData('processo.registroImesc', e.target.value)} />
                    <TextInput label="Data da Perícia" type="date" value={data.processo.dataPericia} onChange={e => updateData('processo.dataPericia', e.target.value)} />
                    <TextInput label="Requerido" value={data.processo.requerido} onChange={e => updateData('processo.requerido', e.target.value)} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Dados do Requerente (Periciando)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Nome Completo" value={data.processo.requerente.nome} onChange={e => updateData('processo.requerente.nome', e.target.value)} />
                    <TextInput label="Data de Nascimento" value={data.processo.requerente.nascimento} onChange={e => updateData('processo.requerente.nascimento', e.target.value)} />
                    <TextInput label="RG" value={data.processo.requerente.rg} onChange={e => updateData('processo.requerente.rg', e.target.value)} />
                    <TextInput label="CPF" value={data.processo.requerente.cpf} onChange={e => updateData('processo.requerente.cpf', e.target.value)} />
                    <TextInput label="Endereço Completo" className="md:col-span-2" value={data.processo.requerente.endereco} onChange={e => updateData('processo.requerente.endereco', e.target.value)} />
                </div>
            </div>

            <RichTextEditor label="1.2 Dados do Perito (Texto Introdutório)" value={data.peritoIntro} onChange={val => updateData('peritoIntro', val)} />
            <RichTextEditor label="1.3 Resumo da Exordial" value={data.resumoExordial} onChange={val => updateData('resumoExordial', val)} quickInserts={['Nada consta', 'Alega acidente de trabalho', 'Alega erro médico']} />
            <RichTextEditor label="1.4 Resumo da Contestação" value={data.resumoContestacao} onChange={val => updateData('resumoContestacao', val)} quickInserts={['Nada consta', 'Nega nexo causal', 'Impugna alegações']} />
            <RichTextEditor label="1.5 Despacho Saneador" value={data.despachoSaneador} onChange={val => updateData('despachoSaneador', val)} quickInserts={['Nada consta', 'Definiu os pontos controvertidos']} />
          </div>
        );

      case Section.HISTORICO:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">2. Histórico</h2>
            <RichTextEditor label="2.1 Contexto Pericial" value={data.historico.contexto} onChange={val => updateData('historico.contexto', val)} />
            <RichTextEditor label="2.2 Anamnese Médico Pericial" value={data.historico.anamnese} onChange={val => updateData('historico.anamnese', val)} quickInserts={['Comparece acompanhado', 'Lúcido e orientado', 'Deambula sem auxílio']} />
            <RichTextEditor label="2.3 Antecedentes Pessoais" value={data.historico.antecedentesPessoais} onChange={val => updateData('historico.antecedentesPessoais', val)} quickInserts={['Nega comorbidades', 'Hipertensão em tratamento', 'Diabetes tipo 2']} />
            <RichTextEditor label="2.4 Antecedentes Familiares" value={data.historico.antecedentesFamiliares} onChange={val => updateData('historico.antecedentesFamiliares', val)} />
            <RichTextEditor label="2.5 Antecedentes Socioeducacionais" value={data.historico.antecedentesSocio} onChange={val => updateData('historico.antecedentesSocio', val)} quickInserts={['Nega tabagismo', 'Etilista social', 'Ensino fundamental incompleto']} />
            <RichTextEditor label="2.6 Documentos Médico Legais" value={data.historico.documentosLegais} onChange={val => updateData('historico.documentosLegais', val)} quickInserts={['Vide documentos em anexo', 'Apresentou relatórios datados de...']} />
          </div>
        );

      case Section.DESCRICAO:
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">3. Descrição</h2>
                <RichTextEditor label="3.1 Exame Físico Geral" value={data.exameFisicoGeral} onChange={val => updateData('exameFisicoGeral', val)} quickInserts={['Bom estado geral (BEG)', 'Eupneico', 'Corado', 'Hidratado', 'Afebril']} />
                <RichTextEditor label="3.2 Exame Físico Específico" value={data.exameFisicoEspecifico} onChange={val => updateData('exameFisicoEspecifico', val)} quickInserts={['Mobilidade preservada', 'Força muscular grau 5', 'Cicatrização adequada']} />
            </div>
        );

       case Section.DISCUSSAO:
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">4. Discussão</h2>
                <RichTextEditor label="4.1 Método e Técnica" value={data.metodoTecnica} onChange={val => updateData('metodoTecnica', val)} />
                <RichTextEditor label="4.2 Literatura Médica" value={data.literatura} onChange={val => updateData('literatura', val)} quickInserts={['Tratado de Medicina Legal', 'Diretrizes da AMA', 'Tabela SUSEP']} />
                <RichTextEditor label="4.3 Contextualização" value={data.contextualizacao} onChange={val => updateData('contextualizacao', val)} />
            </div>
        );

       case Section.CONCLUSAO:
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">5. Conclusões</h2>
                <RichTextEditor label="Texto da Conclusão" value={data.conclusao} onChange={val => updateData('conclusao', val)} quickInserts={['Há nexo causal', 'Não há nexo causal', 'Incapacidade total e temporária', 'Incapacidade parcial e permanente']} />
            </div>
        );

       case Section.QUESITOS:
           const renderQuesitosSection = (title: string, type: 'quesitosJuizo' | 'quesitosRequerente' | 'quesitosRequerido', items: Quesito[]) => (
             <div className="mb-8 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-700">{title}</h3>
                 <button onClick={() => addQuesito(type)} className="flex items-center text-sm bg-imesc-100 text-imesc-700 px-3 py-1.5 rounded hover:bg-imesc-200">
                    <Plus size={16} className="mr-1"/> Adicionar
                 </button>
               </div>
               {items.length === 0 ? <p className="text-slate-400 italic text-sm">Nenhum quesito adicionado.</p> : (
                 <div className="space-y-4">
                   {items.map((q, idx) => (
                     <div key={q.id} className="relative pl-8 border-l-4 border-slate-300">
                       <span className="absolute -left-[26px] top-0 bg-slate-200 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                       <div className="mb-2">
                         <input placeholder="Pergunta..." className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-imesc-500 outline-none transition-colors" value={q.question} onChange={e => updateQuesito(type, q.id, 'question', e.target.value)} />
                       </div>
                       <div>
                         <textarea placeholder="Resposta..." className="w-full text-slate-600 text-sm bg-slate-50 p-2 rounded focus:ring-1 focus:ring-imesc-400 outline-none resize-none" rows={2} value={q.answer} onChange={e => updateQuesito(type, q.id, 'answer', e.target.value)} />
                       </div>
                       <button onClick={() => removeQuesito(type, q.id)} className="absolute top-0 right-0 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           );

           return (
            <div className="space-y-6">
                <h2 className="text-2xl font-serif text-slate-800 border-b pb-2">6. Quesitos</h2>
                {renderQuesitosSection("6.1 Quesitos do Juízo", "quesitosJuizo", data.quesitosJuizo)}
                {renderQuesitosSection("6.2 Quesitos do Requerente", "quesitosRequerente", data.quesitosRequerente)}
                {renderQuesitosSection("6.3 Quesitos do Requerido", "quesitosRequerido", data.quesitosRequerido)}
            </div>
           );
        
        case Section.ENCERRAMENTO:
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <CheckCircle size={64} className="text-green-500" />
                    <h2 className="text-3xl font-serif text-slate-800">Laudo Finalizado</h2>
                    <p className="text-slate-600 max-w-md">Todos os dados foram preenchidos. Você pode revisar as seções anteriores ou gerar o documento final agora.</p>
                    <button onClick={() => generatePdf(data)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:-translate-y-1 transition-all flex items-center">
                        <FileOutput size={24} className="mr-2" />
                        Exportar PDF
                    </button>
                </div>
            )
            
        case Section.PREVIEW:
            return (
                <div className="flex flex-col h-full">
                     <div className="flex items-center justify-between mb-4 pb-2 border-b shrink-0">
                         <h2 className="text-2xl font-serif text-slate-800">Visualização do Laudo</h2>
                         <button 
                            onClick={() => {
                                setIsGenerating(true);
                                setTimeout(() => {
                                    try {
                                        const url = generatePdfPreviewUrl(data);
                                        setPreviewUrl(url);
                                    } catch(e) { console.error(e) } finally { setIsGenerating(false); }
                                }, 100);
                            }} 
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            disabled={isGenerating}
                        >
                            <RefreshCcw size={16} className={`mr-1 ${isGenerating ? 'animate-spin' : ''}`} /> Atualizar
                         </button>
                     </div>
                     <div className="flex-1 bg-slate-200 rounded-lg border border-slate-300 overflow-hidden relative">
                         {isGenerating ? (
                             <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-100/80 z-10">
                                 <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                                 <p className="font-medium animate-pulse">Gerando visualização do PDF...</p>
                             </div>
                         ) : previewUrl ? (
                             <iframe 
                                src={previewUrl} 
                                className="w-full h-full border-0 block" 
                                title="PDF Preview"
                             />
                         ) : (
                             <div className="flex items-center justify-center h-full text-slate-500">
                                 <p>Não foi possível carregar a visualização.</p>
                             </div>
                         )}
                     </div>
                </div>
            );

      default:
        return <div>Selecione uma seção</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentSection={activeSection} onNavigate={setActiveSection} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm shrink-0">
            <div className="flex items-center text-slate-500 text-sm space-x-4">
                <div>
                    <span className="font-semibold text-slate-700 mr-2">Pasta Atual:</span>
                    {data.folderNumber || "Não definida"}
                </div>
                {lastSaved && (
                     <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full animate-fade-in">
                        <CheckCircle size={10} className="mr-1" />
                        Salvo {lastSaved.toLocaleTimeString()}
                     </div>
                )}
            </div>
            <button 
                onClick={() => generatePdf(data)} 
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-medium transition-colors"
                title="Gerar documento atual"
            >
                <Download size={18} />
                <span>Exportar PDF</span>
            </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
            <div className={`mx-auto bg-white p-8 md:p-12 rounded-xl shadow-lg border border-slate-100 min-h-full flex flex-col ${activeSection === Section.PREVIEW ? 'max-w-6xl h-full' : 'max-w-4xl'}`}>
                {renderContent()}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
