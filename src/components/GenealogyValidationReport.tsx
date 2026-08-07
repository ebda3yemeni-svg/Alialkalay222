import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.ts';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Edit,
  Filter,
  Info,
  User,
  ExternalLink,
  Search,
  Zap,
  GitMerge,
  Check,
  X,
  Lock,
  Eye,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Person,
  GenealogyValidationIssue,
  FourPartDuplicateWarning,
  DataReviewDashboardPayload,
} from '../types.ts';

interface GenealogyValidationReportProps {
  onEditPerson: (personId: number) => void;
  onSelectPersonProfile?: (personId: number) => void;
  onClose?: () => void;
}

export const GenealogyValidationReport: React.FC<GenealogyValidationReportProps> = ({
  onEditPerson,
  onSelectPersonProfile,
  onClose,
}) => {
  const { isAdmin, token, dbUser } = useAuth();
  const [dataPayload, setDataPayload] = useState<DataReviewDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'duplicates' | 'unverified' | 'review' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Merge Resolution Modal State
  const [selectedMergeWarning, setSelectedMergeWarning] = useState<FourPartDuplicateWarning | null>(null);
  const [primaryPersonId, setPrimaryPersonId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  // Approving State
  const [approvingPairKey, setApprovingPairKey] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/admin/data-review`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('فشل جلب بيانات لوحة تدقيق الأنساب');
      }

      const payload: DataReviewDashboardPayload = await res.json();
      setDataPayload(payload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تحميل بيانات التدقيق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin, token]);

  // Handle Approve Different People
  const handleApproveDifferent = async (warning: FourPartDuplicateWarning) => {
    try {
      setApprovingPairKey(warning.pairKey);
      const res = await fetch(`${API_BASE_URL}/api/admin/duplicate-reviews/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          person1Id: warning.person1.id,
          person2Id: warning.person2.id,
          normalizedName: warning.normalized4PartName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشلت عملية اعتماد السجلين كمختلفين');
      }

      setActionSuccessMessage(
        `تم حفظ اعتماد (${warning.person1.fullName}) و (${warning.person2.fullName}) كشخصين مختلفين مستقلين دائمياً.`
      );

      // Trigger sync events
      window.dispatchEvent(
        new CustomEvent('genealogy_data_updated', {
          detail: { action: 'duplicate_approved' },
        })
      );
      window.dispatchEvent(new CustomEvent('app_global_refresh'));

      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الاعتماد');
    } finally {
      setApprovingPairKey(null);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  // Handle Execute Merge
  const handleExecuteMerge = async () => {
    if (!selectedMergeWarning || !primaryPersonId) return;

    const duplicateId =
      primaryPersonId === selectedMergeWarning.person1.id
        ? selectedMergeWarning.person2.id
        : selectedMergeWarning.person1.id;

    try {
      setMerging(true);
      setMergeError(null);

      const res = await fetch(`${API_BASE_URL}/api/admin/merge-people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          primaryId: primaryPersonId,
          duplicateId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشلت عملية دمج السجلين');
      }

      setActionSuccessMessage(
        `تم دمج السجل المكرر #${duplicateId} بنجاح في السجل الرئيسي #${primaryPersonId}.`
      );

      setSelectedMergeWarning(null);
      setPrimaryPersonId(null);

      // Dispatch global refresh
      window.dispatchEvent(
        new CustomEvent('genealogy_data_updated', {
          detail: { action: 'merged', personId: primaryPersonId },
        })
      );
      window.dispatchEvent(new CustomEvent('app_global_refresh'));

      fetchDashboardData();
    } catch (err: any) {
      setMergeError(err.message || 'حدث خطأ أثناء عملية الدمج');
    } finally {
      setMerging(false);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  // Handle Change Verification Status (confidenceLevel)
  const handleChangeVerificationStatus = async (personId: number, status: 'verified' | 'unverified' | 'review') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/people/${personId}/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ confidenceLevel: status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشل تغيير حالة التوثيق');
      }

      window.dispatchEvent(
        new CustomEvent('genealogy_data_updated', {
          detail: { action: 'status_changed', personId },
        })
      );
      window.dispatchEvent(new CustomEvent('app_global_refresh'));

      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'خطأ في التوثيق');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 shadow-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-amiri text-stone-900">
          دخول مقتصر على المشرفين المعتمدين (Admin Only)
        </h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          عفواً، قسم تدقيق وتوثيق بيانات الأنساب ومراجعة التكرار متاح حصرياً للإدارة العليا والمشرفين المعتمدين.
        </p>
      </div>
    );
  }

  const summary = dataPayload?.summary || {
    totalPeople: 0,
    duplicateCount: 0,
    unverifiedCount: 0,
    needsReviewCount: 0,
    verifiedCount: 0,
  };

  const duplicateWarnings = dataPayload?.duplicateWarnings || [];
  const unverifiedPeople = dataPayload?.unverifiedPeople || [];
  const needsReviewPeople = dataPayload?.needsReviewPeople || [];
  const verifiedPeople = dataPayload?.verifiedPeople || [];

  // Filtering
  const filterPeopleBySearch = (list: Person[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((p) => {
      const full = (p.fullLineageName || p.fullName || '').toLowerCase();
      const father = (p.fatherName || '').toLowerCase();
      const tribe = (p.tribe || '').toLowerCase();
      return full.includes(q) || father.includes(q) || tribe.includes(q) || p.id.toString() === q;
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-[#C5A059]/30 shadow-xl overflow-hidden p-6 space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1A2A40] border border-[#C5A059] flex items-center justify-center text-[#C5A059] shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-amiri text-[#1A2A40] flex items-center gap-2">
              <span>مركز تدقيق وتوثيق بيانات الأنساب</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                لوحة المشرفين
              </span>
            </h2>
            <p className="text-xs text-stone-600 font-sans mt-0.5">
              فحص التطابق الرباعي للأسماء، إدارة التوثيق، والتأكد من وحدة وموثوقية شجرة العائلة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-[#243B55] hover:bg-[#1A2A40] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث وربط الفحص التلقائي
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>

      {/* Global Success Banner */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Dynamic Summary Dashboard Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Counter 1: Duplicate 4-Part Names */}
        <div
          onClick={() => setActiveTab('duplicates')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'duplicates'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.02]'
              : 'bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black">{summary.duplicateCount}</span>
            <AlertTriangle className={`w-5 h-5 ${activeTab === 'duplicates' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div className="text-xs font-bold mt-2">⚠️ أسماء رباعية مكررة</div>
          <p className="text-[10px] opacity-80 mt-0.5">تتطلب مراجعة واعتماد المشرف</p>
        </div>

        {/* Counter 2: Unverified */}
        <div
          onClick={() => setActiveTab('unverified')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'unverified'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-[1.02]'
              : 'bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black">{summary.unverifiedCount}</span>
            <AlertCircle className={`w-5 h-5 ${activeTab === 'unverified' ? 'text-white' : 'text-rose-600'}`} />
          </div>
          <div className="text-xs font-bold mt-2">🔴 غير موثق</div>
          <p className="text-[10px] opacity-80 mt-0.5">سجلات بانتظار إرفاق الأدلة</p>
        </div>

        {/* Counter 3: Needs Review */}
        <div
          onClick={() => setActiveTab('review')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'review'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]'
              : 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black">{summary.needsReviewCount}</span>
            <Clock className={`w-5 h-5 ${activeTab === 'review' ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="text-xs font-bold mt-2">🟡 يحتاج مراجعة</div>
          <p className="text-[10px] opacity-80 mt-0.5">سجلات قيد المراجعة العلمية</p>
        </div>

        {/* Counter 4: Verified */}
        <div
          onClick={() => setActiveTab('verified')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'verified'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
              : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black">{summary.verifiedCount}</span>
            <CheckCircle2 className={`w-5 h-5 ${activeTab === 'verified' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <div className="text-xs font-bold mt-2">🟢 موثق ومعتمد</div>
          <p className="text-[10px] opacity-80 mt-0.5">سجلات موثقة بالكامل بالشجرة</p>
        </div>
      </div>

      {/* Navigation Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-stone-100/70 rounded-2xl border border-stone-200">
        
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#1A2A40] text-[#C5A059] shadow-md'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            الكل ({summary.totalPeople})
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'duplicates'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-amber-900 hover:bg-amber-100'
            }`}
          >
            <span>أسماء مكررة</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">
              {summary.duplicateCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unverified')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'unverified'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-rose-900 hover:bg-rose-100'
            }`}
          >
            <span>غير موثق</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black">
              {summary.unverifiedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-blue-900 hover:bg-blue-100'
            }`}
          >
            <span>يحتاج مراجعة</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 text-[10px] font-black">
              {summary.needsReviewCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <span>موثق</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
              {summary.verifiedCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="تصفية حسب الاسم أو رقم السجل..."
            className="w-full py-2 pr-9 pl-3 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#C5A059]"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-stone-400" />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-stone-600">جاري تحميل وتدقيق سجلات الأنساب والتطابقات...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs font-bold text-center border border-rose-200">
          {error}
        </div>
      ) : (
        <div className="space-y-6">

          {/* TAB 1: DUPLICATE 4-PART NAMES REVIEW CARDS */}
          {(activeTab === 'all' || activeTab === 'duplicates') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 font-amiri flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>تنبيهات الأسماء الرباعية المكررة ({duplicateWarnings.length})</span>
                </h3>
                {duplicateWarnings.length > 0 && (
                  <span className="text-xs text-stone-500 font-semibold">
                    المقارنة تشترط تطابق الاسم الرباعي الكامل دون دمج آلي
                  </span>
                )}
              </div>

              {duplicateWarnings.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800 font-amiri">
                    لا توجد أي أسماء رباعية مكررة بانتظار المراجعة
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    جميع الأسماء المفحوصة في شجرة النسب مميزة وفريدة، أو تم اعتماد تميزها كأشخاص مختلفين من قبل المشرف.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {duplicateWarnings.map((warning) => (
                    <div
                      key={warning.id}
                      className="bg-amber-50/50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4 transition-all hover:border-amber-400"
                    >
                      {/* Warning Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-black shadow-sm">
                            تنبيه تطابق اسم رباعي
                          </span>
                          <h4 className="text-sm font-bold text-amber-950 font-amiri">
                            الاسم المطابق: ({warning.original4PartName})
                          </h4>
                        </div>
                        <span className="text-[11px] text-amber-900 font-bold bg-amber-200/80 px-2.5 py-1 rounded-lg">
                          رمز الحالة: {warning.pairKey}
                        </span>
                      </div>

                      {/* Side-by-Side Comparison Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Person 1 Card */}
                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold text-[#1A2A40] bg-stone-100 px-2.5 py-0.5 rounded-lg">
                              السجل الأول (#1)
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-800">
                              ID: {warning.person1.id}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-sm text-stone-900">
                              {warning.person1.fullLineageName || warning.person1.fullName}
                            </div>
                            <div className="text-stone-600">
                              الأب: <strong className="text-stone-800">{warning.person1.fatherName || 'غير مربوط'}</strong>
                            </div>
                            <div className="text-stone-600">
                              الأم: <strong className="text-stone-800">{warning.person1.motherName || '—'}</strong>
                            </div>
                            <div className="text-stone-600">
                              الفرع / القبيلة: <strong className="text-stone-800">{warning.person1.tribe || warning.person1.familyName || '—'}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                            {onSelectPersonProfile && (
                              <button
                                onClick={() => onSelectPersonProfile(warning.person1.id)}
                                className="flex-1 py-1.5 px-3 bg-[#243B55] hover:bg-[#1A2A40] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>فتح الشخص</span>
                              </button>
                            )}

                            <button
                              onClick={() => onEditPerson(warning.person1.id)}
                              className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>تعديل السجل</span>
                            </button>
                          </div>
                        </div>

                        {/* Person 2 Card */}
                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <span className="text-xs font-bold text-[#1A2A40] bg-stone-100 px-2.5 py-0.5 rounded-lg">
                              السجل الثاني (#2)
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-800">
                              ID: {warning.person2.id}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-sm text-stone-900">
                              {warning.person2.fullLineageName || warning.person2.fullName}
                            </div>
                            <div className="text-stone-600">
                              الأب: <strong className="text-stone-800">{warning.person2.fatherName || 'غير مربوط'}</strong>
                            </div>
                            <div className="text-stone-600">
                              الأم: <strong className="text-stone-800">{warning.person2.motherName || '—'}</strong>
                            </div>
                            <div className="text-stone-600">
                              الفرع / القبيلة: <strong className="text-stone-800">{warning.person2.tribe || warning.person2.familyName || '—'}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                            {onSelectPersonProfile && (
                              <button
                                onClick={() => onSelectPersonProfile(warning.person2.id)}
                                className="flex-1 py-1.5 px-3 bg-[#243B55] hover:bg-[#1A2A40] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>فتح الشخص</span>
                              </button>
                            )}

                            <button
                              onClick={() => onEditPerson(warning.person2.id)}
                              className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>تعديل السجل</span>
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Administrator Actions Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/70">
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* Action 1: Approve Different */}
                          <button
                            onClick={() => handleApproveDifferent(warning)}
                            disabled={approvingPairKey === warning.pairKey}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>✓ أوافق أنهما شخصان مختلفان</span>
                          </button>

                          {/* Action 2: Edit Person Data */}
                          <button
                            onClick={() => onEditPerson(warning.person1.id)}
                            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Edit className="w-4 h-4" />
                            <span>⚙ تعديل البيانات</span>
                          </button>
                        </div>

                        {/* Action 3: Controlled Merge Duplicate */}
                        <button
                          onClick={() => {
                            setSelectedMergeWarning(warning);
                            setPrimaryPersonId(warning.person1.id);
                            setMergeError(null);
                          }}
                          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                        >
                          <GitMerge className="w-4 h-4" />
                          <span>⚠ حل التكرار ودمج السجلين</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2 / 3 / 4: VERIFICATION STATUS PEOPLE LISTS */}
          {(activeTab === 'unverified' || activeTab === 'review' || activeTab === 'verified') && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 font-amiri">
                  {activeTab === 'unverified' && '🔴 سجلات غير موثقة'}
                  {activeTab === 'review' && '🟡 سجلات تحتاج مراجعة وتدقيق'}
                  {activeTab === 'verified' && '🟢 سجلات موثقة ومعتمدة'}
                </h3>
                <span className="text-xs font-bold text-stone-500">
                  عدد السجلات: {
                    activeTab === 'unverified' ? unverifiedPeople.length :
                    activeTab === 'review' ? needsReviewPeople.length : verifiedPeople.length
                  }
                </span>
              </div>

              {/* Table of People */}
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#1A2A40] text-white font-bold">
                    <tr>
                      <th className="p-3"># ID</th>
                      <th className="p-3">الاسم الكامل</th>
                      <th className="p-3">الأب</th>
                      <th className="p-3">الفرع / القبيلة</th>
                      <th className="p-3 text-center">حالة التوثيق</th>
                      <th className="p-3 text-center">تغيير حالة التوثيق</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filterPeopleBySearch(
                      activeTab === 'unverified' ? unverifiedPeople :
                      activeTab === 'review' ? needsReviewPeople : verifiedPeople
                    ).map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-800">{p.id}</td>
                        <td className="p-3 font-bold text-stone-900">{p.fullLineageName || p.fullName}</td>
                        <td className="p-3 text-stone-600">{p.fatherName || 'غير مربوط'}</td>
                        <td className="p-3 text-stone-600">{p.tribe || p.familyName || '—'}</td>
                        <td className="p-3 text-center">
                          {(!p.confidenceLevel || p.confidenceLevel === 'verified') && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px]">
                              🟢 موثق
                            </span>
                          )}
                          {p.confidenceLevel === 'review' && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 font-bold text-[11px]">
                              🟡 يحتاج مراجعة
                            </span>
                          )}
                          {p.confidenceLevel === 'unverified' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-bold text-[11px]">
                              🔴 غير موثق
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleChangeVerificationStatus(p.id, 'verified')}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                              title="اعتماد كـ موثق"
                            >
                              موثق
                            </button>
                            <button
                              onClick={() => handleChangeVerificationStatus(p.id, 'review')}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200"
                              title="تحديد كـ يحتاج مراجعة"
                            >
                              مراجعة
                            </button>
                            <button
                              onClick={() => handleChangeVerificationStatus(p.id, 'unverified')}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200"
                              title="تحديد كـ غير موثق"
                            >
                              غير موثق
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {onSelectPersonProfile && (
                              <button
                                onClick={() => onSelectPersonProfile(p.id)}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800"
                                title="عرض الملف"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditPerson(p.id)}
                              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900"
                              title="تعديل السجل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* CONTROLLED DUPLICATE RESOLUTION / MERGE MODAL */}
      {selectedMergeWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-rose-300 overflow-hidden space-y-0 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  <GitMerge className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-200 font-amiri">
                    إجراء حل التكرار ودمج السجلين نهائياً
                  </h3>
                  <p className="text-xs text-rose-100">
                    حدد السجل الأساسي (الذي سيتم الإبقاء عليه) والسجل المكرر (الذي سيتم دمجه وحذفه)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMergeWarning(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              
              {/* Error Alert */}
              {mergeError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{mergeError}</span>
                </div>
              )}

              {/* Warning Banner */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 font-medium space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>تنبيه هـام لإدارة النسب:</span>
                </div>
                <p>
                  سيقوم النظام بإعادة ربط جميع الأبناء والوالدين والوثائق والصور الخاصة بالسجل المكرر بالكامل إلى السجل الأساسي المختار، ثم حذف السجل المكرر دائمياً.
                </p>
              </div>

              {/* Primary Selection Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-stone-900">
                  اختر السجل الأساسي المعتمد للدمج:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: Person 1 as Primary */}
                  <label
                    onClick={() => setPrimaryPersonId(selectedMergeWarning.person1.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      primaryPersonId === selectedMergeWarning.person1.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">السجل الأول (#1)</span>
                      {primaryPersonId === selectedMergeWarning.person1.id ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          الأساسي (سيتم الإبقاء عليه)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold">
                          مكرر (سيُحذف)
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-stone-900 text-sm">
                      {selectedMergeWarning.person1.fullName}
                    </div>
                    <div className="text-[11px] text-stone-600">
                      ID: {selectedMergeWarning.person1.id} | الأب: {selectedMergeWarning.person1.fatherName || 'غير معروف'}
                    </div>
                  </label>

                  {/* Option 2: Person 2 as Primary */}
                  <label
                    onClick={() => setPrimaryPersonId(selectedMergeWarning.person2.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      primaryPersonId === selectedMergeWarning.person2.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">السجل الثاني (#2)</span>
                      {primaryPersonId === selectedMergeWarning.person2.id ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          الأساسي (سيتم الإبقاء عليه)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold">
                          مكرر (سيُحذف)
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-stone-900 text-sm">
                      {selectedMergeWarning.person2.fullName}
                    </div>
                    <div className="text-[11px] text-stone-600">
                      ID: {selectedMergeWarning.person2.id} | الأب: {selectedMergeWarning.person2.fatherName || 'غير معروف'}
                    </div>
                  </label>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSelectedMergeWarning(null)}
                  disabled={merging}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleExecuteMerge}
                  disabled={merging || !primaryPersonId}
                  className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>{merging ? 'جاري الدمج والتحديث...' : 'تأكيد تنفيذ عملية الدمج الدائم'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
