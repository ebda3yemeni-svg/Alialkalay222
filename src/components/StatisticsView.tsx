import React, { useEffect, useState } from 'react';
import { GenealogyStatistics } from '../types.ts';
import {
  BarChart3,
  Users,
  Layers,
  Award,
  Heart,
  BookOpen,
  Printer,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Camera,
  FileWarning,
  PieChart,
  TrendingUp,
  Share2,
} from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const [stats, setStats] = useState<GenealogyStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const handleLiveUpdate = () => {
      fetchStats();
    };
    window.addEventListener('genealogy_data_updated', handleLiveUpdate);
    return () => {
      window.removeEventListener('genealogy_data_updated', handleLiveUpdate);
    };
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/statistics');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReports = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-amber-900 font-bold font-amiri text-lg">
        جاري حساب وقراءة التقارير الذكية الشاملة لنسب بني علي الكلعي...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 print:p-6 print:bg-white print:text-black">
      
      {/* Header Banner */}
      <div className="bg-[#1A2A40] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-[#C5A059]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-white print:text-black print:border-b-2 print:border-black print:rounded-none print:p-0 print:shadow-none">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#C5A059] print:text-black flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#C5A059] print:hidden" />
            التقارير التحليلية الذكية لموسوعة أنساب بني علي الكلعي
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 print:text-gray-700">
            تقرير أحصائي ذكي يتضمن مؤشرات موثوقية السجلات، وتفاصيل الفروع وسلسلة الأنساب التاريخية.
          </p>
        </div>

        <button
          onClick={handlePrintReports}
          className="px-5 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer print:hidden active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة / تصدير التقرير PDF</span>
        </button>
      </div>

      {/* Main Quantitative Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-[#C5A059]/30 rounded-2xl p-5 text-center space-y-1.5 shadow-xs">
          <Users className="w-7 h-7 mx-auto text-[#C5A059]" />
          <div className="text-3xl sm:text-4xl font-bold text-[#1A2A40] font-amiri">{stats.totalPeople}</div>
          <div className="text-xs font-bold text-gray-600">إجمالي الأشخاص المسجلين</div>
        </div>

        <div className="bg-white border border-[#C5A059]/30 rounded-2xl p-5 text-center space-y-1.5 shadow-xs">
          <BookOpen className="w-7 h-7 mx-auto text-[#C5A059]" />
          <div className="text-3xl sm:text-4xl font-bold text-[#1A2A40] font-amiri">{stats.totalFamilies}</div>
          <div className="text-xs font-bold text-gray-600">إجمالي العائلات الموثقة</div>
        </div>

        <div className="bg-white border border-[#C5A059]/30 rounded-2xl p-5 text-center space-y-1.5 shadow-xs">
          <Layers className="w-7 h-7 mx-auto text-[#C5A059]" />
          <div className="text-3xl sm:text-4xl font-bold text-[#1A2A40] font-amiri">{stats.totalGenerations}</div>
          <div className="text-xs font-bold text-gray-600">عدد الأجيال المتعاقبة</div>
        </div>

        <div className="bg-white border border-[#C5A059]/30 rounded-2xl p-5 text-center space-y-1.5 shadow-xs">
          <Camera className="w-7 h-7 mx-auto text-[#C5A059]" />
          <div className="text-3xl sm:text-4xl font-bold text-[#1A2A40] font-amiri">{stats.withPhotosCount}</div>
          <div className="text-xs font-bold text-gray-600">أفراد موثقون بالصور</div>
        </div>
      </div>

      {/* Smart Analysis Highlights Section */}
      <div className="bg-white p-6 rounded-3xl border border-[#C5A059]/30 shadow-sm space-y-6">
        <h3 className="text-xl font-bold font-amiri text-[#1A2A40] flex items-center gap-2 border-b border-gray-100 pb-3">
          <TrendingUp className="w-5 h-5 text-[#C5A059]" />
          <span>المؤشرات والأرقام القياسية في الشجرة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <div className="text-xs font-bold text-amber-900">أكبر عائلة من حيث عدد الأفراد</div>
            <div className="text-xl font-bold font-amiri text-[#1A2A40]">
              {stats.largestFamilyByMembers?.familyName || 'بني علي الكلعي'}
            </div>
            <div className="text-xs text-amber-800 font-medium">
              تضم {stats.largestFamilyByMembers?.count || stats.totalPeople} فرداً مسجلاً
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1A2A40]/5 border border-[#1A2A40]/15 space-y-2">
            <div className="text-xs font-bold text-[#1A2A40]">الشخص الأكثر إعقاباً (ذريات)</div>
            <div className="text-xl font-bold font-amiri text-[#C5A059]">
              {stats.mostDescendantsPerson?.fullName || stats.largestBranch?.ancestorName || 'غير محدد'}
            </div>
            <div className="text-xs text-gray-600 font-medium">
              يمتلك {stats.mostDescendantsPerson?.descendantsCount || stats.largestBranch?.descendantsCount || 0} حفيداً وسليلاً مباشر
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="text-xs font-bold text-emerald-900">العائلة الأكثر تفرعاً وتشعباً</div>
            <div className="text-xl font-bold font-amiri text-emerald-950">
              {stats.largestBranch?.ancestorName || 'غير محدد'}
            </div>
            <div className="text-xs text-emerald-800 font-medium">
              تشمل {stats.largestBranch?.descendantsCount || 0} فرعاً وسلسلة أجداد
            </div>
          </div>
        </div>
      </div>

      {/* Demographic & Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Gender Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-5">
          <h3 className="text-lg font-bold font-amiri text-[#1A2A40] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#C5A059]" />
            التوزيع النوعي والحالة الحياتية
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#1A2A40]">عدد الذكور: {stats.totalMales}</span>
                <span>{Math.round((stats.totalMales / (stats.totalPeople || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${(stats.totalMales / (stats.totalPeople || 1)) * 100}%` }}
                  className="h-full bg-[#1A2A40]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-900">عدد الإناث: {stats.totalFemales}</span>
                <span>{Math.round((stats.totalFemales / (stats.totalPeople || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-rose-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${(stats.totalFemales / (stats.totalPeople || 1)) * 100}%` }}
                  className="h-full bg-rose-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="font-bold text-emerald-900 text-base">{stats.totalLiving}</div>
                <div className="text-[11px] text-emerald-800 font-bold">الأحياء (أطال الله أعمارهم)</div>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-center">
                <div className="font-bold text-gray-800 text-base">{stats.totalDeceased}</div>
                <div className="text-[11px] text-gray-600 font-bold">المتوفون (رحمهم الله)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Confidence & Quality Indicators */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-5">
          <h3 className="text-lg font-bold font-amiri text-[#1A2A40] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            جودة البيانات ومؤشرات التوثيق
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <span className="text-base">🟢</span>
                <span>السجلات الموثقة نهائياً (Verified)</span>
              </div>
              <span className="px-3 py-1 bg-emerald-200 text-emerald-900 rounded-xl font-extrabold text-sm">
                {stats.verifiedCount} سجل
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <span className="text-base">🟡</span>
                <span>سجلات قيد المراجعة التدقيقية (Needs Review)</span>
              </div>
              <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-xl font-extrabold text-sm">
                {stats.reviewCount} سجل
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <span className="text-base">🔴</span>
                <span>سجلات غير موثقة (Unverified)</span>
              </div>
              <span className="px-3 py-1 bg-rose-200 text-rose-900 rounded-xl font-extrabold text-sm">
                {stats.unverifiedCount} سجل
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 font-bold text-gray-700">
                <FileWarning className="w-4 h-4 text-orange-500" />
                <span>سجلات بحاجة لاستكمال معلومات أساسية</span>
              </div>
              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-xl font-bold text-xs">
                {stats.missingInfoCount} سجل
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Most Common Names Grid */}
      <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold font-amiri text-[#1A2A40]">الأسماء الأكثر تكراراً في السلسلة النسبية</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {stats.mostCommonNames.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-bold">
              <span className="text-[#1A2A40]">{idx + 1}. {item.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-[#1A2A40] text-[#C5A059] text-[11px]">{item.count} شخص</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

