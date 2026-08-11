import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceSearchButtonProps {
  onSpeechResult: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onSpeechResult,
  className = '',
  size = 'md',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setErrorMessage('متصفحك لا يدعم خاصية التعرّف الصوتي (متاح في Chrome/Safari/Edge)');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onSpeechResult(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage('تم رفض صلاحية الميكروفون. يُرجى التوجه إلى إعدادات الهاتف > التطبيقات > تفعيل إذن الميكروفون لاستخدام البحث الصوتي');
        } else if (event.error === 'no-speech') {
          setErrorMessage('لم يتم التعرّف على صوت، يُرجى التحدث بوضوح وإعادة المحاولة');
        } else if (event.error === 'network') {
          setErrorMessage('حدث خطأ في الاتصال بالشبكة للتعرّف الصوتي');
        } else {
          setErrorMessage('يلزم السماح بإذن الميكروفون في إعدادات الجهاز لاستخدام البحث الصوتي');
        }
        setTimeout(() => setErrorMessage(null), 6000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setErrorMessage('تعذّر تشغيل الخدمة الصوتية');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const btnPadding = size === 'sm' ? 'p-1.5' : 'p-2.5';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={startListening}
        disabled={isListening}
        title={isListening ? 'جاري الاستماع...' : 'البحث الصوتي باللغة العربية'}
        className={`${btnPadding} rounded-xl transition-all flex items-center justify-center ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300 shadow-lg'
            : 'bg-[#243B55] hover:bg-[#2C4A6B] text-[#C5A059] border border-[#C5A059]/40 hover:border-[#C5A059]'
        } ${className}`}
      >
        {isListening ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : supported ? (
          <Mic className={iconSize} />
        ) : (
          <MicOff className={`${iconSize} opacity-50`} />
        )}
      </button>

      {/* Floating Status / Error Tooltip */}
      {isListening && (
        <span className="absolute bottom-full mb-2 right-0 whitespace-nowrap bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl animate-bounce border border-rose-400 z-50">
          🎙️ جاري الاستماع... اتكلّم بالاسم
        </span>
      )}

      {errorMessage && (
        <span className="absolute top-full mt-2 right-0 max-w-xs whitespace-normal bg-slate-900 text-rose-300 text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-xl border border-rose-500/40 z-50">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
