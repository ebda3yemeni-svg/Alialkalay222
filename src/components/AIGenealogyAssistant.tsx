import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, UserCheck, AlertTriangle, GitBranch, RefreshCw, User, ShieldAlert, CheckCircle2, ChevronLeft, ExternalLink, HelpCircle, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { API_BASE_URL } from '../config.ts';
import { Person } from '../types.ts';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface SuggestionItem {
  id: string;
  type: 'duplicate' | 'missing' | 'error';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  personId: number;
  personName: string;
  relatedPersonId?: number | null;
  relatedPersonName?: string | null;
  suggestedFix: string;
  requiresApproval: boolean;
}

interface AIGenealogyAssistantProps {
  onSelectPerson: (personId: number) => void;
  onOpenEditPerson?: (person?: Person) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const AIGenealogyAssistant: React.FC<AIGenealogyAssistantProps> = ({
  onSelectPerson,
  onOpenEditPerson,
  isModal = false,
  onCloseModal,
}) => {
  const { isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'suggestions'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'مرحباً بك! أنا **مساعد الأنساب الذكي** الخاص بموسوعة بني علي الكلعي.\n\nيمكنني مساعدتك في الإجابة عن كل ما يتعلق بالأنساب، الأجداد، السلالات، صلات القرابة والبحث الطبيعي في قاعدة البيانات المعتمدة.\n\nكيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [approvedSuggestions, setApprovedSuggestions] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'من هو والد أحمد بن علي؟',
    'ما صلة القرابة بين أحمد ومحمد؟',
    'من هم أحفاد وأبناء الجد علي؟',
    'أوجد الجد المشترك وسلسلة النسب',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModal && onCloseModal) {
        onCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onCloseModal]);

  useEffect(() => {
    if (isAdmin && activeSubTab === 'suggestions') {
      fetchAdminSuggestions();
    }
  }, [isAdmin, activeSubTab]);

  const fetchAdminSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/admin-suggestions`);
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Failed to fetch AI admin suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      // Prepare history
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text,
        }));

      const response = await fetch(`${API_BASE_URL}/api/ai/genealogy-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, history }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل الاتصال بمساعد الأنساب');
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'لم يتم استلام رد، يرجى المحاولة لاحقاً.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ ${err.message || 'حدث خطأ أثناء التواصل مع مساعد الأنساب الذكي.'}`,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSuggestion = (id: string, personId: number) => {
    setApprovedSuggestions((prev) => new Set(prev).add(id));
    onSelectPerson(personId);
  };

  /**
   * Helper to format assistant text and turn `[person:ID|Name]` into clickable interactive pills
   */
  const renderFormattedText = (text: string) => {
    const personRegex = /\[person:(\d+)\|([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = personRegex.exec(text)) !== null) {
      // Push text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const personId = parseInt(match[1]);
      const personName = match[2];

      parts.push(
        <button
          key={`person_${personId}_${match.index}`}
          onClick={() => onSelectPerson(personId)}
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-lg bg-[#C5A059]/20 hover:bg-[#C5A059]/40 text-[#C5A059] border border-[#C5A059]/40 font-bold text-xs transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title={`فتح بطاقة ملف ${personName}`}
        >
          <User className="w-3 h-3 text-[#C5A059]" />
          <span>{personName}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </button>
      );

      lastIndex = personRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div
      className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#C5A059]/30 flex flex-col overflow-hidden ${
        isModal ? 'h-[92vh] sm:h-[85vh] max-h-[800px] w-full max-w-4xl mx-auto' : 'h-[750px] w-full'
      }`}
    >
      {/* Top Header */}
      <div className="bg-[#1A2A40] text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-[#C5A059]/30 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#9E7B3B] p-0.5 flex items-center justify-center shadow-lg shrink-0">
            <div className="w-full h-full bg-[#1A2A40] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-[#C5A059]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-xl font-bold font-amiri text-[#C5A059]">
                مساعد الأنساب الذكي
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] text-[9px] sm:text-[10px] font-bold border border-[#C5A059]/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ذكاء اصطناعي موثوق
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-300 line-clamp-1 sm:line-clamp-none">
              مساعد تفاعلي فورى للإجابة وتحليل المشجرة بناءً على بيانات السلسلة المعتمدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex bg-[#243B55] p-1 rounded-xl border border-[#C5A059]/30 text-xs font-bold">
              <button
                onClick={() => setActiveSubTab('chat')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  activeSubTab === 'chat'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                محادثة الأنساب
              </button>
              <button
                onClick={() => setActiveSubTab('suggestions')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeSubTab === 'suggestions'
                    ? 'bg-[#C5A059] text-[#1A2A40] shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مقترحات التدقيق</span>
              </button>
            </div>
          )}

          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer active:scale-95"
              title="إغلاق النافذة (Esc)"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
              <span className="hidden sm:inline">إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'chat' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#FBF9F5]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  msg.sender === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-bold shadow ${
                    msg.sender === 'user'
                      ? 'bg-[#1A2A40] text-white'
                      : 'bg-[#C5A059] text-[#1A2A40]'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div
                  className={`rounded-2xl p-4 shadow-sm text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1A2A40] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-[#C5A059]/30 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{renderFormattedText(msg.text)}</div>
                  <div
                    className={`text-[10px] mt-2 text-left ${
                      msg.sender === 'user' ? 'text-gray-400' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%] ml-auto">
                <div className="w-9 h-9 rounded-2xl bg-[#C5A059] text-[#1A2A40] flex items-center justify-center shadow">
                  <Bot className="w-5 h-5 animate-bounce" />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#C5A059]/30 shadow-sm flex items-center gap-2 text-xs font-bold text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                  جاري البحث والتحليل في قاعدة بيانات الأنساب...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 sm:px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs shrink-0">
            <span className="text-gray-400 font-bold flex-shrink-0 text-[11px] flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#C5A059]" />
              أسئلة مقترحة:
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#C5A059]/15 hover:text-[#C5A059] hover:border-[#C5A059]/40 border border-transparent text-gray-700 font-medium whitespace-nowrap transition-all text-xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 sm:p-4 bg-white border-t border-[#C5A059]/30 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="اطرح سؤالك هنا (مثلاً: من هو والد أحمد؟ أو ما صلة القرابة بين أحمد ومحمد؟)..."
              disabled={loading}
              className="flex-1 min-w-0 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:border-[#C5A059] focus:bg-white focus:outline-none text-xs sm:text-sm font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
              title="إرسال الرسالة"
              aria-label="إرسال"
            >
              <span>إرسال</span>
              <Send className="w-4 h-4 rotate-180 shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        /* Admin AI Suggestions Tab */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">مقترحات التدقيق الذكي (خاصة بالمدراء والمشرفين):</p>
              يقوم مساعد الذكاء الاصطناعي بفحص سجلات الأنساب اكتشافاً لاحتمالية تكرار الأشخاص، العلاقات المفقودة، أو التواريخ غير المنطقية. **جميع المقترحات تتطلب موافقة صريحة من المشرف قبل التطبيق**.
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              قائمة الاقتراحات المكتشفة ({suggestions.length})
            </h3>

            <button
              onClick={fetchAdminSuggestions}
              disabled={loadingSuggestions}
              className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-[#C5A059] flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
              تحديث الفحص
            </button>
          </div>

          {loadingSuggestions ? (
            <div className="py-12 text-center text-sm font-bold text-gray-500 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin" />
              جاري فحص وتدقيق بيانات المشجرة...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-gray-800 text-base">لم يتم العثور على أخطاء أو تكرارات في البيانات!</p>
              <p className="text-xs text-gray-500 mt-1">جميع السجلات والعلاقات المسجلة سليمة ومتسقة مع قواعد النسَب.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((item) => {
                const isApproved = approvedSuggestions.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                      isApproved ? 'border-emerald-400 bg-emerald-50/30 opacity-75' : 'border-gray-200 hover:border-[#C5A059]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            item.type === 'duplicate'
                              ? 'bg-amber-100 text-amber-800'
                              : item.type === 'missing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.type === 'duplicate'
                            ? 'احتمالية تكرار'
                            : item.type === 'missing'
                            ? 'علاقة مفقودة'
                            : 'خطأ في البيانات'}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          درجة الأهمية: {item.severity === 'high' ? 'عالية' : item.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">{item.description}</p>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs mb-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">السجل المعني:</span>
                          <button
                            onClick={() => onSelectPerson(item.personId)}
                            className="font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                          >
                            <span>{item.personName}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        {item.relatedPersonName && (
                          <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                            <span className="text-gray-500">السجل المقترن:</span>
                            <button
                              onClick={() => item.relatedPersonId && onSelectPerson(item.relatedPersonId)}
                              className="font-bold text-[#C5A059] hover:underline flex items-center gap-1"
                            >
                              <span>{item.relatedPersonName}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100 mb-4">
                        <span className="font-bold text-amber-900">الإجراء المقترح:</span> {item.suggestedFix}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {isApproved ? (
                        <div className="w-full text-center py-2 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          تمت المراجعة وفتح الملف للمشرف
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApproveSuggestion(item.id, item.personId)}
                            className="flex-1 py-2.5 bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <UserCheck className="w-4 h-4" />
                            موافقة ومراجعة الملف
                          </button>
                          {onOpenEditPerson && (
                            <button
                              onClick={() => onOpenEditPerson({ id: item.personId, fullName: item.personName } as Person)}
                              className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-colors"
                            >
                              تعديل
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
