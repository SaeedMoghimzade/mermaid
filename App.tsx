
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Play, 
  User, 
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
  Palette,
  Power,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw
} from 'lucide-react';
import mermaid from 'mermaid';
import { Participant, DiagramStep, DiagramState, ArrowType, StepType } from './types';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Vazirmatn'
});

const PRESET_COLORS = [
  { name: 'پیش‌فرض', value: '' },
  { name: 'آبی روشن', value: '#e0f2fe' },
  { name: 'سبز روشن', value: '#dcfce7' },
  { name: 'قرمز روشن', value: '#fee2e2' },
  { name: 'زرد روشن', value: '#fef9c3' },
  { name: 'بنفش روشن', value: '#f3e8ff' },
  { name: 'نارنجی روشن', value: '#ffedd5' },
];

const App: React.FC = () => {
  const [state, setState] = useState<DiagramState>({
    participants: [
      { id: '1', name: 'کاربر', type: 'actor', color: '' },
      { id: '2', name: 'سیستم', type: 'participant', color: '' }
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
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Generate Mermaid Syntax
  useEffect(() => {
    let code = 'sequenceDiagram\n';
    if (state.autoNumber) code += '  autonumber\n';

    state.participants.forEach(p => {
      if (p.color) {
        code += `  box ${p.color} ${p.name}\n`;
        code += `    ${p.type} ${p.name}\n`;
        code += `  end\n`;
      } else {
        code += `  ${p.type} ${p.name}\n`;
      }
    });

    state.steps.forEach(step => {
      switch (step.type) {
        case 'message':
          code += `  ${step.from}${step.arrow}${step.to}: ${step.text || 'پیام'}\n`;
          break;
        case 'note':
          code += `  Note ${step.position} ${step.actor}: ${step.text || 'یادداشت'}\n`;
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
          code += `  activate ${step.actor}\n`;
          break;
        case 'deactivate':
          code += `  deactivate ${step.actor}\n`;
          break;
        case 'end':
          code += `  end\n`;
          break;
      }
    });

    setMermaidCode(code);
  }, [state]);

  // Render SVG Preview with Auto-Closing Logic
  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidCode) return;
      try {
        // Robust rendering: automatically close open blocks for the preview
        let codeToRender = mermaidCode;
        
        // Count unclosed blocks (loop, alt, opt)
        // We use a simplified regex count as steps are structured
        const openBlocks = (mermaidCode.match(/\b(loop|alt|opt)\b/g) || []).length;
        const closedBlocks = (mermaidCode.match(/\bend\b/g) || []).length;
        
        // Compensate for participant boxes which also use 'end'
        const boxCount = state.participants.filter(p => p.color).length;
        const actualClosedBlocks = closedBlocks - boxCount;

        const missingEnds = openBlocks - actualClosedBlocks;
        if (missingEnds > 0) {
          codeToRender += '\n' + '  end\n'.repeat(missingEnds);
        }

        const { svg } = await mermaid.render('mermaid-svg', codeToRender);
        setPreviewSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };
    renderDiagram();
  }, [mermaidCode, state.participants]);

  const addParticipant = () => {
    const newP: Participant = {
      id: Date.now().toString(),
      name: `Actor${state.participants.length + 1}`,
      type: 'participant',
      color: ''
    };
    setState(prev => ({ ...prev, participants: [...prev.participants, newP] }));
  };

  const updateParticipant = (id: string, name: string, type: 'participant' | 'actor', color?: string) => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.map(p => p.id === id ? { ...p, name, type, color: color !== undefined ? color : p.color } : p)
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

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...state.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setState(prev => ({ ...prev, steps: newSteps }));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInTab = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCodeTabCopied(true);
    setTimeout(() => setCodeTabCopied(false), 2000);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(0.1, prev + delta), 4));
  };

  const resetZoom = () => setZoomLevel(1);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
            <Layout className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Mermaid Sequence</h1>
            <p className="text-sm text-slate-500 font-medium">طراحی دیاگرام بدون کدنویسی</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg transition-colors font-bold border border-slate-200 text-sm"
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>راهنما</span>
          </button>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg transition-colors font-bold border border-slate-200 text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد' : 'کپی'}</span>
          </button>
          <button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-bold shadow-md text-sm"
            onClick={() => {
              const blob = new Blob([mermaidCode], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'diagram.mmd';
              a.click();
            }}
          >
            <Download className="w-4 h-4" />
            دانلود
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* FIXED TOOL STRIP */}
        <aside className="w-[68px] bg-white flex flex-col items-center py-3 gap-2 z-20 border-l border-slate-200 shadow-sm overflow-y-auto no-scrollbar">
          <div className="text-slate-400 text-[10px] font-bold uppercase mb-0.5 tracking-tighter opacity-80">ابزار</div>
          <ToolAction icon={<MessageSquare />} label="پیام" color="bg-emerald-500" onClick={() => addStep('message')} />
          <ToolAction icon={<StickyNote />} label="نوت" color="bg-amber-500" onClick={() => addStep('note')} />
          <ToolAction icon={<RefreshCw />} label="حلقه" color="bg-blue-500" onClick={() => addStep('loop')} />
          <div className="w-8 h-px bg-slate-100 my-0.5" />
          <ToolAction icon={<Code />} label="Alt" color="bg-purple-500" onClick={() => addStep('alt')} />
          <ToolAction icon={<Code />} label="Opt" color="bg-indigo-500" onClick={() => addStep('opt')} />
          <div className="w-8 h-px bg-slate-100 my-0.5" />
          <ToolAction icon={<Zap />} label="فعال" color="bg-orange-500" onClick={() => addStep('activate')} />
          <ToolAction icon={<Power />} label="غیر" color="bg-rose-500" onClick={() => addStep('deactivate')} />
          <ToolAction icon={<X />} label="پایان" color="bg-slate-400" onClick={() => addStep('end')} />
        </aside>

        {/* SIDEBAR - Participants and Steps List */}
        <div className="w-[380px] min-w-[340px] bg-white border-l border-slate-100 overflow-y-auto p-6 shadow-sm">
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold flex items-center gap-2 text-slate-700 uppercase tracking-wider">
                  <User className="w-4 h-4 text-blue-500" />
                  شرکت‌کنندگان
                </h2>
                <button 
                  onClick={addParticipant}
                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {state.participants.map(p => (
                  <div key={p.id} className="relative">
                    <div 
                      className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 transition-all hover:border-slate-300"
                      style={{ borderRight: p.color ? `5px solid ${p.color}` : undefined }}
                    >
                      <select 
                        value={p.type} 
                        onChange={(e) => updateParticipant(p.id, p.name, e.target.value as any)}
                        className="bg-white border text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer font-bold"
                      >
                        <option value="participant">P</option>
                        <option value="actor">A</option>
                      </select>
                      <input 
                        type="text" 
                        value={p.name}
                        onChange={(e) => updateParticipant(p.id, e.target.value, p.type)}
                        className="flex-1 bg-white border rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                        placeholder="نام..."
                      />
                      <button 
                        onClick={() => setActiveColorPicker(activeColorPicker === p.id ? null : p.id)}
                        className={`p-2 rounded-lg transition-colors ${p.color ? 'text-blue-600 bg-blue-100' : 'text-slate-400'} hover:bg-blue-50`}
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeParticipant(p.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {activeColorPicker === p.id && (
                      <div className="absolute top-full right-0 mt-2 z-50 bg-white border rounded-2xl shadow-2xl p-4 grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color.value}
                            onClick={() => {
                              updateParticipant(p.id, p.name, p.type, color.value);
                              setActiveColorPicker(null);
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                            style={{ backgroundColor: color.value || '#fff' }}
                            title={color.name}
                          >
                            {!color.value && <X className="w-4 h-4 text-slate-300" />}
                            {p.color === color.value && color.value && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="pb-12">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700 uppercase tracking-wider">
                <Layout className="w-4 h-4 text-orange-500" />
                لیست گام‌ها
              </h2>
              <div className="space-y-4">
                {state.steps.map((step, idx) => (
                  <div key={step.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-400 hover:shadow-md transition-all">
                    <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{step.type}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => moveStep(idx, 'up')} className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-800 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                        <button onClick={() => moveStep(idx, 'down')} className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-800 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                        <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-50 text-red-300 hover:text-red-600 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {step.type === 'message' && (
                        <>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                              <select className="text-sm border rounded-lg p-2 flex-1 bg-white font-bold" value={step.from} onChange={(e) => updateStep(step.id, { from: e.target.value })}>
                                {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                              <span className="text-slate-500 font-bold">←</span>
                              <select className="text-sm border rounded-lg p-2 flex-1 bg-white font-bold" value={step.to} onChange={(e) => updateStep(step.id, { to: e.target.value })}>
                                {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                            </div>
                            <select className="w-full text-sm border rounded-lg p-2 bg-white font-bold" value={step.arrow} onChange={(e) => updateStep(step.id, { arrow: e.target.value as any })}>
                              <option value="->>">خط ممتد (پیکان)</option>
                              <option value="->">خط ممتد</option>
                              <option value="-->>">خط‌چین (پیکان)</option>
                              <option value="-->">خط‌چین</option>
                              <option value="-x">ضربدر ممتد</option>
                              <option value="--x">ضربدر خط‌چین</option>
                            </select>
                          </div>
                          <input className="w-full text-sm border rounded-lg px-3 py-2.5 font-bold" placeholder="پیام..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                        </>
                      )}
                      {step.type === 'note' && (
                        <>
                          <div className="flex gap-2 items-center">
                            <select className="text-sm border rounded-lg p-2 flex-1 bg-white font-bold" value={step.position} onChange={(e) => updateStep(step.id, { position: e.target.value as any })}>
                              <option value="over">روی</option>
                              <option value="left of">چپِ</option>
                              <option value="right of">راستِ</option>
                            </select>
                            <select className="text-sm border rounded-lg p-2 flex-1 bg-white font-bold" value={step.actor} onChange={(e) => updateStep(step.id, { actor: e.target.value })}>
                              {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                          </div>
                          <input className="w-full text-sm border rounded-lg px-3 py-2.5 font-bold" placeholder="متن یادداشت..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                        </>
                      )}
                      {(['loop', 'alt', 'opt'].includes(step.type)) && (
                        <div className="space-y-2">
                          <input className="w-full text-sm border rounded-lg px-3 py-2.5 font-bold bg-blue-50/30 border-blue-100" placeholder="توضیح بلوک..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                          <div className="text-[10px] text-blue-500 font-bold px-1">فراموش نکنید پس از اتمام گام‌های داخلی، دکمه «پایان» را بزنید.</div>
                        </div>
                      )}
                      {step.type === 'else' && (
                        <input className="w-full text-sm border rounded-lg px-3 py-2.5 font-bold bg-purple-50/30 border-purple-100" placeholder="شرط جایگزین..." value={step.text} onChange={(e) => updateStep(step.id, { text: e.target.value })} />
                      )}
                      {step.type === 'activate' || step.type === 'deactivate' ? (
                        <select className="w-full text-sm border rounded-lg p-2.5 bg-white font-bold" value={step.actor} onChange={(e) => updateStep(step.id, { actor: e.target.value })}>
                          {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      ) : null}
                      {step.type === 'end' && (
                        <p className="text-sm text-slate-500 text-center font-bold py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">بستن بلوک (End)</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {state.steps.length === 0 && (
                   <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                    <p className="text-slate-400 text-sm px-10 leading-relaxed font-bold">
                      لیست گام‌ها خالی است. <br/> از نوار ابزار سمت راست دستور جدید اضافه کنید.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Preview Panel with Zoom Logic */}
        <div className="flex-1 flex flex-col bg-slate-100 p-6 overflow-hidden relative">
          <div className="flex gap-3 mb-4">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${activeTab === 'editor' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              پیش‌نمایش دیاگرام
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              کد Mermaid
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 text-sm text-slate-700 shadow-sm">
              <input type="checkbox" id="autonumber" className="w-4 h-4 text-blue-600 cursor-pointer" checked={state.autoNumber} onChange={(e) => setState(prev => ({ ...prev, autoNumber: e.target.checked }))} />
              <label htmlFor="autonumber" className="cursor-pointer select-none font-bold">شماره‌گذاری</label>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[2rem] shadow-2xl overflow-auto border border-slate-200 relative min-h-0">
            {activeTab === 'editor' ? (
              <div className="min-w-full min-h-full flex flex-col items-center p-12 relative overflow-visible">
                {/* Zoom Controls Overlay */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-2xl transition-all hover:scale-105">
                  <button onClick={() => handleZoom(-0.1)} className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors" title="کوچک‌نمایی"><ZoomOut className="w-5 h-5" /></button>
                  <div className="px-3 text-xs font-bold text-slate-700 min-w-[50px] text-center border-x border-slate-100 select-none">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  <button onClick={() => handleZoom(0.1)} className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors" title="بزرگنمایی"><ZoomIn className="w-5 h-5" /></button>
                  <button onClick={resetZoom} className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors" title="بازنشانی"><RotateCcw className="w-5 h-5" /></button>
                </div>

                <div 
                  className="transition-transform duration-150 ease-out origin-top"
                  style={{ transform: `scale(${zoomLevel})` }}
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              </div>
            ) : (
              <div className="w-full h-full relative group">
                <button onClick={copyInTab} className="absolute top-8 left-8 z-30 flex items-center gap-2 bg-slate-800/95 hover:bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all opacity-0 group-hover:opacity-100 shadow-2xl border border-slate-700">
                  {codeTabCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {codeTabCopied ? 'کپی شد' : 'کپی سریع کد'}
                </button>
                <pre className="w-full h-full p-10 text-sm font-mono text-slate-800 bg-slate-900 text-blue-100 overflow-auto whitespace-pre-wrap leading-relaxed select-all">
                  {mermaidCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                راهنمای طراحی دیاگرام
              </h2>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-7 h-7 text-slate-400" /></button>
            </div>
            <div className="p-10 overflow-y-auto space-y-8 text-sm text-slate-700 text-right">
              <section><h3 className="font-bold text-blue-700 mb-2 border-r-4 border-blue-500 pr-3">افزودن دستور جدید</h3><p>از نوار ابزار سمت راست برای اضافه کردن گام‌های جدید استفاده کنید.</p></section>
              <section className="bg-blue-50 p-6 rounded-3xl"><h3 className="font-bold text-blue-800 mb-2">پیش‌نمایش هوشمند</h3><p>حتی اگر فراموش کنید بلوک‌های حلقه (Loop) یا شرط (Alt) را ببندید، سیستم به صورت هوشمند پیش‌نمایش را به شما نشان می‌دهد تا روند طراحی مختل نشود.</p></section>
              <section><h3 className="font-bold text-slate-700 mb-2 border-r-4 border-slate-400 pr-3">خروجی کد</h3><p>پس از اتمام طراحی، می‌توانید کد را کپی کرده یا دیاگرام را دانلود کنید.</p></section>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setShowHelp(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-bold text-base">متوجه شدم</button>
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
  <button onClick={onClick} className="flex flex-col items-center group relative w-full px-1">
    <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm ${color} text-white`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
    </div>
    <span className="text-[10px] text-slate-500 font-bold mt-1 group-hover:text-slate-800 transition-colors tracking-tighter">{label}</span>
    <div className="absolute right-full mr-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-3 group-hover:translate-x-0 whitespace-nowrap z-50 border border-slate-700 font-bold">
      افزودن {label}
    </div>
  </button>
);

export default App;
