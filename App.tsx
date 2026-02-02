
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  MessageSquare, 
  StickyNote, 
  RefreshCw, 
  Code,
  Layout,
  Check,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  X,
  Power,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  ListTree,
  Split,
  Info,
  ArrowRightLeft,
  Activity,
  GripVertical
} from 'lucide-react';
import mermaid from 'mermaid';
import { Participant, DiagramStep, DiagramState, StepType } from './types';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Vazirmatn',
  sequence: {
    useMaxWidth: false, // Prevent Mermaid from forcing 100% width
  }
});

const App: React.FC = () => {
  const [state, setState] = useState<DiagramState>({
    participants: [
      { id: '1', name: 'کاربر', type: 'actor' },
      { id: '2', name: 'سیستم', type: 'participant' }
    ],
    steps: [],
    title: 'Sequence Diagram',
    autoNumber: false
  });

  const [mermaidCode, setMermaidCode] = useState('');
  const [previewSvg, setPreviewSvg] = useState('');
  const [copied, setCopied] = useState(false);
  const [codeTabCopied, setCodeTabCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showHelp, setShowHelp] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [isStepsOpen, setIsStepsOpen] = useState(true);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const getSafeId = (id: string) => `act_${id}`;

  useEffect(() => {
    let code = 'sequenceDiagram\n';
    if (state.autoNumber) code += '  autonumber\n';

    state.participants.forEach(p => {
      const safeId = getSafeId(p.id);
      const displayName = p.name.replace(/"/g, "'"); 
      code += `  ${p.type} ${safeId} as ${displayName}\n`;
    });

    state.steps.forEach(step => {
      const fromP = state.participants.find(p => p.name === step.from);
      const toP = state.participants.find(p => p.name === step.to);
      const actorP = state.participants.find(p => p.name === step.actor);
      
      const fromId = fromP ? getSafeId(fromP.id) : 'unknown';
      const toId = toP ? getSafeId(toP.id) : 'unknown';
      const actorId = actorP ? getSafeId(actorP.id) : 'unknown';

      switch (step.type) {
        case 'message':
          code += `  ${fromId}${step.arrow}${toId}: ${step.text || 'پیام'}\n`;
          break;
        case 'note':
          code += `  Note ${step.position} ${actorId}: ${step.text || 'یادداشت'}\n`;
          break;
        case 'loop':
          code += `  loop ${step.text || 'حلقه'}\n`;
          break;
        case 'alt':
          code += `  alt ${step.text || 'شرط'}\n`;
          break;
        case 'else':
          code += `  else ${step.text || 'در غیر این صورت'}\n`;
          break;
        case 'opt':
          code += `  opt ${step.text || 'اختیاری'}\n`;
          break;
        case 'activate':
          code += `  activate ${actorId}\n`;
          break;
        case 'deactivate':
          code += `  deactivate ${actorId}\n`;
          break;
        case 'end':
          code += `  end\n`;
          break;
      }
    });

    setMermaidCode(code);
  }, [state]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidCode) return;
      try {
        let codeToRender = mermaidCode;
        const openBlocks = (mermaidCode.match(/^\s*(loop|alt|opt)\b/gm) || []).length;
        const closedBlocks = (mermaidCode.match(/^\s*end\b/gm) || []).length;
        
        const missingEnds = Math.max(0, openBlocks - closedBlocks);
        if (missingEnds > 0) {
          codeToRender += '\n' + '  end\n'.repeat(missingEnds);
        }

        const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}`, codeToRender);
        setPreviewSvg(svg);
      } catch (err) {
        console.warn('Mermaid partial render error:', err);
      }
    };
    renderDiagram();
  }, [mermaidCode]);

  const addParticipant = () => {
    const newP: Participant = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Actor${state.participants.length + 1}`,
      type: 'participant'
    };
    setState(prev => ({ ...prev, participants: [...prev.participants, newP] }));
    if (!isParticipantsOpen) setIsParticipantsOpen(true);
  };

  const updateParticipant = (id: string, name: string, type: 'participant' | 'actor') => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.map(p => p.id === id ? { ...p, name: name.trim() || p.name, type } : p)
    }));
  };

  const removeParticipant = (id: string) => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id)
    }));
  };

  const addStep = (type: StepType) => {
    const firstActor = state.participants[0]?.name || 'Actor1';
    const secondActor = state.participants[1]?.name || state.participants[0]?.name || 'Actor2';
    const newStep: DiagramStep = {
      id: Date.now().toString(),
      type,
      from: firstActor,
      to: secondActor,
      arrow: '->>',
      text: '',
      position: 'over',
      actor: firstActor
    };
    setState(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    if (!isStepsOpen) setIsStepsOpen(true);
  };

  const updateStep = (id: string, updates: Partial<DiagramStep>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const removeStep = (id: string) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== id)
    }));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStepIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedStepIndex === null || draggedStepIndex === targetIndex) {
      setDraggedStepIndex(null);
      return;
    }

    const updatedSteps = [...state.steps];
    const [draggedItem] = updatedSteps.splice(draggedStepIndex, 1);
    updatedSteps.splice(targetIndex, 0, draggedItem);

    setState(prev => ({ ...prev, steps: updatedSteps }));
    setDraggedStepIndex(null);
  };

  const handleZoom = (delta: number) => setZoomLevel(prev => Math.min(Math.max(0.1, prev + delta), 4));

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
            <Layout className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Mermaid Builder</h1>
            <p className="text-xs text-slate-500 font-medium">طراحی توالی هوشمند</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold transition-all">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>راهنما</span>
          </button>
          <button onClick={() => navigator.clipboard.writeText(mermaidCode).then(() => {setCopied(true); setTimeout(() => setCopied(false), 2000);})} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد' : 'کپی'}</span>
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md text-sm font-bold" onClick={() => {const blob = new Blob([mermaidCode], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'diagram.mmd'; a.click();}}>
            <Download className="w-4 h-4" />
            دانلود
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <aside className="w-[68px] bg-white flex flex-col items-center py-4 gap-3 z-40 border-l border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-2 mb-4 border-b border-slate-100 pb-4">
            <button onClick={() => setIsParticipantsOpen(!isParticipantsOpen)} className={`p-2.5 rounded-xl transition-all ${isParticipantsOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} title="شرکت‌کنندگان"><Users className="w-5 h-5" /></button>
            <button onClick={() => setIsStepsOpen(!isStepsOpen)} className={`p-2.5 rounded-xl transition-all ${isStepsOpen ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} title="گام‌های دیاگرام"><ListTree className="w-5 h-5" /></button>
          </div>

          <div className="text-slate-300 text-[10px] font-bold uppercase tracking-tighter opacity-80">ابزار</div>
          <ToolAction icon={<MessageSquare />} label="پیام" color="bg-emerald-500" onClick={() => addStep('message')} />
          <ToolAction icon={<StickyNote />} label="نوت" color="bg-amber-500" onClick={() => addStep('note')} />
          <ToolAction icon={<RefreshCw />} label="حلقه" color="bg-blue-500" onClick={() => addStep('loop')} />
          <div className="w-8 h-px bg-slate-100 my-0.5" />
          <ToolAction icon={<Code />} label="Alt" color="bg-purple-500" onClick={() => addStep('alt')} />
          <ToolAction icon={<Split />} label="Else" color="bg-purple-400" onClick={() => addStep('else')} />
          <ToolAction icon={<Code />} label="Opt" color="bg-indigo-500" onClick={() => addStep('opt')} />
          <div className="w-8 h-px bg-slate-100 my-0.5" />
          <ToolAction icon={<Zap />} label="فعال" color="bg-orange-500" onClick={() => addStep('activate')} />
          <ToolAction icon={<Power />} label="غیر" color="bg-rose-500" onClick={() => addStep('deactivate')} />
          <ToolAction icon={<X />} label="پایان" color="bg-slate-400" onClick={() => addStep('end')} />
        </aside>

        <div className={`transition-all duration-300 overflow-hidden bg-white border-l border-slate-100 shadow-sm flex flex-col ${isParticipantsOpen ? 'w-[320px]' : 'w-0'}`}>
          <div className="min-w-[320px] p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider"><Users className="w-4 h-4 text-blue-500" />شرکت‌کنندگان</h2>
              <button onClick={addParticipant} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex-shrink-0"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar pb-4">
              {state.participants.map(p => (
                <div key={p.id} className="relative">
                  <div className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 transition-colors">
                    <select value={p.type} onChange={(e) => updateParticipant(p.id, p.name, e.target.value as any)} className="bg-white border text-[10px] rounded-lg px-2 py-1 outline-none font-bold flex-shrink-0">
                      <option value="participant">P</option>
                      <option value="actor">A</option>
                    </select>
                    <input type="text" value={p.name} onChange={(e) => updateParticipant(p.id, e.target.value, p.type)} className="flex-1 min-w-0 bg-white border rounded-lg px-2 py-1 text-xs font-bold outline-none" placeholder="نام..." />
                    <button onClick={() => removeParticipant(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="حذف"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden bg-white border-l border-slate-100 shadow-sm flex flex-col ${isStepsOpen ? 'w-[360px]' : 'w-0'}`}>
          <div className="min-w-[360px] p-6 flex flex-col h-full">
            <h2 className="text-sm font-bold mb-6 flex items-center gap-2 text-slate-700 uppercase tracking-wider"><ListTree className="w-4 h-4 text-orange-500" />لیست گام‌ها</h2>
            <div className="space-y-4 overflow-y-auto flex-1 no-scrollbar pb-10">
              {state.steps.map((step, idx) => (
                <div 
                  key={step.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-blue-300 transition-all cursor-default relative group ${draggedStepIndex === idx ? 'opacity-40 grayscale scale-95' : ''}`}
                >
                  <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between border-b">
                    <div className="flex items-center gap-2">
                      <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded-md text-slate-400 group-hover:text-blue-500 transition-colors">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{step.type}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-md transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {step.type === 'message' && (
                      <>
                        <div className="flex gap-2 items-center">
                          <select className="text-[10px] border rounded-lg p-1 flex-1 bg-white font-bold min-w-0" value={step.from} onChange={(e) => updateStep(step.id, { from: e.target.value })}>
                            {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                          <select className="text-[10px] border rounded-lg p-0.5 bg-slate-100 font-black w-14 text-center outline-none" value={step.arrow} onChange={(e) => updateStep(step.id, { arrow: e.target.value as any })}>
                            <option value="->>">——&gt;&gt;</option>
                            <option value="-->>">- - &gt;&gt;</option>
                            <option value="->">——&gt;</option>
                            <option value="-->">- - &gt;</option>
                            <option value="-x">——x</option>
                            <option value="--x">- - x</option>
                            <option value="-)">——)</option>
                            <option value="--)">- - )</option>
                          </select>
                          <select className="text-[10px] border rounded-lg p-1 flex-1 bg-white font-bold min-w-0" value={step.to} onChange={(e) => updateStep(step.id, { to: e.target.value })}>
                            {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>
                        <input className="w-full text-xs border rounded-lg px-2 py-2 font-bold" placeholder="پیام..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                      </>
                    )}
                    {step.type === 'note' && (
                      <>
                        <div className="flex gap-2 items-center">
                          <select className="text-xs border rounded-lg p-1.5 flex-1 bg-white font-bold" value={step.position} onChange={(e) => updateStep(step.id, { position: e.target.value as any })}>
                            <option value="over">روی</option>
                            <option value="left of">چپِ</option>
                            <option value="right of">راستِ</option>
                          </select>
                          <select className="text-xs border rounded-lg p-1.5 flex-1 bg-white font-bold" value={step.actor} onChange={(e) => updateStep(step.id, { actor: e.target.value })}>
                            {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>
                        <input className="w-full text-xs border rounded-lg px-2 py-2 font-bold" placeholder="متن یادداشت..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                      </>
                    )}
                    {(['loop', 'alt', 'opt'].includes(step.type)) && (
                      <input className="w-full text-xs border rounded-lg px-2 py-2 font-bold bg-blue-50/20 border-blue-100" placeholder="توضیح بلوک..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                    )}
                    {step.type === 'else' && (
                       <input className="w-full text-xs border rounded-lg px-2 py-2 font-bold bg-purple-50/20 border-purple-100" placeholder="شرط جایگزین..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                    )}
                    {step.type === 'end' && <p className="text-[10px] text-slate-400 text-center font-bold py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">بستن بلوک</p>}
                    {(step.type === 'activate' || step.type === 'deactivate') && (
                      <select className="w-full text-xs border rounded-lg p-2 bg-white font-bold" value={step.actor} onChange={(e) => updateStep(step.id, { actor: e.target.value })}>
                        {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              ))}
              {state.steps.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                   <p className="text-xs text-slate-400 font-bold">هنوز گامی اضافه نشده است</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-100 p-6 overflow-hidden relative">
          <div className="flex gap-3 mb-4 flex-shrink-0">
            <button onClick={() => setActiveTab('editor')} className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${activeTab === 'editor' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>پیش‌نمایش دیاگرام</button>
            <button onClick={() => setActiveTab('preview')} className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>کد Mermaid</button>
            <div className="flex-1" />
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-700 shadow-sm">
              <input type="checkbox" id="autonumber" className="w-4 h-4 text-blue-600 cursor-pointer" checked={state.autoNumber} onChange={(e) => setState(prev => ({ ...prev, autoNumber: e.target.checked }))} />
              <label htmlFor="autonumber" className="cursor-pointer select-none font-bold">شماره‌گذاری</label>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 relative min-h-0">
            {activeTab === 'editor' ? (
              <div 
                ref={previewContainerRef}
                className="w-full h-full overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] relative"
              >
                {/* Floating Controls */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-2xl transition-all hover:scale-105">
                  <button onClick={() => handleZoom(-0.1)} className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"><ZoomOut className="w-5 h-5" /></button>
                  <div className="px-3 text-xs font-bold text-slate-700 min-w-[50px] text-center border-x border-slate-100 select-none">{Math.round(zoomLevel * 100)}%</div>
                  <button onClick={() => handleZoom(0.1)} className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"><ZoomIn className="w-5 h-5" /></button>
                  <button onClick={() => setZoomLevel(1)} className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"><RotateCcw className="w-5 h-5" /></button>
                </div>

                {/* Diagram Canvas Wrapper for Centering */}
                <div className="min-w-full min-h-full grid place-items-center p-20">
                    <div 
                      className="transition-transform duration-200 ease-out origin-top"
                      style={{ 
                        transform: `scale(${zoomLevel})`
                      }}
                    >
                      <div className="mermaid inline-block" dangerouslySetInnerHTML={{ __html: previewSvg }} />
                    </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative group">
                <button onClick={() => {navigator.clipboard.writeText(mermaidCode); setCodeTabCopied(true); setTimeout(() => setCodeTabCopied(false), 2000);}} className="absolute top-8 left-8 z-30 flex items-center gap-2 bg-slate-800/95 hover:bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all opacity-0 group-hover:opacity-100 shadow-2xl border border-slate-700">
                  {codeTabCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {codeTabCopied ? 'کپی شد' : 'کپی سریع کد'}
                </button>
                <pre className="w-full h-full p-10 text-sm font-mono text-slate-800 bg-slate-900 text-blue-100 overflow-auto whitespace-pre-wrap leading-relaxed select-all no-scrollbar">{mermaidCode}</pre>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">راهنمای کامل Mermaid Builder</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-7 h-7 text-slate-400" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-10 text-slate-700 leading-relaxed text-right no-scrollbar">
              
              {/* Section: Participants */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-r-4 border-blue-600 pr-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  مبانی: شرکت‌کنندگان (Participants)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-bold mb-1 flex items-center gap-2 text-blue-800"><Layout className="w-4 h-4" /> Participant (باکس)</div>
                    <p className="text-sm">نماد استاندارد برای اشیاء یا سیستم‌ها. به صورت یک مستطیل در بالا و پایین دیاگرام نمایش داده می‌شود.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="font-bold mb-1 flex items-center gap-2 text-blue-800"><Users className="w-4 h-4" /> Actor (آدمک)</div>
                    <p className="text-sm">نماد انسانی. معمولاً برای نمایش کاربران نهایی یا نقش‌های انسانی که با سیستم تعامل دارند استفاده می‌شود.</p>
                  </div>
                </div>
              </section>

              {/* Section: Communication */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-r-4 border-emerald-600 pr-3">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                  ارتباطات و پیام‌ها
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><MessageSquare className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold">پیام (Message)</div>
                      <p className="text-sm">انتقال اطلاعات بین دو شرکت‌کننده. فلش‌ها جهت حرکت اطلاعات و درخواست‌ها را نشان می‌دهند.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl"><StickyNote className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold">یادداشت (Note)</div>
                      <p className="text-sm">برای اضافه کردن توضیحات اضافی در سمت چپ، راست یا روی یک شرکت‌کننده استفاده می‌شود.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Logic Blocks */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-r-4 border-purple-600 pr-3">
                  <Code className="w-5 h-5 text-purple-600" />
                  منطق و کنترل جریان
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="flex items-center gap-3 p-3 border border-purple-100 rounded-xl">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><RefreshCw className="w-4 h-4" /></div>
                    <span><b>حلقه (Loop):</b> تکرار یک مجموعه از پیام‌ها تا برقراری یک شرط خاص.</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-purple-100 rounded-xl">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Code className="w-4 h-4" /></div>
                    <span><b>Alt:</b> نمایش مسیرهای جایگزین (مانند if/else در برنامه‌نویسی).</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-purple-100 rounded-xl">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Info className="w-4 h-4" /></div>
                    <span><b>Opt:</b> مراحلی که اختیاری هستند و ممکن است انجام شوند یا نشوند.</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-purple-100 rounded-xl">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><X className="w-4 h-4" /></div>
                    <span><b>End:</b> تمام بلوک‌های منطقی (Loop, Alt, Opt) باید با این ابزار بسته شوند.</span>
                  </div>
                </div>
              </section>

              {/* Section: Execution */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 border-r-4 border-orange-600 pr-3">
                  <Activity className="w-5 h-5 text-orange-600" />
                  چرخه حیات (Activation)
                </h3>
                <div className="flex gap-4 items-start p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="flex flex-col gap-2">
                    <div className="bg-orange-500 text-white p-2 rounded-lg"><Zap className="w-4 h-4" /></div>
                    <div className="bg-rose-500 text-white p-2 rounded-lg"><Power className="w-4 h-4" /></div>
                  </div>
                  <div>
                    <div className="font-bold">فعال‌سازی و غیرفعال‌سازی</div>
                    <p className="text-sm">نشان می‌دهد که یک سیستم در حال حاضر مشغول پردازش است. با فعال‌سازی، یک نوار ضخیم روی خطِ زمان آن شرکت‌کننده ظاهر می‌شود.</p>
                  </div>
                </div>
              </section>

              {/* Tips */}
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-sm">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> نکات تکمیلی:</h4>
                <ul className="list-disc pr-5 space-y-1">
                  <li>برای جابجا کردن گام‌ها، از <b>دستگیره (Grip)</b> کنار هر کارت استفاده کنید و آن را بکشید.</li>
                  <li>بخش پیش‌نمایش اکنون قابلیت <b>اسکرول افقی و عمودی</b> دارد تا در دیاگرام‌های بزرگ، متن‌ها به خوبی در مرکز قرار گیرند.</li>
                  <li>در صورت بروز خطا در پیش‌نمایش، مطمئن شوید تمام بلوک‌های Alt یا Loop را با یک <b>End</b> بسته‌اید.</li>
                </ul>
              </div>

            </div>
            
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setShowHelp(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 active:translate-y-0">متوجه شدم، بزن بریم!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ToolActionProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const ToolAction: React.FC<ToolActionProps> = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center group relative w-full px-1 flex-shrink-0">
    <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm ${color} text-white`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
    </div>
    <span className="text-[10px] text-slate-400 font-bold mt-1 group-hover:text-slate-800 transition-colors tracking-tighter">{label}</span>
    <div className="absolute right-full mr-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-3 group-hover:translate-x-0 whitespace-nowrap z-50 border border-slate-700 font-bold">افزودن {label}</div>
  </button>
);

export default App;
