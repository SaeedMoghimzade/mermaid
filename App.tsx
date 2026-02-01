
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Play, 
  User, 
  Server, 
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
  Palette
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

  // Render SVG Preview
  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidCode) return;
      try {
        const { svg } = await mermaid.render('mermaid-svg', mermaidCode);
        setPreviewSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };
    renderDiagram();
  }, [mermaidCode]);

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

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Layout className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mermaid Sequence Builder</h1>
            <p className="text-xs text-slate-500">طراح هوشمند سکوئنس دیاگرام بدون نیاز به کدنویسی</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium border border-slate-200"
            title="راهنما"
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">راهنما</span>
          </button>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'کپی شد' : 'کپی کد'}
          </button>
          <button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-md"
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
            دانلود فایل
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar - Controls */}
        <div className="w-1/3 bg-white border-l overflow-y-auto p-6 shadow-inner">
          <div className="space-y-8">
            {/* Participants Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                  <User className="w-5 h-5 text-blue-500" />
                  شرکت‌کنندگان
                </h2>
                <button 
                  onClick={addParticipant}
                  className="p-1 hover:bg-blue-50 text-blue-600 rounded-full transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-3">
                {state.participants.map(p => (
                  <div key={p.id} className="relative">
                    <div 
                      className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200"
                      style={{ borderRight: p.color ? `4px solid ${p.color}` : undefined }}
                    >
                      <select 
                        value={p.type} 
                        onChange={(e) => updateParticipant(p.id, p.name, e.target.value as any)}
                        className="bg-white border text-sm rounded px-1 py-1 outline-none"
                      >
                        <option value="participant">Participant</option>
                        <option value="actor">Actor</option>
                      </select>
                      <input 
                        type="text" 
                        value={p.name}
                        onChange={(e) => updateParticipant(p.id, e.target.value, p.type)}
                        className="flex-1 bg-white border rounded px-2 py-1 text-sm focus:border-blue-500 outline-none"
                        placeholder="نام شرکت کننده..."
                      />
                      <button 
                        onClick={() => setActiveColorPicker(activeColorPicker === p.id ? null : p.id)}
                        className={`p-1 rounded transition-colors ${p.color ? 'text-blue-600' : 'text-slate-400'} hover:bg-blue-50`}
                        title="انتخاب ظاهر"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeParticipant(p.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {activeColorPicker === p.id && (
                      <div className="absolute top-full right-0 mt-1 z-30 bg-white border rounded-xl shadow-xl p-3 grid grid-cols-4 gap-2 animate-in fade-in zoom-in duration-150">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color.value}
                            onClick={() => {
                              updateParticipant(p.id, p.name, p.type, color.value);
                              setActiveColorPicker(null);
                            }}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.value || '#fff' }}
                            title={color.name}
                          >
                            {!color.value && <X className="w-4 h-4 text-slate-400" />}
                            {p.color === color.value && color.value && <Check className="w-4 h-4 text-slate-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Step Builder Section */}
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
                <Play className="w-5 h-5 text-green-500" />
                افزودن دستور جدید
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <ToolButton icon={<MessageSquare className="w-4 h-4" />} label="پیام" onClick={() => addStep('message')} />
                <ToolButton icon={<StickyNote className="w-4 h-4" />} label="یادداشت" onClick={() => addStep('note')} />
                <ToolButton icon={<RefreshCw className="w-4 h-4" />} label="حلقه" onClick={() => addStep('loop')} />
                <ToolButton icon={<Code className="w-4 h-4" />} label="شرط (Alt)" onClick={() => addStep('alt')} />
                <ToolButton icon={<Code className="w-4 h-4" />} label="اختیاری (Opt)" onClick={() => addStep('opt')} />
                <ToolButton icon={<Trash2 className="w-4 h-4" />} label="پایان بلوک" onClick={() => addStep('end')} />
                <ToolButton icon={<Play className="w-4 h-4" />} label="فعال سازی" onClick={() => addStep('activate')} />
                <ToolButton icon={<Play className="w-4 h-4 rotate-180" />} label="غیرفعال سازی" onClick={() => addStep('deactivate')} />
              </div>
            </section>

            {/* Step List Section */}
            <section className="pb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
                <Layout className="w-5 h-5 text-orange-500" />
                لیست گام‌ها
              </h2>
              <div className="space-y-4">
                {state.steps.map((step, idx) => (
                  <div key={step.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b">
                      <span className="text-xs font-bold text-slate-500 uppercase">{step.type}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveStep(idx, 'up')} className="p-1 hover:bg-slate-200 rounded"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveStep(idx, 'down')} className="p-1 hover:bg-slate-200 rounded"><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {step.type === 'message' && (
                        <>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                              <select 
                                className="text-xs border rounded p-1 w-1/2"
                                value={step.from}
                                onChange={(e) => updateStep(step.id, { from: e.target.value })}
                              >
                                {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                              <span className="text-slate-400 text-xs font-bold">به</span>
                              <select 
                                className="text-xs border rounded p-1 w-1/2"
                                value={step.to}
                                onChange={(e) => updateStep(step.id, { to: e.target.value })}
                              >
                                {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                            </div>
                            <select 
                              className="w-full text-xs border rounded p-1"
                              value={step.arrow}
                              onChange={(e) => updateStep(step.id, { arrow: e.target.value as any })}
                            >
                              <option value="->>">خط ممتد (با سرپیکان)</option>
                              <option value="->">خط ممتد (بدون سرپیکان)</option>
                              <option value="-->>">خط‌چین (با سرپیکان)</option>
                              <option value="-->">خط‌چین (بدون سرپیکان)</option>
                              <option value="-x">خط ممتد (با علامت ضربدر)</option>
                              <option value="--x">خط‌چین (با علامت ضربدر)</option>
                              <option value="-)">خط ممتد (پیکان باز - ناهمگام)</option>
                              <option value="--)">خط‌چین (پیکان باز - ناهمگام)</option>
                            </select>
                          </div>
                          <input 
                            className="w-full text-sm border rounded px-2 py-1"
                            placeholder="متن پیام..."
                            value={step.text}
                            onChange={(e) => updateStep(step.id, { text: e.target.value })}
                          />
                        </>
                      )}

                      {step.type === 'note' && (
                        <>
                          <div className="flex gap-2 items-center">
                            <select 
                              className="text-xs border rounded p-1 w-1/2"
                              value={step.position}
                              onChange={(e) => updateStep(step.id, { position: e.target.value as any })}
                            >
                              <option value="over">بر روی</option>
                              <option value="left of">سمت چپ</option>
                              <option value="right of">سمت راست</option>
                            </select>
                            <select 
                              className="text-xs border rounded p-1 w-1/2"
                              value={step.actor}
                              onChange={(e) => updateStep(step.id, { actor: e.target.value })}
                            >
                              {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                          </div>
                          <input 
                            className="w-full text-sm border rounded px-2 py-1"
                            placeholder="متن یادداشت..."
                            value={step.text}
                            onChange={(e) => updateStep(step.id, { text: e.target.value })}
                          />
                        </>
                      )}

                      {(['loop', 'alt', 'opt'].includes(step.type)) && (
                        <input 
                          className="w-full text-sm border rounded px-2 py-1"
                          placeholder="توضیح بلوک..."
                          value={step.text}
                          onChange={(e) => updateStep(step.id, { text: e.target.value })}
                        />
                      )}

                      {(step.type === 'activate' || step.type === 'deactivate') && (
                        <select 
                          className="w-full text-xs border rounded p-1"
                          value={step.actor}
                          onChange={(e) => updateStep(step.id, { actor: e.target.value })}
                        >
                          {state.participants.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      )}

                      {step.type === 'end' && (
                        <p className="text-xs text-slate-400 text-center italic">پایان بلوک فعلی</p>
                      )}
                    </div>
                  </div>
                ))}

                {state.steps.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-sm">هنوز گامی اضافه نکرده‌اید</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-slate-100 p-8 overflow-hidden">
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'editor' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}
            >
              پیش‌نمایش بصری
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}
            >
              مشاهده کد Mermaid
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border text-sm text-slate-600">
              <input 
                type="checkbox" 
                id="autonumber"
                checked={state.autoNumber}
                onChange={(e) => setState(prev => ({ ...prev, autoNumber: e.target.checked }))}
              />
              <label htmlFor="autonumber" className="cursor-pointer select-none">شماره‌گذاری خودکار</label>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-auto border border-slate-200 relative flex items-center justify-center">
            {activeTab === 'editor' ? (
              <div 
                className="w-full h-full p-8 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            ) : (
              <div className="w-full h-full relative group">
                <button 
                  onClick={copyInTab}
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-800/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 shadow-lg border border-slate-700"
                >
                  {codeTabCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {codeTabCopied ? 'کپی شد' : 'کپی سریع'}
                </button>
                <pre className="w-full h-full p-8 text-sm font-mono text-slate-800 bg-slate-900 text-blue-300 overflow-auto whitespace-pre-wrap selection:bg-blue-500/30">
                  {mermaidCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                راهنمای استفاده از ابزار
              </h2>
              <button 
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 text-slate-700 leading-relaxed">
              <section>
                <h3 className="text-lg font-bold text-blue-700 mb-3 border-b pb-2">نحوه شروع کار</h3>
                <p>این ابزار به شما کمک می‌کند بدون نوشتن حتی یک خط کد، دیاگرام‌های توالی (Sequence Diagrams) استاندارد Mermaid.js بسازید.</p>
                <ul className="list-disc list-inside mt-3 space-y-1 mr-4">
                  <li>ابتدا شرکت‌کنندگان (Participants) یا بازیگران (Actors) خود را در ستون سمت چپ تعریف کنید.</li>
                  <li>سپس با استفاده از دکمه‌های بخش "افزودن دستور جدید"، مراحل مختلف دیاگرام را اضافه کنید.</li>
                  <li>هر مرحله اضافه شده را می‌توانید با کلیک بر روی آن ویرایش کرده یا ترتیب آن‌ها را جابجا کنید.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-blue-700 mb-3 border-b pb-2">آشنایی با دستورات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      پیام (Message)
                    </h4>
                    <p className="text-sm">ارسال پیام بین دو شرکت‌کننده. می‌توانید نوع خط (ممتد یا نقطه‌چین) و نوع پیکان را انتخاب کنید.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                      <StickyNote className="w-4 h-4 text-yellow-600" />
                      یادداشت (Note)
                    </h4>
                    <p className="text-sm">اضافه کردن توضیحات اضافی در سمت چپ، راست یا روی یک بازیگر خاص.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      حلقه (Loop)
                    </h4>
                    <p className="text-sm">برای نمایش تکرار یک فرآیند. فراموش نکنید که در پایان مراحل حلقه، دستور "پایان بلوک" را اضافه کنید.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                      <Code className="w-4 h-4 text-purple-600" />
                      شرط (Alt/Opt)
                    </h4>
                    <p className="text-sm"><strong>Alt:</strong> برای نمایش مسیرهای جایگزین (if/else).<br/><strong>Opt:</strong> برای نمایش یک مسیر اختیاری (optional).</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                      <Play className="w-4 h-4 text-orange-600" />
                      فعال‌سازی (Activation)
                    </h4>
                    <p className="text-sm">نمایش نوار عمودی روی خط زندگی (Lifeline) یک بازیگر برای نشان دادن درگیری فعال او در فرآیند.</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      پایان بلوک (End)
                    </h4>
                    <p className="text-sm">این دستور برای بستن بلوک‌های Loop، Alt و Opt ضروری است.</p>
                  </div>
                </div>
              </section>

              <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 mb-2">خروجی گرفتن</h3>
                <p className="text-sm">شما می‌توانید در هر لحظه با رفتن به تب "مشاهده کد Mermaid"، کد تولید شده را کپی کرده و در ابزارهای دیگر (مثل GitHub، Notion یا Obsidian) استفاده کنید. همچنین امکان دانلود فایل با پسوند .mmd فراهم شده است.</p>
              </section>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={() => setShowHelp(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold transition-colors shadow-md"
              >
                فهمیدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600 group"
  >
    <div className="p-2 bg-slate-100 group-hover:bg-blue-100 rounded-lg transition-colors">
      {icon}
    </div>
    <span className="text-xs font-bold">{label}</span>
  </button>
);

export default App;
