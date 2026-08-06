import React, { useState, useEffect } from 'react';
import { PersonDetail, Person } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { updateSEO } from '../utils/seo.ts';
import { DescendantsTreeMapView } from './DescendantsTreeMapView.tsx';
import {
  X,
  User,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  GitCommit,
  TreePine,
  Users,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  Heart,
  Share2,
  GitCompare,
  Printer,
  Copy,
  Check,
  Activity,
  Sparkles,
  Clock,
  Shield,
  Edit,
  Trash2,
} from 'lucide-react';

interface PersonProfileModalProps {
  personId: number | null;
  onClose: () => void;
  onSelectPerson: (id: number) => void;
  onStartCompare?: (personId: number) => void;
  onOpenEditPerson?: (person: Person) => void;
}

export const PersonProfileModal: React.FC<PersonProfileModalProps> = ({
  personId,
  onClose,
  onSelectPerson,
  onStartCompare,
  onOpenEditPerson,
}) => {
  const { isAdmin, token } = useAuth();
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'lineage' | 'descendants_tree' | 'relatives' | 'photos' | 'docs'>('info');
  const [viewingFullPhoto, setViewingFullPhoto] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleUpdateConfidence = async (level: 'verified' | 'review' | 'unverified') => {
    if (!detail) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/people/${detail.person.id}/confidence`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ confidenceLevel: level }),
      });
      if (res.ok) {
        const updated = await res.json().catch(() => null);
        setDetail({
          ...detail,
          person: {
            ...detail.person,
            confidenceLevel: updated?.confidenceLevel || level,
          },
        });
        // Dispatch live update event for statistics and trees
        window.dispatchEvent(new CustomEvent('genealogy_data_updated', {
          detail: { personId: detail.person.id, confidenceLevel: level }
        }));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'فشل تحديث مستوى الموثوقية');
      }
    } catch (err) {
      console.error('Confidence update error:', err);
    }
  };

  const handleDeletePersonInModal = async () => {
    if (!detail?.person) return;
    const name = detail.person.fullName;
    if (!confirm(`هل أنت متأكد من حذف السجل الخاص بـ (${name}) نهائياً من قاعدة البيانات؟`)) return;

    try {
      const res = await fetch(`/api/people/${detail.person.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.dispatchEvent(
          new CustomEvent('genealogy_data_updated', {
            detail: { action: 'deleted', personId: detail.person.id },
          })
        );
        window.dispatchEvent(new CustomEvent('app_global_refresh'));
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'فشل عملية الحذف');
      }
    } catch (err) {
      console.error('Delete person error:', err);
      alert('حدث خطأ أثناء تنفيذ الحذف');
    }
  };

  useEffect(() => {
    if (personId) {
      fetchDetail(personId);
    }
  }, [personId]);

  useEffect(() => {
    const handleDataUpdate = (e: any) => {
      const deletedId = e?.detail?.personId;
      const action = e?.detail?.action;
      if (action === 'deleted' && deletedId && personId === deletedId) {
        onClose();
        return;
      }
      if (personId) {
        fetchDetail(personId);
      }
    };

    window.addEventListener('genealogy_data_updated', handleDataUpdate);
    window.addEventListener('app_global_refresh', handleDataUpdate);
    return () => {
      window.removeEventListener('genealogy_data_updated', handleDataUpdate);
      window.removeEventListener('app_global_refresh', handleDataUpdate);
    };
  }, [personId]);

  useEffect(() => {
    if (detail?.person) {
      const p = detail.person;
      const displayName = p.fullLineageName || p.fullName;
      const fatherInfo = p.fatherName ? `ابن ${p.fatherName}` : '';
      const familyInfo = p.familyName ? `عائلة ${p.familyName}` : p.tribe ? `قبيلة ${p.tribe}` : '';
      const desc = `${displayName} - ملف الشخصية والأصل والنسب في موسوعة بني علي الكلعي. ${fatherInfo} ${familyInfo}`.trim();

      updateSEO({
        title: displayName,
        description: desc,
        ogImage: p.photoUrl || undefined,
        ogType: 'profile',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: displayName,
          alternateName: p.fullName,
          gender: p.gender === 'female' ? 'Female' : 'Male',
          birthDate: p.birthDate || undefined,
          birthPlace: p.birthPlace ? { '@type': 'Place', name: p.birthPlace } : undefined,
          jobTitle: p.occupation || undefined,
          image: p.photoUrl || undefined,
          description: desc,
          memberOf: {
            '@type': 'Organization',
            name: 'موسوعة الأنساب لبني علي الكلعي',
          },
        },
      });
    }
  }, [detail]);

  const fetchDetail = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/people/${id}`);
      if (!res.ok) throw new Error('فشل جلب بيانات الملف الشخصي');
      const data = await res.json();
      setDetail(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطأ أثناء تحميل بيانات الشخص');
    } finally {
      setLoading(false);
    }
  };

  if (!personId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1A2A40]/80 backdrop-blur-md overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-4xl bg-[#F7F5F2] rounded-2xl shadow-2xl border border-[#C5A059]/40 overflow-hidden my-3 sm:my-8 max-h-[92vh] flex flex-col text-right">
        
        {/* Modal Header Banner */}
        <div className="relative bg-gradient-to-r from-[#1A2A40] via-[#243B55] to-[#1A2A40] text-white p-6 sm:p-8 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-colors border border-[#C5A059]/30"
          >
            <X className="w-6 h-6" />
          </button>

          {loading ? (
            <div className="h-20 flex items-center justify-center font-bold text-[#C5A059]">
              جاري تحميل الملف الشخصي...
            </div>
          ) : detail ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div
                onClick={() => detail.person.photoUrl && setViewingFullPhoto(detail.person.photoUrl)}
                title={detail.person.photoUrl ? "انقر لفتح الصورة بالحجم الكامل" : ""}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#F0F4F8] border-4 border-[#C5A059] overflow-hidden shadow-2xl shrink-0 flex items-center justify-center text-3xl font-bold text-[#1A2A40] ${
                  detail.person.photoUrl ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                }`}
              >
                {detail.person.photoUrl ? (
                  <img src={detail.person.photoUrl} alt={detail.person.fullName} className="w-full h-full object-cover" />
                ) : (
                  detail.person.fullName.charAt(0)
                )}
              </div>

              <div className="space-y-2 text-center sm:text-right flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#243B55] border border-[#C5A059]/40 text-[#C5A059] text-xs font-bold">
                    <span>{detail.person.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                    {detail.person.isDeceased ? ' • متوفى (رحمه الله)' : ' • على قيد الحياة'}
                  </div>

                  {onStartCompare && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartCompare(detail.person.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border border-[#C5A059]/40 rounded-full text-xs font-bold transition-all active:scale-95"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>مقارنة صلة القرابة</span>
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      {onOpenEditPerson && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenEditPerson(detail.person);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل البيانات</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleDeletePersonInModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف السجل</span>
                      </button>
                    </>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#C5A059]">
                  {detail.person.fullName}
                </h2>

                <p className="text-xs sm:text-sm text-gray-300">
                  {detail.person.familyName ? `عائلة ${detail.person.familyName}` : ''}
                  {detail.person.tribe ? ` • ${detail.person.tribe}` : ''}
                  {detail.person.branch ? ` • ${detail.person.branch}` : ''}
                </p>

                {/* Data Confidence Indicator - Admins Only */}
                {isAdmin && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#1A2A40]/90 border border-[#C5A059]/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#C5A059] font-bold">
                      <Shield className="w-4 h-4" />
                      <span>مؤشر موثوقية السجل (خاص بالإدارة فقط):</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateConfidence('verified')}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-[11px] cursor-pointer ${
                          (!detail.person.confidenceLevel || detail.person.confidenceLevel === 'verified')
                            ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-300 font-extrabold'
                            : 'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-800/40 border border-emerald-600/30'
                        }`}
                      >
                        <span>🟢 موثق (Verified)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateConfidence('review')}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-[11px] cursor-pointer ${
                          detail.person.confidenceLevel === 'review'
                            ? 'bg-amber-500 text-stone-950 shadow ring-2 ring-amber-200 font-extrabold'
                            : 'bg-amber-950/50 text-amber-300 hover:bg-amber-800/40 border border-amber-500/30'
                        }`}
                      >
                        <span>🟡 بحاجة لمراجعة (Review)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateConfidence('unverified')}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all text-[11px] cursor-pointer ${
                          detail.person.confidenceLevel === 'unverified'
                            ? 'bg-rose-600 text-white shadow ring-2 ring-rose-300 font-extrabold'
                            : 'bg-rose-950/50 text-rose-300 hover:bg-rose-800/40 border border-rose-600/30'
                        }`}
                      >
                        <span>🔴 غير موثق (Unverified)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Navigation Tabs */}
          {detail && (
            <div className="flex items-center gap-2 pt-6 mt-4 border-t border-[#C5A059]/30 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'info' ? 'bg-[#C5A059] text-[#1A2A40] shadow font-bold' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                الملف الشامل
              </button>

              <button
                onClick={() => setActiveTab('lineage')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'lineage' ? 'bg-[#C5A059] text-[#1A2A40] shadow font-bold' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                سلسلة النسب المتصلة ({detail.lineageChain.length})
              </button>

              <button
                onClick={() => setActiveTab('descendants_tree')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                  activeTab === 'descendants_tree'
                    ? 'bg-[#C5A059] text-[#1A2A40] border-[#C5A059] shadow font-bold'
                    : 'bg-[#243B55] text-[#C5A059] border-[#C5A059]/40 hover:bg-[#2C4A6B]'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>شجرة الذرية والخريطة</span>
              </button>

              <button
                onClick={() => setActiveTab('relatives')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'relatives' ? 'bg-[#C5A059] text-[#1A2A40] shadow font-bold' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                الأقارب والأقرباء
              </button>

              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'photos' ? 'bg-[#C5A059] text-[#1A2A40] shadow font-bold' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                معرض الصور ({detail.photos.length})
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'docs' ? 'bg-[#C5A059] text-[#1A2A40] shadow font-bold' : 'bg-[#243B55] text-gray-200 hover:text-[#C5A059]'
                }`}
              >
                الوثائق والمستندات ({detail.documents.length})
              </button>
            </div>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 p-4 sm:p-6 sm:p-8 overflow-y-auto space-y-6 overscroll-contain touch-pan-y scrollbar-thin">
          {loading ? (
            <div className="p-12 text-center text-amber-800 font-bold">جاري إعداد السجل...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 font-bold bg-red-50 rounded-2xl border border-red-200">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Modern Person Dashboard */}
              <div className="bg-gradient-to-br from-[#1A2A40] via-[#243B55] to-[#1A2A40] rounded-2xl p-5 sm:p-6 text-white border border-[#C5A059]/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#C5A059]/30 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#C5A059]/20 rounded-xl border border-[#C5A059]/40 text-[#C5A059]">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#C5A059] font-amiri leading-none">
                        لوحة إحصائيات ومعلومات الشخصية
                      </h3>
                      <p className="text-xs text-gray-300 mt-1">
                        الملخص الجيني والإحصائي لسلسلة نسب {detail.person.fullName}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-[#C5A059] bg-[#142235] px-3 py-1 rounded-full border border-[#C5A059]/30 font-bold max-w-full truncate">
                    الاسم: {detail.person.fullLineageName || detail.person.fullName}
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                  {/* Full Name */}
                  <div className="col-span-2 bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 flex flex-col justify-center">
                    <span className="text-[11px] text-[#C5A059] font-semibold">الاسم الكامل المعتمد</span>
                    <span className="text-sm font-bold text-white font-amiri truncate mt-0.5">
                      {detail.person.fullLineageName || detail.person.fullName}
                    </span>
                  </div>

                  {/* Father */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20">
                    <span className="text-[11px] text-gray-300 block">الأب</span>
                    <span className="text-xs font-bold text-amber-300 mt-0.5 block truncate">
                      {detail.father ? detail.father.fullName : detail.person.fatherName || 'غير مدخل'}
                    </span>
                  </div>

                  {/* Mother */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20">
                    <span className="text-[11px] text-gray-300 block">الأم</span>
                    <span className="text-xs font-bold text-amber-300 mt-0.5 block truncate">
                      {detail.mother ? detail.mother.fullName : detail.person.motherName || 'غير مدخل'}
                    </span>
                  </div>

                  {/* Children count */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-emerald-300 block font-semibold">عدد الأبناء</span>
                    <span className="text-lg font-black text-white mt-0.5 block">
                      {detail.children.length}
                    </span>
                  </div>

                  {/* Grandchildren count */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-teal-300 block font-semibold">عدد الأحفاد</span>
                    <span className="text-lg font-black text-white mt-0.5 block">
                      {detail.grandchildren.length}
                    </span>
                  </div>

                  {/* Total Descendants */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-amber-300 block font-semibold">إجمالي الذرية</span>
                    <span className="text-lg font-black text-[#C5A059] mt-0.5 block">
                      {detail.totalDescendantsCount ?? (detail.children.length + detail.grandchildren.length)}
                    </span>
                  </div>

                  {/* Direct Family Branches */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-purple-300 block font-semibold">الفروع العائلية المباشرة</span>
                    <span className="text-lg font-black text-white mt-0.5 block">
                      {detail.directBranchesCount ?? 0}
                    </span>
                  </div>

                  {/* Generations Descending */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-blue-300 block font-semibold">الأجيال النازلة</span>
                    <span className="text-lg font-black text-white mt-0.5 block">
                      {detail.generationsCount ?? 0}
                    </span>
                  </div>

                  {/* Brothers count */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-slate-300 block font-semibold">عدد الإخوة</span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      {detail.brothersCount ?? detail.siblings.filter((s) => s.gender === 'male').length}
                    </span>
                  </div>

                  {/* Sisters count */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20 text-center">
                    <span className="text-[11px] text-rose-300 block font-semibold">عدد الأخوات</span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      {detail.sistersCount ?? detail.siblings.filter((s) => s.gender === 'female').length}
                    </span>
                  </div>

                  {/* Last update date */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20">
                    <span className="text-[11px] text-gray-400 block">آخر تحديث</span>
                    <span className="text-[11px] font-bold text-gray-200 mt-1 block dir-ltr text-right">
                      {detail.person.updatedAt ? new Date(detail.person.updatedAt).toLocaleDateString('ar-SA') : 'غير مسجل'}
                    </span>
                  </div>

                  {/* Created date */}
                  <div className="bg-[#142235]/80 p-3 rounded-xl border border-[#C5A059]/20">
                    <span className="text-[11px] text-gray-400 block">تاريخ الإنشاء</span>
                    <span className="text-[11px] font-bold text-gray-200 mt-1 block dir-ltr text-right">
                      {detail.person.createdAt ? new Date(detail.person.createdAt).toLocaleDateString('ar-SA') : 'غير مسجل'}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons Toolbar */}
                <div className="pt-3 border-t border-[#C5A059]/30 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('descendants_tree')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C5A059] hover:bg-amber-400 text-[#1A2A40] rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <GitCommit className="w-4 h-4" />
                    <span>عرض شجرة الذرية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('lineage')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#243B55] hover:bg-[#2C4A6B] text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>عرض شجرة الأجداد</span>
                  </button>

                  {onStartCompare && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartCompare(detail.person.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#243B55] hover:bg-[#2C4A6B] text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition-all active:scale-95"
                    >
                      <GitCompare className="w-4 h-4" />
                      <span>مقارنة مع شخص آخر</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?person=${detail.person.id}`;
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#142235] hover:bg-[#1A2A40] text-gray-200 border border-[#C5A059]/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[#C5A059]" />}
                    <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الملف'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#142235] hover:bg-[#1A2A40] text-gray-200 border border-[#C5A059]/30 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-[#C5A059]" />
                    <span>طباعة ملف الشخصية</span>
                  </button>
                </div>
              </div>
              {/* Tab 1: Comprehensive Info */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Descendants Map Quick Shortcut */}
                  <div className="bg-gradient-to-r from-[#1A2A40] to-[#243B55] p-5 rounded-2xl border border-[#C5A059]/40 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1 text-center sm:text-right">
                      <div className="text-xs text-[#C5A059] font-bold flex items-center justify-center sm:justify-start gap-1.5">
                        <GitCommit className="w-4 h-4 text-[#C5A059]" />
                        <span>شجرة الذرية والخريطة السلالية</span>
                      </div>
                      <h4 className="text-base font-bold text-white font-amiri">
                        استعراض كافة الأبناء والأحفاد والذرية لـ {detail.person.fullName}
                      </h4>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        خريطة تفاعلية تحسب النسب والامتداد عبر العلاقات الأسرية المباشرة والأجيال المتعاقبة.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('descendants_tree')}
                      className="px-5 py-2.5 rounded-xl bg-[#C5A059] text-[#1A2A40] text-xs font-bold hover:bg-amber-400 transition-colors shadow-md shrink-0 inline-flex items-center gap-2"
                    >
                      <TreePine className="w-4 h-4" />
                      <span>عرض خريطة الذرية</span>
                    </button>
                  </div>
                  {/* Profile Photo Display Card */}
                  {detail.person.photoUrl && (
                    <div className="bg-white p-5 rounded-2xl border border-[#C5A059]/40 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
                      <div className="relative group shrink-0">
                        <img
                          src={detail.person.photoUrl}
                          alt={detail.person.fullName}
                          onClick={() => setViewingFullPhoto(detail.person.photoUrl!)}
                          className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-2 border-[#C5A059] shadow-md cursor-pointer hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-2 text-center sm:text-right flex-1">
                        <div className="text-xs text-[#C5A059] font-bold flex items-center justify-center sm:justify-start gap-1.5">
                          <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                          <span>الصورة الشخصية المعتمدة</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1A2A40]">
                          الصورة الشخصية الخاصة بـ {detail.person.fullName}
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          هذه الصورة الشخصية مرتبطة دائمًا بملف هذا الشخص في شجرة العائلة وموسوعة الأنساب.
                        </p>
                        <button
                          onClick={() => setViewingFullPhoto(detail.person.photoUrl!)}
                          className="px-4 py-2 rounded-xl bg-[#1A2A40] text-[#C5A059] text-xs font-bold hover:bg-[#243B55] transition-colors border border-[#C5A059]/40 shadow-sm inline-flex items-center gap-2 mt-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>عرض الصورة الشخصية بالحجم الكامل</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
                      <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>تواريخ الميلاد والوفاة:</span>
                      </div>
                      <div className="text-sm font-semibold text-stone-800">
                        {detail.person.birthDate ? `تاريخ الميلاد: ${detail.person.birthDate}` : 'تاريخ الميلاد غير مدون'}
                      </div>
                      <div className="text-sm font-semibold text-stone-800">
                        {detail.person.isDeceased
                          ? `تاريخ الوفاة: ${detail.person.deathDate || 'غير مدون'}`
                          : 'الحالة: على قيد الحياة'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2">
                      <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span>أماكن الميلاد والإقامة:</span>
                      </div>
                      <div className="text-sm font-semibold text-stone-800">
                        {detail.person.birthPlace ? `مكان الميلاد: ${detail.person.birthPlace}` : 'مكان الميلاد غير مدون'}
                      </div>
                      <div className="text-sm font-semibold text-stone-800">
                        {detail.person.deathPlace ? `مكان الوفاة: ${detail.person.deathPlace}` : ''}
                      </div>
                    </div>
                  </div>

                  {detail.person.occupation && (
                    <div className="bg-white p-4 rounded-2xl border border-amber-200 space-y-1">
                      <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-amber-600" />
                        <span>المهنة والوظيفة:</span>
                      </div>
                      <div className="text-sm font-semibold text-stone-800">{detail.person.occupation}</div>
                    </div>
                  )}

                  {detail.person.biography && (
                    <div className="bg-white p-5 rounded-2xl border border-amber-200 space-y-2">
                      <div className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <span>السيرة الذاتية والمحطات التاريخية:</span>
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                        {detail.person.biography}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Lineage Chain */}
              {activeTab === 'lineage' && (
                <div className="space-y-4">
                  <div className="text-sm font-bold text-amber-950 mb-2">
                    السلسلة المباشرة المتصلة من الجد الأكبر حتى الشخص الحالي:
                  </div>

                  <div className="relative border-r-2 border-amber-600 pr-6 space-y-6">
                    {detail.lineageChain.map((ancestor, index) => (
                      <div
                        key={ancestor.id}
                        onClick={() => onSelectPerson(ancestor.id)}
                        className="relative bg-white p-4 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-amber-500 group"
                      >
                        <div className="absolute top-4 -right-9 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shadow">
                          {index + 1}
                        </div>

                        <div className="font-bold text-amber-950 text-base group-hover:text-amber-800">
                          {ancestor.fullName}
                        </div>

                        <div className="text-xs text-stone-500 mt-1">
                          {index === 0 ? '👑 الجد الأكبر للفرع' : index === detail.lineageChain.length - 1 ? '🎯 الشخص الحالي' : 'والد / جد'}
                          {ancestor.birthDate ? ` • مواليد ${ancestor.birthDate}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2.5: Descendants Family Tree & Map */}
              {activeTab === 'descendants_tree' && (
                <div className="space-y-4">
                  <DescendantsTreeMapView
                    rootPersonId={detail.person.id}
                    rootPersonName={detail.person.fullName}
                    onSelectPerson={(id) => {
                      onSelectPerson(id);
                    }}
                    onFocusPerson={(id) => {
                      fetchDetail(id);
                    }}
                  />
                </div>
              )}

              {/* Tab 3: Immediate Relatives */}
              {activeTab === 'relatives' && (
                <div className="space-y-6">
                  
                  {/* Father & Grandfather */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-amber-900">الآباء والأجداد المباشرون:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detail.father && (
                        <div
                          onClick={() => onSelectPerson(detail.father!.id)}
                          className="p-3.5 rounded-2xl bg-white border border-amber-200 cursor-pointer hover:border-amber-500 transition-all shadow-sm"
                        >
                          <div className="text-xs text-amber-700 font-bold">الأب:</div>
                          <div className="font-bold text-stone-900">{detail.father.fullName}</div>
                        </div>
                      )}

                      {detail.grandfather && (
                        <div
                          onClick={() => onSelectPerson(detail.grandfather!.id)}
                          className="p-3.5 rounded-2xl bg-white border border-amber-200 cursor-pointer hover:border-amber-500 transition-all shadow-sm"
                        >
                          <div className="text-xs text-amber-700 font-bold">الجد:</div>
                          <div className="font-bold text-stone-900">{detail.grandfather.fullName}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Children */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-amber-900">الأبناء والأبناء ({detail.children.length}):</h3>
                    {detail.children.length === 0 ? (
                      <div className="text-xs text-stone-500 italic">لا يوجد أبناء مسجلون</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detail.children.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => onSelectPerson(c.id)}
                            className="p-3.5 rounded-2xl bg-white border border-amber-200 cursor-pointer hover:border-amber-500 transition-all shadow-sm"
                          >
                            <div className="font-bold text-stone-900">{c.fullName}</div>
                            <div className="text-xs text-stone-500">{c.gender === 'female' ? 'ابنة' : 'ابن'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Siblings */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-amber-900">الإخوة والأخوات ({detail.siblings.length}):</h3>
                    {detail.siblings.length === 0 ? (
                      <div className="text-xs text-stone-500 italic">لا يوجد إخوة مسجلون</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detail.siblings.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => onSelectPerson(s.id)}
                            className="p-3.5 rounded-2xl bg-white border border-amber-200 cursor-pointer hover:border-amber-500 transition-all shadow-sm"
                          >
                            <div className="font-bold text-stone-900">{s.fullName}</div>
                            <div className="text-xs text-stone-500">{s.gender === 'female' ? 'أخت' : 'أخ'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Uncles & Cousins */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-amber-900">الأعمام وأبناء العمومة:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {detail.uncles.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => onSelectPerson(u.id)}
                          className="p-3.5 rounded-2xl bg-white border border-amber-200 cursor-pointer hover:border-amber-500 transition-all shadow-sm"
                        >
                          <div className="text-xs text-amber-700 font-bold">عم:</div>
                          <div className="font-bold text-stone-900">{u.fullName}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 4: Photos */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  {detail.photos.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-sm">لا توجد صور تاريخية مضافة بعد</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {detail.photos.map((ph) => (
                        <div
                          key={ph.id}
                          onClick={() => setViewingFullPhoto(ph.url)}
                          className="rounded-2xl overflow-hidden border border-[#C5A059]/40 shadow bg-white cursor-pointer hover:border-[#C5A059] hover:shadow-lg transition-all group"
                        >
                          <img
                            src={ph.url}
                            alt={ph.caption || 'صورة'}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                          />
                          {ph.caption && (
                            <div className="p-2 text-xs text-stone-700 text-center font-semibold bg-[#F7F5F2]">
                              {ph.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Documents */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  {detail.documents.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 text-sm">لا توجد وثائق تاريخية مرفقة لهذا الشخص</div>
                  ) : (
                    <div className="space-y-3">
                      {detail.documents.map((doc) => (
                        <div key={doc.id} className="p-4 rounded-2xl bg-white border border-amber-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-amber-700" />
                            <div>
                              <div className="font-bold text-stone-900 text-sm">{doc.title}</div>
                              <div className="text-xs text-stone-500">نوع المستند: {doc.fileType}</div>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-amber-800 text-amber-100 text-xs font-bold hover:bg-amber-700"
                          >
                            فتح المستند
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

      </div>

      {/* Full-Size Photo Lightbox Overlay */}
      {viewingFullPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setViewingFullPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#1A2A40] rounded-2xl p-4 border border-[#C5A059]/60 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingFullPhoto(null)}
              className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={viewingFullPhoto}
              alt={detail?.person.fullName || 'صورة مكبرة'}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="text-center pt-3 text-[#C5A059] text-sm font-bold font-amiri">
              {detail?.person.fullName} - الصورة الشخصية بالحجم الكامل
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
