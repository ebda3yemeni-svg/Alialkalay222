import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config.ts';
import {
  GitCompare,
  Search,
  UserCheck,
  Share2,
  Copy,
  Check,
  Printer,
  History,
  Trash2,
  ArrowRightLeft,
  Crown,
  Info,
  Sparkles,
  Download,
  FileSpreadsheet,
  AlertCircle,
  FileText,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Person, ComparisonResult, ComparisonHistoryItem } from '../types.ts';
import { VoiceSearchButton } from './VoiceSearchButton.tsx';
import { searchPeople, getPersonDisplayName } from '../utils/search.ts';

interface RelationshipComparatorProps {
  initialPerson1Id?: number | null;
  initialPerson2Id?: number | null;
  allPeople: Person[];
  onSelectPersonProfile?: (personId: number) => void;
}

export const RelationshipComparator: React.FC<RelationshipComparatorProps> = ({
  initialPerson1Id,
  initialPerson2Id,
  allPeople,
  onSelectPersonProfile,
}) => {
  const [person1Id, setPerson1Id] = useState<number | null>(initialPerson1Id || null);
  const [person2Id, setPerson2Id] = useState<number | null>(initialPerson2Id || null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [exportingImg, setExportingImg] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  const [search1, setSearch1] = useState<string>('');
  const [search2, setSearch2] = useState<string>('');
  const [showDropdown1, setShowDropdown1] = useState<boolean>(false);
  const [showDropdown2, setShowDropdown2] = useState<boolean>(false);

  const [history, setHistory] = useState<ComparisonHistoryItem[]>([]);

  const exportRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('genealogy_compare_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load comparison history:', e);
    }
  }, []);

  // Sync initial props if changed
  useEffect(() => {
    if (initialPerson1Id) setPerson1Id(initialPerson1Id);
    if (initialPerson2Id) setPerson2Id(initialPerson2Id);
  }, [initialPerson1Id, initialPerson2Id]);

  // Sync search input values when person IDs change
  useEffect(() => {
    if (person1Id) {
      const p1 = allPeople.find((p) => Number(p.id) === Number(person1Id));
      if (p1) setSearch1(getPersonDisplayName(p1));
    }
    if (person2Id) {
      const p2 = allPeople.find((p) => Number(p.id) === Number(person2Id));
      if (p2) setSearch2(getPersonDisplayName(p2));
    }
  }, [person1Id, person2Id, allPeople]);

  // Fetch comparison result whenever both valid IDs are selected
  useEffect(() => {
    if (!person1Id || !person2Id) {
      setComparison(null);
      setError(null);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/people/compare?p1=${person1Id}&p2=${person2Id}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'أحد الشخصين المحددين غير موجود أو لا توجد صلة قرابة مسجلة');
        }
        const data: ComparisonResult = await res.json();
        setComparison(data);

        // Save to history if valid comparison
        if (data && data.person1 && data.person2) {
          const name1 = getPersonDisplayName(data.person1);
          const name2 = getPersonDisplayName(data.person2);
          const ancName = data.commonAncestor ? getPersonDisplayName(data.commonAncestor) : 'لا يوجد جد مشترك';

          const newItem: ComparisonHistoryItem = {
            id: `${data.person1.id}_${data.person2.id}_${Date.now()}`,
            person1Id: data.person1.id,
            person1Name: name1,
            person2Id: data.person2.id,
            person2Name: name2,
            commonAncestorName: ancName,
            relationshipDegree: data.relationshipDegree,
            timestamp: new Date().toLocaleDateString('ar-SA', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          setHistory((prev) => {
            const filtered = prev.filter(
              (item) =>
                !(
                  (item.person1Id === data.person1.id && item.person2Id === data.person2.id) ||
                  (item.person1Id === data.person2.id && item.person2Id === data.person1.id)
                )
            );
            const updated = [newItem, ...filtered].slice(0, 15);
            try {
              localStorage.setItem('genealogy_compare_history', JSON.stringify(updated));
            } catch (err) {
              console.error(err);
            }
            return updated;
          });
        }
      } catch (err: any) {
        console.error('Comparison error:', err);
        setError(err.message || 'حدث خطأ أثناء إجراء المقارنة');
        setComparison(null);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();

    const handleDataUpdate = () => {
      fetchComparison();
    };

    window.addEventListener('genealogy_data_updated', handleDataUpdate);
    window.addEventListener('app_global_refresh', handleDataUpdate);
    return () => {
      window.removeEventListener('genealogy_data_updated', handleDataUpdate);
      window.removeEventListener('app_global_refresh', handleDataUpdate);
    };
  }, [person1Id, person2Id]);

  const handleSwap = () => {
    const tempId = person1Id;
    const tempSearch = search1;
    setPerson1Id(person2Id);
    setSearch1(search2);
    setPerson2Id(tempId);
    setSearch2(tempSearch);
  };

  const handleCopySummary = () => {
    if (!comparison) return;
    navigator.clipboard.writeText(comparison.formattedSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleShareLink = () => {
    if (!person1Id || !person2Id) return;
    const url = `${window.location.origin}${window.location.pathname}?tab=compare&p1=${person1Id}&p2=${person2Id}`;

    if (navigator.share && comparison) {
      navigator
        .share({
          title: 'تحليل صلة القرابة - مشجرة العائلة',
          text: comparison.formattedSummary,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setExportingImg(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `genealogy-comparison-${person1Id}-${person2Id}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setExportingImg(false);
    }
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    setExportingPdf(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`genealogy-comparison-${person1Id}-${person2Id}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('genealogy_compare_history');
    } catch (e) {
      console.error(e);
    }
  };

  // Intelligent search for dropdown list items with scoring & ranking
  const filteredPeople1 = searchPeople(allPeople, search1, 10);
  const filteredPeople2 = searchPeople(allPeople, search2, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 dir-rtl text-right">
      {/* Header Section */}
      <div className="bg-gradient-to-l from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-full text-xs font-medium">
              <GitCompare className="w-3.5 h-3.5" />
              أداة صلة القرابة المحسّنة
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              مقارنة وتحديد صلة القرابة بالاسم الكامل
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-2xl leading-relaxed">
              اختر أي شخصين من المشجرة بالاسم الكامل للبحث الذكي، تحديد الجد المشترك، ودرجة القرابة والتقرير القابل للتصدير والمشاركة.
            </p>
          </div>

          <div className="hidden lg:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-amber-300">
            <GitCompare className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Selectors Section */}
      <div id="compare-selector-card" className="bg-white rounded-2xl p-6 shadow-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          تحديد طرفي المقارنة بالاسم الكامل
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Person 1 Selector */}
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              الشخص الأول (ابحث بالاسم الكامل أو الجد أو القبيلة)
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search1}
                  onChange={(e) => {
                    setSearch1(e.target.value);
                    setShowDropdown1(true);
                    if (!e.target.value) setPerson1Id(null);
                  }}
                  onFocus={() => setShowDropdown1(true)}
                  placeholder="ابحث بالاسم الكامل أو الأب..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
              <VoiceSearchButton
                size="sm"
                onSpeechResult={(res) => {
                  setSearch1(res);
                  setShowDropdown1(true);
                }}
              />
            </div>

            {/* Person 1 Dropdown */}
            {showDropdown1 && filteredPeople1.length > 0 && (
              <div className="absolute z-30 right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredPeople1.map((p) => {
                  const displayName = getPersonDisplayName(p);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPerson1Id(p.id);
                        setSearch1(displayName);
                        setShowDropdown1(false);
                      }}
                      className="w-full text-right px-4 py-3 hover:bg-emerald-50 text-slate-800 text-sm flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block leading-tight">{displayName}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {p.tribe && <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">القبيلة: {p.tribe}</span>}
                          {p.branch && <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">الفرع: {p.branch}</span>}
                        </div>
                      </div>
                      {p.id === person1Id && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center py-2">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!person1Id && !person2Id}
              title="تبديل الطرفين"
              className="p-3 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-full transition-all border border-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Person 2 Selector */}
          <div className="md:col-span-5 relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              الشخص الثاني (ابحث بالاسم الكامل أو الجد أو القبيلة)
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search2}
                  onChange={(e) => {
                    setSearch2(e.target.value);
                    setShowDropdown2(true);
                    if (!e.target.value) setPerson2Id(null);
                  }}
                  onFocus={() => setShowDropdown2(true)}
                  placeholder="ابحث بالاسم الكامل أو الأب..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
              <VoiceSearchButton
                size="sm"
                onSpeechResult={(res) => {
                  setSearch2(res);
                  setShowDropdown2(true);
                }}
              />
            </div>

            {/* Person 2 Dropdown */}
            {showDropdown2 && filteredPeople2.length > 0 && (
              <div className="absolute z-30 right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredPeople2.map((p) => {
                  const displayName = getPersonDisplayName(p);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPerson2Id(p.id);
                        setSearch2(displayName);
                        setShowDropdown2(false);
                      }}
                      className="w-full text-right px-4 py-3 hover:bg-emerald-50 text-slate-800 text-sm flex items-center justify-between transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block leading-tight">{displayName}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {p.tribe && <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">القبيلة: {p.tribe}</span>}
                          {p.branch && <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">الفرع: {p.branch}</span>}
                        </div>
                      </div>
                      {p.id === person2Id && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-md border border-slate-100">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium">جاري تحليل مسارات النسب بالأسماء الكاملة والبحث عن الجد المشترك...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-base">{error}</h3>
          <p className="text-xs text-rose-600">يرجى التأكد من اختيار شخصين صحيحين من المشجرة أو التحقق من البيانات المسجلة.</p>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && !loading && (
        <div className="space-y-8" ref={exportRef}>
          {/* Summary Banner Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-emerald-100 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  نتيجة تحليل القرابة المكتملة
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{comparison.relationshipDegree}</h2>
                <p className="text-slate-600 text-sm font-medium">{comparison.relationshipType}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200 active:scale-95"
                >
                  {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copiedSummary ? 'تم النسخ!' : 'نسخ نتيجة القرابة'}
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all border border-emerald-800 active:scale-95 shadow-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                  {copiedLink ? 'تم نسخ الرابط!' : 'مشاركة نتيجة القرابة'}
                </button>

                <button
                  type="button"
                  onClick={handleExportImage}
                  disabled={exportingImg}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
                  title="تحميل التقرير كصورة PNG"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  {exportingImg ? 'جاري التحميل...' : 'تصدير صورة'}
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
                  title="تصدير ملف PDF"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  {exportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
                  title="طباعة التقرير"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Formatted Text Box */}
            <div className="mt-6 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-xs font-bold text-emerald-900 block mb-1">نص الملخص الكامل للنشر والمشاركة:</span>
              <p className="text-base font-bold text-emerald-950 font-serif leading-relaxed dir-rtl">
                {comparison.formattedSummary}
              </p>
            </div>

            {/* Simple Relationship Explanation */}
            <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">شرح وتوضيح القرابة بأسلوب مبسط:</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{comparison.explanation}</p>
              </div>
            </div>
          </div>

          {/* Visual Comparison Tree Diagram */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
            <h3 className="text-lg font-bold text-amber-300 mb-6 text-center flex items-center justify-center gap-2">
              <GitCompare className="w-5 h-5 text-amber-400" />
              شجرة المقارنة والتقاء النسب (الأسماء الكاملة)
            </h3>

            {/* Common Ancestor Card */}
            {comparison.commonAncestor ? (
              <div className="flex flex-col items-center mb-8 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-bold mb-3">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  الجد المشترك بين الطرفين
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPersonProfile && onSelectPersonProfile(comparison.commonAncestor!.id)}
                  className="bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white rounded-2xl p-4 shadow-xl border-2 border-amber-300 text-center transition-all transform hover:-translate-y-1 group max-w-lg min-w-[280px]"
                >
                  {/* Full Registered Name displayed everywhere */}
                  <span className="text-lg font-extrabold block text-amber-100 group-hover:text-white mb-1 leading-snug">
                    {getPersonDisplayName(comparison.commonAncestor)}
                  </span>
                  {comparison.commonAncestor.tribe && (
                    <span className="text-xs text-amber-300/90 block font-medium">
                      القبيلة: {comparison.commonAncestor.tribe}
                    </span>
                  )}
                </button>

                {/* Vertical Stem down to branches */}
                <div className="w-0.5 h-8 bg-amber-400/60 my-2" />
                <div className="w-full max-w-xl h-0.5 bg-amber-400/40" />
              </div>
            ) : (
              <div className="text-center p-6 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300 mb-8">
                لم يتم العثور على جد مشترك مباشر مسجل في البيانات
              </div>
            )}

            {/* Two Branch Lineage Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {/* Branch 1 */}
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/80 space-y-4">
                <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-400 font-semibold block">سلسلة نسب الطرف الأول</span>
                    <h4 className="text-base font-bold text-white">{getPersonDisplayName(comparison.person1)}</h4>
                  </div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    العمق: {comparison.distance1} أجيال
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {comparison.path1.map((step, idx) => (
                    <div key={`p1_step_${step.person.id}_${idx}`} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => onSelectPersonProfile && onSelectPersonProfile(step.person.id)}
                        className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-center justify-between group ${
                          step.person.id === comparison.person1.id
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 hover:bg-emerald-900'
                            : step.person.id === comparison.commonAncestor?.id
                            ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        <div className="space-y-0.5">
                          {/* Full Name Displayed */}
                          <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span>{getPersonDisplayName(step.person)}</span>
                            {step.person.id === comparison.person1.id && (
                              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                                البداية
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-900/60 text-slate-300 border border-slate-700 flex-shrink-0">
                          {step.relationshipToTarget}
                        </span>
                      </button>

                      {idx < comparison.path1.length - 1 && (
                        <div className="w-0.5 h-4 bg-emerald-500/40 my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch 2 */}
              <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/80 space-y-4">
                <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-teal-400 font-semibold block">سلسلة نسب الطرف الثاني</span>
                    <h4 className="text-base font-bold text-white">{getPersonDisplayName(comparison.person2)}</h4>
                  </div>
                  <span className="text-xs bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-full border border-teal-500/30">
                    العمق: {comparison.distance2} أجيال
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  {comparison.path2.map((step, idx) => (
                    <div key={`p2_step_${step.person.id}_${idx}`} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => onSelectPersonProfile && onSelectPersonProfile(step.person.id)}
                        className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-center justify-between group ${
                          step.person.id === comparison.person2.id
                            ? 'bg-teal-950/80 border-teal-500 text-teal-100 hover:bg-teal-900'
                            : step.person.id === comparison.commonAncestor?.id
                            ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        <div className="space-y-0.5">
                          {/* Full Name Displayed */}
                          <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span>{getPersonDisplayName(step.person)}</span>
                            {step.person.id === comparison.person2.id && (
                              <span className="text-[10px] bg-teal-500 text-slate-950 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                                البداية
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-medium px-2 py-1 rounded bg-slate-900/60 text-slate-300 border border-slate-700 flex-shrink-0">
                          {step.relationshipToTarget}
                        </span>
                      </button>

                      {idx < comparison.path2.length - 1 && (
                        <div className="w-0.5 h-4 bg-teal-500/40 my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison History Section */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 print:hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              سجل المقارنات السابقة الحافظة
            </h3>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              مسح السجل
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPerson1Id(item.person1Id);
                  setPerson2Id(item.person2Id);
                  setSearch1(item.person1Name);
                  setSearch2(item.person2Name);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200 hover:border-emerald-300 text-right transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 mb-1 leading-snug group-hover:text-emerald-700">
                  {item.person1Name} × {item.person2Name}
                </div>
                <div className="text-[11px] text-emerald-800 font-semibold">{item.relationshipDegree}</div>
                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between border-t border-slate-200/60 pt-1">
                  <span className="truncate max-w-[150px]">الجد: {item.commonAncestorName}</span>
                  <span>{item.timestamp}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
